import { db } from '../config/db.js';

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
};
