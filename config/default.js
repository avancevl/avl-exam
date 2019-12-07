module.exports = {
  isDebug: true,
  enableLog: false,
  url: 'http://localhost:8000',
  database: {
    url: 'mongodb://127.0.0.1:27017/avl-exam',
    options: {
      ssl: false,
      useNewUrlParser: true,
      connectTimeoutMS: 1000,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 500,
      autoIndex: false,
      useUnifiedTopology: true
    }
  },
  expressServer: {host: 'localhost', port: 8000},
  webpackDevServer: {host: 'localhost', port: 8001},

  redis: {
    rateLimitRedisUrl: 'redis://localhost:6379',
    rateLimitRedisDb: 0
  },

  session: {
    name: 'session',
    secret: '10406a54-9138-4c15-99de-3872c960212e',
    secure: false,
    maxAge: 14 * 24 * 60 * 60 * 1000 // = 14 days.
  },

  s3: {
    key: '',
    secret: '',
    bucket: '',
    region: '',
    urlPrefix: '',
    folders: {}
  }
};
