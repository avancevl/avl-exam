const fs = require('fs');
const path = require('path');
const util = require('util');
const zlib = require('zlib');
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
 --------------------------
 
 -------- assets ----------
 node . -s
 --------------------------`
  )
  .options('c', {alias: 'createCollections'})
  .describe('c', 'Create collections and indexes of all models.')
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
