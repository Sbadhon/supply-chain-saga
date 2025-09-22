import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5436),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

export async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await fn(client);
    await client.query('COMMIT');
    return res;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function bootstrapDb() {
  const ddl = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS inventory (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      supplier_id TEXT NOT NULL,
      available_qty INT NOT NULL DEFAULT 0,
      reserved_qty INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await query(ddl);

  if ((process.env.NODE_ENV || 'development') === 'development') {
    await query(`
      INSERT INTO inventory (sku, supplier_id, available_qty, reserved_qty) VALUES
        ('SKU-1', 'SUPP-A', 100, 0),
        ('SKU-2', 'SUPP-B', 50, 5),
        ('SKU-3',      'SUPP-C', 20, 0)
      ON CONFLICT (sku) DO NOTHING;
    `);
  }
}
