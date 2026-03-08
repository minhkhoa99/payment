import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsUUID,
  IsEnum,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { PaymentType } from '../../core/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsUUID()
  buyerId: string;

  @ApiProperty()
  @IsUUID()
  sellerId: string;

  @ApiProperty({ enum: PaymentType })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;
}
