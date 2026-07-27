import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { apiFetch } from './api';

const SESSION_KEY = 'bakery_mobile_session_id';
const QUEUE_KEY = 'bakery_mobile_metrics_queue';
const CLIENT_PLATFORM = 'MOBILE';

const createSessionId = () => `mob_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const getMetricsSessionId = async () => {
  let sessionId = await AsyncStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = createSessionId();
    await AsyncStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const readQueue = async () => {
  try {
    return JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || '[]');
  } catch (error) {
    return [];
  }
};

const writeQueue = async (events) => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-100)));
};

let flushing = false;

export const trackActivity = async (eventType, {
  page = 'HOME',
  productId = null,
  orderId = null,
  meta = {}
} = {}) => {
  const sessionId = await getMetricsSessionId();
  const event = {
    eventType,
    platform: CLIENT_PLATFORM,
    sessionId,
    page,
    productId,
    orderId,
    attributes: [
      ...Object.entries(meta).map(([key, value]) => ({ key, value: String(value) })),
      { key: 'os', value: Platform.OS },
      { key: 'client', value: 'expo-mobile' }
    ]
  };

  const queue = await readQueue();
  queue.push(event);
  await writeQueue(queue);
  flushActivityQueue();
};

export const flushActivityQueue = async () => {
  if (flushing) {
    return;
  }

  const queue = await readQueue();
  if (!queue.length) {
    return;
  }

  flushing = true;
  await writeQueue([]);

  try {
    await apiFetch('/api/metrics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Platform': CLIENT_PLATFORM
      },
      body: JSON.stringify({ events: queue })
    });
  } catch (error) {
    const existing = await readQueue();
    await writeQueue([...queue, ...existing]);
  } finally {
    flushing = false;
  }
};
