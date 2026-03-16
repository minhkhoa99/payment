import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersSellerId1708400000000 implements MigrationInterface {
  name = 'UpdateUsersSellerId1708400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sellerId" character varying',
    );
    await queryRunner.query(
      'UPDATE "users" SET "sellerId" = "id"::text WHERE "sellerId" IS NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "sellerId" SET NOT NULL',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_users_sellerId'
        ) THEN
          ALTER TABLE "users" ADD CONSTRAINT "UQ_users_sellerId" UNIQUE ("sellerId");
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_email"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "email"',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" character varying',
    );
    await queryRunner.query(
      `UPDATE "users" SET "email" = CONCAT("sellerId", '@restored.local') WHERE "email" IS NULL`,
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_users_email'
        ) THEN
          ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email");
        END IF;
      END
      $$;
    `);
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_users_sellerId"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP COLUMN IF EXISTS "sellerId"',
    );
  }
}
