import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const ORDERS = 'ORDERS';
export const PAYMENTS = 'PAYMENTS';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: ORDERS,
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('NATS_URL') ?? 'nats://nats:4222';
        return ClientProxyFactory.create({
          transport: Transport.NATS,
          options: { servers: [url] },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: PAYMENTS,
      useFactory: (cfg: ConfigService) => {
        const url = cfg.get<string>('NATS_URL') ?? 'nats://nats:4222';
        return ClientProxyFactory.create({
          transport: Transport.NATS,
          options: { servers: [url] },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [ORDERS, PAYMENTS],
})
export class NatsClientModule {}
