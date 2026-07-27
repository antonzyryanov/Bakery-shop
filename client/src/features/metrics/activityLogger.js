import { apiFetch } from '../../app/api.js';

const SESSION_KEY = 'bakery_metrics_session_id';
const QUEUE_KEY = 'bakery_metrics_queue';

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 32);
  }

  return `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getMetricsSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = createSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

const readQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch (error) {
    return [];
  }
};

const writeQueue = (events) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-100)));
};

export const trackActivity = (eventType, {
  page = 'HOME',
  productId = null,
  orderId = null,
  meta = {}
} = {}) => {
  const event = {
    eventType,
    platform: 'WEB',
    sessionId: getMetricsSessionId(),
    page,
    productId,
    orderId,
    meta,
    attributes: Object.entries(meta).map(([key, value]) => ({ key, value: String(value) }))
  };

  const queue = readQueue();
  queue.push(event);
  writeQueue(queue);
  flushActivityQueue();
};

let flushTimer = null;
let flushing = false;

export const flushActivityQueue = async () => {
  if (flushing) {
    return;
  }

  if (flushTimer) {
    clearTimeout(flushTimer);
  }

  flushTimer = setTimeout(async () => {
    const queue = readQueue();
    if (!queue.length) {
      return;
    }

    flushing = true;
    writeQueue([]);

    try {
      await apiFetch('/api/metrics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: queue })
      });
    } catch (error) {
      const existing = readQueue();
      writeQueue([...queue, ...existing]);
    } finally {
      flushing = false;
    }
  }, 250);
};
