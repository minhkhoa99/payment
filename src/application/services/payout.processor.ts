import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentSchema } from '../../infrastructure/database/payment.schema';
import { PayoutSchema } from '../../infrastructure/database/payout.schema';
import { UserSchema } from '../../infrastructure/database/user.schema';
import { PayoutStatus } from '../../core/entities/payout.entity';
import { Payment, PaymentType } from '../../core/entities/payment.entity';
import { Inject, Logger } from '@nestjs/common';
import { PaymentGatewayPort } from '../../core/ports/outbound/payment-gateway.port';
import { ConfigService } from '@nestjs/config';

@Processor('payout')
export class PayoutProcessor extends WorkerHost {
  private readonly logger = new Logger(PayoutProcessor.name);

  constructor(
    @InjectRepository(PaymentSchema)
    private paymentRepo: Repository<PaymentSchema>,
    @InjectRepository(PayoutSchema)
    private payoutRepo: Repository<PayoutSchema>,
    @InjectRepository(UserSchema) private userRepo: Repository<UserSchema>,
    @Inject('PaymentGatewayPort') private paymentGateway: PaymentGatewayPort,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const { paymentId } = job.data;

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });
    if (!payment) return;

    const { payoutAmount, feeAmount } = Payment.calculateCommission(
      payment.amount,
      payment.type,
    );

    const beneficiary = await this.resolveBeneficiary(payment);
    if (!beneficiary) {
      return;
    }

    const payout = this.payoutRepo.create({
      paymentId: payment.id,
      referenceId: `PO_${payment.orderCode}_${Date.now().toString().slice(-4)}`,
      amount: payoutAmount,
      feeAmount: feeAmount,
      beneficiaryBank: beneficiary.bankName,
      beneficiaryAccount: beneficiary.bankAccount,
      status: PayoutStatus.PROCESSING,
    });

    await this.payoutRepo.save(payout);

    try {
      const balanceInfo =
        (await this.paymentGateway.getPayoutAccountBalance()) as any;
      if (balanceInfo.balance < payoutAmount) {
        throw new Error(
          `Insufficient disbursement balance. Available: ${balanceInfo.balance}`,
        );
      }

      await this.paymentGateway.createPayout({
        referenceId: payout.referenceId,
        amount: payoutAmount,
        description: `Thanh toan don hang ${payment.orderCode}`,
        toBin: beneficiary.bankName,
        toAccountNumber: beneficiary.bankAccount,
        accountName: beneficiary.accountName,
      });

      payout.status = PayoutStatus.COMPLETED;
    } catch (e) {
      payout.status = PayoutStatus.FAILED;
      this.logger.error(`Payout Failed for ${paymentId}: ${e.message}`);
    }

    await this.payoutRepo.save(payout);
  }

  private async resolveBeneficiary(payment: PaymentSchema) {
    if (payment.type === PaymentType.DIRECT) {
      const bankName = this.configService.get<string>('BANK_NAME') || '';
      const bankAccount = this.configService.get<string>('BANK_ACCOUNT') || '';
      const accountName =
        this.configService.get<string>('BANK_ACCOUNT_NAME') || '';

      if (!bankName || !bankAccount || !accountName) {
        this.logger.error(
          'DIRECT payment requires BANK_NAME, BANK_ACCOUNT, BANK_ACCOUNT_NAME in .env',
        );
        return null;
      }

      return {
        bankName,
        bankAccount,
        accountName,
      };
    }

    const seller = await this.userRepo.findOne({
      where: { id: payment.sellerId },
    });

    if (
      !seller ||
      !seller.bankAccount ||
      !seller.bankName ||
      !seller.accountName
    ) {
      this.logger.error(
        `COMMISSION payment seller ${payment.sellerId} missing bank information`,
      );
      return null;
    }

    return {
      bankName: seller.bankName,
      bankAccount: seller.bankAccount,
      accountName: seller.accountName,
    };
  }
}
