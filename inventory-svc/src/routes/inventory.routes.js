import { Router } from 'express';
import * as ctrl from '../controllers/inventory.controller.js';

const route = Router();

route.get('/:sku', ctrl.get);
route.post('/reserve', ctrl.reserve);
route.post('/commit', ctrl.commit);
route.post('/release', ctrl.release);
route.post('/adjust', ctrl.adjust);

export default route;
