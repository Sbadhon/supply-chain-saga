import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  order_id: number;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsNumber()
  amount: number;

  @IsString()
  provider_ref: string;
}