Vercel Serverless API `api/state`

Purpose:
- Provides GET /state and POST /state to persist the single `app_state` JSON row.
- Preferred for secure writes using a database `DATABASE_URL` (Postgres) or Supabase service role key.

Environment variables (set in Vercel):
- `DATABASE_URL` — Postgres connection string (preferred).
- `VITE_SUPABASE_URL` — Supabase project URL (if using Supabase fallback).
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-only) to allow writes.

Usage:
- Set `VITE_BACKEND_URL` in the frontend Vercel project to the deployed Vercel site URL (e.g., `https://raminfosys-portal.vercel.app`) so the frontend uses `/state` for persistence.

Notes:
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend; keep it as a Vercel project secret.
- If you provide `DATABASE_URL`, the function will use Postgres directly.
