import { db } from '../config/db.js';

export const findCustomerByEmail = async (email) => {
  const [rows] = await db.execute(
    'SELECT id, email, role, password_hash, current_order_id FROM customers WHERE email = ?',
    [email]
  );
  return rows[0] || null;
};

export const findCustomerById = async (id) => {
  const [rows] = await db.execute(
    'SELECT id, email, role, current_order_id FROM customers WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

export const createCustomer = async ({ id, email, passwordHash }) => {
  await db.execute(
    'INSERT INTO customers (id, email, role, password_hash) VALUES (?, ?, ?, ?)',
    [id, email, 'CUSTOMER', passwordHash]
  );
};

export const setCurrentOrderId = async (customerId, orderId) => {
  await db.execute('UPDATE customers SET current_order_id = ? WHERE id = ?', [orderId, customerId]);
};

export const addDoneOrder = async (customerId, orderId) => {
  await db.execute(
    'INSERT IGNORE INTO customer_done_orders (customer_id, order_id) VALUES (?, ?)',
    [customerId, orderId]
  );
};

export const listDoneOrders = async (customerId) => {
  const [rows] = await db.execute(
    'SELECT order_id, completed_at FROM customer_done_orders WHERE customer_id = ? ORDER BY completed_at DESC',
    [customerId]
  );
  return rows;
};

export const ensureAdminUser = async ({ email, passwordHash }) => {
  const [rows] = await db.execute('SELECT id FROM customers WHERE email = ?', [email]);
  if (!rows.length) {
    await db.execute(
      'INSERT INTO customers (id, email, role, password_hash) VALUES (?, ?, ?, ?)',
      ['admin-customer-0001', email, 'ADMIN', passwordHash]
    );
    return;
  }

  await db.execute(
    'UPDATE customers SET role = ?, password_hash = ? WHERE email = ?',
    ['ADMIN', passwordHash, email]
  );
};
