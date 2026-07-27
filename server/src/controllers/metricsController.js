import {
  getMetricsFeed,
  getMetricsLookups,
  getMetricsSummary,
  recordActivityEvents
} from '../services/metricsService.js';

export const postActivityEvents = async (req, res, next) => {
  try {
    const headerPlatform = String(req.headers['x-client-platform'] || '').toUpperCase();
    const fallbackPlatform = ['WEB', 'MOBILE'].includes(headerPlatform) ? headerPlatform : 'WEB';

    const result = await recordActivityEvents({
      events: req.body.events,
      customerId: req.user?.sub || null,
      fallbackPlatform
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

export const listActivityEvents = async (req, res, next) => {
  try {
    const data = await getMetricsFeed({
      eventTypeCode: req.query.eventType || '',
      platformCode: req.query.platform || '',
      pageCode: req.query.page || '',
      customerId: req.query.customerId || '',
      sessionId: req.query.sessionId || '',
      from: req.query.from || '',
      to: req.query.to || '',
      limit: req.query.limit,
      offset: req.query.offset
    });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const listActivityLookups = async (req, res, next) => {
  try {
    const lookups = await getMetricsLookups();
    return res.json(lookups);
  } catch (error) {
    return next(error);
  }
};

export const listActivitySummary = async (req, res, next) => {
  try {
    const summary = await getMetricsSummary({
      from: req.query.from || '',
      to: req.query.to || '',
      platformCode: req.query.platform || ''
    });
    return res.json({ summary });
  } catch (error) {
    return next(error);
  }
};
