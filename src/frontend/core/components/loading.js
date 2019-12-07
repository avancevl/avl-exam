const classNames = require('classnames');
const PropTypes = require('prop-types');
const React = require('react');

module.exports = class Loading extends React.Component {
  static get propTypes() {
    return {
      className: PropTypes.string
    };
  }

  static get defaultProps() {
    return {
      className: null
    };
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div className={classNames('text-center text-muted py-5', this.props.className)}>
        <div className="spinner-border">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }
};
