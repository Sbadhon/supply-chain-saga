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

export async function create(client, { id, order_id, status, label_url }) {
  const sql = `
    INSERT INTO shipments (id, order_id, status, label_url, created_at, updated_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    RETURNING *`;
  const params = [id, order_id, status, label_url ?? null];
  const { rows } = await client.query(sql, params);
  return rows[0];
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
