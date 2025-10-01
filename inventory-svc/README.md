A lightweight Inventory microservice for managing stock levels per SKU + location. Built with Express + PostgreSQL, designed for idempotent writes and distributed tracing.

##Highlights
Trace IDs end-to-end via X-Trace-Id (propagated & exposed).
Idempotency on all unsafe writes via Redis middleware + optional DB key.
Transactions + Row locks (FOR UPDATE) for safe stock mutations.
Event log table for quick “inventory history” timelines.
HTTP-first service; consumed by a Nest gateway.

##API
Base path: /v1/inventory
GET	/	List all inventory rows	—
GET	/:sku	Get MAIN location row for SKU	—
POST	/reserve	Move available → reserved (header)
POST	/commit	Consume reserved	(header)
POST	/release	Move reserved → available (header)
POST	/adjust	Adjust available/reserved deltas  (header)
POST	/move	Move stock between locations (header)
GET	/:id/history	Event timeline (keyset pagination)

##Headers
Request: Idempotency-Key: <uuid> (required for POST endpoints)
Response: X-Trace-Id: <uuid> (readable by frontend; CORS exposed)

Quick Start (local)
# install
npm i

# env
cp .env.example .env
# ensure DB_* and REDIS_* point to your local dev env

# run
npm run dev


##Docker
This service is wired in docker-compose.yml (uses postgres, redis).
Environment (in container):
PORT=3002
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=supply-chain-saga-db
REDIS_HOST=redis
REDIS_PORT=6379


##Example calls
# reserve
curl -sS -X POST http://localhost:3000/inventory/reserve \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: inv-res-1' \
  -d '{"orderId":"ORDER-1","sku":"SKU-1","quantity":2}' | jq

# list history
curl -sS http://localhost:3000/inventory/1234/history | jq


Data Model
inventory(id, sku, supplier_id, location, available_qty, reserved_qty, updated_at)
unique (sku, location)
inventory_events(id, inventory_id, sku, type, qty, at, meta)