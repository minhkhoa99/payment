import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSellerDto } from '../../../application/dtos/create-seller.dto';
import { UpdateSellerDto } from '../../../application/dtos/update-seller.dto';
import { SellerService } from '../../../application/services/seller.service';

@ApiTags('Sellers')
@Controller('sellers')
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Post()
  @ApiOperation({ summary: 'Create seller payout profile' })
  async create(@Body() dto: CreateSellerDto) {
    return this.sellerService.createSeller(dto);
  }

  @Get(':sellerId')
  @ApiOperation({ summary: 'Get seller payout profile' })
  async get(@Param('sellerId') sellerId: string) {
    return this.sellerService.getSeller(sellerId);
  }

  @Patch(':sellerId')
  @ApiOperation({ summary: 'Update seller payout profile' })
  async update(
    @Param('sellerId') sellerId: string,
    @Body() dto: UpdateSellerDto,
  ) {
    return this.sellerService.updateSeller(sellerId, dto);
  }

  @Delete(':sellerId')
  @ApiOperation({ summary: 'Delete seller payout profile' })
  async delete(@Param('sellerId') sellerId: string) {
    return this.sellerService.deleteSeller(sellerId);
  }
}
