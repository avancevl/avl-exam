const RestaurantModel = require('../models/data/restaurant-model');

exports.getRestaurants = (req, res) => {
  /*
  GET /api/restaurants
   */
  const time = new Date(req.query.time);

  return RestaurantModel.where({
    dutyTimes: {
      $elemMatch: {
        start: {$lte: time},
        end: {$gt: time}
      }
    }
  })
    .then(restaurants => {
      res.json(restaurants.map(x => x.dump()));
    });
};
