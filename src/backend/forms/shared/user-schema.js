const {validator} = require('../');
const UserPermission = require('../../models/constants/user-permission');

module.exports = {
  name: {
    optional: false,
    type: 'string',
    empty: false,
    max: 16
  },
  username: {
    optional: true,
    type: 'custom',
    min: 2,
    max: 16,
    pattern: /^[a-zA-Z0-9._-]{2,16}$/,
    check: function (value, schema) {
      if (schema.optional && (value == null || value === '')) {
        return true;
      }

      if (typeof value !== 'string') {
        return this.makeError('string', null, value);
      }

      if (value.length < schema.min) {
        return this.makeError('stringMin', schema.min, value);
      }

      if (value.length > schema.max) {
        return this.makeError('stringMax', schema.max, value);
      }

      if (!schema.pattern.test(value)) {
        return this.makeError('username', schema.max, value);
      }

      return true;
    }
  },
  permission: {
    optional: false,
    type: 'string',
    empty: false,
    enum: UserPermission.all()
  },
  email: {
    optional: true,
    type: 'custom',
    max: 1024,
    check: function (value, schema) {
      if (schema.optional && (value == null || value === '')) {
        return true;
      }

      if (typeof value !== 'string') {
        return this.makeError('string', null, value);
      }

      if (value.length > schema.max) {
        return this.makeError('stringMax', schema.max, value);
      }

      return validator.rules.email.apply(this, [value, schema]);
    }
  },
  password: {
    optional: true,
    type: 'custom',
    min: 6,
    max: 32,
    isNeedLowerCase: true,
    isNeedUpperCase: true,
    isNeedNumber: true,
    check: function (value, schema) {
      if (schema.optional && (value == null || value === '')) {
        return true;
      }

      if (typeof value !== 'string') {
        return this.makeError('string', null, value);
      }

      if (value.length < schema.min) {
        return this.makeError('stringMin', schema.min, value);
      }

      if (value.length > schema.max) {
        return this.makeError('stringMax', schema.max, value);
      }

      if (schema.isNeedLowerCase && !/[a-z]+/.test(value)) {
        return this.makeError('stringContainsLowerCaseLatter', null, value);
      }

      if (schema.isNeedUpperCase && !/[A-Z]+/.test(value)) {
        return this.makeError('stringContainsUpperCaseLatter', null, value);
      }

      if (schema.isNeedNumber && !/\d+/.test(value)) {
        return this.makeError('stringContainsNumber', null, value);
      }

      return true;
    }
  }
};
