import { query } from '../db.js';

/** Enqueue an outbox event INSIDE the same DB transaction (use the tx's client). */
export async function addOutboxEvent(client, ev) {
  const sql = `
    INSERT INTO outbox
      (id, aggregate_type, aggregate_id, type, payload, headers, status, attempts, next_attempt_at, idempotency_key, created_at, updated_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'PENDING', 0, NOW(), $6, NOW(), NOW())
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING *`;
  const params = [
    ev.aggregateType,
    ev.aggregateId,
    ev.type,
    ev.payload,
    ev.headers ?? null,
    ev.idempotencyKey ?? null,
  ];
  const { rows } = await client.query(sql, params);
  return rows[0] ?? null;
}

/** Claim a batch for dispatch with SKIP LOCKED (used by worker) */
export async function claimBatch(client, batchSize = 50) {
  const sql = `
    SELECT *
    FROM outbox
    WHERE status='PENDING'
      AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT $1`;
  const { rows } = await client.query(sql, [batchSize]);
  if (rows.length) {
    const ids = rows.map(r => r.id);
    await client.query(
      `UPDATE outbox SET status='PROCESSING', updated_at=NOW() WHERE id = ANY($1)`,
      [ids],
    );
  }
  return rows;
}

export async function markPublished(id) {
  await query(`UPDATE outbox SET status='PUBLISHED', updated_at=NOW() WHERE id=$1`, [id]);
}

export async function markFailed(id, attempts, baseBackoffMs = 1000, maxAttempts = 20) {
  const n = Math.min(10, (attempts ?? 0) + 1);
  const next = new Date(Date.now() + Math.pow(2, n) * baseBackoffMs);
  const status = (attempts ?? 0) + 1 >= maxAttempts ? 'FAILED' : 'PENDING';
  await query(
    `UPDATE outbox SET attempts=attempts+1, status=$2, next_attempt_at=$3, updated_at=NOW() WHERE id=$1`,
    [id, status, next],
  );
}
