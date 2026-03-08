import { Payment, PaymentType } from '../entities/payment.entity';

describe('Payment Commission Logic', () => {
  it('should calculate 0% fee for DIRECT payment type', () => {
    const amount = 100000;
    const result = Payment.calculateCommission(amount, PaymentType.DIRECT);
    
    expect(result.payoutAmount).toBe(100000);
    expect(result.feeAmount).toBe(0);
  });

  it('should calculate 10% fee for COMMISSION payment type', () => {
    const amount = 100000;
    const result = Payment.calculateCommission(amount, PaymentType.COMMISSION);
    
    expect(result.payoutAmount).toBe(90000);
    expect(result.feeAmount).toBe(10000);
  });

  it('should handle small amounts correctly', () => {
    const amount = 1000;
    const result = Payment.calculateCommission(amount, PaymentType.COMMISSION);
    
    expect(result.payoutAmount).toBe(900);
    expect(result.feeAmount).toBe(100);
  });
});
