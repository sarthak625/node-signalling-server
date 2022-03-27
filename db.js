const log4js = require('log4js');
const logger = log4js.getLogger('console');

const Redis = require("ioredis");
const redis = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
});

redis.on('connect', () => {
    logger.info(`Successfully connected to redis at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
});

module.exports = redis;