import * as svc from '../services/shipping.service.js';

export async function getAll(_req, res, next) {
  try {
    const rows = await svc.getAll();
    res.json(rows ?? []);
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const row = await svc.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Shipment not found' });
    res.json(row);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    const { order_id, label_url } = req.body || {};
    const created = await svc.create({ order_id, label_url });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

export async function cancel(req, res, next) {
  try {
    const { id } = req.body || {};
    const updated = await svc.cancel({ id });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}
