const Validator = require('fastest-validator');

exports.validator = new Validator({
  messages: {
    stringContainsLowerCaseLatter: 'This field must contain the lower case letter.',
    stringContainsUpperCaseLatter: 'This field must contain the upper case letter.',
    stringContainsNumber: 'This field must contain the number.',
    id: 'This field must be a valid ID.',
    username: 'This field must be a valid username.'
  }
});

exports.generateSearchSchema = (sortFields, fields) => ({
  /*
  @param sortFields {Array<String>} ex: ['createTime']
  @param fields {Object} The other fields.
   */
  index: {
    optional: true,
    type: 'string',
    pattern: /^\d*$/
  },
  size: {
    optional: true,
    type: 'custom',
    min: 1,
    max: 100,
    check: function (value, schema) {
      if (!/^\d+$/.test(value)) {
        return this.makeError('numberInteger', null, value);
      }

      const parsedValue = Number(value);
      if (parsedValue < schema.min) {
        return this.makeError('numberMin', schema.min, value);
      }

      if (parsedValue > schema.max) {
        return this.makeError('numberMax', schema.max, value);
      }

      return true;
    }
  },
  keyword: {
    optional: true,
    type: 'string',
    max: 1024
  },
  sort: {
    optional: true,
    type: 'custom',
    fields: sortFields,
    check: function (value, schema) {
      if (typeof value !== 'string') {
        return this.makeError('string', schema.fields, value);
      }

      const items = value.split(' ');
      for (let index = 0; index < items.length; index += 1) {
        if (!items[index]) {
          return this.makeError('required', schema.fields, value);
        }

        const target = items[index].match(/^-?(.*)$/)[1];
        if (schema.fields.indexOf(target) < 0) {
          return this.makeError('enumValue', schema.fields, value);
        }
      }

      return true;
    }
  },
  ...fields
});
