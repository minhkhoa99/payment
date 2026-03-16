import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { PaymentService } from './application/services/payment.service';
import { BankService } from './application/services/bank.service';
import { SellerService } from './application/services/seller.service';
import { PayoutProcessor } from './application/services/payout.processor';
import { PayOSAdapter } from './infrastructure/adapters/outbound/payos.adapter';
import { PostgresPaymentRepository } from './infrastructure/adapters/outbound/postgres-payment.repository';
import { PaymentSchema } from './infrastructure/database/payment.schema';
import { PayoutSchema } from './infrastructure/database/payout.schema';
import { UserSchema } from './infrastructure/database/user.schema';
import { WebhookLogSchema } from './infrastructure/database/webhook-log.schema';
import { BankController } from './infrastructure/adapters/inbound/bank.controller';
import { PaymentController } from './infrastructure/adapters/inbound/payment.controller';
import { SellerController } from './infrastructure/adapters/inbound/seller.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [PaymentSchema, PayoutSchema, UserSchema, WebhookLogSchema],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      PaymentSchema,
      PayoutSchema,
      UserSchema,
      WebhookLogSchema,
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'payout',
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
          ttl: 60000,
        }),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  controllers: [PaymentController, BankController, SellerController],
  providers: [
    BankService,
    PaymentService,
    SellerService,
    PayoutProcessor,
    {
      provide: 'PaymentGatewayPort',
      useClass: PayOSAdapter,
    },
    {
      provide: 'PaymentRepositoryPort',
      useClass: PostgresPaymentRepository,
    },
  ],
})
export class AppModule {}
