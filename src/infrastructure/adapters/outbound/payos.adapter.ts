import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreatePaymentLink,
  PaymentGatewayPort,
} from '../../../core/ports/outbound/payment-gateway.port';

// Import theo chuẩn CommonJS
const PayOS = require('@payos/node');

@Injectable()
export class PayOSAdapter implements PaymentGatewayPort {
  private payos: any;
  private readonly logger = new Logger(PayOSAdapter.name);

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID') || '';
    const apiKey = this.configService.get<string>('PAYOS_API_KEY') || '';
    const checksumKey =
      this.configService.get<string>('PAYOS_CHECKSUM_KEY') || '';

    try {
      // Sửa lỗi: Đối với @payos/node v2, export có thể là default hoặc direct class
      // Chúng ta sẽ kiểm tra xem PayOS có phải là một class (constructor) hay không
      const TargetPayOS = PayOS.PayOS || PayOS.default || PayOS;

      // Khởi tạo instance
      this.payos = new TargetPayOS(clientId, apiKey, checksumKey);

      this.logger.log('PayOS SDK initialized successfully');
    } catch (e) {
      this.logger.error(`Failed to initialize PayOS SDK: ${e.message}`);
    }
  }

  async createPaymentLink(
    data: CreatePaymentLink,
  ): Promise<{ checkoutUrl: string; qrCode: string }> {
    const paymentLinkRes = await this.payos.createPaymentLink({
      amount: data.amount,
      orderCode: data.orderCode,
      description: data.description,
      returnUrl: data.returnUrl,
      cancelUrl: data.cancelUrl,
    });

    return {
      checkoutUrl: paymentLinkRes.checkoutUrl,
      qrCode: paymentLinkRes.qrCode,
    };
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const verifiedData = this.payos.verifyPaymentWebhookData(payload);
      return !!verifiedData;
    } catch (e) {
      this.logger.error(`Webhook verification failed: ${e.message}`);
      return false;
    }
  }

  async createPayout(data: any): Promise<any> {
    return await this.payos.createDisbursement(data);
  }

  async getPayoutAccountBalance(): Promise<any> {
    return await this.payos.getDisbursementAccountBalance();
  }

  async confirmWebhook(url: string): Promise<string> {
    return await this.payos.confirmWebhook(url);
  }
}
