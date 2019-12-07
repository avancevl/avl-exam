const auth = require('../auth/authorization');
const errors = require('../models/errors');
const utils = require('../common/utils');
const authentication = require('../auth/authentication');
const passwordLoginForm = require('../forms/account/password-login-form');
const registerForm = require('../forms/account/register-form');
const UserModel = require('../models/data/user-model');
const UserPermission = require('../models/constants/user-permission');

exports.passwordLogin = (req, res) => {
  /*
  POST /api/account/_password-login
  @response {UserModel}
   */
  const checkResult = passwordLoginForm(req.body);
  if (checkResult !== true) {
    throw new errors.Http400('form validation failed.', checkResult);
  }

  return authentication.password(req.body, req, res).then(user => {
    if (!user) {
      throw new errors.Http400('incorrect email or password.');
    }

    res.json(user.dump(req));
  });
};

exports.register = (req, res) => {
  /*
  POST /api/account/_register
  @response {UserModel}
   */
  const checkResult = registerForm(req.body);
  if (checkResult !== true) {
    throw new errors.Http400('form validation failed.', checkResult);
  }

  const user = new UserModel({
    name: req.body.name,
    email: req.body.email,
    permission: UserPermission.basic
  });
  return user.save()
    .then(user => {
      return Promise.all([
        user,
        utils.setSessionCookie(req, res, user)
      ]);
    })
    .then(([user]) => {
      res.json(user.dump(req));
    })
    .cache(error => {
      if (error.name === 'MongoError' && error.code === 11000) {
        // E11000 duplicate key error
        throw new errors.Http400('duplicate email');
      }

      throw error;
    });
};

exports.logout = auth(UserPermission.all(), (req, res) => {
  /*
  POST /api/account/_logout
   */
  return req.session.delete().then(() => {
    res.status(204).send();
  });
});
