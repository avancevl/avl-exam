const mongoose = require('mongoose');
const utils = require('../../common/utils');

const schema = utils.generateSchema('Logs', {
  hostname: {type: String, trim: true},
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'UserModel',
    index: {
      name: 'User'
    }
  },
  ip: {type: String, lowercase: true, trim: true},
  method: {type: String, uppercase: true, trim: true},
  path: {type: String, trim: true},
  headers: {
    // JSON
    type: String,
    trim: true
  },
  requestBody: {
    // JSON
    type: String,
    trim: true
  },
  extra: {
    // JSON
    type: String,
    trim: true
  },
  responseStatus: {
    type: Number,
    default: 0
  },
  errorStack: {
    type: String,
    trim: true
  },
  processTime: {
    // Milliseconds
    type: Number,
    index: {
      name: 'ProcessTime'
    }
  }
});

schema.method('dump', function (req = {}) {
  return {
    id: this.id,
    hostname: this.hostname,
    user:
      this.user && typeof this.user.dump === 'function' ? this.user.dump(req) : this.user,
    ip: this.ip,
    method: this.method,
    path: this.path,
    headers: (() => {
      if (!this.headers) {
        return this.headers;
      }

      try {
        return JSON.parse(this.headers);
      } catch (_) {
        return this.headers;
      }
    })(),
    requestBody: (() => {
      if (!this.requestBody) {
        return this.requestBody;
      }

      try {
        return JSON.parse(this.requestBody);
      } catch (_) {
        return this.requestBody;
      }
    })(),
    extra: (() => {
      if (!this.extra) {
        return this.extra;
      }

      try {
        return JSON.parse(this.extra);
      } catch (_) {
        return this.extra;
      }
    })(),
    responseStatus: this.responseStatus,
    errorStack: this.errorStack,
    processTime: this.processTime,
    createTime: this.createTime
  };
});

module.exports = mongoose.model('LogModel', schema);
