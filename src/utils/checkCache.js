const Redis = require('ioredis');

const config = require('../config');

// Redis

const redis = new Redis(config.redis.host, {
  username: config.redis.username,
  password: config.redis.password
});

module.exports = async (pasteId) => redis.get(pasteId);
