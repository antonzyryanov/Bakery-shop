CREATE DATABASE bakery_nutrition;

\c bakery_nutrition;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_entries (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dish_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  calories NUMERIC(10, 2) NOT NULL CHECK (calories >= 0),
  proteins NUMERIC(10, 2) NOT NULL CHECK (proteins >= 0),
  fats NUMERIC(10, 2) NOT NULL CHECK (fats >= 0),
  carbohydrates NUMERIC(10, 2) NOT NULL CHECK (carbohydrates >= 0),
  description TEXT NOT NULL,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_eaten ON food_entries(user_id, eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_eaten_at ON food_entries(eaten_at);
