import { query } from '../db.js';

export async function getBySku(client, sku) {
  const runner = client ?? { query };
  const { rows } = await (client ? client.query('SELECT * FROM inventory WHERE sku = $1', [sku])
                                 : query('SELECT * FROM inventory WHERE sku = $1', [sku]));
  return rows[0] ?? null;
}

export async function lockBySku(client, sku) {
  const { rows } = await client.query(`SELECT * FROM inventory WHERE sku = $1 FOR UPDATE`, [sku]);
  return rows[0] ?? null;
}

export async function setQuantities(client, sku, { availableDelta = 0, reservedDelta = 0 }) {
  const { rows } = await client.query(
    `UPDATE inventory
       SET available_qty = available_qty + $2,
           reserved_qty   = reserved_qty   + $3,
           updated_at     = NOW()
     WHERE sku = $1
     RETURNING *`,
    [sku, availableDelta, reservedDelta]
  );
  return rows[0] ?? null;
}
