import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OutboxService } from './outbox.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const outbox = app.get(OutboxService);
  const interval = Number(process.env.OUTBOX_DISPATCH_INTERVAL_MS || 1000);

  const tick = async (): Promise<void> => {
    try {
      const n = await outbox.dispatchOnce();
      if (n > 0) {
        console.log(`[outbox] published ${n} event(s)`);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : String(err);
      console.error('[outbox] error:', message);
    }
  };

  setInterval(() => {
    void tick(); // explicitly ignore the returned promise
  }, interval);

  console.log(`[outbox] worker started; interval=${interval}ms`);
}

bootstrap().catch((err) => {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : String(err);
  console.error('[outbox] bootstrap error:', message);
  process.exit(1); // Optional: fail fast on boot error
});
