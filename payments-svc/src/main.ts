import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { TraceIdInterceptor } from './common/trace-id.interceptor';
import { LoggingInterceptor } from './common/logging.interceptor';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log','error','warn'] });
  app.use(helmet());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TraceIdInterceptor(), new LoggingInterceptor());
  app.enableCors({
    origin: ['http://localhost:4200'],
    allowedHeaders: ['Content-Type','Authorization','Idempotency-Key'],
    credentials: true,
  });
  const configService = app.get(ConfigService);
  const port = Number(process.env.PORT || configService.get('PORT') || 3003);
  await app.listen(port);
  console.log(`payments-svc listening on :${port}`);
}
bootstrap();
