import {
  getMetricSummary,
  insertMetricEvent,
  listMetricEvents,
  listMetricLookups,
  resolveEventTypeId,
  resolvePageId,
  resolvePlatformId
} from '../repositories/metricsRepository.js';

export const recordActivityEvents = async ({ events, customerId, fallbackPlatform }) => {
  if (!Array.isArray(events) || !events.length) {
    const error = new Error('At least one event is required.');
    error.status = 400;
    throw error;
  }

  const savedIds = [];

  for (const event of events.slice(0, 50)) {
    const platformCode = String(event.platform || fallbackPlatform || 'WEB').toUpperCase();
    const eventTypeId = await resolveEventTypeId(event.eventType);
    const platformId = await resolvePlatformId(platformCode);

    if (!eventTypeId || !platformId) {
      const error = new Error(`Unknown eventType or platform: ${event.eventType}/${platformCode}`);
      error.status = 400;
      throw error;
    }

    const pageId = event.page ? await resolvePageId(event.page) : null;
    const sessionId = String(event.sessionId || '').trim();
    if (!sessionId) {
      const error = new Error('sessionId is required for each event.');
      error.status = 400;
      throw error;
    }

    const attributes = Array.isArray(event.attributes)
      ? event.attributes
      : Object.entries(event.meta || {}).map(([key, value]) => ({ key, value }));

    const id = await insertMetricEvent({
      eventTypeId,
      platformId,
      pageId,
      customerId: event.customerId || customerId || null,
      sessionId,
      productId: event.productId || null,
      orderId: event.orderId || null,
      attributes
    });

    savedIds.push(id);
  }

  return { saved: savedIds.length, ids: savedIds };
};

export const getMetricsFeed = async (filters) => listMetricEvents(filters);

export const getMetricsLookups = async () => listMetricLookups();

export const getMetricsSummary = async (filters) => getMetricSummary(filters);
