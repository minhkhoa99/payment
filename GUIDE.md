# Hướng dẫn Tích hợp & Vận hành Hệ thống Thanh toán PayOS

Tài liệu này hướng dẫn cách thiết lập tài khoản, cấu hình môi trường và sử dụng các API trong hệ thống thanh toán NestJS (Kiến trúc Hexagonal).

---

## 1. Cấu hình Tài khoản (Quy trình tiền mặt)

Hệ thống hỗ trợ 2 luồng chính:

- **1-on-1 Payment (DIRECT):** Người mua trả tiền -> Nền tảng nhận -> Chuyển 100% cho Người bán.
- **Commission Payment (COMMISSION):** Người mua trả tiền -> Nền tảng nhận -> Nền tảng thu 10% phí -> Chuyển 90% cho Người bán.

### Thiết lập các loại tài khoản:

1. **Tài khoản Nhận tiền (Platform Receiver):**
   - Đây là tài khoản ngân hàng liên kết với PayOS Dashboard của bạn.
   - Khi khách hàng quét mã QR, tiền sẽ đổ vào tài khoản này (do Nền tảng quản lý).

2. **Tài khoản Chuyển tiền/Chi hộ (Disbursement Account):**
   - Tiền sau khi về PayOS sẽ nằm trong số dư **Chi hộ**.
   - Bạn cần đảm bảo số dư trong PayOS Dashboard (phần Chi hộ) đủ để thực hiện lệnh chuyển cho Người bán.

3. **Tài khoản Người bán (Seller Account):**
   - Thông tin này được lưu trong bảng `users` trong cơ sở dữ liệu của bạn.
   - **Cực kỳ quan trọng:** Bạn phải thêm mã **BIN** ngân hàng (ví dụ: `970415` cho VietinBank) vào cột `bankName` để hệ thống chi tiền chính xác.

---

## 2. Hướng dẫn Cài đặt

### Yêu cầu hệ thống:

- Node.js 18+
- PostgreSQL
- Redis (Dùng cho BullMQ xử lý chi tiền ngầm)

### Các bước thực hiện:

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
2. **Cấu hình môi trường (`.env`):**
   Cập nhật các thông số từ PayOS Dashboard:
   ```env
   PAYOS_CLIENT_ID=your_id
   PAYOS_API_KEY=your_key
   PAYOS_CHECKSUM_KEY=your_checksum
   DATABASE_URL=postgresql://user:pass@localhost:5432/payment_db
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
3. **Chạy Migration để tạo bảng:**
   ```bash
   npm run migration:run
   ```
4. **Khởi chạy ứng dụng:**
   ```bash
   npm run start:dev
   ```

---

## 3. Chi tiết API (Swagger: http://localhost:3000/docs)

### A. Tạo Link Thanh toán

- **Endpoint:** `POST /api/v1/payments`
- **Body:**
  ```json
  {
    "amount": 100000,
    "buyerId": "uuid-khach-hang",
    "sellerId": "uuid-nguoi-ban",
    "type": "COMMISSION",
    "description": "Thanh toan don hang #123"
  }
  ```
- **Giải thích `type`:**
  - `DIRECT`: Chuyển đủ 100% cho seller.
  - `COMMISSION`: Thu 10%, chuyển 90% cho seller.

### B. Webhook (Tự động)

- **Endpoint:** `POST /api/v1/payments/webhook`
- **Chức năng:** PayOS tự động gọi vào đây. Hệ thống sẽ:
  1. Xác thực chữ ký.
  2. Cập nhật trạng thái `PAID`.
  3. Đẩy lệnh chi tiền vào hàng đợi Redis (BullMQ).

### C. Lấy Lịch sử Thanh toán

- **Endpoint:** `GET /api/v1/payments/history`
- **Query Params:** `userId`, `fromDate`, `toDate`, `page`, `limit`.

---

## 4. Quản lý luồng Chi tiền (Payout)

Hệ thống sử dụng **BullMQ** để chi tiền tự động nhằm đảm bảo:

- **Tính ổn định:** Nếu PayOS API lỗi, lệnh chi sẽ được lưu trong Redis và thử lại sau.
- **Kiểm soát:** Hệ thống luôn kiểm tra số dư tài khoản chi hộ trước khi thực hiện lệnh chuyển tiền.

### Cách thêm thông tin Người bán để nhận tiền:

Bạn cần chèn dữ liệu vào bảng `users`:

```sql
INSERT INTO users (id, email, "bankName", "bankAccount", "accountName")
VALUES ('uuid-cua-seller', 'seller@email.com', '970415', '123456789', 'NGUYEN VAN A');
```

_(Lưu ý: `bankName` phải là mã BIN của ngân hàng theo tiêu chuẩn NAPAS/PayOS)_

---

## 5. Xử lý lỗi & Điều hướng

- **Thành công:** Người dùng được chuyển về `PAYOS_RETURN_URL`.
- **Hủy thanh toán:** Người dùng được chuyển về `PAYOS_CANCEL_URL`.
- **Lỗi Webhook:** Kiểm tra bảng `webhook_logs` trong cơ sở dữ liệu để xem payload lỗi và chữ ký.

---

_Tài liệu này được tạo tự động bởi Antigravity AI._
