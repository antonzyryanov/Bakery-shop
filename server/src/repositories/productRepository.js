import { db } from '../config/db.js';

export const getAllProducts = async () => {
  const [rows] = await db.execute(
    'SELECT id, name, description, image_url AS imageUrl, price FROM products ORDER BY name ASC'
  );
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await db.execute(
    'SELECT id, name, description, image_url AS imageUrl, price FROM products WHERE id = ?',
    [id]
  );
  return rows[0] || null;
};

export const createProduct = async ({ id, name, description, imageUrl, price }) => {
  await db.execute(
    'INSERT INTO products (id, name, description, image_url, price) VALUES (?, ?, ?, ?, ?)',
    [id, name, description, imageUrl, price]
  );
};

export const updateProduct = async ({ id, name, description, imageUrl, price }) => {
  await db.execute(
    'UPDATE products SET name = ?, description = ?, image_url = ?, price = ? WHERE id = ?',
    [name, description, imageUrl, price, id]
  );
};

export const deleteProduct = async (id) => {
  await db.execute('DELETE FROM products WHERE id = ?', [id]);
};
