const React = require('react');
const store = require('../store');
const {IS_API_PROCESSING, CURRENT_USER} = require('../constants').store;

module.exports = class Base extends React.Component {
  state = {
    $isApiProcessing: store.get(IS_API_PROCESSING),
    $user: store.get(CURRENT_USER)
  };

  constructor(props) {
    super(props);
    this.$isMounted = false;
    this.$listens = [
      store.subscribe(IS_API_PROCESSING, (_, data) => {
        if (this.$isMounted) {
          this.setState({$isApiProcessing: data});
        } else {
          this.state.$isApiProcessing = data;
        }
      }),
      store.subscribe(CURRENT_USER, (_, data) => {
        if (this.$isMounted) {
          this.setState({$user: {...data}});
        } else {
          this.state.$user = data;
        }
      })
    ];
  }

  componentDidMount() {
    this.$isMounted = true;
  }

  componentWillUnmount() {
    this.$listens.forEach(x => x());
  }
};
