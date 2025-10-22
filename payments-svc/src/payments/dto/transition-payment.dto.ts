import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export enum PaymentAction {
  AUTHORIZE = 'AUTHORIZE',
  CANCEL = 'CANCEL',
  CAPTURE = 'CAPTURE',
  VOID = 'VOID',
  REFUND = 'REFUND',
}

export class TransitionPaymentDto {
  @ApiProperty({ enum: PaymentAction })
  @IsEnum(PaymentAction)
  action!: PaymentAction;

  @ApiProperty({ required: false, type: Number })
  @IsOptional()
  @IsNumber()
  amount?: number;
}
