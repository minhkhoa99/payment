import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  Payment,
  PaymentStatus,
  PaymentType,
} from '../../core/entities/payment.entity';
import { PaymentGatewayPort } from '../../core/ports/outbound/payment-gateway.port';
import { PaymentRepositoryPort } from '../../core/ports/outbound/payment-repository.port';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLogSchema } from '../../infrastructure/database/webhook-log.schema';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @Inject('PaymentGatewayPort')
    private readonly paymentGateway: PaymentGatewayPort,
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
    @InjectQueue('payout')
    private readonly payoutQueue: Queue,
    @InjectRepository(WebhookLogSchema)
    private readonly webhookLogRepo: Repository<WebhookLogSchema>,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async createPayment(data: {
    amount: number;
    buyerId: string;
    sellerId: string;
    type: PaymentType;
    description: string;
  }) {
    try {
      const orderCode = Number(Date.now().toString().slice(-9));

      const payment = new Payment();
      payment.amount = data.amount;
      payment.buyerId = data.buyerId;
      payment.sellerId = data.sellerId;
      payment.type = data.type;
      payment.orderCode = orderCode;
      payment.status = PaymentStatus.PENDING;
      payment.currency = 'VND';

      const link = await this.paymentGateway.createPaymentLink({
        amount: data.amount,
        orderCode: orderCode,
        description: data.description,
        returnUrl: this.configService.get<string>('PAYOS_RETURN_URL') || '',
        cancelUrl: this.configService.get<string>('PAYOS_CANCEL_URL') || '',
      });

      payment.checkoutUrl = link.checkoutUrl;
      payment.qrCode = link.qrCode;

      return await this.paymentRepository.save(payment);
    } catch (e) {
      this.logger.error(`createPayment Error: ${e.message}`);
      return null;
    }
  }

  async handleWebhook(payload: any, signature: string | undefined) {
    try {
      const safeSignature = signature || '';
      await this.webhookLogRepo.save({
        payload,
        signature: safeSignature,
        processed: true,
      });

      const isVerified = await this.paymentGateway.verifyWebhookSignature(
        payload,
        safeSignature,
      );
      if (!isVerified) {
        this.logger.warn('Webhook signature verification failed');
      }

      const webhookData = payload.data || payload;
      const payment = await this.paymentRepository.findByOrderCode(
        webhookData.orderCode,
      );

      if (
        payment &&
        (payload.code === '00' || payload.success) &&
        payment.status !== PaymentStatus.PAID
      ) {
        await this.paymentRepository.updateStatus(
          payment.id,
          PaymentStatus.PAID,
        );
        if (payment.type === PaymentType.COMMISSION) {
          await this.payoutQueue.add('process-payout', {
            paymentId: payment.id,
          });
        }

        this.logger.log(
          payment.type === PaymentType.COMMISSION
            ? `Payment confirmed. Queuing payout for order: ${webhookData.orderCode}`
            : `Payment confirmed. No payout required for order: ${webhookData.orderCode}`,
        );
      }
    } catch (e) {
      this.logger.error(`handleWebhook Error: ${e.message}`);
    }
  }

  async getHistory(filters: {
    userId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const cacheKey = `history:${filters.userId || 'all'}:${filters.fromDate || ''}:${filters.toDate || ''}:${page}:${limit}`;

    try {
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        this.logger.log('Returning history from cache');
        return cachedData;
      }

      const result = await this.paymentRepository.findAll({
        userId: filters.userId,
        fromDate: filters.fromDate ? new Date(filters.fromDate) : undefined,
        toDate: filters.toDate ? new Date(filters.toDate) : undefined,
        page,
        limit,
      });

      await this.cacheManager.set(cacheKey, result, 60000); // 1 minute TTL
      return result;
    } catch (e) {
      this.logger.error(`getHistory Error: ${e.message}`);
      return await this.paymentRepository.findAll({
        userId: filters.userId,
        page,
        limit,
      });
    }
  }
}
