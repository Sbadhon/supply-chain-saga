import { Router } from 'express';
import * as ctrl from '../controllers/inventory.controller.js';

const route = Router();

route.get('/', ctrl.getAll);
route.get('/:sku', ctrl.getBySku);
route.post('/reserve', ctrl.reserve);
route.post('/commit', ctrl.commit);
route.post('/release', ctrl.release);
route.post('/adjust', ctrl.adjust);
route.post('/move', ctrl.move);
route.get('/:id/history', ctrl.history);

export default route;
