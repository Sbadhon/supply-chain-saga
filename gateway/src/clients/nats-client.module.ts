import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      { name: 'ORDERS',    transport: Transport.NATS, options: { servers: ['nats://localhost:4222'] } },
      { name: 'INVENTORY', transport: Transport.NATS, options: { servers: ['nats://localhost:4222'] } },
      { name: 'SHIPPING',  transport: Transport.NATS, options: { servers: ['nats://localhost:4222'] } },
      { name: 'PAYMENTS',  transport: Transport.NATS, options: { servers: ['nats://localhost:4222'] } },
    ]),
  ],
  exports: [ClientsModule],
})
export class NatsClientModule {}
