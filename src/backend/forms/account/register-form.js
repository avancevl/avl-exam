const {validator} = require('../');
const UserSchema = require('../shared/user-schema');

module.exports = validator.compile({
  name: UserSchema.name,
  email: {
    ...UserSchema.email,
    optional: false
  },
  password: {
    ...UserSchema.password,
    optional: false,
    isNeedLowerCase: false,
    isNeedUpperCase: false,
    isNeedNumber: false
  }
});
