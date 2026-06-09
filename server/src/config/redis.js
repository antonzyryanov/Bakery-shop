import { createClient } from 'redis';
import { env } from './env.js';

let redisClient = null;
let redisWarned = false;

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
        connectTimeout: 2000,
        reconnectStrategy: () => false
      }
    });

    redisClient.on('error', (err) => {
      if (!redisWarned) {
        console.warn('Redis unavailable. Continuing without cache.');
        console.warn('Redis error:', err.message);
        redisWarned = true;
      }
    });

    await redisClient.connect();
    console.log('Redis connected');
  } catch (error) {
    if (!redisWarned) {
      console.warn('Redis unavailable. Continuing without cache.');
      console.warn('Redis error:', error.message);
      redisWarned = true;
    }
    redisClient = null;
  }
};

export const getRedisClient = () => redisClient;
