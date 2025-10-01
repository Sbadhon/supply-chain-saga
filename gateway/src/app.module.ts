import { Module, MiddlewareConsumer } from '@nestjs/common';
import { NatsClientModule } from './clients/nats-client.module';
import { TracingMiddleware } from './common/tracing.middleware';
import { TracingInterceptor } from './common/tracing.interceptor';
import { IdempotencyInterceptor } from './common/idempotency.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { IdempotencyService } from './common/idempotency.service';
import { OrdersController } from './routes/orders.controller';
import { InventoryController } from './routes/inventory.controller';
import { PaymentsController } from './routes/payment.controller';
import { ShippingController } from './routes/shipping.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    NatsClientModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [
    OrdersController,
    InventoryController,
    ShippingController,
    PaymentsController,
  ],
  providers: [
    IdempotencyService,
    { provide: APP_INTERCEPTOR, useClass: TracingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TracingMiddleware).forRoutes('*');
  }
}
