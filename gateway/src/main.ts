import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.setGlobalPrefix('v1');

  app.enableCors({
    origin: true, // reflect request origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'traceparent',
      'x-trace-id',
      'idempotency-key',
    ],
    exposedHeaders: ['x-trace-id', 'traceparent', 'idempotency-key'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Optional but nice in Docker/Kubernetes
  app.enableShutdownHooks();

  const PORT = Number.parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(PORT);
  Logger.log(`HTTP server listening on http://localhost:${PORT}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
        ? err
        : String(err);
  Logger.error(
    `[app] bootstrap error: ${message}`,
    err instanceof Error ? err.stack : undefined,
    'Bootstrap',
  );
});
