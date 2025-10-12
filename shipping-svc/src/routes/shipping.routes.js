import { Router } from 'express';
import * as ctrl from '../controllers/shipping.controller.js';

const route = Router();

/**
 * @swagger
 * tags:
 *   - name: shipping
 *     description: Shipping operations
 */

/**
 * @swagger
 * /v1/shipping/shipments:
 *   post:
 *     summary: Create a shipment
 *     description: Creates a shipment record for an order. Idempotent via `Idempotency-Key` header.
 *     tags: [shipping]
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         required: false
 *         schema: { type: string }
 *         description: If provided, the request will be idempotent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id:
 *                 type: string
 *                 example: "ORD-123"
 *               label_url:
 *                 type: string
 *                 nullable: true
 *                 example: "https://labels.example.com/label-123.pdf"
 *     responses:
 *       201:
 *         description: Shipment created
 *       400:
 *         description: Invalid payload
 */
route.post('/shipments', ctrl.create);

/**
 * @swagger
 * /v1/shipping/shipments/cancel:
 *   post:
 *     summary: Cancel a shipment
 *     tags: [shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Shipment id
 *                 example: "a2f5a9b0-3e4b-4d7f-9a7a-1d2c3b4e5f6a"
 *     responses:
 *       200:
 *         description: Shipment canceled (idempotent-by-state)
 *       404:
 *         description: Shipment not found
 */
route.post('/shipments/cancel', ctrl.cancel);

/**
 * @swagger
 * /v1/shipping/shipments/ship:
 *   post:
 *     summary: Mark a shipment as shipped
 *     description: Transitions a shipment to `SHIPPED`. Exact behavior depends on service implementation.
 *     tags: [shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *                 description: Shipment id
 *                 example: "a2f5a9b0-3e4b-4d7f-9a7a-1d2c3b4e5f6a"
 *               carrier:
 *                 type: string
 *                 example: "UPS"
 *               tracking_number:
 *                 type: string
 *                 example: "1Z9999W99999999999"
 *     responses:
 *       200:
 *         description: Shipment marked as shipped
 *       404:
 *         description: Shipment not found
 */
route.post('/shipments/ship', ctrl.ship);

/**
 * @swagger
 * /v1/shipping/shipments:
 *   get:
 *     summary: List shipments
 *     tags: [shipping]
 *     responses:
 *       200:
 *         description: Array of shipments
 */
route.get('/shipments', ctrl.getAll);

/**
 * @swagger
 * /v1/shipping/shipments/{id}:
 *   get:
 *     summary: Get a shipment by id
 *     tags: [shipping]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Shipment
 *       404:
 *         description: Shipment not found
 */
route.get('/shipments/:id', ctrl.getById);

export default route;
