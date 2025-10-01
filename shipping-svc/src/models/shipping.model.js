import { query } from '../db.js';

export async function getAll(client = null) {
  const sql = `SELECT * FROM shipments ORDER BY created_at DESC`;
  const { rows } = client ? await client.query(sql) : await query(sql);
  return rows ?? [];
}

export async function getById(client = null, id) {
  const sql = `SELECT * FROM shipments WHERE id = $1`;
  const { rows } = client ? await client.query(sql, [id]) : await query(sql, [id]);
  return rows[0] ?? null;
}

export async function getByIdempotencyKey(client, idempotency_key) {
  const sql = `SELECT * FROM shipments WHERE idempotency_key = $1`;
  const { rows } = client ? await client.query(sql, [idempotency_key]) : await query(sql, [idempotency_key]);
  return rows[0] ?? null;
}

export async function create(client, { id, order_id, status, label_url, idempotency_key = null }) {
  const sql = `
    INSERT INTO shipments (id, order_id, status, label_url, idempotency_key)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (id) DO NOTHING
    RETURNING *`;
  const params = [id, order_id, status, label_url, idempotency_key];
  const { rows } = await client.query(sql, params);
  // If ON CONFLICT (id) DO NOTHING triggered (rare), fetch row
  return rows[0] ?? (await getById(client, id));
}

export async function updateStatus(client, id, status) {
  const sql = `
    UPDATE shipments
       SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING *`;
  const { rows } = await client.query(sql, [id, status]);
  return rows[0] ?? null;
}
