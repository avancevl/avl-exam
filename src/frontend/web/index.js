// Stylesheets
require('./stylesheets/_web.scss');

// Vendors
require('@babel/polyfill');
require('bootstrap/dist/js/bootstrap.bundle.js');

const nprogress = require('nprogress');
const React = require('react');
const ReactDOM = require('react-dom');
const {RouterView} = require('capybara-router');
const {PUSH, REPLACE, POP, RELOAD} = require('capybara-router/lib/constants/history-actions');
const router = require('./router');
const Loading = require('../core/components/loading');
const store = require('../core/store');
const {CURRENT_USER} = require('../core/constants').store;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

store.set(CURRENT_USER, window.user);
nprogress.configure({showSpinner: false});

router.listen('ChangeStart', (action, toState, fromState, cancel) => {
  nprogress.start();
  if (window.error) {
    // Backend need we render the error page.
    cancel();
    setTimeout(() => {
      nprogress.done();
      router.renderError(window.error);
    });
    return;
  }

  const $user = store.get(CURRENT_USER);
  const deniedAnonymousRoutes = [];
  if (!$user && deniedAnonymousRoutes.indexOf(toState.name) >= 0) {
    cancel();
    setTimeout(() => {
      router.go('/login', {replace: true});
    });
  }
});
router.listen('ChangeSuccess', action => {
  nprogress.done();
  // Scroll to top.
  if ([PUSH, REPLACE, POP].indexOf(action) >= 0) {
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  } else if (action === RELOAD) {
    if (typeof window.scrollTo === 'function') {
      window.scrollTo(0, 0);
    }
  }
});
router.listen('ChangeError', nprogress.done);
router.start();

ReactDOM.render(
  <RouterView><Loading/></RouterView>,
  document.getElementById('root')
);
