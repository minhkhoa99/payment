import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentRepositoryPort } from '../../../core/ports/outbound/payment-repository.port';
import { Payment } from '../../../core/entities/payment.entity';
import { PaymentSchema } from '../../database/payment.schema';

@Injectable()
export class PostgresPaymentRepository implements PaymentRepositoryPort {
  private readonly logger = new Logger(PostgresPaymentRepository.name);

  constructor(
    @InjectRepository(PaymentSchema)
    private readonly repository: Repository<PaymentSchema>,
  ) { }

  async save(payment: Payment): Promise<Payment | null> {
    try {
      return (await this.repository.save(payment)) as any;
    } catch (e) {
      this.logger.error(`savePayment Error: ${e.message}`, JSON.stringify(payment));
      return null;
    }
  }

  async findByOrderCode(orderCode: number): Promise<Payment | null> {
    try {
      return (await this.repository.findOne({ where: { orderCode } })) as any;
    } catch (e) {
      this.logger.error(`findByOrderCode Error: ${e.message}`);
      return null;
    }
  }

  async updateStatus(id: string, status: string): Promise<void> {
    try {
      await this.repository.update(id, { status: status as any });
    } catch (e) {
      this.logger.error(`updateStatus Error: ${id} - ${e.message}`);
    }
  }

  async findAll(filters: {
    userId?: string;
    fromDate?: Date;
    toDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ items: Payment[]; total: number }> {
    const { userId, fromDate, toDate, page, limit } = filters;
    const query = this.repository.createQueryBuilder('p');

    if (userId) {
      query.andWhere('(p.buyerId = :userId OR p.sellerId = :userId)', { userId });
    }

    if (fromDate && toDate) {
      query.andWhere('p.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate,
        toDate,
      });
    }

    const [items, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('p.createdAt', 'DESC')
      .getManyAndCount();

    return {
      items: items.map(
        (item) =>
          ({
            ...item,
            orderCode: Number(item.orderCode),
            amount: Number(item.amount),
          }) as Payment,
      ),
      total,
    };
  }
}
