USE bakery_shop;

SET @column_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'bakery_shop'
    AND TABLE_NAME = 'products'
    AND COLUMN_NAME = 'image_url'
);

SET @add_column_sql = IF(
  @column_exists = 0,
  'ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NOT NULL DEFAULT ''/images/products/prd-001.jpg'' AFTER description',
  'SELECT ''image_url column already exists'''
);

PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;

UPDATE products SET image_url = '/images/products/prd-001.jpg' WHERE id = 'prd-001';
UPDATE products SET image_url = '/images/products/prd-002.jpg' WHERE id = 'prd-002';
UPDATE products SET image_url = '/images/products/prd-003.jpg' WHERE id = 'prd-003';
UPDATE products SET image_url = '/images/products/prd-004.jpg' WHERE id = 'prd-004';
UPDATE products SET image_url = '/images/products/prd-005.jpg' WHERE id = 'prd-005';
UPDATE products SET image_url = '/images/products/prd-006.jpg' WHERE id = 'prd-006';
UPDATE products SET image_url = '/images/products/prd-007.jpg' WHERE id = 'prd-007';
UPDATE products SET image_url = '/images/products/prd-008.jpg' WHERE id = 'prd-008';
UPDATE products SET image_url = '/images/products/prd-009.jpg' WHERE id = 'prd-009';
UPDATE products SET image_url = '/images/products/prd-010.jpg' WHERE id = 'prd-010';
UPDATE products SET image_url = '/images/products/prd-011.jpg' WHERE id = 'prd-011';
UPDATE products SET image_url = '/images/products/prd-012.jpg' WHERE id = 'prd-012';
UPDATE products SET image_url = '/images/products/prd-013.jpg' WHERE id = 'prd-013';
UPDATE products SET image_url = '/images/products/prd-014.jpg' WHERE id = 'prd-014';
UPDATE products SET image_url = '/images/products/prd-015.jpg' WHERE id = 'prd-015';
UPDATE products SET image_url = '/images/products/prd-016.jpg' WHERE id = 'prd-016';
UPDATE products SET image_url = '/images/products/prd-017.jpg' WHERE id = 'prd-017';
UPDATE products SET image_url = '/images/products/prd-018.jpg' WHERE id = 'prd-018';
UPDATE products SET image_url = '/images/products/prd-019.jpg' WHERE id = 'prd-019';
UPDATE products SET image_url = '/images/products/prd-020.jpg' WHERE id = 'prd-020';
UPDATE products SET image_url = '/images/products/prd-021.jpg' WHERE id = 'prd-021';
UPDATE products SET image_url = '/images/products/prd-022.jpg' WHERE id = 'prd-022';
UPDATE products SET image_url = '/images/products/prd-023.jpg' WHERE id = 'prd-023';
UPDATE products SET image_url = '/images/products/prd-024.jpg' WHERE id = 'prd-024';
UPDATE products SET image_url = '/images/products/prd-025.jpg' WHERE id = 'prd-025';
UPDATE products SET image_url = '/images/products/prd-026.jpg' WHERE id = 'prd-026';
UPDATE products SET image_url = '/images/products/prd-027.jpg' WHERE id = 'prd-027';
UPDATE products SET image_url = '/images/products/prd-028.jpg' WHERE id = 'prd-028';
UPDATE products SET image_url = '/images/products/prd-029.jpg' WHERE id = 'prd-029';
UPDATE products SET image_url = '/images/products/prd-030.jpg' WHERE id = 'prd-030';
