-- =====================================================
-- LỊCH SỬ THANH TOÁN VÀO TÀI KHOẢN NGƯỜI BÁN (SELLER)
-- Tối ưu cho latency thấp
-- =====================================================

-- -----------------------------------------------------
-- Cách 1: Lịch sử payments mà seller đã nhận được
-- Dùng khi cần xem các khoản thanh toán từ buyer
-- -----------------------------------------------------
SELECT
    p.id AS payment_id,
    p."orderCode",
    p.amount,
    p.currency,
    p.status AS payment_status,
    p.type AS payment_type,
    p."createdAt" AS payment_created_at,
    p."updatedAt" AS payment_updated_at,
    buyer.id AS buyer_id,
    buyer.email AS buyer_email
FROM public.payments p
LEFT JOIN public.users buyer
    ON buyer.id::text = p."buyerId"
WHERE p."sellerId" = :sellerId
    AND p.status = 'PAID'
ORDER BY p."createdAt" DESC
LIMIT 50;

-- -----------------------------------------------------
-- Cách 2: Lịch sử payouts đã chuyển cho seller
-- Dùng khi cần xem các khoản đã chi trả thực tế
-- -----------------------------------------------------
SELECT
    po.id AS payout_id,
    po."referenceId",
    po.amount,
    po."feeAmount",
    po.amount - po."feeAmount" AS net_amount,
    po.status AS payout_status,
    po."beneficiaryBank",
    po."beneficiaryAccount",
    po."retryCount",
    po."createdAt" AS payout_created_at
FROM public.payouts po
WHERE po."paymentId" = :sellerId
    AND po.status = 'COMPLETED'
ORDER BY po."createdAt" DESC
LIMIT 50;

-- -----------------------------------------------------
-- Cách 3: Tổng hợp cả payments và payouts của seller
-- Dùng khi cần view tổng quan
-- -----------------------------------------------------
WITH payments_summary AS (
    SELECT
        p.id AS transaction_id,
        'PAYMENT' AS transaction_type,
        p.amount,
        p.status,
        p."createdAt"
    FROM public.payments p
    WHERE p."sellerId" = :sellerId
        AND p.status = 'PAID'
),
payouts_summary AS (
    SELECT
        po.id AS transaction_id,
        'PAYOUT' AS transaction_type,
        po.amount - po."feeAmount" AS amount,
        po.status,
        po."createdAt"
    FROM public.payouts po
    WHERE po."paymentId" = :sellerId
        AND po.status = 'COMPLETED'
)
SELECT * FROM payments_summary
UNION ALL
SELECT * FROM payouts_summary
ORDER BY "createdAt" DESC
LIMIT 50;

-- =====================================================
-- INDEXES cho query tối ưu
-- =====================================================

-- Index cho payments theo seller + status + createdAt (dùng cho query cách 1)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_seller_status_created
ON public.payments ("sellerId", status, "createdAt" DESC);

-- Index cho payouts theo paymentId (seller) + status + createdAt (dùng cho query cách 2)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payouts_payment_status_created
ON public.payouts ("paymentId", status, "createdAt" DESC);

-- Index cho users lookup theo id (để join nhanh)
-- Nếu dùng id::text thì tạo index dạng expression
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_id_text
ON public.users ((id::text));
