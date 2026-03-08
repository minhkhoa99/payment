import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { PaymentService } from '../../../application/services/payment.service';
import { CreatePaymentDto } from '../../../application/dtos/create-payment.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post()
  @ApiOperation({ summary: 'Create payment link' })
  async create(@Body() dto: CreatePaymentDto) {
    return await this.paymentService.createPayment(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'PayOS Webhook' })
  async webhook(@Body() payload: any, @Query('signature') signature?: string) {
    // PayOS thường gửi signature trong body hoặc query tùy version/config
    return await this.paymentService.handleWebhook(payload, signature);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  async history(
    @Query('userId') userId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.paymentService.getHistory({ userId, fromDate, toDate, page, limit });
  }
}
