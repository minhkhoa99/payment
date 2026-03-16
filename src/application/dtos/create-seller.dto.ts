import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateSellerDto {
  @ApiProperty()
  @IsUUID()
  sellerId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bankAccount: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountName: string;
}
