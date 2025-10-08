import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsMessageController } from './payments.message.controller';
import { OutboxService } from 'src/outbox/outbox.service';
import { OutboxEvent } from 'src/outbox/outbox.entity';
import { NatsPublisher } from 'src/outbox/nats.publisher';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, OutboxEvent])],
  controllers: [PaymentsController, PaymentsMessageController],
  providers: [PaymentsService, OutboxService, NatsPublisher],
  exports: [TypeOrmModule, OutboxService],
})
export class PaymentsModule {}
