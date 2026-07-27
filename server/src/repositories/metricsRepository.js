import { db } from '../config/db.js';
import { generateId } from '../utils/ids.js';

const lookupCache = {
  eventTypes: new Map(),
  platforms: new Map(),
  pages: new Map()
};

const getLookupId = async (table, codeColumn, cacheKey, code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (lookupCache[cacheKey].has(normalized)) {
    return lookupCache[cacheKey].get(normalized);
  }

  const [rows] = await db.execute(
    `SELECT id FROM ${table} WHERE ${codeColumn} = ? LIMIT 1`,
    [normalized]
  );

  const id = rows[0]?.id || null;
  if (id) {
    lookupCache[cacheKey].set(normalized, id);
  }

  return id;
};

export const resolveEventTypeId = (code) => getLookupId('metric_event_types', 'code', 'eventTypes', code);
export const resolvePlatformId = (code) => getLookupId('metric_platforms', 'code', 'platforms', code);
export const resolvePageId = (code) => getLookupId('metric_pages', 'code', 'pages', code);

export const insertMetricEvent = async ({
  eventTypeId,
  platformId,
  pageId,
  customerId,
  sessionId,
  productId,
  orderId,
  attributes = []
}) => {
  const eventId = generateId();

  await db.execute(
    `INSERT INTO metric_events
      (id, event_type_id, platform_id, page_id, customer_id, session_id, product_id, order_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      eventId,
      eventTypeId,
      platformId,
      pageId || null,
      customerId || null,
      sessionId,
      productId || null,
      orderId || null
    ]
  );

  for (const attr of attributes) {
    const key = String(attr.key || '').trim().slice(0, 64);
    const value = String(attr.value ?? '').trim().slice(0, 500);
    if (!key || !value) {
      continue;
    }

    await db.execute(
      `INSERT INTO metric_event_attributes (event_id, attr_key, attr_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE attr_value = VALUES(attr_value)`,
      [eventId, key, value]
    );
  }

  return eventId;
};

export const listMetricLookups = async () => {
  const [[eventTypes], [platforms], [pages]] = await Promise.all([
    db.execute('SELECT id, code, name FROM metric_event_types ORDER BY name ASC'),
    db.execute('SELECT id, code, name FROM metric_platforms ORDER BY name ASC'),
    db.execute('SELECT id, code, name FROM metric_pages ORDER BY name ASC')
  ]);

  return { eventTypes, platforms, pages };
};

export const listMetricEvents = async ({
  eventTypeCode,
  platformCode,
  pageCode,
  customerId,
  sessionId,
  from,
  to,
  limit = 200,
  offset = 0
}) => {
  const where = [];
  const params = [];

  if (eventTypeCode) {
    where.push('et.code = ?');
    params.push(String(eventTypeCode).toUpperCase());
  }
  if (platformCode) {
    where.push('mp.code = ?');
    params.push(String(platformCode).toUpperCase());
  }
  if (pageCode) {
    where.push('pg.code = ?');
    params.push(String(pageCode).toUpperCase());
  }
  if (customerId) {
    where.push('me.customer_id = ?');
    params.push(customerId);
  }
  if (sessionId) {
    where.push('me.session_id = ?');
    params.push(sessionId);
  }
  if (from) {
    where.push('me.created_at >= ?');
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    where.push('me.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(to);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [rows] = await db.execute(
    `SELECT
        me.id,
        me.session_id AS sessionId,
        me.customer_id AS customerId,
        c.email AS customerEmail,
        me.product_id AS productId,
        p.name AS productName,
        me.order_id AS orderId,
        me.created_at AS createdAt,
        et.code AS eventTypeCode,
        et.name AS eventTypeName,
        mp.code AS platformCode,
        mp.name AS platformName,
        pg.code AS pageCode,
        pg.name AS pageName
      FROM metric_events me
      INNER JOIN metric_event_types et ON et.id = me.event_type_id
      INNER JOIN metric_platforms mp ON mp.id = me.platform_id
      LEFT JOIN metric_pages pg ON pg.id = me.page_id
      LEFT JOIN customers c ON c.id = me.customer_id
      LEFT JOIN products p ON p.id = me.product_id
      ${whereSql}
      ORDER BY me.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total
      FROM metric_events me
      INNER JOIN metric_event_types et ON et.id = me.event_type_id
      INNER JOIN metric_platforms mp ON mp.id = me.platform_id
      LEFT JOIN metric_pages pg ON pg.id = me.page_id
      ${whereSql}`,
    params
  );

  const eventIds = rows.map((row) => row.id);
  let attributesByEvent = {};

  if (eventIds.length) {
    const placeholders = eventIds.map(() => '?').join(',');
    const [attrs] = await db.execute(
      `SELECT event_id AS eventId, attr_key AS attrKey, attr_value AS attrValue
       FROM metric_event_attributes
       WHERE event_id IN (${placeholders})`,
      eventIds
    );

    attributesByEvent = attrs.reduce((acc, attr) => {
      if (!acc[attr.eventId]) {
        acc[attr.eventId] = [];
      }
      acc[attr.eventId].push({ key: attr.attrKey, value: attr.attrValue });
      return acc;
    }, {});
  }

  return {
    total: Number(countRows[0]?.total || 0),
    events: rows.map((row) => ({
      ...row,
      attributes: attributesByEvent[row.id] || []
    }))
  };
};

export const getMetricSummary = async ({ from, to, platformCode } = {}) => {
  const where = [];
  const params = [];

  if (from) {
    where.push('me.created_at >= ?');
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    where.push('me.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    params.push(to);
  }
  if (platformCode) {
    where.push('mp.code = ?');
    params.push(String(platformCode).toUpperCase());
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [byType] = await db.execute(
    `SELECT et.code AS code, et.name AS name, COUNT(*) AS count
     FROM metric_events me
     INNER JOIN metric_event_types et ON et.id = me.event_type_id
     INNER JOIN metric_platforms mp ON mp.id = me.platform_id
     ${whereSql}
     GROUP BY et.id, et.code, et.name
     ORDER BY count DESC`,
    params
  );

  const [byPlatform] = await db.execute(
    `SELECT mp.code AS code, mp.name AS name, COUNT(*) AS count
     FROM metric_events me
     INNER JOIN metric_platforms mp ON mp.id = me.platform_id
     ${whereSql}
     GROUP BY mp.id, mp.code, mp.name
     ORDER BY count DESC`,
    params
  );

  return { byType, byPlatform };
};
