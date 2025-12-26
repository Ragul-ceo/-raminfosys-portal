import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  try {
    const sqlPath = path.join(process.cwd(), 'server', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await pool.query(sql);
    console.log('Database initialized using', sqlPath);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Database initialization failed:', err?.message || err);
    process.exit(1);
  }
}

main();
