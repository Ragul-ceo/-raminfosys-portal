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

-- Seed a default admin user into the JSON app_state so credentials aren't stored in frontend code
-- The admin username/password will be present only in the server-side DB after applying this migration.
UPDATE app_state
SET data = COALESCE(data, '{}'::jsonb) || $payload$
{
  "users": [
    {
      "id": "1",
      "name": "Admin Director",
      "email": "admin@raminfosys.com",
      "username": "admin",
      "password": "admin123",
      "role": "ADMIN",
      "department": "Management",
      "joinedDate": "2023-01-01",
      "isApproved": true
    }
  ]
}
$payload$::jsonb
WHERE id = 'main';
