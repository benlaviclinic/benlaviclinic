import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PGHOST || 'db',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'amit',
  password: process.env.PGPASSWORD || 'amit_dev_pass',
  database: process.env.PGDATABASE || 'amit',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected DB error', err);
});

export async function waitForDb({ retries = 30, delayMs = 1000 } = {}) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (e) {
      console.log(`DB not ready (attempt ${i + 1}/${retries}): ${e.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Database not reachable after retries');
}
