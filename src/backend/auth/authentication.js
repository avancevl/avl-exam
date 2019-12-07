const utils = require('../common/utils');
const UserModel = require('../models/data/user-model');

exports.session = (req, res, next) => {
  utils.getSession(req, res)
    .then(session => {
      if (!session || !session.user) {
        return next();
      }

      req.session = session;
      req.user = session.user;
      next();
    })
    .catch(next);
};

exports.password = ({email, password}, req, res) =>
  UserModel.where({email: email})
    .findOne().then(user => {
      if (!user || !utils.verifyPassword(password, user.password)) {
        return [null];
      }

      return Promise.all([
        user,
        utils.setSessionCookie(req, res, user)
      ]);
    })
    .then(([user]) => user);
