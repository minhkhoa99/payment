implementation_plan.md - PayOS Integration (NestJS + Hexagonal)
Goal
Develop a payment system using NestJS with Hexagonal Architecture (Ports & Adapters) to integrate PayOS. Key Features:

1-on-1 Payment: Buyer pays Seller (Full amount transferred to Seller eventually).
Commission Payment: Buyer pays Platform -> Platform takes 10% -> Platform transfers 90% to Seller.
Tech Stack: NestJS, PostgreSQL, Redis.
Database: Migrations required.
User Review Required
IMPORTANT

Assumption on "1-on-1 Payment": Since PayOS credentials belong to the Platform, "1-on-1" implies the Platform collects money first, then transfers 100% to the Seller via Payout API. (Unless Seller provides their own credentials, which is complex for a single app integration). Rate: Commission is 10% for "Discount" flow, 0% for "1-on-1" flow (configurable).

Architecture: Hexagonal (Ports & Adapters)
The project will follow a strict separation of concerns:

src/
├── core/                       # Domain Layer (Enterprise Business Rules)
│   ├── entities/               # Payment, Payout, User
│   ├── rules/                  # Commission logic (10% calculation)
│   └── ports/                  # Interfaces (Inbound/Outbound)
│       ├── inbound/            # Use Cases (CreatePaymentUseCase, HandleWebhookUseCase)
│       └── outbound/           # Repository Interfaces, PaymentGatewayPort (PayOS)
├── application/                # Application Layer (Use Case Implementations)
│   ├── services/               # PaymentService (Implements Inbound Ports)
│   └── dtos/                   # Data Transfer Objects
├── infrastructure/             # Infrastructure Layer (Frameworks & Drivers)
│   ├── adapters/
│   │   ├── inbound/            # HTTP Controllers, Consumers (Jobs)
│   │   └── outbound/           # PayOSAdapter, PostgresRepository, RedisCache
│   ├── database/               # TypeORM/Prisma Config & Migrations
│   └── config/                 # Environment Config (PayOS Keys)
└── main.ts                     # Entry Point
Database Schema (PostgreSQL)
We will use TypeORM or Prisma (user preference? Assuming TypeORM or Knex for clear migrations). Decision: TypeORM acts well with NestJS and migrations.

1. users (Minimal for context)
id (UUID, PK)
email (VARCHAR)
bank_name (VARCHAR) - For Payouts
bank_account (VARCHAR) - For Payouts
2. payments (Inbound Transactions)
id (UUID, PK)
order_code (BIGINT, Unique) - Required by PayOS (integer)
amount (DECIMAL)
currency (VARCHAR, default 'VND')
status (ENUM: PENDING, PAID, CANCELLED, FAILED)
buyer_id (UUID, FK -> users)
seller_id (UUID, FK -> users)
checkout_url (TEXT)
qr_code (TEXT)
type (ENUM: DIRECT, COMMISSION) - To determine payout logic
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
3. payouts (Outbound Transfers)
id (UUID, PK)
payment_id (UUID, FK -> payments) - 1-to-1 relationship with source payment
reference_id (VARCHAR, Unique)
amount (DECIMAL) - The amount sent to seller (90% or 100%)
fee_amount (DECIMAL) - The platform fee (10% or 0%)
status (ENUM: PENDING, PROCESSING, COMPLETED, FAILED)
beneficiary_bank (VARCHAR)
beneficiary_account (VARCHAR)
retry_count (INT)
created_at (TIMESTAMP)
4. webhook_logs
id (UUID, PK)
payload (JSONB)
signature (VARCHAR)
processed (BOOLEAN)
created_at (TIMESTAMP WITH TIME ZONE) - Stored in UTC
Configuration & Environment
Environment Variables (.env)
env
# Server
PORT=3000
TZ=UTC  # Force application to run in UTC
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
# PayOS (Production credentials provided)
PAYOS_CLIENT_ID=87444897-c5cb-49e9-9ffd-ee6d92735d0b
PAYOS_API_KEY=a56f47dd-ce63-4255-a5b7-508c0deeda61
PAYOS_CHECKSUM_KEY=d6091e56717b854859301ed245642a5a1c7e94d612bd8e6714817c6ff5d78f9a
Timezone Strategy
Application: Force process.env.TZ = 'UTC' in main.ts to ensure all new Date() calls are UTC.
Database: Configure PostgreSQL timezone to UTC or store all timestamps as TIMESTAMPTZ.
Format: ISO 8601 (e.g., 2025-04-25T06:03:20Z).
API Design
1. Payment Controller (Inbound HTTP)
POST /api/v1/payments: Create payment link.
Body: { amount, sellerId, type: 'DIRECT' | 'COMMISSION', description }
Returns: { checkoutUrl, qrCode, orderCode }
POST /api/v1/payments/webhook: Handle PayOS webhook.
Body: PayOS JSON
Action: Verify signature -> Update payments.status -> Trigger Payout Job if Success.
GET /api/v1/payments/history: Get user history.
Query: userId, fromDate, toDate, page, limit.
2. Payout Job (Background Worker - BullMQ/Redis)
Trigger: When Payment status becomes PAID.
Logic:
If type == DIRECT: Payout amount to Seller.
If type == COMMISSION: Calculate fee = amount * 0.1, Payout amount - fee to Seller.
Call PayOS Payout API.
Update payouts status.
Migration Strategy
Use strict migration files (e.g., 1708300000000-CreatePaymentTables.ts).
npm run request-migration -> generates file -> write SQL/TypeORM schema -> npm run migrate.
Implementation Steps
Step 1: detailed Setup
Instantiate NestJS project.
Install pg, typeorm, @nestjs/typeorm, @nestjs/bull, cache-manager-redis-store.
Configure env with PayOS credentials.
Step 2: Core Domain
Define Payment entity.
Implement logic: calculateCommission().
Step 3: Outbound Adapters
PayOS Adapter: specific class to wrap payos-node functionality.
createPaymentLink()
verifyWebhookSignature()
createPayout()
Step 4: Application Logic
PaymentService: Orchestrate creation -> save to DB -> call PayOS.
WebhookHandler: Receive -> Validate -> Update DB -> Queue Payout Job.
Step 5: Background Jobs
PayoutProcessor: Consume job -> Execute logic -> Update DB.
Verification Plan
Automated Tests
Unit tests for calculateCommission.
Integration test for CreatePayment (mocking PayOS).
Manual Verification
Use PayOS Sandbox/Test Environment URL (https://pay.payos.vn/web/...).
Trigger Webhook simulation (using Postman or PayOS dashboard if available).
Verify Database records for payouts created after webhooks.

