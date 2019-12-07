const device = require('device');
const mongoose = require('mongoose');
const utils = require('../../common/utils');

const schema = utils.generateEmptySchema('Sessions', {
  hash: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'UserModel'
  },
  expiredTime: {
    type: Date,
    required: true,
    index: {
      name: 'ExpiredTime'
    }
  },
  ip: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  loginIp: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  createTime: {
    type: Date,
    default: Date.now
  }
});
schema.index(
  {user: 1, createTime: -1},
  {
    name: 'UserCreateTime',
    background: true
  }
);

schema.method('getDeviceType', function () {
  return device(this.userAgent).type;
});

schema.method('dump', function (req = {}) {
  return {
    id: this.id,
    ip: this.ip,
    userAgent: this.userAgent,
    deviceType: this.getDeviceType(),
    loginIp: this.loginIp,
    isCurrentSession: Boolean(req && req.session && req.session.id === this.id),
    createTime: this.createTime
  };
});

module.exports = mongoose.model('SessionModel', schema);
