const mongoose = require('mongoose');
const Redis = require('ioredis');

const config = require('../config');
const logger = require('./logger');

// MongoDB

try {
  mongoose.connect(config.mongodb.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  logger.info('MongoDB connected', { type: 'database' });
} catch (error) {
  logger.error('MongoDB Connection Error', { type: 'database' });
}

const PasteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    site_id: { type: String, required: true },
    paste: {
      id: { type: String, required: true },
      url: { type: String, required: true },
      title: { type: String, required: true },
      author: { type: String, required: true },
      createdOn: { type: Date, required: true },
      body: { type: String, required: true },
      md5: { type: String, required: true }
    }
  },
  { timestamps: true }
);

const pasteModel = mongoose.model('paste', PasteSchema);

// Redis
let redis;
try {
  redis = new Redis(config.redis.host, {
    username: config.redis.username,
    password: config.redis.password
  });
  logger.info('Redis connected', { type: 'database' });
} catch (error) {
  logger.error('Redis Connection Error', { type: 'database' });
}

module.exports = async (paste) => {
  try {
    await pasteModel.updateOne({ id: paste.id }, paste, { upsert: true });
    logger.info(`${paste.id} Paste saved in database`, { type: 'database' });
  } catch (error) {
    logger.error(error, { type: 'database' });
  }
  try {
    await redis.set(paste.id, paste.paste.md5);
    logger.info(`${paste.id} Paste saved in cache`, { type: 'database' });
  } catch (error) {
    logger.error(error, { type: 'database' });
  }
};
