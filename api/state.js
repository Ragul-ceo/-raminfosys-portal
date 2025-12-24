import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_DATABASE_URL || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '';

let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL });
}

function jsonOk(res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();

  // Use Postgres if DATABASE_URL is present
  if (pool) {
    if (method === 'GET') {
      try {
        const { rows } = await pool.query('SELECT data FROM app_state WHERE id = $1', ['main']);
        if (rows.length) return jsonOk(res, rows[0].data);
        return jsonOk(res, { users: [], tasks: [], leaves: [], attendance: [], projects: [], announcements: [] });
      } catch (e) {
        console.error('GET /state error', e);
        res.statusCode = 500; return jsonOk(res, { error: 'db_failed' });
      }
    }

    if (method === 'POST') {
      try {
        const data = req.body || {};
        await pool.query(`INSERT INTO app_state (id, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()`, ['main', data]);
        return jsonOk(res, { ok: true });
      } catch (e) {
        console.error('POST /state error', e);
        res.statusCode = 500; return jsonOk(res, { error: 'db_failed' });
      }
    }

    res.statusCode = 405; return jsonOk(res, { error: 'method_not_allowed' });
  }

  // If no Postgres, fall back to Supabase service role if provided
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    if (method === 'GET') {
      try {
        const { data, error } = await supabase.from('app_state').select('data').eq('id', 'main').maybeSingle();
        if (error) throw error;
        return jsonOk(res, data?.data ?? { users: [], tasks: [], leaves: [], attendance: [], projects: [], announcements: [] });
      } catch (e) {
        console.error('SUPABASE GET error', e);
        res.statusCode = 500; return jsonOk(res, { error: 'db_failed' });
      }
    }

    if (method === 'POST') {
      try {
        const row = { id: 'main', data: req.body || {} };
        const { error } = await supabase.from('app_state').upsert(row, { onConflict: 'id' });
        if (error) throw error;
        return jsonOk(res, { ok: true });
      } catch (e) {
        console.error('SUPABASE POST error', e);
        res.statusCode = 500; return jsonOk(res, { error: 'db_failed' });
      }
    }

    res.statusCode = 405; return jsonOk(res, { error: 'method_not_allowed' });
  }

  res.statusCode = 500;
  return jsonOk(res, { error: 'no_backend_configured' });
}
