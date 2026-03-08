export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class Payout {
  id: string;
  paymentId: string;
  referenceId: string;
  amount: number;
  feeAmount: number;
  status: PayoutStatus;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  retryCount: number;
  createdAt: Date;
}
