export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

export enum PaymentType {
  DIRECT = 'DIRECT',
  COMMISSION = 'COMMISSION',
}

export class Payment {
  id: string;
  orderCode: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  buyerId: string;
  sellerId: string;
  checkoutUrl?: string;
  qrCode?: string;
  type: PaymentType;
  createdAt: Date;
  updatedAt: Date;

  static calculateCommission(
    amount: number,
    type: PaymentType,
  ): { payoutAmount: number; feeAmount: number } {
    if (type === PaymentType.DIRECT) {
      return { payoutAmount: 0, feeAmount: 0 };
    }
    const feeAmount = amount * 0.1;
    return { payoutAmount: amount - feeAmount, feeAmount };
  }
}
