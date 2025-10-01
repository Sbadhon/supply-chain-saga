##Shipping Service (shipping-svc)
A simple Shipping microservice to create and cancel shipments, illustrating idempotent creation and timeline events. Built with Express + PostgreSQL, fronted by a Nest gateway.

##Highlights
Trace IDs via X-Trace-Id (auto-added & returned).
Idempotent create/cancel via Redis middleware + optional DB constraint.
Event sourcing-lite: shipping_events for timelines.

##API
Base path: /v1/shipping

GET	/shipments	List all	—
GET	/shipments/:id	Get by id	—
POST	/shipments	Create shipment	(header)
POST	/shipments/cancel	Cancel by id (header)
Tip: cancel is idempotent-by-state (multiple cancels return the same CANCELED row).

##Headers
Request: Idempotency-Key: <uuid> for POSTs
Response: X-Trace-Id exposed for FE debugging

##Quick Start (local)
npm i
cp .env.example .env
npm run dev

##Docker env (compose)
PORT=3004
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=supply-chain-saga-db
REDIS_HOST=redis
REDIS_PORT=6379


##Example calls (via gateway)
# create
curl -sS -X POST http://localhost:3000/shipping/shipments \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: ship-1' \
  -d '{"order_id":"ORDER-2001"}' | jq

# cancel
curl -sS -X POST http://localhost:3000/shipping/shipments/cancel \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: ship-cancel-1' \
  -d '{"id":"<shipment-id>"}' | jq


Data Model
shipments(id, order_id, status, label_url, idempotency_key?, created_at, updated_at)
partial unique index on idempotency_key when not null
shipping_events(id, shipment_id, type, message, at, meta)
