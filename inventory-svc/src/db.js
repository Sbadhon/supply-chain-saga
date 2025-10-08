import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5436),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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

    -- Main inventory table: one row per (sku, location)
    CREATE TABLE IF NOT EXISTS inventory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sku TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      location TEXT NOT NULL,                
      available_qty INT NOT NULL DEFAULT 0,
      reserved_qty  INT NOT NULL DEFAULT 0,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      CONSTRAINT inventory_sku_location_uk UNIQUE (sku, location)
    );

    -- Movement / audit log (for Quick View History)
    CREATE TABLE IF NOT EXISTS inventory_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
      sku  TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN
        ('RECEIVE','RESERVE','RELEASE','ADJUST','MOVE_IN','MOVE_OUT','COMMIT')),
      qty  INT,
      at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_events_inventory_at
      ON inventory_events (inventory_id, at DESC);
    CREATE INDEX IF NOT EXISTS idx_inventory_events_type
      ON inventory_events (type);

    -- transactional outbox
    CREATE TABLE IF NOT EXISTS outbox (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aggregate_type TEXT NOT NULL,
      aggregate_id   TEXT NOT NULL,
      type           TEXT NOT NULL,
      payload        JSONB NOT NULL,
      headers        JSONB,
      status         TEXT NOT NULL DEFAULT 'PENDING',
      attempts       INT NOT NULL DEFAULT 0,
      next_attempt_at TIMESTAMPTZ,
      idempotency_key TEXT,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_outbox_status_next ON outbox(status, next_attempt_at);
  `;
  await query(ddl);

  if ((process.env.NODE_ENV || 'development') === 'development') {
    await query(
      `
      INSERT INTO inventory (sku, supplier_id, location, available_qty, reserved_qty)
      VALUES
        ('SKU-1', 'SUPP-A', 'MAIN', 120,  0),
        ('SKU-1', 'SUPP-A', 'A-01',  30,  0),
        ('SKU-2', 'SUPP-B', 'MAIN',  50,  5),
        ('SKU-2', 'SUPP-B', 'B-02',  10,  0),
        ('SKU-3', 'SUPP-C', 'MAIN',  20,  0)
      ON CONFLICT ON CONSTRAINT inventory_sku_location_uk DO NOTHING;
      `
    );
  }
}

