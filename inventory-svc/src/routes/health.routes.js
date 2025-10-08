import { Router } from 'express';
import * as health from  '../controllers/health.controller.js';

const router = Router();
router.get('/live', health.liveness);   // fast: process OK
router.get('/ready', health.readiness); // checks DB (+ Redis)
router.get('/', health.full);           // verbose

export default router;
