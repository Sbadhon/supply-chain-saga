import * as svc from '../services/inventory.service.js';

export async function get(req, res, next) {
  try {
    const row = await svc.getInventory(req.params.sku);
    if (!row) return res.status(404).json({ error: 'SKU not found' });
    res.json(row);
  } catch (error) { next(error); }
}

export async function reserve(req, res, next) {
  try {
    const out = await svc.reserveStock(req.body);
    if (!out.success) return res.status(409).json(out);
    res.status(201).json(out);
  } catch (error) { next(error); }
}

export async function commit(req, res, next) {
  try {
    const out = await svc.commitReservation(req.body);
    if (!out.success) return res.status(409).json(out);
    res.json(out);
  } catch (error) { next(error); }
}

export async function release(req, res, next) {
  try {
    const out = await svc.releaseReservation(req.body);
    if (!out.success) return res.status(409).json(out);
    res.json(out);
  } catch (error) { next(error); }
}

export async function adjust(req, res, next) {
  try {
    const out = await svc.adjustStock(req.body);
    res.json(out);
  } catch (error) { next(error); }
}
