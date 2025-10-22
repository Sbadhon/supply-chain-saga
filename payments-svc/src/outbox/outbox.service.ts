import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { OutboxEvent } from './outbox.entity';
import { NatsPublisher } from './nats.publisher';

const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 50);
const BASE_BACKOFF_MS = Number(process.env.OUTBOX_BASE_BACKOFF_MS || 1000);
const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || 20);
const SERVICE_NAME = process.env.SERVICE_NAME || 'orders-svc';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly pub: NatsPublisher,
  ) {}

  // Call this **inside** the same transaction that mutates domain state.
  async enqueue(
    trx: EntityManager,
    ev: Omit<Partial<OutboxEvent>, 'status' | 'attempts'>,
  ) {
    const repo = trx.getRepository(OutboxEvent);
    const row = repo.create({
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: new Date(),
      ...ev,
    });
    return repo.save(row);
  }

  // Run periodically from a background task.
  async dispatchOnce(): Promise<number> {
    const subject = `${SERVICE_NAME}.events.v1`;
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // Claim a batch with SKIP LOCKED
      const toProcess: OutboxEvent[] = await qr.manager.query(
        `
        SELECT *
        FROM outbox
        WHERE status = 'PENDING'
          AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT $1
        `,
        [BATCH_SIZE],
      );

      // Mark as PROCESSING to be explicit
      if (toProcess.length > 0) {
        const ids = toProcess.map((r) => r.id);
        await qr.manager.query(
          `UPDATE outbox SET status='PROCESSING', updated_at=NOW() WHERE id = ANY($1)`,
          [ids],
        );
      }

      await qr.commitTransaction();
      await qr.release();

      // Publish outside the transaction
      let published = 0;
      for (const ev of toProcess) {
        try {
          const envelope = {
            id: ev.id,
            type: ev.type,
            aggregateType: ev.aggregateType,
            aggregateId: ev.aggregateId,
            payload: ev.payload,
            headers: ev.headers ?? {},
            occurredAt: ev.createdAt,
          };
          await this.pub.publish(subject, envelope);
          await this.markPublished(ev.id);
          published++;
        } catch (err) {
          this.logger.error(
            `Publish failed for outbox ${ev.id}: ${(err as Error).message}`,
          );
          await this.markFailed(ev.id, ev.attempts ?? 0);
        }
      }
      return published;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : String(err);
      this.logger.error('dispatchOnce tx error', message);
      try {
        await qr.rollbackTransaction();
      } catch {
        /* empty */
      }
      try {
        await qr.release();
      } catch {
        /* empty */
      }
      return 0;
    }
  }

  private backoffMs(attempts: number): number {
    const n = Math.min(attempts, 10);
    return Math.floor(BASE_BACKOFF_MS * Math.pow(2, n)); // cap growth
  }

  private async markPublished(id: string) {
    await this.ds.manager.query(
      `UPDATE outbox SET status='PUBLISHED', updated_at=NOW() WHERE id=$1`,
      [id],
    );
  }

  private async markFailed(id: string, attempts: number) {
    const next = new Date(Date.now() + this.backoffMs(attempts + 1));
    const status = attempts + 1 >= MAX_ATTEMPTS ? 'FAILED' : 'PENDING';
    await this.ds.manager.query(
      `UPDATE outbox SET attempts = attempts + 1, status=$2, next_attempt_at=$3, updated_at=NOW() WHERE id=$1`,
      [id, status, next],
    );
  }
  /**
   * Convenience helper to record a payment-related event
   * without requiring a full transaction context.
   * This is used by PaymentsService.retry(), void(), etc.
   */
  async addPaymentEvent(params: {
    paymentId: string;
    type: string;
    message?: string;
    traceId?: string;
    idempotencyKey?: string;
  }): Promise<void> {
    const { paymentId, type, message, traceId, idempotencyKey } = params;

    const repo = this.ds.getRepository(OutboxEvent);
    const event = repo.create({
      aggregateType: 'Payment',
      aggregateId: paymentId,
      type,
      payload: {
        paymentId,
        message: message ?? '',
      },
      headers: {
        ...(traceId ? { traceId } : {}),
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
      status: 'PENDING',
      attempts: 0,
      nextAttemptAt: new Date(),
    });

    await repo.save(event);

    this.logger.debug(`Queued payment event ${type} for ${paymentId}`);
  }
}
