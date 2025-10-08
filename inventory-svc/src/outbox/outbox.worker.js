import 'dotenv/config';
import { connect, StringCodec } from 'nats';
import pg from 'pg';

const sc = StringCodec();
const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222';
const SERVICE_NAME = process.env.SERVICE_NAME || 'inventory-svc';
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 50);
const INTERVAL_MS = Number(process.env.OUTBOX_DISPATCH_INTERVAL_MS || 1000);
const BASE_BACKOFF_MS = Number(process.env.OUTBOX_BASE_BACKOFF_MS || 1000);
const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || 20);

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5436),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function withClient(fn) {
  const client = await pool.connect();
  try { return await fn(client); } finally { client.release(); }
}

async function claimBatch(client) {
  const { rows } = await client.query(
    `SELECT * FROM outbox WHERE status='PENDING' AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
     ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT $1`,
    [BATCH_SIZE],
  );
  if (rows.length) {
    const ids = rows.map(r => r.id);
    await client.query(`UPDATE outbox SET status='PROCESSING', updated_at=NOW() WHERE id = ANY($1)`, [ids]);
  }
  return rows;
}

async function markPublished(id) {
  await pool.query(`UPDATE outbox SET status='PUBLISHED', updated_at=NOW() WHERE id=$1`, [id]);
}

async function markFailed(id, attempts) {
  const n = Math.min(10, (attempts ?? 0) + 1);
  const next = new Date(Date.now() + Math.pow(2, n) * BASE_BACKOFF_MS);
  const status = (attempts ?? 0) + 1 >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING';
  await pool.query(
    `UPDATE outbox SET attempts=attempts+1, status=$2, next_attempt_at=$3, updated_at=NOW() WHERE id=$1`,
    [id, status, next],
  );
}

async function runOnce(nc) {
  return withClient(async (client) => {
    await client.query('BEGIN');
    try {
      const batch = await claimBatch(client);
      await client.query('COMMIT');

      let published = 0;
      for (const ev of batch) {
        try {
          const envelope = {
            id: ev.id,
            type: ev.type,
            aggregateType: ev.aggregate_type,
            aggregateId: ev.aggregate_id,
            payload: ev.payload,
            headers: ev.headers ?? {},
            occurredAt: ev.created_at,
          };
          const subject = `${SERVICE_NAME}.events.v1`;
          nc.publish(subject, sc.encode(JSON.stringify(envelope)));
          await markPublished(ev.id);
          published++;
        } catch (err) {
          console.error('[outbox] publish failed', err);
          await markFailed(ev.id, ev.attempts || 0);
        }
      }
      return published;
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('[outbox] tx error', e);
      return 0;
    }
  });
}

async function main() {
  const nc = await connect({ servers: NATS_URL });
  console.log(`[outbox] worker up for ${SERVICE_NAME}; interval=${INTERVAL_MS}ms`);
  setInterval(async () => {
    try {
      const n = await runOnce(nc);
      if (n > 0) console.log(`[outbox] published ${n} event(s)`);
    } catch (e) {
      console.error('[outbox] error', e);
    }
  }, INTERVAL_MS);
}

main().catch((e) => { console.error(e); process.exit(1); });
