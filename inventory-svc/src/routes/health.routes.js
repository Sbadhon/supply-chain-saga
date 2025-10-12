import { Router } from 'express';
import * as health from '../controllers/health.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: health
 *     description: Liveness & readiness
 */

/**
 * @swagger
 * /v1/health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Process is up
 */
router.get('/live', health.liveness);

/**
 * @swagger
 * /v1/health/ready:
 *   get:
 *     summary: Readiness probe
 *     description: Verifies DB (and Redis, if configured)
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Ready
 *       503:
 *         description: Degraded / not ready
 */
router.get('/ready', health.readiness);

/**
 * @swagger
 * /v1/health:
 *   get:
 *     summary: Full health details
 *     tags: [health]
 *     responses:
 *       200:
 *         description: Health payload with dependency info
 */
router.get('/', health.full);

export default router;
