const axios = require('axios');
const store = require('../store');
const {IS_API_PROCESSING} = require('../constants').store;

const _pool = {};
const _updateApiStatus = () => {
  /*
  Update store.$isApiProcessing.
   */
  if (Object.keys(_pool).length) {
    if (!store.get(IS_API_PROCESSING)) {
      store.set(IS_API_PROCESSING, true);
    }
  } else if (store.get(IS_API_PROCESSING)) {
    store.set(IS_API_PROCESSING, false);
  }
};

module.exports = args => {
  const id = Math.random().toString(36).substr(2);
  _pool[id] = args;
  _updateApiStatus();
  return axios(args).finally(() => {
    delete _pool[id];
    _updateApiStatus();
  });
};
