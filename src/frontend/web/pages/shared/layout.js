const React = require('react');
const {RouterView} = require('capybara-router');
const Base = require('../../../core/pages/base');
const Loading = require('../../../core/components/loading');

module.exports = class Layout extends Base {
  render() {
    return (
      <RouterView><Loading/></RouterView>
    );
  }
};
