import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ItemDto {
  @IsString() 
  @IsNotEmpty() 
  sku: string;

  @IsString() 
  @IsOptional() 
  supplierId: string;

  @IsInt() 
  @Min(1) quantity: number;

  @IsNumberString() 
  unitPrice: string;
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
