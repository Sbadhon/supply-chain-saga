import { query } from '../db.js';

/**
 * Row shape (reference)
 * id, sku, supplier_id, location, available_qty, reserved_qty, updated_at
 */

/* ======================
 * Reads
 * ====================== */

export async function getAll(client) {
  const runner = client ?? { query };
  const sql = `SELECT * FROM inventory ORDER BY sku, location`;
  const { rows } = client ? await client.query(sql) : await query(sql);
  return rows ?? [];
}

/** Return ALL rows for a SKU (multiple locations) */
export async function listBySku(client, sku) {
  const runner = client ?? { query };
  const sql = `SELECT * FROM inventory WHERE sku = $1 ORDER BY location`;
  const { rows } = client ? await client.query(sql, [sku]) : await query(sql, [sku]);
  return rows ?? [];
}

/** Return the primary row for a SKU at a location (defaults to 'MAIN') */
export async function getBySkuAndLocation(client, sku, location = 'MAIN') {
  const runner = client ?? { query };
  const sql = `SELECT * FROM inventory WHERE sku = $1 AND location = $2`;
  const { rows } = client ? await client.query(sql, [sku, location]) : await query(sql, [sku, location]);
  return rows[0] ?? null;
}

/** (Legacy) get one row by SKU — now returns the MAIN location */
export async function getBySku(client, sku) {
  return getBySkuAndLocation(client, sku, 'MAIN');
}

export async function getById(client, id) {
  const runner = client ?? { query };
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

/** Lock exactly one row by (sku, location) */
export async function lockBySkuAndLocation(client, sku, location = 'MAIN') {
  const { rows } = await client.query(
    `SELECT * FROM inventory WHERE sku = $1 AND location = $2 FOR UPDATE`,
    [sku, location]
  );
  return rows[0] ?? null;
}

/** 
 * (Legacy) Lock rows by SKU.
 * NOTE: With (sku, location) uniqueness, a SKU may have multiple rows.
 * This function locks ALL of them and returns an aggregated snapshot.
 */
export async function lockBySku(client, sku) {
  const { rows } = await client.query(
    `SELECT * FROM inventory WHERE sku = $1 FOR UPDATE`,
    [sku]
  );
  if (!rows?.length) return null;
  // aggregate for callers that expect one row
  const agg = rows.reduce(
    (acc, r) => ({
      ...r, // keep last row fields for shape, but…
      available_qty: (acc.available_qty ?? 0) + r.available_qty,
      reserved_qty: (acc.reserved_qty ?? 0) + r.reserved_qty,
      location: undefined, // meaningless when aggregated
    }),
    { available_qty: 0, reserved_qty: 0 }
  );
  return agg;
}

/* ======================
 * Mutations
 * ====================== */

/** Update by ID (precise row) */
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

/** Update by (sku, location) */
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

/**
 * (Legacy) Update by SKU.
 * Historically updated a single row; now we define it as updating the MAIN location.
 * Prefer setQuantitiesById or setQuantitiesBySkuLocation for correctness.
 */
export async function setQuantities(client, sku, { availableDelta = 0, reservedDelta = 0 }) {
  return setQuantitiesBySkuLocation(client, sku, 'MAIN', { availableDelta, reservedDelta });
}

/* ======================
 * Helpers for move operations
 * ====================== */

/** Ensure a destination row exists (create if missing) and return it */
export async function ensureRow(client, { sku, supplier_id, location = 'MAIN' }) {
  const existing = await getBySkuAndLocation(client, sku, location);
  if (existing) return existing;
  return await create(client, { sku, supplier_id, location, available_qty: 0, reserved_qty: 0 });
}
