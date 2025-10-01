##Orders Service (order-svc)
A production-grade microservice for managing customer orders in a supply chain system.
Built with NestJS + TypeORM + PostgreSQL + NATS following DDD and 12-Factor App principles.

##Features
Hybrid Application → exposes REST API + handles NATS messages.
Idempotency → prevents duplicate order creation with Idempotency-Key.
Traceability → every request carries a X-Trace-Id for distributed logging.
Robust State Machine → supports transitions (PENDING → PAID → CANCELED).
Transaction Safety → ensures atomic writes with PostgreSQL transactions.
DTO Validation → strict runtime validation using class-validator.
Security Hardening → helmet, CORS, and field-level serialization (@Expose).

##Endpoints (HTTP)
POST	/v1/orders	Create new order	--> via header
GET	/v1/orders	List all orders	
GET	/v1/orders/:id	Fetch order by ID	
POST	/v1/orders/:id/approve	Approve order → PAID	--> by state
POST	/v1/orders/:id/cancel	Cancel order → CANCELED

##Tech Stack
NestJS (v11)
TypeORM + PostgreSQL
NATS (event transport)
Docker Compose (local dev)
Helmet + CORS
class-validator / class-transformer

# clone & install
git clone https://github.com/Sbadhon/supply-chain-saga
cd orders-svc
npm install

# run with docker-compose (Postgres + NATS up)
docker-compose up -d postgres nats

# start service
npm run start:dev

Service runs at:
HTTP → http://localhost:3001/v1/orders
NATS → nats://localhost:4222

Example: 
curl -X POST http://localhost:3001/v1/orders \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: abc123" \
  -d '{"customerId":"CUST1","items":[{"sku":"SKU1","quantity":2,"unitPrice":19.99}]}'
