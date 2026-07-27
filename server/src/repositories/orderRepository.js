import { db } from '../config/db.js';

export const createOrderWithItems = async ({ orderId, customerId, phoneNumber, adress, totalPrice, items }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(
      'INSERT INTO orders (id, customer_id, phone_number, adress, total_price, status) VALUES (?, ?, ?, ?, ?, ?)',
      [orderId, customerId, phoneNumber, adress, totalPrice, 'PLACED']
    );

    for (const item of items) {
      await connection.execute(
        'INSERT INTO chosen_products (id, order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        [item.id, orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const attachItemsToOrders = async (orders) => {
  if (!orders.length) {
    return orders;
  }

  const ids = orders.map((order) => order.id);
  const placeholders = ids.map(() => '?').join(',');
  const [items] = await db.execute(
    `SELECT cp.order_id AS orderId,
            cp.product_id AS productId,
            p.name AS productName,
            cp.quantity,
            cp.unit_price AS unitPrice
     FROM chosen_products cp
     INNER JOIN products p ON p.id = cp.product_id
     WHERE cp.order_id IN (${placeholders})
     ORDER BY p.name ASC`,
    ids
  );

  const byOrder = items.reduce((acc, item) => {
    if (!acc[item.orderId]) {
      acc[item.orderId] = [];
    }
    acc[item.orderId].push(item);
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    items: byOrder[order.id] || [],
    canCancel: order.status === 'PLACED',
    canAccept: order.status === 'PLACED'
  }));
};

export const getOrderHistoryByCustomer = async (customerId) => {
  const [rows] = await db.execute(
    `SELECT o.id, o.phone_number AS phoneNumber, o.adress, o.total_price AS totalPrice, o.status, o.created_at AS createdAt
     FROM orders o
     WHERE o.customer_id = ?
     ORDER BY o.created_at DESC`,
    [customerId]
  );
  return attachItemsToOrders(rows);
};

const buildRangeClause = (range) => {
  switch (range) {
    case 'last_day':
      return "o.created_at >= NOW() - INTERVAL 1 DAY";
    case 'last_week':
      return "o.created_at >= NOW() - INTERVAL 7 DAY";
    case 'last_month':
      return "o.created_at >= NOW() - INTERVAL 1 MONTH";
    case 'last_year':
      return "o.created_at >= NOW() - INTERVAL 1 YEAR";
    default:
      return '1=1';
  }
};

export const getAdminOrdersByRange = async ({ range, from, to }) => {
  let whereClause = buildRangeClause(range);
  const params = [];

  if (range === 'custom' && from && to) {
    whereClause = 'o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)';
    params.push(from, to);
  }

  const [rows] = await db.execute(
    `SELECT o.id,
            o.customer_id AS customerId,
            c.email AS customerEmail,
            o.phone_number AS phoneNumber,
            o.adress,
            o.total_price AS totalPrice,
            o.status,
            o.created_at AS createdAt
     FROM orders o
     INNER JOIN customers c ON c.id = o.customer_id
     WHERE ${whereClause}
     ORDER BY o.created_at DESC`,
    params
  );

  return attachItemsToOrders(rows);
};

export const getOrderById = async (orderId) => {
  const [rows] = await db.execute(
    `SELECT id, customer_id AS customerId, phone_number AS phoneNumber, adress,
            total_price AS totalPrice, status, created_at AS createdAt
     FROM orders
     WHERE id = ?
     LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
};

export const updateOrderStatus = async ({ orderId, status, expectedStatus }) => {
  const [result] = await db.execute(
    'UPDATE orders SET status = ? WHERE id = ? AND status = ?',
    [status, orderId, expectedStatus]
  );
  return result.affectedRows > 0;
};
