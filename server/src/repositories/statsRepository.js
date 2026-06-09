import { db } from '../config/db.js';

export const getAdminStats = async () => {
  const [[orders]] = await db.execute('SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_price), 0) AS revenue FROM orders');
  const [[customers]] = await db.execute('SELECT COUNT(*) AS totalCustomers FROM customers WHERE role = ?',[ 'CUSTOMER']);
  const [[products]] = await db.execute('SELECT COUNT(*) AS totalProducts FROM products');

  return {
    totalOrders: orders.totalOrders,
    revenue: Number(orders.revenue || 0),
    totalCustomers: customers.totalCustomers,
    totalProducts: products.totalProducts
  };
};
