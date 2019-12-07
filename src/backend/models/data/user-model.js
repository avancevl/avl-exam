const mongoose = require('mongoose');
const utils = require('../../common/utils');
const UserPermission = require('../constants/user-permission');

const schema = utils.generateSchema('Users', {
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    lowercase: true,
    trim: true
  },
  permission: {
    type: String,
    enum: UserPermission.all(),
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    trim: true
  }
});

schema.index(
  {username: 1},
  {
    name: 'UniqueUsername',
    background: true,
    unique: true,
    partialFilterExpression: {
      username: {$exists: true}
    }
  }
);
schema.index(
  {email: 1},
  {
    name: 'UniqueEmail',
    background: true,
    unique: true,
    partialFilterExpression: {
      email: {$exists: true}
    }
  }
);

schema.method('dump', function (req = {}) {
  const result = {
    id: this.id,
    name: this.name,
    username: this.username,
    permission: this.permission,
    createTime: this.createTime
  };
  if (
    req.user &&
    (this.id === req.user.id || [UserPermission.root].indexOf(req.user.permission) >= 0)
  ) {
    result.email = this.email;
  }

  return result;
});

module.exports = mongoose.model('UserModel', schema);
