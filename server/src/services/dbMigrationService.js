import { db } from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hasColumn = async (tableName, columnName) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return Number(rows[0]?.count || 0) > 0;
};

const hasTable = async (tableName) => {
  const [rows] = await db.execute(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(rows[0]?.count || 0) > 0;
};

const runSqlFile = async (relativePath, label) => {
  const sqlPath = path.resolve(__dirname, relativePath);
  const rawSql = fs.readFileSync(sqlPath, 'utf8');
  const statements = rawSql
    .replace(/\r\n/g, '\n')
    .split(';')
    .map((chunk) => chunk
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim())
    .filter((chunk) => chunk && !chunk.toUpperCase().startsWith('USE '));

  for (const statement of statements) {
    try {
      await db.query(statement);
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_TABLE_EXISTS_ERROR') {
        continue;
      }
      throw error;
    }
  }

  console.log(`Migration applied: ${label}`);
};

export const runRequiredMigrations = async () => {
  const hasPhoneNumber = await hasColumn('orders', 'phone_number');
  if (!hasPhoneNumber) {
    await db.execute(
      "ALTER TABLE orders ADD COLUMN phone_number VARCHAR(40) NOT NULL DEFAULT '' AFTER customer_id"
    );
    console.log('Migration applied: orders.phone_number');
  }

  const hasAdress = await hasColumn('orders', 'adress');
  if (!hasAdress) {
    await db.execute(
      "ALTER TABLE orders ADD COLUMN adress VARCHAR(300) NOT NULL DEFAULT '' AFTER phone_number"
    );
    console.log('Migration applied: orders.adress');
  }

  const hasMetrics = await hasTable('metric_events');
  if (!hasMetrics) {
    await runSqlFile('../../../database/add_metrics_tables.sql', 'metrics tables (3NF)');
  }

  const [enumRows] = await db.execute(
    `SELECT COLUMN_TYPE AS columnType
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'orders'
       AND COLUMN_NAME = 'status'`
  );
  const columnType = String(enumRows[0]?.columnType || '');
  if (columnType && !columnType.includes("'ACCEPTED'")) {
    await db.execute(
      "ALTER TABLE orders MODIFY COLUMN status ENUM('PLACED', 'ACCEPTED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'PLACED'"
    );
    console.log('Migration applied: orders.status ACCEPTED');
  }

  const hasConversations = await hasTable('conversations');
  if (!hasConversations) {
    await runSqlFile('../../../database/add_orders_chat_tables.sql', 'orders chat tables (3NF)');
  }
};
