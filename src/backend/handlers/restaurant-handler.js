const RestaurantModel = require('../models/data/restaurant-model');

exports.getRestaurants = (req, res) => {
  /*
  GET /api/restaurants
   */
  const time = new Date(req.query.time);

  const query = RestaurantModel.where();
  if (req.query.time) {
    query.where({
      dutyTimes: {
        $elemMatch: {
          start: {$lte: time},
          end: {$gt: time}
        }
      }
    });
  }

  return query.then(restaurants => {
    res.json(restaurants.map(x => x.dump()));
  });
};
