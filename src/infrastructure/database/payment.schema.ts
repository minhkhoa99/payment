import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ValueTransformer } from 'typeorm';
import { PaymentStatus, PaymentType } from '../../core/entities/payment.entity';

// Transformer giúp Repository tự động convert dữ liệu khi Save/Find
const bigintTransformer: ValueTransformer = {
  to: (value: number) => value?.toString(),
  from: (value: string) => (value ? Number(value) : null),
};

const numericTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? Number(value) : null),
};

@Entity('payments')
export class PaymentSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, transformer: bigintTransformer })
  orderCode: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ default: 'VND' })
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column()
  buyerId: string;

  @Column()
  sellerId: string;

  @Column({ type: 'text', nullable: true })
  checkoutUrl: string;

  @Column({ type: 'text', nullable: true })
  qrCode: string;

  @Column({ type: 'enum', enum: PaymentType })
  type: PaymentType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
