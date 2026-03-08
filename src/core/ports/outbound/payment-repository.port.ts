import { Payment } from '../../entities/payment.entity';

export interface PaymentRepositoryPort {
  save(payment: Payment): Promise<Payment | null>;
  findByOrderCode(orderCode: number): Promise<Payment | null>;
  updateStatus(id: string, status: string): Promise<void>;
  findAll(filters: { userId?: string; fromDate?: Date; toDate?: Date; page: number; limit: number }): Promise<{ items: Payment[]; total: number }>;
}
