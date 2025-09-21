import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ItemDto {
  @IsString() @IsNotEmpty() sku: string;
  @IsInt() @Min(1) quantity: number;
  @IsString() unitPrice: string;
}
export class CreateOrderDto {
  @IsString() @IsOptional() customerId?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
  @IsOptional() metadata?: Record<string, any>;
}
