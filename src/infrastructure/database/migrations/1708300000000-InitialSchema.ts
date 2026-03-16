import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1708300000000 implements MigrationInterface {
  name = 'InitialSchema1708300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Table: users
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "sellerId" character varying NOT NULL,
                "bankName" character varying,
                "bankAccount" character varying,
                "accountName" character varying,
                CONSTRAINT "PK_users" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_users_sellerId" UNIQUE ("sellerId")
            )
        `);

    // Table: payments
    await queryRunner.query(`
            CREATE TYPE "payments_status_enum" AS ENUM('PENDING', 'PAID', 'CANCELLED', 'FAILED');
            CREATE TYPE "payments_type_enum" AS ENUM('DIRECT', 'COMMISSION');
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "orderCode" bigint NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "currency" character varying NOT NULL DEFAULT 'VND',
                "status" "payments_status_enum" NOT NULL DEFAULT 'PENDING',
                "buyerId" character varying NOT NULL,
                "sellerId" character varying NOT NULL,
                "checkoutUrl" text,
                "qrCode" text,
                "type" "payments_type_enum" NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_payments_orderCode" UNIQUE ("orderCode")
            )
        `);

    // Table: payouts
    await queryRunner.query(`
            CREATE TYPE "payouts_status_enum" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
            CREATE TABLE "payouts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentId" character varying NOT NULL,
                "referenceId" character varying NOT NULL,
                "amount" numeric(12,2) NOT NULL,
                "feeAmount" numeric(12,2) NOT NULL,
                "status" "payouts_status_enum" NOT NULL DEFAULT 'PENDING',
                "beneficiaryBank" character varying NOT NULL,
                "beneficiaryAccount" character varying NOT NULL,
                "retryCount" integer NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_payouts" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_payouts_referenceId" UNIQUE ("referenceId")
            )
        `);

    // Table: webhook_logs
    await queryRunner.query(`
            CREATE TABLE "webhook_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "payload" jsonb NOT NULL,
                "signature" character varying NOT NULL,
                "processed" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_webhook_logs" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "webhook_logs"`);
    await queryRunner.query(`DROP TABLE "payouts"`);
    await queryRunner.query(`DROP TYPE "payouts_status_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "payments_type_enum"`);
    await queryRunner.query(`DROP TYPE "payments_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
