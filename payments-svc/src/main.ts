import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { TraceIdInterceptor } from './common/trace-id.interceptor';
import { LoggingInterceptor } from './common/logging.interceptor';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const http = await NestFactory.create(AppModule, { logger: ['log','error','warn'] });

  http.use(helmet());
  http.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  http.useGlobalInterceptors(
    new ClassSerializerInterceptor(http.get(Reflector)),
    new TraceIdInterceptor(),
    new LoggingInterceptor(),
  );
  http.enableCors({
    origin: ['http://localhost:4200'],
    allowedHeaders: ['Content-Type','Authorization','Idempotency-Key','X-Trace-Id'],
    exposedHeaders: ['X-Trace-Id'],
    credentials: true,
  });

  http.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: { servers: [process.env.NATS_URL || 'nats://localhost:4222'] },
  });

  await http.startAllMicroservices();
  const config = http.get(ConfigService);
  const port = Number(process.env.PORT || config.get('PORT') || 3003);
  await http.listen(port);

  console.log(`payments-svc HTTP listening on :${port}`);
  console.log(`payments-svc NATS connected → ${process.env.NATS_URL || 'nats://localhost:4222'}`);
}

bootstrap();
