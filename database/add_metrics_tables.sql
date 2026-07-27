USE bakery_shop;

CREATE TABLE IF NOT EXISTS metric_event_types (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_metric_event_types_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS metric_platforms (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_metric_platforms_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS metric_pages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_metric_pages_code UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS metric_events (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  event_type_id INT UNSIGNED NOT NULL,
  platform_id INT UNSIGNED NOT NULL,
  page_id INT UNSIGNED NULL,
  customer_id VARCHAR(36) NULL,
  session_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(36) NULL,
  order_id VARCHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_metric_events_type FOREIGN KEY (event_type_id) REFERENCES metric_event_types(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_metric_events_platform FOREIGN KEY (platform_id) REFERENCES metric_platforms(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_metric_events_page FOREIGN KEY (page_id) REFERENCES metric_pages(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_metric_events_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_metric_events_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_metric_events_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS metric_event_attributes (
  event_id VARCHAR(36) NOT NULL,
  attr_key VARCHAR(64) NOT NULL,
  attr_value VARCHAR(500) NOT NULL,
  PRIMARY KEY (event_id, attr_key),
  CONSTRAINT fk_metric_attr_event FOREIGN KEY (event_id) REFERENCES metric_events(id)
    ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_metric_events_created ON metric_events(created_at);
CREATE INDEX idx_metric_events_session ON metric_events(session_id);
CREATE INDEX idx_metric_events_customer ON metric_events(customer_id);
CREATE INDEX idx_metric_events_type ON metric_events(event_type_id);
CREATE INDEX idx_metric_events_platform ON metric_events(platform_id);

INSERT IGNORE INTO metric_platforms (code, name) VALUES
('WEB', 'Web'),
('MOBILE', 'Mobile');

INSERT IGNORE INTO metric_pages (code, name) VALUES
('HOME', 'Home / Shop'),
('CART', 'Cart'),
('AUTH', 'Auth'),
('CHECKOUT', 'Checkout'),
('ADMIN', 'Admin'),
('ADMIN_ORDERS', 'Admin Orders'),
('ADMIN_PRODUCTS', 'Admin Products'),
('ADMIN_METRICS', 'Admin Metrics');

INSERT IGNORE INTO metric_event_types (code, name, description) VALUES
('APP_OPEN', 'App opened', 'Application launch or first paint'),
('PAGE_VIEW', 'Page viewed', 'Screen or route became visible'),
('LOCALE_CHANGE', 'Locale changed', 'User switched UI language'),
('PRODUCT_ADD', 'Product added to cart', 'Increment product quantity in cart'),
('PRODUCT_REMOVE', 'Product removed from cart', 'Decrement or clear product from cart'),
('CART_OPEN', 'Cart opened', 'User opened cart panel'),
('AUTH_OPEN', 'Auth opened', 'User opened sign-in / sign-up'),
('AUTH_LOGIN_SUCCESS', 'Login success', 'User signed in successfully'),
('AUTH_LOGIN_FAIL', 'Login failed', 'Sign-in attempt failed'),
('AUTH_REGISTER_SUCCESS', 'Register success', 'User registered successfully'),
('AUTH_LOGOUT', 'Logout', 'User signed out'),
('ORDER_PLACE_CLICK', 'Order place clicked', 'User started checkout'),
('ORDER_PLACED', 'Order placed', 'Order created successfully'),
('ORDER_FAILED', 'Order failed', 'Order placement failed');
