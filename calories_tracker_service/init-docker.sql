-- 3NF schema for Docker / Kubernetes init (database already created by POSTGRES_DB).
-- roles        = role lookup
-- users        = identity + role_code FK
-- dishes       = dish attributes
-- food_entries = consumption facts only

CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

INSERT INTO roles (code, name) VALUES
  ('CUSTOMER', 'Customer'),
  ('ADMIN', 'Administrator')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role_code VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER' REFERENCES roles(code),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dishes (
  id VARCHAR(36) PRIMARY KEY,
  created_by_user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  calories NUMERIC(10, 2) NOT NULL CHECK (calories >= 0),
  proteins NUMERIC(10, 2) NOT NULL CHECK (proteins >= 0),
  fats NUMERIC(10, 2) NOT NULL CHECK (fats >= 0),
  carbohydrates NUMERIC(10, 2) NOT NULL CHECK (carbohydrates >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_entries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dish_id VARCHAR(36) NOT NULL REFERENCES dishes(id) ON DELETE RESTRICT,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_code ON users(role_code);
CREATE INDEX IF NOT EXISTS idx_dishes_created_by ON dishes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_eaten ON food_entries(user_id, eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_dish ON food_entries(dish_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_eaten_at ON food_entries(eaten_at);
