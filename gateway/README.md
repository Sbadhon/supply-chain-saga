A NestJS API Gateway that fronts all services and normalizes cross-cutting concerns. It exposes HTTP endpoints to the frontend and fans out to services via NATS (orders/payments) and HTTP (inventory/shipping).


##Highlights
Hybrid transport: NATS (microservices) + Axios (HTTP services).
Trace ID propagation: creates/forwards X-Trace-Id to all downstreams.
Idempotency header passthrough: forwards Idempotency-Key to services.
CORS & Security: helmet + CORS, exposes X-Trace-Id to the browser.
Thin controllers: gateway stays transport-only; validation lives in services.


##API
POST	/orders	NATS → orders-svc
POST	/orders/:id/approve	NATS → orders-svc
POST	/orders/:id/cancel	NATS → orders-svc
POST	/payments	NATS → payments-svc
POST	/payments/:id/retry	NATS → payments-svc
POST	/payments/:id/void	NATS → payments-svc
GET	/inventory	HTTP → inventory
POST	/inventory/reserve	HTTP → inventory
POST	/shipping/shipments	HTTP → shipping
POST	/shipping/shipments/cancel	HTTP → shipping
All unsafe writes accept Idempotency-Key. All responses include X-Trace-Id.


##Environment
For local dev (.env):
PORT=3000
NATS_URL=nats://localhost:4222
INVENTORY_URL=http://localhost:3002/v1/inventory
SHIPPING_URL=http://localhost:3004/v1/shipping
REDIS_URL=redis://localhost:6379  
PORT=3000
NATS_URL=nats://nats:4222
INVENTORY_URL=http://inventory-svc:3002/v1/inventory
SHIPPING_URL=http://shipping-svc:3004/v1/shipping


##Run
npm i
cp .env.example .env
npm run start:dev
# or via docker-compose (recommended for full stack)



##Tests
# Orders (NATS)
curl -sS -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: o-1' \
  -d '{"customerId":"C1","items":[{"sku":"SKU-1","quantity":1,"unitPrice":9.99}]}' | jq

# Inventory (HTTP)
curl -sS http://localhost:3000/inventory | jq

# Shipping (HTTP)
curl -sS -X POST http://localhost:3000/shipping/shipments \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: s-1' \
  -d '{"order_id":"ORDER-2001"}' | jq


##Architecture
The gateway assigns/propagates a traceId to every downstream call and exposes it back to the browser.
Orders/Payments use NATS so they can scale horizontally and emit/consume events.
Inventory/Shipping are HTTP today (Express), so the gateway calls them with Axios (HttpModule).
Idempotency is enforced in services; the gateway simply forwards headers.