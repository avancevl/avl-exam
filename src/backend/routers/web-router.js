const express = require('express');
const utils = require('../common/utils');
const errors = require('../models/errors');
const accountHandler = require('../handlers/account-handler');
const baseHandler = require('../handlers/base-handler');
const restaurantHandler = require('../handlers/restaurant-handler');

exports.web = new express.Router();
exports.api = new express.Router();

class CustomRouter {
  constructor(router) {
    this.router = router;
    this.setRouter = this.setRouter.bind(this);
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
  }

  static promiseErrorHandler(func) {
    return (req, res, next) => {
      const result = func(req, res, next);

      if (result && typeof result.catch === 'function') {
        result.catch(error => {
          if (error instanceof Error) {
            // This error is errors.HttpXXX().
            next(error);
          } else {
            next(new errors.Http500(error));
          }
        });
      }

      return result;
    };
  }

  setRouter(method, path, ...handlers) {
    /*
    @param method {String} "get", "post", "put", "delete"
    @param path {String}
    @param handlers {Array<Function>}
      The last function has the promise error handler.
     */
    if (handlers.length > 1) {
      this.router[method](
        path,
        ...handlers.slice(0, handlers.length - 1),
        CustomRouter.promiseErrorHandler(handlers[handlers.length - 1])
      );
    } else {
      this.router[method](
        path,
        CustomRouter.promiseErrorHandler(handlers[0])
      );
    }
  }

  get(path, ...handlers) {
    this.setRouter('get', path, ...handlers);
  }

  post(path, ...handlers) {
    this.setRouter('post', path, ...handlers);
  }

  put(path, ...handlers) {
    this.setRouter('put', path, ...handlers);
  }

  delete(path, ...handlers) {
    this.setRouter('delete', path, ...handlers);
  }
}

const webRouter = new CustomRouter(exports.web);

webRouter.get('/', baseHandler.baseView);
webRouter.get('/login', baseHandler.baseView);
webRouter.get('/register', baseHandler.baseView);
webRouter.get('/robots.txt', baseHandler.getRobotsTxt);

// /api
const apiRouter = new CustomRouter(exports.api);

apiRouter.post(
  '/account/_password-login',
  utils.generateRateLimit('/account/_password-login/', 60 * 1000, 5),
  accountHandler.passwordLogin
);
apiRouter.post('/account/_logout', accountHandler.logout);
apiRouter.post(
  '/account/_register',
  utils.generateRateLimit('/account/_register/', 5 * 60 * 1000, 5),
  accountHandler.register
);
apiRouter.post(
  '/account/_forgot-password',
  utils.generateRateLimit('/account/_forgot-password/', 5 * 60 * 1000, 5),
  accountHandler.forgotPassword
);
apiRouter.post(
  '/account/_change-password',
  utils.generateRateLimit('/account/_change-password/', 5 * 60 * 1000, 5),
  accountHandler.updatePasswordWithCode
);
apiRouter.get('/restaurants', restaurantHandler.getRestaurants);
