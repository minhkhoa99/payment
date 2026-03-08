import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ValueTransformer } from 'typeorm';
import { PayoutStatus } from '../../core/entities/payout.entity';

const numericTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string) => (value ? Number(value) : null),
};

@Entity('payouts')
export class PayoutSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paymentId: string;

  @Column({ unique: true })
  referenceId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numericTransformer })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, transformer: numericTransformer })
  feeAmount: number;

  @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  @Column()
  beneficiaryBank: string;

  @Column()
  beneficiaryAccount: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
