CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role ENUM('CUSTOMER', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  password_hash VARCHAR(255) NOT NULL,
  current_order_id VARCHAR(36) NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_product_price CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  phone_number VARCHAR(40) NOT NULL DEFAULT '',
  adress VARCHAR(300) NOT NULL DEFAULT '',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status ENUM('PLACED', 'ACCEPTED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'PLACED',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_total_price CHECK (total_price >= 0),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

ALTER TABLE customers
  ADD CONSTRAINT fk_customers_current_order
  FOREIGN KEY (current_order_id) REFERENCES orders(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS chosen_products (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_chosen_quantity CHECK (quantity > 0),
  CONSTRAINT chk_unit_price CHECK (unit_price >= 0),
  CONSTRAINT uq_order_product UNIQUE (order_id, product_id),
  CONSTRAINT fk_chosen_products_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_chosen_products_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS customer_done_orders (
  customer_id VARCHAR(36) NOT NULL,
  order_id VARCHAR(36) NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (customer_id, order_id),
  CONSTRAINT fk_done_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_done_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

-- One conversation per customer (3NF)
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  customer_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_conversations_customer UNIQUE (customer_id),
  CONSTRAINT fk_conversations_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  body VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_chosen_order ON chosen_products(order_id);
CREATE INDEX idx_chosen_product ON chosen_products(product_id);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_conversations_updated ON conversations(updated_at);
CREATE INDEX idx_orders_status ON orders(status);

INSERT INTO customers (id, email, role, password_hash)
VALUES ('admin-customer-0001', 'admin@bakery.local', 'ADMIN', 'PENDING_HASH_ON_BOOTSTRAP');

INSERT INTO products (id, name, description, image_url, price) VALUES
('prd-001', 'Sourdough Loaf', 'Rustic sourdough with deep crust and airy crumb.', '/images/products/prd-001.jpg', 5.90),
('prd-002', 'Butter Croissant', 'Layered French croissant with cultured butter.', '/images/products/prd-002.jpg', 3.20),
('prd-003', 'Pain au Chocolat', 'Croissant dough wrapped around dark chocolate batons.', '/images/products/prd-003.jpg', 3.80),
('prd-004', 'Cinnamon Roll', 'Soft spiral pastry with cinnamon sugar glaze.', '/images/products/prd-004.jpg', 4.10),
('prd-005', 'Blueberry Muffin', 'Tender muffin with fresh blueberry burst.', '/images/products/prd-005.jpg', 3.50),
('prd-006', 'Banana Walnut Bread', 'Moist banana bread with toasted walnuts.', '/images/products/prd-006.jpg', 4.60),
('prd-007', 'Whole Wheat Baguette', 'Nutty whole wheat baguette with crisp crust.', '/images/products/prd-007.jpg', 3.70),
('prd-008', 'Classic Bagel', 'Chewy kettle-boiled bagel with malt sweetness.', '/images/products/prd-008.jpg', 2.60),
('prd-009', 'Sesame Bagel', 'Toasted sesame bagel with rich aroma.', '/images/products/prd-009.jpg', 2.80),
('prd-010', 'Everything Bagel', 'Savory seed blend bagel with garlic and onion.', '/images/products/prd-010.jpg', 2.90),
('prd-011', 'Pretzel Twist', 'Golden soft pretzel twist with flaky salt.', '/images/products/prd-011.jpg', 2.70),
('prd-012', 'Brioche Bun', 'Buttery brioche bun with pillowy texture.', '/images/products/prd-012.jpg', 2.50),
('prd-013', 'Chocolate Eclair', 'Choux pastry filled with vanilla cream.', '/images/products/prd-013.jpg', 4.40),
('prd-014', 'Lemon Tartlet', 'Bright lemon curd tart with crisp shell.', '/images/products/prd-014.jpg', 4.20),
('prd-015', 'Apple Danish', 'Flaky danish with spiced apple filling.', '/images/products/prd-015.jpg', 3.90),
('prd-016', 'Raspberry Danish', 'Buttery danish topped with raspberry compote.', '/images/products/prd-016.jpg', 3.90),
('prd-017', 'Almond Croissant', 'Twice-baked croissant with almond cream.', '/images/products/prd-017.jpg', 4.30),
('prd-018', 'Strawberry Shortcake Slice', 'Light sponge with fresh strawberries and cream.', '/images/products/prd-018.jpg', 5.20),
('prd-019', 'Carrot Cake Slice', 'Spiced carrot cake with cream cheese frosting.', '/images/products/prd-019.jpg', 5.00),
('prd-020', 'Red Velvet Cupcake', 'Cocoa cupcake crowned with cream cheese swirl.', '/images/products/prd-020.jpg', 3.60),
('prd-021', 'Vanilla Cupcake', 'Classic vanilla bean cupcake and buttercream.', '/images/products/prd-021.jpg', 3.40),
('prd-022', 'Chocolate Chip Cookie', 'Large cookie packed with dark chocolate chips.', '/images/products/prd-022.jpg', 2.40),
('prd-023', 'Oatmeal Raisin Cookie', 'Chewy oats, raisins, and warm spices.', '/images/products/prd-023.jpg', 2.30),
('prd-024', 'Macaron Box (4)', 'Assorted French macarons, four flavors.', '/images/products/prd-024.jpg', 7.80),
('prd-025', 'Cheesecake Slice', 'Creamy baked cheesecake with biscuit base.', '/images/products/prd-025.jpg', 5.40),
('prd-026', 'Focaccia Slice', 'Olive oil focaccia with rosemary and sea salt.', '/images/products/prd-026.jpg', 3.30),
('prd-027', 'Multigrain Roll', 'Hearty roll with seeds and grains.', '/images/products/prd-027.jpg', 2.20),
('prd-028', 'Pecan Pie Bar', 'Caramelized pecan topping over buttery crust.', '/images/products/prd-028.jpg', 4.70),
('prd-029', 'Brownie Square', 'Fudgy brownie with glossy crackle top.', '/images/products/prd-029.jpg', 3.10),
('prd-030', 'Mini Quiche Lorraine', 'Savory mini quiche with bacon and cheese.', '/images/products/prd-030.jpg', 4.90);

