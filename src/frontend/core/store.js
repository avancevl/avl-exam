const PubSub = require('pubsub-js');
const constants = require('./constants');

const _data = {};

module.exports = {
  subscribe: (key, func) => {
    /*
    @param key {String}
    @param func {Function} (msg, data) =>
    @returns {Function} Unsubscribe.
     */
    const token = PubSub.subscribe(`${constants.store.EVENT}${key}`, func);
    return () => PubSub.unsubscribe(token);
  },
  broadcast: (key, value) => {
    /*
    @param key {String}
    @param value {Any}
     */
    return PubSub.publishSync(`${constants.store.EVENT}${key}`, value);
  },
  set: (key, value) => {
    _data[key] = value;
    return PubSub.publishSync(`${constants.store.EVENT}${key}`, value);
  },
  get: key => _data[key]
};
