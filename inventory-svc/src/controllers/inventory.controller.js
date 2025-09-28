import * as svc from '../services/inventory.service.js';

/** GET /v1/inventory */
export async function getAll(_req, res, next) {
  try {
    const rows = await svc.getAll();
    // Empty array is a valid response
    res.json(rows ?? []);
  } catch (error) {
    next(error);
  }
}

/** GET /v1/inventory/:sku  (returns MAIN location row for that SKU) */
export async function getBySku(req, res, next) {
  try {
    const row = await svc.getInventory(req.params.sku);
    if (!row) return res.status(404).json({ error: 'SKU not found' });
    res.json(row);
  } catch (error) {
    next(error);
  }
}

/** POST /v1/inventory/reserve  { orderId, sku, quantity, location? } */
export async function reserve(req, res, next) {
  try {
    const out = await svc.reserveStock(req.body);
    if (!out.success) return res.status(409).json(out);
    res.status(201).json(out);
  } catch (error) {
    next(error);
  }
}

/** POST /v1/inventory/commit  { orderId, sku, quantity, location? } */
export async function commit(req, res, next) {
  try {
    const out = await svc.commitReservation(req.body);
    if (!out.success) return res.status(409).json(out);
    res.json(out);
  } catch (error) {
    next(error);
  }
}

/** POST /v1/inventory/release  { orderId, sku, quantity, location? } */
export async function release(req, res, next) {
  try {
    const out = await svc.releaseReservation(req.body);
    if (!out.success) return res.status(409).json(out);
    res.json(out);
  } catch (error) {
    next(error);
  }
}

/** POST /v1/inventory/adjust  { sku, location?, availableDelta?, reservedDelta?, reason? } */
export async function adjust(req, res, next) {
  try {
    const out = await svc.adjustStock(req.body);
    res.json(out);
  } catch (error) {
    next(error);
  }
}

/** POST /v1/inventory/move  { id, qty, toLocation, fromLocation? } */
export async function move(req, res, next) {
  try {
    const out = await svc.moveStock(req.body);
    res.json(out);
  } catch (error) {
    next(error);
  }
}

/** GET /v1/inventory/:id/history?limit=20&cursor=ISO */
export async function history(req, res, next) {
  try {
    const id = req.params.id;
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const out = await svc.quickViewHistory({ id, limit, cursor });
    res.json(out);
  } catch (error) {
    next(error);
  }
}
