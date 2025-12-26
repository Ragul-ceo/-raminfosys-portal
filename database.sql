-- SQL migration: create app_state and incidents tables
-- This file can be applied to a Postgres database to create the
-- minimal schema used by the application.

CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO app_state (id, data, updated_at)
VALUES ('main', '{}'::jsonb, now())
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- End of migration
��Z�)ߢ̬