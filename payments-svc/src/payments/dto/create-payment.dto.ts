import {
  IsNumber,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsPositive,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const PaymentStatuses = [
  'NEW',
  'PROCESSING',
  'REQUIRES_ACTION',
  'AUTHORIZED',
  'CAPTURED',
  'DECLINED',
  'FAILED',
  'VOIDED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'DISPUTED',
  'CANCELED',
] as const;

export class CreatePaymentDto {
  @ApiProperty({ description: 'Associated order ID' })
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @ApiProperty({ description: 'Amount in major currency units (e.g., 12.34)' })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({ description: 'ISO 4217 currency code, e.g. USD, EUR' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency!: string;

  @ApiPropertyOptional({ description: 'Short description of payment method' })
  @IsOptional()
  @IsString()
  methodSummary?: string;

  @ApiPropertyOptional({ description: 'Payment provider name (e.g., Stripe)' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Provider payment id/reference' })
  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @ApiPropertyOptional({
    enum: PaymentStatuses,
    description: 'Optional initial status (defaults to NEW in service)',
  })
  @IsOptional()
  @IsString()
  @IsIn([...PaymentStatuses])
  status?: string;
}
