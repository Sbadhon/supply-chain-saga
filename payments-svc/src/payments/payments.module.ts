import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymentsMessageController } from './payments.message.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController, PaymentsMessageController],
  providers: [PaymentsService],
  exports: [TypeOrmModule],
})
export class PaymentsModule {}
