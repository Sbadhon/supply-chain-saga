import { IsNumber, IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  provider_ref?: string;

  @IsOptional()
  @IsString()
  methodSummary?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'NEW','PROCESSING','REQUIRES_ACTION','AUTHORIZED','CAPTURED',
    'DECLINED','FAILED','VOIDED','REFUNDED','PARTIALLY_REFUNDED','DISPUTED','CANCELED'
  ])
  status?: string;
}
