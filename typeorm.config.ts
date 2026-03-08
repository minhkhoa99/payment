import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { PaymentSchema } from './src/infrastructure/database/payment.schema';
import { PayoutSchema } from './src/infrastructure/database/payout.schema';
import { UserSchema } from './src/infrastructure/database/user.schema';
import { WebhookLogSchema } from './src/infrastructure/database/webhook-log.schema';

config();

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [PaymentSchema, PayoutSchema, UserSchema, WebhookLogSchema],
  migrations: ['./src/infrastructure/database/migrations/*.ts'],
  synchronize: false, // Tắt synchronize khi dùng migration
});
