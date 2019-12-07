const mongoose = require('mongoose');
const utils = require('../../common/utils');

const schema = utils.generateSchema('Restaurants', {
  name: {
    type: String,
    required: true,
    trim: true,
    index: {
      name: 'Name',
      unique: true
    }
  },
  dutyTimeRawData: {
    type: String,
    required: true,
    trim: true
  },
  dutyTimes: [
    new mongoose.Schema({
      _id: false,
      start: {
        type: Date,
        required: true
      },
      end: {
        type: Date,
        required: true
      }
    })
  ]
});

schema.index(
  {'dutyTimes.start': 1, 'dutyTimes.end': 1},
  {
    name: 'DutyTime',
    background: true
  }
);

schema.method('dump', function () {
  return {
    id: this.id,
    name: this.name,
    dutyTimeRawData: this.dutyTimeRawData,
    dutyTimes: this.dutyTimes,
    createTime: this.createTime
  };
});

module.exports = mongoose.model('RestaurantModel', schema);
