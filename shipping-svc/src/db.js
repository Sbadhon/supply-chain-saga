import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
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
    await client.query("BEGIN");
    const res = await fn(client);
    await client.query("COMMIT");
    return res;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function bootstrapDb() {
  const ddl = `
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      status TEXT NOT NULL,
      label_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
    
    ALTER TABLE shipments
      ADD COLUMN IF NOT EXISTS idempotency_key TEXT NULL;

    -- Only enforce uniqueness when key is present
    CREATE UNIQUE INDEX IF NOT EXISTS uq_shipments_idem
      ON shipments(idempotency_key)
      WHERE idempotency_key IS NOT NULL;

    -- optional: events table used by addEvent()
    CREATE TABLE IF NOT EXISTS shipping_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      shipment_id TEXT NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      message TEXT,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_shipping_events_shipment_at
      ON shipping_events (shipment_id, at DESC);
  `;
  await query(ddl);

  if ((process.env.NODE_ENV || "development") === "development") {
    await query(`
      INSERT INTO shipments (id, order_id, status, label_url)
      VALUES ('seed-1', 'ORDER-1001', 'CREATED', NULL)
      ON CONFLICT (id) DO NOTHING;
    `);
  }
}
