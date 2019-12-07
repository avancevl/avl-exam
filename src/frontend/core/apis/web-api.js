const api = require('./');

module.exports = {
  restaurant: {
    getRestaurants: time => api({
      method: 'get',
      url: '/api/restaurants',
      params: {time}
    })
  }
};
