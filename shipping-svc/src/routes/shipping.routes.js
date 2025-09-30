import { Router } from 'express';
import * as ctrl from '../controllers/shipping.controller.js';

const route = Router();

// POST /v1/shipping/shipments
route.post('/shipments', ctrl.create);

// POST /v1/shipping/shipments/cancel
route.post('/shipments/cancel', ctrl.cancel);

// Helpers
route.get('/shipments', ctrl.getAll);
route.get('/shipments/:id', ctrl.getById);

export default route;

