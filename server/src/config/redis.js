import { createClient } from 'redis';
import { env } from './env.js';

let redisClient = null;
let redisWarned = false;

const warnOnce = (message, detail) => {
  if (redisWarned) {
    return;
  }
  console.warn(message);
  if (detail) {
    console.warn('Redis error:', detail);
  }
  redisWarned = true;
};

export const connectRedis = async () => {
  if (!env.redisEnabled || !env.redisUrl) {
    console.log('Redis disabled. Continuing without cache.');
    redisClient = null;
    return;
  }

  try {
    redisClient = createClient({
      url: env.redisUrl,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries) => {
          if (retries > 20) {
            return false;
          }
          return Math.min(retries * 200, 3000);
        }
      }
    });

    redisClient.on('error', (err) => {
      warnOnce('Redis unavailable. Continuing without cache.', err.message);
    });

    redisClient.on('ready', () => {
      redisWarned = false;
      console.log('Redis connected');
    });

    await redisClient.connect();
  } catch (error) {
    warnOnce('Redis unavailable. Continuing without cache.', error.message);
    redisClient = null;
  }
};

export const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    return null;
  }
  return redisClient;
};
