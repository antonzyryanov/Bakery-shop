-- Migrate existing bakery_nutrition schema to 3NF.
-- Safe to run once against a database created from the previous init.sql.
-- Usage:
--   psql -h localhost -p 5434 -U postgres -d bakery_nutrition -f migrate_to_3nf.sql

BEGIN;

CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

INSERT INTO roles (code, name) VALUES
  ('CUSTOMER', 'Customer'),
  ('ADMIN', 'Administrator')
ON CONFLICT (code) DO NOTHING;

-- users.role -> users.role_code FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role_code'
  ) THEN
    ALTER TABLE users ADD COLUMN role_code VARCHAR(20);
    UPDATE users SET role_code = COALESCE(NULLIF(TRIM(role), ''), 'CUSTOMER');
    UPDATE users SET role_code = 'CUSTOMER'
      WHERE role_code NOT IN (SELECT code FROM roles);
    ALTER TABLE users ALTER COLUMN role_code SET NOT NULL;
    ALTER TABLE users ALTER COLUMN role_code SET DEFAULT 'CUSTOMER';
    ALTER TABLE users
      ADD CONSTRAINT fk_users_role_code FOREIGN KEY (role_code) REFERENCES roles(code);
    ALTER TABLE users DROP COLUMN role;
  END IF;
END $$;

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

-- Split dish attributes out of food_entries (1:1 using entry id as dish id for existing rows)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_entries' AND column_name = 'dish_name'
  ) THEN
    ALTER TABLE food_entries ADD COLUMN IF NOT EXISTS dish_id VARCHAR(36);

    INSERT INTO dishes (
      id, created_by_user_id, name, description, image_url,
      calories, proteins, fats, carbohydrates, created_at
    )
    SELECT
      fe.id,
      fe.user_id,
      fe.dish_name,
      fe.description,
      fe.image_url,
      fe.calories,
      fe.proteins,
      fe.fats,
      fe.carbohydrates,
      fe.created_at
    FROM food_entries fe
    WHERE NOT EXISTS (SELECT 1 FROM dishes d WHERE d.id = fe.id);

    UPDATE food_entries SET dish_id = id WHERE dish_id IS NULL;

    ALTER TABLE food_entries ALTER COLUMN dish_id SET NOT NULL;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'food_entries' AND constraint_name = 'fk_food_entries_dish'
    ) THEN
      ALTER TABLE food_entries
        ADD CONSTRAINT fk_food_entries_dish FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE RESTRICT;
    END IF;

    ALTER TABLE food_entries
      DROP COLUMN IF EXISTS dish_name,
      DROP COLUMN IF EXISTS image_url,
      DROP COLUMN IF EXISTS calories,
      DROP COLUMN IF EXISTS proteins,
      DROP COLUMN IF EXISTS fats,
      DROP COLUMN IF EXISTS carbohydrates,
      DROP COLUMN IF EXISTS description;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role_code ON users(role_code);
CREATE INDEX IF NOT EXISTS idx_dishes_created_by ON dishes(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_eaten ON food_entries(user_id, eaten_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_dish ON food_entries(dish_id);
CREATE INDEX IF NOT EXISTS idx_food_entries_eaten_at ON food_entries(eaten_at);

COMMIT;
