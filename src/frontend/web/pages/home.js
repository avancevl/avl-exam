const React = require('react');
const Base = require('../../core/pages/base');

module.exports = class Home extends Base {
  render() {
    const {restaurants} = this.props;

    return (
      <div className="container">
        <div className="row">
          <div className="col-12">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Time</th>
                </tr>
              </thead>
              <tbody>
                {
                  restaurants.map(restaurant => (
                    <tr key={restaurant.id}>
                      <td>{restaurant.name}</td>
                      <td>{restaurant.dutyTimeRawData}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
};
