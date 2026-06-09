USE bakery_shop;

SET @phone_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'bakery_shop'
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'phone_number'
);

SET @add_phone_sql = IF(
  @phone_exists = 0,
  'ALTER TABLE orders ADD COLUMN phone_number VARCHAR(40) NOT NULL DEFAULT '''' AFTER customer_id',
  'SELECT ''phone_number column already exists'''
);

PREPARE add_phone_stmt FROM @add_phone_sql;
EXECUTE add_phone_stmt;
DEALLOCATE PREPARE add_phone_stmt;

SET @adress_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'bakery_shop'
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'adress'
);

SET @add_adress_sql = IF(
  @adress_exists = 0,
  'ALTER TABLE orders ADD COLUMN adress VARCHAR(300) NOT NULL DEFAULT '''' AFTER phone_number',
  'SELECT ''adress column already exists'''
);

PREPARE add_adress_stmt FROM @add_adress_sql;
EXECUTE add_adress_stmt;
DEALLOCATE PREPARE add_adress_stmt;
