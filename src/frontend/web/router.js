/* eslint-disable capitalized-comments */
const {Router} = require('capybara-router');
const history = require('history');
const api = require('../core/apis/web-api');

const _title = 'Web';

module.exports = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      isAbstract: true,
      name: 'web',
      uri: '',
      component: require('./pages/shared/layout')
    },
    {
      name: 'web.home',
      uri: '/',
      onEnter: () => {
        document.title = _title;
      },
      resolve: {
        restaurants: () => {
          const time = new Date('1970-01-04T00:00:00.000Z');
          const now = new Date();
          time.setMinutes(now.getMinutes());
          time.setHours(now.getHours());
          time.setDate(time.getDate() + now.getDay());
          return api.restaurant.getRestaurants(time).then(response => response.data)
        }
      },
      loadComponent: () => import(
        /* webpackChunkName: "web-home" */
        './pages/home'
      )
    },
    {
      name: 'not-found',
      uri: '.*',
      component: require('./pages/shared/not-found')
    }
  ],
  errorComponent: require('./pages/shared/error-page')
});
