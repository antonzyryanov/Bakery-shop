import { createClient } from 'redis';
import { env } from '../config/env.js';

const NUTRITION_QUEUE_KEY = 'bakery:nutrition:queue';

let redisClient = null;

const getRedisClient = async () => {
  if (!env.redisEnabled) {
    return null;
  }

  if (!redisClient) {
    redisClient = createClient({ url: env.redisUrl });
    redisClient.on('error', (error) => {
      console.error('Redis nutrition queue error:', error.message);
    });
    await redisClient.connect();
  }

  return redisClient;
};

export const nutritionApiFetch = async (path, options = {}) => {
  const headers = {
    Accept: 'application/json',
    'X-Internal-Api-Key': env.nutritionInternalKey,
    ...(options.headers || {})
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${env.nutritionApiUrl}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.detail || errorBody.message || `Nutrition API failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const enqueueNutritionTask = async (task, payload) => {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }

  const message = JSON.stringify({
    task,
    payload,
    queuedAt: new Date().toISOString()
  });

  await client.lPush(NUTRITION_QUEUE_KEY, message);

  try {
    await nutritionApiFetch('/api/v1/internal/queue', {
      method: 'POST',
      body: JSON.stringify({ task, payload })
    });
  } catch (error) {
    console.warn('Nutrition Celery queue dispatch failed:', error.message);
  }

  return message;
};

export const syncNutritionUser = async ({ id, email, role }) => {
  try {
    await nutritionApiFetch('/api/v1/internal/users/sync', {
      method: 'POST',
      body: JSON.stringify({ id, email, role })
    });
  } catch (error) {
    await enqueueNutritionTask('sync_user', { id, email, role });
  }
};
