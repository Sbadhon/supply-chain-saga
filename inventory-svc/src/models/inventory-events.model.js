import { query } from '../db.js';

/**
 * List events for a specific inventory row (Quick View History).
 * Keyset pagination using `cursor` (ISO date string): returns events with at < cursor.
 */
export async function listByInventoryId(client, inventoryId, { limit = 20, cursor } = {}) {
  const params = [inventoryId, limit];
  let cursorClause = '';

  if (cursor) {
    params.push(new Date(cursor));
    cursorClause = 'AND at < $3';
  }

  const sql = `
    SELECT id, inventory_id, sku, type, qty, at, meta
    FROM inventory_events
    WHERE inventory_id = $1
      ${cursorClause}
    ORDER BY at DESC
    LIMIT $2
  `;

  const { rows } = client ? await client.query(sql, params) : await query(sql, params);
  const nextCursor = rows.length ? rows[rows.length - 1].at : null;
  return { events: rows, nextCursor };
}

/**
 * Append a movement/audit event for an inventory row.
 * type: 'RECEIVE' | 'RESERVE' | 'RELEASE' | 'ADJUST' | 'MOVE_IN' | 'MOVE_OUT' | 'COMMIT'
 */
export async function add(client, { inventory_id, sku, type, qty = null, at = new Date(), meta = {} }) {
  const sql = `
    INSERT INTO inventory_events (inventory_id, sku, type, qty, at, meta)
    VALUES ($1, $2, $3, $4, $5, $6)
  `;
  await client.query(sql, [inventory_id, sku, type, qty, at, meta]);
}
