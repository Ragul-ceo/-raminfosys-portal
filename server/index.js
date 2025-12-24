import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;

const PORT = process.env.PORT || 4000;
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new Pool({ connectionString: DATABASE_URL });

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// simple health
app.get('/', (_req, res) => res.send({ ok: true }));

// GET /state returns the whole app state (or empty default)
app.get('/state', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT data FROM app_state WHERE id = $1`, ['main']);
    if (rows.length) return res.json(rows[0].data);
    return res.json({ users: [], tasks: [], leaves: [], attendance: [], projects: [], announcements: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

// POST /state replaces the stored state (upsert)
app.post('/state', async (req, res) => {
  try {
    const data = req.body || {};
    await pool.query(`INSERT INTO app_state (id, data, updated_at) VALUES ($1, $2, now()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = now()`, ['main', data]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
