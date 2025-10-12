import { Router } from 'express';
import * as ctrl from '../controllers/inventory.controller.js';

const route = Router();

/**
 * @swagger
 * tags:
 *   - name: inventory
 *     description: Inventory operations
 */

/**
 * @swagger
 * /v1/inventory:
 *   get:
 *     summary: List all inventory (all locations)
 *     tags: [inventory]
 *     responses:
 *       200:
 *         description: Array of inventory rows
 */
route.get('/', ctrl.getAll);

/**
 * @swagger
 * /v1/inventory/{sku}:
 *   get:
 *     summary: Get MAIN location inventory for a SKU
 *     tags: [inventory]
 *     parameters:
 *       - in: path
 *         name: sku
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory row
 *       404:
 *         description: Not found
 */
route.get('/:sku', ctrl.getBySku);

/**
 * @swagger
 * /v1/inventory/reserve:
 *   post:
 *     summary: Reserve stock at a location
 *     description: Decreases available and increases reserved for a SKU.
 *     tags: [inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, sku, quantity]
 *             properties:
 *               orderId: { type: string, example: "ORDER-1001" }
 *               sku: { type: string, example: "SKU-1" }
 *               quantity: { type: integer, example: 3, minimum: 1 }
 *               location: { type: string, example: "MAIN" }
 *     responses:
 *       201:
 *         description: Reserved successfully
 *       409:
 *         description: Insufficient stock or conflict
 */
route.post('/reserve', ctrl.reserve);

/**
 * @swagger
 * /v1/inventory/commit:
 *   post:
 *     summary: Commit a reservation
 *     description: Decreases reserved for a SKU (after shipment/payment completion).
 *     tags: [inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, sku, quantity]
 *             properties:
 *               orderId: { type: string, example: "ORDER-1001" }
 *               sku: { type: string, example: "SKU-1" }
 *               quantity: { type: integer, example: 3, minimum: 1 }
 *               location: { type: string, example: "MAIN" }
 *     responses:
 *       200:
 *         description: Commit ok
 *       409:
 *         description: Not enough reserved to commit
 */
route.post('/commit', ctrl.commit);

/**
 * @swagger
 * /v1/inventory/release:
 *   post:
 *     summary: Release a reservation
 *     description: Moves quantity from reserved back to available.
 *     tags: [inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, sku, quantity]
 *             properties:
 *               orderId: { type: string, example: "ORDER-1001" }
 *               sku: { type: string, example: "SKU-1" }
 *               quantity: { type: integer, example: 3, minimum: 1 }
 *               location: { type: string, example: "MAIN" }
 *     responses:
 *       200:
 *         description: Release ok
 *       409:
 *         description: Not enough reserved to release
 */
route.post('/release', ctrl.release);

/**
 * @swagger
 * /v1/inventory/adjust:
 *   post:
 *     summary: Adjust stock levels
 *     description: Adds/subtracts available and/or reserved amounts for a SKU at a location.
 *     tags: [inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sku]
 *             properties:
 *               sku: { type: string, example: "SKU-2" }
 *               location: { type: string, example: "MAIN" }
 *               availableDelta: { type: integer, example: 5 }
 *               reservedDelta: { type: integer, example: -2 }
 *               reason: { type: string, example: "Cycle count correction" }
 *     responses:
 *       200:
 *         description: Adjustment applied
 */
route.post('/adjust', ctrl.adjust);

/**
 * @swagger
 * /v1/inventory/move:
 *   post:
 *     summary: Move available stock to another location
 *     tags: [inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, qty, toLocation]
 *             properties:
 *               id: { type: string, description: "Inventory row id (source)", example: "2b2f3e6b-..." }
 *               qty: { type: number, example: 10, minimum: 1 }
 *               toLocation: { type: string, example: "A-01" }
 *               fromLocation: { type: string, example: "MAIN" }
 *     responses:
 *       200:
 *         description: Move completed
 *       400:
 *         description: Validation errors
 *       409:
 *         description: Insufficient available quantity
 */
route.post('/move', ctrl.move);

/**
 * @swagger
 * /v1/inventory/{id}/history:
 *   get:
 *     summary: Paginated inventory event history
 *     tags: [inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Inventory row id
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: cursor
 *         required: false
 *         schema: { type: string, description: "ISO timestamp cursor" }
 *     responses:
 *       200:
 *         description: History page (events + nextCursor)
 */
route.get('/:id/history', ctrl.history);

export default route;
