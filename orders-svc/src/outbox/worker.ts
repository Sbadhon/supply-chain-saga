import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OutboxService } from './outbox.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log','error','warn'] });
  const outbox = app.get(OutboxService);
  const interval = Number(process.env.OUTBOX_DISPATCH_INTERVAL_MS || 1000);

  const tick = async () => {
    try {
      const n = await outbox.dispatchOnce();
      if (n > 0) console.log(`[outbox] published ${n} event(s)`);
    } catch (e) {
      console.error('[outbox] error', e);
    }
  };

  setInterval(tick, interval);
  console.log(`[outbox] worker started; interval=${interval}ms`);
}

bootstrap();
