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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      idempotency_key TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_shipments_idem
      ON shipments(idempotency_key)
      WHERE idempotency_key IS NOT NULL;

    -- event log used by addEvent()
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

  if ((process.env.NODE_ENV || "development") === "development") {
    await query(`
      INSERT INTO shipments (id, order_id, status, label_url)
      VALUES ('seed-1', 'ORDER-1001', 'CREATED', NULL)
      ON CONFLICT (id) DO NOTHING;
    `);
  }
}
