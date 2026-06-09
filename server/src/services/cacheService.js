import { getRedisClient } from '../config/redis.js';

export const getCache = async (key) => {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  await redis.setEx(key, ttlSeconds, JSON.stringify(value));
};

export const deleteCache = async (key) => {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  await redis.del(key);
};
