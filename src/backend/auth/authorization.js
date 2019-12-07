const errors = require('../models/errors');

module.exports = (permissions, func) =>
  /*
  Authorization function.
  example:
    handler = authorization(['basic'], (req, res, next) => {...});
  @param permissions {Array<String>} What permissions allowed to execute the func.
  @param func {Function} The handler method. (req, res, next) =>
  @returns {Function} (req, res, next) =>
   */
  function (req, res, next) {
    const user = req.user || {};

    if (permissions.indexOf(user.permission) < 0) {
      // The req.user isn't in the white list.
      if (user.id) {
        // The user was already login.
        next(new errors.Http403());
      } else {
        // Redirect the user to the login page.
        next(new errors.Http401());
      }
    } else {
      return func.apply(this, arguments);
    }
  };
