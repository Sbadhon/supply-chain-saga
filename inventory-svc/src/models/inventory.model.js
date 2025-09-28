import { query } from '../db.js';

/**
 * Table: inventory
 * Columns: id (uuid), sku (text), supplier_id (text), location (text),
 *          available_qty (int), reserved_qty (int), updated_at (timestamptz)
 */

/* ======================
 * Reads
 * ====================== */

export async function getAll(client) {
  const sql = `SELECT * FROM inventory ORDER BY sku, location`;
  const { rows } = client ? await client.query(sql) : await query(sql);
  return rows ?? [];
}

/** Return ALL rows for a SKU (multiple locations) */
export async function listBySku(client, sku) {
  const sql = `SELECT * FROM inventory WHERE sku = $1 ORDER BY location`;
  const { rows } = client ? await client.query(sql, [sku]) : await query(sql, [sku]);
  return rows ?? [];
}

/** Exact row by (sku, location). Defaults to MAIN. */
export async function getBySkuAndLocation(client, sku, location = 'MAIN') {
  const sql = `SELECT * FROM inventory WHERE sku = $1 AND location = $2`;
  const { rows } = client ? await client.query(sql, [sku, location]) : await query(sql, [sku, location]);
  return rows[0] ?? null;
}

/** Legacy: MAIN location row for a SKU */
export async function getBySku(client, sku) {
  return getBySkuAndLocation(client, sku, 'MAIN');
}

export async function getById(client, id) {
  const sql = `SELECT * FROM inventory WHERE id = $1`;
  const { rows } = client ? await client.query(sql, [id]) : await query(sql, [id]);
  return rows[0] ?? null;
}

/* ======================
 * Creators
 * ====================== */

export async function create(client, { sku, supplier_id, location = 'MAIN', available_qty = 0, reserved_qty = 0 }) {
  const sql = `
    INSERT INTO inventory (sku, supplier_id, location, available_qty, reserved_qty)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (sku, location) DO UPDATE SET
      supplier_id = EXCLUDED.supplier_id,
      updated_at  = NOW()
    RETURNING *`;
  const params = [sku, supplier_id, location, available_qty, reserved_qty];
  const { rows } = await client.query(sql, params);
  return rows[0];
}

/* ======================
 * Locks
 * ====================== */

export async function lockById(client, id) {
  const { rows } = await client.query(`SELECT * FROM inventory WHERE id = $1 FOR UPDATE`, [id]);
  return rows[0] ?? null;
}

export async function lockBySkuAndLocation(client, sku, location = 'MAIN') {
  const { rows } = await client.query(
    `SELECT * FROM inventory WHERE sku = $1 AND location = $2 FOR UPDATE`,
    [sku, location]
  );
  return rows[0] ?? null;
}

/**
 * Legacy: lock ALL rows for a SKU and return an aggregated snapshot.
 * Prefer lockById / lockBySkuAndLocation for correctness.
 */
export async function lockBySku(client, sku) {
  const { rows } = await client.query(`SELECT * FROM inventory WHERE sku = $1 FOR UPDATE`, [sku]);
  if (!rows?.length) return null;
  const agg = rows.reduce(
    (acc, r) => ({
      ...r, // keep last row fields for shape
      available_qty: (acc.available_qty ?? 0) + r.available_qty,
      reserved_qty: (acc.reserved_qty ?? 0) + r.reserved_qty,
      location: undefined, // not meaningful when aggregated
    }),
    { available_qty: 0, reserved_qty: 0 }
  );
  return agg;
}

/* ======================
 * Mutations
 * ====================== */

export async function setQuantitiesById(client, id, { availableDelta = 0, reservedDelta = 0 }) {
  const sql = `
    UPDATE inventory
       SET available_qty = available_qty + $2,
           reserved_qty  = reserved_qty  + $3,
           updated_at    = NOW()
     WHERE id = $1
     RETURNING *`;
  const { rows } = await client.query(sql, [id, availableDelta, reservedDelta]);
  return rows[0] ?? null;
}

export async function setQuantitiesBySkuLocation(client, sku, location = 'MAIN', { availableDelta = 0, reservedDelta = 0 }) {
  const sql = `
    UPDATE inventory
       SET available_qty = available_qty + $3,
           reserved_qty  = reserved_qty  + $4,
           updated_at    = NOW()
     WHERE sku = $1 AND location = $2
     RETURNING *`;
  const { rows } = await client.query(sql, [sku, location, availableDelta, reservedDelta]);
  return rows[0] ?? null;
}

/** Legacy helper: update MAIN row by sku */
export async function setQuantities(client, sku, { availableDelta = 0, reservedDelta = 0 }) {
  return setQuantitiesBySkuLocation(client, sku, 'MAIN', { availableDelta, reservedDelta });
}

/* ======================
 * Helpers
 * ====================== */

/** Create destination row if missing (for moves), else return existing */
export async function ensureRow(client, { sku, supplier_id, location = 'MAIN' }) {
  const existing = await getBySkuAndLocation(client, sku, location);
  if (existing) return existing;
  return await create(client, { sku, supplier_id, location, available_qty: 0, reserved_qty: 0 });
}
