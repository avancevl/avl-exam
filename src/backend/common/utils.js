const os = require('os');
const AWS = require('aws-sdk');
const config = require('config');
const mime = require('mime-types');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const RedisStore = require('rate-limit-redis');
const uuid = require('uuid');
const uuidV5 = require('uuid/v5');

const _s3 = new AWS.S3({
  accessKeyId: config.s3.key,
  secretAccessKey: config.s3.secret,
  region: config.s3.region
});

exports.uploadToS3 = (args = {}) =>
  /*
  Upload the image to storage.
  @param args {Object} The params for s3.upload().
    Key: {String}
    Body: {Buffer|stream} When it is stream this function will automatically close the stream.
    ACL: {String} eg. 'public-read'
  @returns {Promise<Buffer|stream>}
   */
  new Promise((resolve, reject) => {
    const params = {
      ...args,
      Bucket: config.s3.bucket,
      ContentType: mime.lookup(args.Key),
      CacheControl: 'max-age=31536000' // 365days
    };
    _s3.upload(params, error => {
      if (typeof args.Body.close === 'function') {
        args.Body.close();
      }

      if (error) {
        return reject(error);
      }

      resolve(args.Body);
    });
  });

exports.deleteS3Objects = (keys = []) =>
  /*
  Delete objects on S3.
  @param keys {Array<String>}
  @returns {Promise<>}
   */
  new Promise((resolve, reject) => {
    const params = {
      Bucket: config.s3.bucket,
      Delete: {
        Objects: keys.map(key => ({Key: key}))
      }
    };
    _s3.deleteObjects(params, (error, result) => {
      if (error) {
        return reject(error);
      }

      resolve(result);
    });
  });

let _rateLimitRedis;
exports.getRateLimitRedis = () => {
  /*
  Get the redis client for rate limit.
  @returns {redis}
   */
  if (_rateLimitRedis) {
    return _rateLimitRedis;
  }

  _rateLimitRedis = redis.createClient(config.redis.rateLimitRedisUrl);
  _rateLimitRedis.select(config.redis.rateLimitRedisDb);
  return _rateLimitRedis;
};

exports.generateRateLimit = (keyPrefix, windowMs, max) => {
  /*
  Generate the rate limit middleware.
  @param keyPrefix {String}
  @param windowMs {Number}
  @param max {Number}
  @returns {Function}
   */
  return rateLimit({
    keyGenerator: req => `${keyPrefix}${req.ip}`,
    store: new RedisStore({
      client: exports.getRateLimitRedis(),
      expiry: windowMs / 1000
    }),
    windowMs: windowMs,
    max: max
  });
};

const _table = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const _keyLength = 64;
const _digest = 'sha512';
exports.hashPassword = password => {
  /*
  Hash password use SHA512-Crypt.
  @param password {String}
  @returns {String}
   */
  let salt = [];
  for (let index = 0; index <= 3; index += 1) {
    salt.push(_table[parseInt(Math.random() * _table.length, 10)]);
  }

  salt = salt.join('');
  const rounds = parseInt(Math.random() * 50, 10) + 50;
  const hash = crypto.pbkdf2Sync(password, salt, rounds, _keyLength, _digest).toString('base64');
  return `$rounds=${rounds}$${salt}$${hash}`;
};

exports.verifyPassword = (password, hash) => {
  /*
  Verify password and SHA512-Crypt hash.
  @param password {String}
  @param hash {String}
  @returns {Boolean}
   */
  if (!hash) {
    return false;
  }

  const parts = hash.split('$');
  const rounds = Number(parts[1].replace('rounds=', ''));
  hash = crypto.pbkdf2Sync(password, parts[2], rounds, _keyLength, _digest).toString('base64');
  return parts[3] === hash;
};

exports.getSession = (req, res) => {
  /*
  @param req {express.req}
  @param res {express.res|null}
  @returns {Promise<SessionModel|null>} populated .user
   */
  const SessionModel = require('../models/data/session-model');
  const sessionKey = req.cookies[config.session.name];
  if (!sessionKey || sessionKey.indexOf('.') < 0) {
    return Promise.resolve(null);
  }

  const session = sessionKey.split('.');
  if (!mongoose.Types.ObjectId.isValid(session[0]) || !/^[a-z\d]{32}$/.test(session[1])) {
    return Promise.resolve(null);
  }

  return SessionModel.findById(session[0])
    .where({
      hash: uuidV5(session[1], config.session.secret).replace(/-/g, ''),
      expiredTime: {$gt: new Date()}
    })
    .populate('user')
    .then(session => {
      if (!session) {
        // The user didn't login.
        return session;
      }

      if (!res) {
        // This is websocket connection.
        return session;
      }

      return Promise.all([
        session,
        session.ip !== req.ip
      ]).then(([session, isModified]) => {
        if (isModified) {
          // Update IP address.
          session.ip = req.ip;
        }

        const timeBound = new Date();
        timeBound.setUTCMilliseconds(timeBound.getUTCMilliseconds() + (config.session.maxAge / 2));
        if (session.expiredTime < timeBound) {
          // Touch session when it will be expired after 0.5 max age.
          isModified = true;
          const expires = new Date();
          expires.setUTCMilliseconds(expires.getUTCMilliseconds() + config.session.maxAge);
          res.cookie(config.session.name, sessionKey, {
            expires: expires,
            httpOnly: true,
            secure: config.session.secure
          });
          session.expiredTime = expires;
        }

        return isModified ? session.save() : session;
      });
    });
};

exports.setSessionCookie = (req, res, user) => {
  /*
  @param req {express.req}
  @param user {UserModel}
  @returns {Promise<SessionModel>}
   */
  const SessionModel = require('../models/data/session-model');
  const hash = uuidV5(uuid.v4(), config.session.secret).replace(/-/g, '');
  const expires = new Date();
  expires.setUTCMilliseconds(expires.getUTCMilliseconds() + config.session.maxAge);

  const session = new SessionModel({
    hash: uuidV5(hash, config.session.secret).replace(/-/g, ''),
    user: user,
    expiredTime: expires,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    loginIp: req.ip
  });
  res.cookie(config.session.name, `${session.id}.${hash}`, {
    expires: expires,
    httpOnly: true,
    secure: config.session.secure
  });
  return session.save();
};

exports.parseKeyword = keyword => {
  /*
  Parse the keyword.
  @param keyword {String}
  @returns {Object}
    plus: {Array<String>}
    minus: {Array<String>}
    fields: {Object} {'fieldName': {String}}
   */
  const source = [];
  const plus = [];
  const minus = [];
  const fields = {};

  if (!keyword) {
    return {plus, minus, fields};
  }

  // ": " -> ":", "\u200b" -> ""
  keyword = keyword.replace(/:\s/g, ':').replace(/\u200b/g, '');

  // Match words in quotation mark
  const quotations = keyword.match(/["'](.*?)["']/g);
  (quotations || []).forEach(quotation => {
    keyword = keyword.replace(quotation, '');
    source.push(quotation.substr(1, quotation.length - 2));
  });

  // Remove " and '
  keyword = keyword.replace(/["']/g, '');
  keyword.split(' ').forEach(word => source.push(word));

  source.forEach(item => {
    if (!item) {
      return;
    }

    if (item.indexOf(':') > 0) {
      const unpacked = item.split(':');
      fields[unpacked[0]] = unpacked[1];
    } else if (item.indexOf('-') === 0) {
      minus.push(item.substr(1));
    } else {
      plus.push(item);
    }
  });

  return {plus, minus, fields};
};

exports.logError = (error, extra) => {
  /*
  @param error {Error}
  @param extra {Object}
   */
  const LogModel = require('../models/data/log-model');
  console.error(error);
  if (!config.enableLog) {
    return;
  }

  const log = new LogModel({
    hostname: os.hostname(),
    errorStack: error ? error.stack : undefined,
    extra: (() => {
      try {
        let result;
        if (extra) {
          result = JSON.stringify(extra);
        }

        return result;
      } catch (_) {}
    })()
  });
  log.save();
};

let _isConnectionLocked;
exports.connectDatabase = () => {
  /*
  Connect to database.
   */
  if (_isConnectionLocked) {
    return;
  }

  _isConnectionLocked = true;
  mongoose.connection.on('error', error => {
    console.error('Mongoose default connection error.');
    console.error(error);
  });
  mongoose.connection.on('disconnected', () => {
    console.error('Mongoose default connection disconnected.');
    console.error(config.database.url);
  });

  mongoose.connect(config.database.url, config.database.options);
};

exports.generateEmptySchema = (collectionName, model) => {
  /*
  Generate a empty instance of mongoose.Schema.
  @param collectionName {String}
  @param model {Object}
  @return {mongoose.Schema}
   */
  exports.connectDatabase();
  const schema = new mongoose.Schema(model, {collection: collectionName});
  schema.plugin(mongoosePaginate);
  return schema;
};

exports.generateSchema = (collectionName, model) => {
  /*
  Generate a instance of mongoose.Schema.
  @param collectionName {String}
  @param model {Object}
  @return {mongoose.Schema}
   */
  const schema = exports.generateEmptySchema(collectionName, {
    createTime: {
      type: Date,
      default: Date.now,
      index: {name: 'CreateTime'}
    },
    updateTime: {
      type: Date,
      default: Date.now,
      index: {name: 'UpdateTime'}
    },
    ...model
  });

  schema.pre('save', function (next) {
    this.increment();
    this.updateTime = Date.now();
    next();
  });
  return schema;
};
