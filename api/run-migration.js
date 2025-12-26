import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  const token = req.headers['x-migrate-token'] || req.headers['x-migrate-token'.toLowerCase()];
  const expected = process.env.MIGRATE_TOKEN || '';
  if (!expected || token !== expected) {
    return json(res, 403, { error: 'forbidden', message: 'missing or invalid migrate token' });
  }

  const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_DATABASE_URL || '';
  if (!DATABASE_URL) return json(res, 500, { error: 'no_database_configured' });

  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const sqlPath = path.join(process.cwd(), 'server', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    await pool.end();
    return json(res, 200, { ok: true, message: 'migration applied' });
  } catch (err) {
    try { await pool.end(); } catch (e) {}
    return json(res, 500, { error: 'migration_failed', message: err?.message || String(err) });
  }
}
