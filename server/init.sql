-- Initialize application database schema

-- table to store entire app state (fallback storage)
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ensure a main row exists
INSERT INTO app_state (id, data, updated_at)
VALUES ('main', '{}'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

-- table for normalized incidents (optional)
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Creates a simple table to store the entire app state as jsonb.
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
