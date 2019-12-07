const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
const csvParse = require('csv-parse/lib/sync');
const pLimit = require('p-limit');
const optimist = require('optimist');
const utils = require('./src/backend/common/utils');

const op = optimist
  .usage(
    `
The command line tool.
Usage:
 -------- database --------
 node . -c
 node . -p data/restaurant_open_times-taipei_sushi.csv
 --------------------------
 
 -------- assets ----------
 node . -s
 --------------------------`
  )
  .options('c', {alias: 'createCollections'})
  .describe('c', 'Create collections and indexes of all models.')
  .options('p', {alias: 'parseCSV'})
  .describe('p', 'Parse the restaurant csv file.')
  .options('s', {alias: 'uploadToS3'})
  .describe('s', 'Upload assets to S3.');

if (op.argv.createCollections) {
  // Create collections and indexes of all models.
  const models = require('./src/backend/models/data');
  const limit = pLimit(1);

  Promise.all(
    models.map(model =>
      limit(() => {
        console.log(`Create: ${model.modelName}`);
        return model.createIndexes();
      })
    )
  ).then(() => {
    process.exit(0);
  });
} else if (op.argv.parseCSV) {
  const RestaurantModel = require('./src/backend/models/data/restaurant-model');
  const csvObject = csvParse(fs.readFileSync(op.argv.parseCSV));
  // 1970-01-04T00:00:00.000Z .getDay() === 0
  Promise.all(csvObject.map(items => {
    const restaurant = new RestaurantModel({
      name: items[0],
      dutyTimeRawData: items[1],
      dutyTimes: (timeData => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const result = [];
        const convertTime = token => {
          const result = {
            start: new Date('1970-01-04T00:00:00.000Z'),
            end: new Date('1970-01-04T00:00:00.000Z')
          };
          for (let index = 0; index < days.length; index += 1) {
            if (token.indexOf(days[index]) >= 0) {
              const timeRange = token.replace(days[index], '').split('-');
              const matchStart = timeRange[0].trim().match(/^(\d{1,2})(:30)?\s(am|pm)/);
              result.start.setDate(result.start.getDate() + index);
              result.start.setHours(result.start.getHours() + Number(matchStart[1]));
              if (matchStart[2]) {
                result.start.setMinutes(result.start.getMinutes() + 30);
              }

              if (matchStart[3] === 'pm') {
                result.start.setHours(result.start.getHours() + 12);
              }

              const matchEnd = timeRange[1].trim().match(/^(\d{1,2})(:30)?\s(am|pm)/);
              result.end.setDate(result.end.getDate() + index);
              result.end.setHours(result.end.getHours() + Number(matchEnd[1]));
              if (matchEnd[2]) {
                result.end.setMinutes(result.end.getMinutes() + 30);
              }

              if (matchEnd[3] === 'pm') {
                result.end.setHours(result.end.getHours() + 12);
              }

              break;
            }
          }

          result.start.setHours(result.start.getHours() - 8);
          result.end.setHours(result.end.getHours() - 8);
          return result;
        };

        timeData.split('/').forEach(token => {
          const match = token.trim().match(/([SMTWF]\w{2})-([SMTWF]\w{2})(?:,\s([SMTWF]\w{2}))?(.*)/);
          if (match) {
            const startDayIndex = days.indexOf(match[1]);
            for (let index = startDayIndex; index < days.length; index += 1) {
              result.push(convertTime(`${days[index]} ${match[4].trim()} `));
              if (days[index] === match[2]) {
                break;
              }
            }

            if (match[3]) {
              result.push(convertTime(`${match[3]} ${match[4].trim()} `));
            }
          } else {
            result.push(convertTime(token.trim()));
          }
        });
        return result;
      })(items[1])
    });
    return restaurant.save();
  }))
    .then(() => console.log('done'))
    .catch(error => {
      console.error(error);
    })
    .finally(() => process.exit(0));
} else if (op.argv.uploadToS3) {
  const limit = pLimit(10);
  const tasks = [];
  const assetsPath = path.join(__dirname, 'dist', 'frontend');
  const gzipPattern = /\.(js|css|svg)$/;
  const gzip = util.promisify(zlib.gzip);

  const uploadFile = (source, destination, isCompression) => {
    const data = fs.readFileSync(source);
    if (isCompression) {
      return gzip(data)
        .then(gzipData => utils.uploadToS3({
          Key: destination,
          ContentEncoding: 'gzip',
          Body: gzipData,
          ACL: 'public-read'
        }));
    }

    return utils.uploadToS3({
      Key: destination,
      Body: data,
      ACL: 'public-read'
    });
  };

  fs.readdirSync(assetsPath).forEach(file => {
    if (gzipPattern.test(file)) {
      tasks.push(limit(() =>
        uploadFile(path.join(assetsPath, file), `assets/${file}`, true)
          .then(() => console.log(`uploaded: assets/${file}`))
      ));
    }
  });
  fs.readdirSync(path.join(assetsPath, 'resources')).forEach(file => {
    tasks.push(limit(() =>
      uploadFile(
        path.join(assetsPath, 'resources', file),
        `assets/resources/${file}`,
        gzipPattern.test(file)
      ).then(() => console.log(`uploaded: assets/resource/${file}`))
    ));
  });

  Promise.all(tasks)
    .then(() => console.log('Done'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
} else {
  op.showHelp();
}
