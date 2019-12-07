const http = require('http');
const path = require('path');
const os = require('os');
const util = require('util');
const config = require('config');
const handlebars = require('handlebars');
const express = require('express');
const expressHandlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const nocache = require('nocache');
const authentication = require('./auth/authentication');
const webRouter = require('./routers/web-router');
const errors = require('./models/errors');
const LogModel = require('./models/data/log-model');
const baseHandler = require('./handlers/base-handler');

const app = express();
const server = http.createServer(app);

// Setup handlebars
const hbs = expressHandlebars.create({
  extname: '.html',
  defaultLayout: false,
  helpers: {
    archive: (object = null) =>
      new handlebars.SafeString((Buffer.from(JSON.stringify(object))).toString('base64'))
  }
});
// Setup template engine
app.set('views', path.join(__dirname, '..', 'frontend'));
app.engine('html', hbs.engine);
app.set('view engine', 'html');

// Hide x-powered-by
app.locals.settings['x-powered-by'] = false;
// Disable ETag at headers
app.disable('etag');
if (!config.isDebug) {
  app.enable('trust proxy');
}

app.locals.config = {
  isDebug: config.isDebug,
  url: config.url,
  assetsPath: config.isDebug ?
    `//${config.webpackDevServer.host}:${config.webpackDevServer.port}` :
    config.s3.urlPrefix
};

app.use((req, res, next) => {
  // Add req.startTime
  req.startTime = new Date();
  if (!config.isDebug) {
    return next();
  }

  // Append end hook
  const originEndFunc = res.end;
  res.end = function () {
    const result = originEndFunc.apply(this, arguments);
    const now = new Date();
    const processTime = `${now - req.startTime}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    console.log(
      `[${res.statusCode}] ${processTime.padStart(7)}ms ${`${req.method}      `.substr(0, 6)} ${req.originalUrl}`
    );
    if (res.error) {
      console.error(res.error.stack);
      if (res.error.extra) {
        console.error(res.error.extra);
      }
    }

    return result;
  };

  next();
});

const cookieMiddleware = cookieParser();
app.use(cookieMiddleware);
app.use(bodyParser.json());
app.use(authentication.session);

// Write log
if (config.enableLog) {
  app.use((req, res, next) => {
    const originEndFunc = res.end;
    const log = new LogModel({
      hostname: os.hostname(),
      user: req.user,
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      headers: (() => {
        if (req.headers && typeof req.body === 'object') {
          const headers = util._extend({}, req.headers);
          delete headers.cookie; // Don't log user's cookie.
          return JSON.stringify(headers);
        }
      })(),
      requestBody: (() => {
        if (req.body && typeof req.body === 'object') {
          const body = util._extend({}, req.body);
          delete body.password;
          delete body.newPassword;
          return JSON.stringify(body);
        }
      })(),
      createTime: req.startTime
    });
    const logPromise = log.save();
    res.end = function () {
      const result = originEndFunc.apply(this, arguments);
      const now = new Date();
      logPromise.then(() => {
        log.processTime = now - req.startTime;
        log.responseStatus = res.statusCode;
        log.errorStack = res.error ? res.error.stack : undefined;
        return log.save();
      });
      return result;
    };

    next();
  });
}

app.use('/api', nocache(), webRouter.api);
app.use(nocache(), webRouter.web);

// Error handlers
app.use((req, res, next) => {
  // Didn't match any routers.
  next(new errors.Http404());
});
app.use((error, req, res, _) => {
  error.status = error.status || 500;
  res.status(error.status);
  res.error = error;

  if (req.headers.accept && req.headers.accept.indexOf('application/json') >= 0) {
    // Return JSON.
    res.json({
      message: `${error}`,
      extra: error.extra
    });
  } else {
    // Return HTML.
    baseHandler.baseView(req, res);
  }
});

// Launch server
server.listen(config.expressServer.port, config.expressServer.host, () => {
  const {address, port} = server.address();
  console.log(`Server listening at http://${address}:${port}`);
});
