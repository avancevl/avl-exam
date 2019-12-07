/* eslint-disable capitalized-comments */
const {Router} = require('capybara-router');
const history = require('history');

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
      resolve: {},
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
