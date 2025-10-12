import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersMessageController } from './orders.message.controller';
import { OutboxEvent } from 'src/outbox/outbox.entity';
import { NatsPublisher } from 'src/outbox/nats.publisher';
import { OutboxService } from 'src/outbox/outbox.service';
import { OrderCommitProgress } from './entities/order-commit-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderCommitProgress,
      OutboxEvent,
    ]),
  ],
  controllers: [OrdersController, OrdersMessageController],
  providers: [OrdersService, OutboxService, NatsPublisher],
  exports: [TypeOrmModule, OutboxService],
})
export class OrdersModule {}
