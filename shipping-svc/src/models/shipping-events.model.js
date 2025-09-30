import { query } from '../db.js';

export async function bootstrap() {
  await query(`
    CREATE TABLE IF NOT EXISTS shipping_events (
      id BIGSERIAL PRIMARY KEY,
      shipment_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT,
      at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_shipping_events_shipment_id ON shipping_events(shipment_id);
  `);
}

export async function add(client, { shipment_id, type, message }) {
  const sql = `
    INSERT INTO shipping_events (shipment_id, type, message, at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *`;
  const { rows } = await client.query(sql, [shipment_id, type, message ?? null]);
  return rows[0];
}
