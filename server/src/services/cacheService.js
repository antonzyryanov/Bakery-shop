import { getRedisClient } from '../config/redis.js';

export const getCache = async (key) => {
  const redis = getRedisClient();
  if (!redis) {
    return null;
  }

  try {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCache = async (key, value, ttlSeconds = 60) => {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Cache is optional; ignore write failures.
  }
};

export const deleteCache = async (key) => {
  const redis = getRedisClient();
  if (!redis) {
    return;
  }

  try {
    await redis.del(key);
  } catch {
    // Cache is optional; ignore delete failures.
  }
};
