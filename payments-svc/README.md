##Payments Service (payment-svc)
Handles the payment lifecycle for orders.
Built with NestJS + TypeORM + PostgreSQL + NATS, focusing on idempotency, state transitions, and reliability.

##Features
Idempotent Payment Creation → safely retry without double charging.
Rich Payment Status Enum → NEW, AUTHORIZED, CAPTURED, REFUNDED, VOIDED, etc.
Retry & Void flows supported.
Payment Events Timeline → exposes an event history endpoint.
TraceId Propagation for observability.

##Endpoints (HTTP)
POST /v1/payments	Create new payment
GET	/v1/payments	List all payments	
GET	/v1/payments/:id	Fetch payment by ID
GET	/v1/payments/:id/events	Timeline of events
POST	/v1/payments/:id/retry	Retry processing	by state
POST	/v1/payments/:id/void	Void authorization	by state

##Message Patterns (NATS)
payments.create	{ dto, traceId, idempotencyKey }	Payment
payments.getById	{ id, traceId }	Payment
payments.getAll	{ traceId }	Payment[]
payments.getEvents	{ id, traceId }	Events[]
payments.retry	{ id, traceId }	Payment
payments.void	{ id, traceId }	Payment

##Tech Stack
NestJS
TypeORM + PostgreSQL
NATS transport
Helmet + CORS
ValidationPipe (strict DTO validation)

# clone & install
git clone https://github.com/Sbadhon/supply-chain-saga
cd payment-svc
npm install

# run with docker-compose (Postgres + NATS up)
docker-compose up -d postgres nats

# start service
npm run start:dev

Example:
curl -X POST http://localhost:3002/v1/payments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pay-abc123" \
  -d '{"orderId":"ORDER1","amount":100.00,"currency":"USD"}'
