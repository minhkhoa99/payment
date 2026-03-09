import { Payment, PaymentStatus } from '../../entities/payment.entity';

export interface CreatePaymentLink {
  amount: number;
  orderCode: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatePayout {
  amount: number;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  description: string;
}

export interface PaymentGatewayPort {
  createPaymentLink(
    data: CreatePaymentLink,
  ): Promise<{ checkoutUrl: string; qrCode: string }>;
  verifyWebhookSignature(payload: any, signature: string): Promise<boolean>;
  createPayout(data: any): Promise<any>;
  getPayoutAccountBalance(): Promise<any>;
  confirmWebhook(url: string): Promise<any>;
}
