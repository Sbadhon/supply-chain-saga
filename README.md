# Supply Chain Saga — Microservices Demo

A full-stack **supply chain management system** built as a distributed microservices architecture.  
It showcases **event-driven design, idempotency, trace IDs, and polyglot services** (NestJS + Express).

Designed as a **portfolio-ready project** to demonstrate production patterns like reliability, traceability, and consistency.

---

## Services

| Service       | Tech              | Purpose                                          |
|---------------|-------------------|--------------------------------------------------|
| [orders-svc](./orders-svc/README.md)     | NestJS + TypeORM   | Create/approve/cancel orders (idempotent writes) |
| [payments-svc](./payments-svc/README.md) | NestJS + TypeORM   | Process payments with retry/void + timeline       |
| [inventory-svc](./inventory-svc/README.md) | Express + Postgres | Reserve/commit/release/move stock across SKUs     |
| [shipping-svc](./shipping-svc/README.md) | Express + Postgres | Create & cancel shipments; event-sourcing-lite    |
| [gateway](./gateway/README.md)           | NestJS             | Public API edge; forwards to services (NATS/HTTP) |

---

## Architecture

```mermaid
flowchart TD
  A[Frontend (Angular + NgRx)] -->|HTTP| GW[API Gateway (NestJS)]

  subgraph GW[Gateway]
    GWN[NATS Client] --> ORD
    GWN --> PAY
    GWH[Axios Client] --> INV
    GWH --> SHIP
  end

  subgraph ORD[orders-svc (NestJS)]
    ORDDB[(Postgres)]
  end

  subgraph PAY[payments-svc (NestJS)]
    PAYDB[(Postgres)]
  end

  subgraph INV[inventory-svc (Express)]
    INVDB[(Postgres)]
  end

  subgraph SHIP[shipping-svc (Express)]
    SHIPDB[(Postgres)]
  end

  GW -->|traceId + idempotency-key| ORD
  GW -->|traceId + idempotency-key| PAY
  GW -->|traceId + idempotency-key| INV
  GW -->|traceId + idempotency-key| SHIP

  ORD -->|events (future)| PAY
  ORD -->|events (future)| INV
  ORD -->|events (future)| SHIP

```

##Features
Distributed tracing — every request carries a traceId across services, returned via X-Trace-Id.
Idempotency — all unsafe writes require an Idempotency-Key to prevent duplicate operations.
Polyglot microservices — some services in NestJS, others in plain Express.
Event sourcing-lite — events tables track lifecycle events for payments, inventory, shipping.
Dockerized stack — single docker-compose up runs everything (Postgres, Redis, NATS, all services).
NgRx frontend — Angular app consuming the gateway API.


##Quick Start
# clone
git clone https://github.com/yourname/supplychain-saga.git
cd supplychain-saga-services

# run with docker
docker compose up --build


##Services:
Gateway → http://localhost:3000
Orders → http://localhost:3001
Inventory → http://localhost:3002
Payments → http://localhost:3003
Shipping → http://localhost:3004
Postgres → localhost:5434
Redis → localhost:6379
NATS → localhost:4222


##Tests
# Create an order
curl -sS -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: o-1' \
  -d '{"customerId":"C1","items":[{"sku":"SKU-1","quantity":1,"unitPrice":9.99}]}' | jq

# Reserve inventory
curl -sS -X POST http://localhost:3000/inventory/reserve \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: inv-1' \
  -d '{"orderId":"ORDER-1","sku":"SKU-1","quantity":1}' | jq

# Create shipment
curl -sS -X POST http://localhost:3000/shipping/shipments \
  -H 'Content-Type: application/json' -H 'Idempotency-Key: ship-1' \
  -d '{"order_id":"ORDER-1"}' | jq



***
Shows real-world concerns: consistency, reliability, observability.
Mixes NestJS + Express
Gateway pattern
Saga-like orchestration via explicit API contracts.
