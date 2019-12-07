const api = require('./');

module.exports = {
  account: {
    passwordLogin: ({email, password}) => api({
      method: 'post',
      url: '/api/account/_password-login',
      data: {email, password}
    }),
    register: ({name, email, password}) => api({
      method: 'post',
      url: '/api/account/_register',
      data: {name, email, password}
    }),
    logout: () => api({
      method: 'post',
      url: '/api/account/_logout'
    })
  }
};
