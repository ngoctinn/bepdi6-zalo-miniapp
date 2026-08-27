# Hướng Dẫn Vận Hành & Test Thủ Công Backend Bếp Dì 6 (Step-by-Step)

Tài liệu này hướng dẫn chi tiết từng bước từ khởi động hạ tầng Docker, nạp dữ liệu mẫu, vận hành máy chủ Django Backend, đến kịch bản kiểm thử thủ công từng API bằng cURL / Postman và quản trị trực quan qua Django Admin.

---

## 🏗️ BƯỚC 1: Khởi Động Hạ Tầng Docker (PostgreSQL & Redis)

Hạ tầng Backend sử dụng **PostgreSQL 16** (Cổng `5432`) và **Redis 7** (Cổng `6379`).

### 1.1 Khởi động Container
Từ thư mục gốc dự án:
```bash
docker-compose -f infra/docker-compose.yml up -d
```

### 1.2 Kiểm tra trạng thái
```bash
docker-compose -f infra/docker-compose.yml ps
```
> **Kết quả mong đợi:** Cả 2 container `bepdi6_postgres` và `bepdi6_redis` đều ở trạng thái `Up (healthy)`.

---

## ⚙️ BƯỚC 2: Cấu Hình Môi Trường & Khởi Tạo CSDL

### 2.1 Tạo file cấu hình môi trường `.env`
```bash
cp -n .env.example .env
```

### 2.2 Chạy Migrations CSDL
Áp dụng toàn bộ cấu trúc bảng vào PostgreSQL:
```bash
uv run python apps/backend/manage.py migrate
```

### 2.3 Nạp dữ liệu mẫu ban đầu (Seeding Data)
Chạy lệnh seed data để tự động tạo tài khoản quản trị, danh mục, món ăn, tùy chọn, mã giảm giá và địa chỉ mẫu:
```bash
uv run python apps/backend/manage.py seed_data
```
> **Thông tin mặc định được tạo:**
> - 👤 **Tài khoản Admin:** `admin` / Mật khẩu: `admin123`
> - 🍱 **Danh mục mẫu:** *Cơm Tấm Truyền Thống*, *Nước Giải Khát & Trà*.
> - 🥩 **Món ăn mẫu:** *Cơm Tấm Sườn Bì Chả Đặc Biệt* (65.000đ), *Cơm Tấm Sườn Nướng Mật Ong* (50.000đ), *Trà Tắc Xí Muội* (20.000đ).
> - 🎟️ **Mã giảm giá:** `BEPDI6CHAOBAN` (Giảm 20k cho đơn từ 80k).
> - 🛵 **Địa chỉ mẫu:** *123 Nguyễn Huệ, Phường Bến Nghé, Quận 1*.

---

## 🚀 BƯỚC 3: Khởi Chạy Máy Chủ Backend & Celery Worker

### 3.1 Khởi chạy Django Dev Server (Cửa sổ Terminal 1)
```bash
uv run python apps/backend/manage.py runserver 0.0.0.0:8000
```
- **API Base URL:** `http://127.0.0.1:8000/api/v1/`
- **Trang Quản Trị Trực Quan:** `http://127.0.0.1:8000/admin/`

### 3.2 Khởi chạy Celery Worker xử lý thông báo ngầm (Cửa sổ Terminal 2 - Tùy chọn)
Để nhận và xử lý tác vụ nền gửi tin Zalo OA / ZNS:
```bash
cd apps/backend && uv run celery -A config worker --loglevel=info
```

---

## 🧪 BƯỚC 4: Kịch Bản Test Thủ Công Từng API (Manual API Scenarios)

Bạn có thể copy và dán trực tiếp các lệnh cURL dưới đây vào Terminal:

### 🍱 Kịch bản 1: Lấy Danh Mục & Thực Đơn (Public API)
```bash
# 1. Lấy danh sách danh mục
curl -s -X GET "http://127.0.0.1:8000/api/v1/categories"

# 2. Lấy danh sách món ăn đang mở bán
curl -s -X GET "http://127.0.0.1:8000/api/v1/products"

# 3. Lấy chi tiết món ăn (Kèm cây tùy chọn Options lồng nhau)
curl -s -X GET "http://127.0.0.1:8000/api/v1/products/1"
```

---

### 🔑 Kịch bản 2: Đăng Nhập Zalo Mini App & Lấy JWT Token
```bash
curl -s -X POST "http://127.0.0.1:8000/api/v1/auth/zalo" \
  -H "Content-Type: application/json" \
  -d '{
    "zalo_token": "mock_zalo_user_888",
    "phone_token": "mock_phone_token",
    "name": "Nguyễn Văn Khách Hàng",
    "avatar_url": "https://avatar.iran.liara.run/public/boy"
  }'
```
> Ghi lại chuỗi `access_token` trong kết quả trả về để dùng cho các bước tiếp theo.

---

### 🏠 Kịch bản 3: Quản Lý Hồ Sơ & Sổ Địa Chỉ Khách Hàng
```bash
# 1. Xem thông tin cá nhân
curl -s -X GET "http://127.0.0.1:8000/api/v1/customers/me" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# 2. Thêm địa chỉ nhận hàng mới (Tự động đặt làm mặc định)
curl -s -X POST "http://127.0.0.1:8000/api/v1/customers/me/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "label": "Nhà riêng",
    "recipient_name": "Nguyễn Văn Khách Hàng",
    "phone": "0987654321",
    "address_text": "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM",
    "latitude": 10.7721,
    "longitude": 106.6983,
    "is_default": true
  }'

# 3. Xem danh sách địa chỉ đã lưu
curl -s -X GET "http://127.0.0.1:8000/api/v1/customers/me/addresses" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

### 🎟️ Kịch bản 4: Kiểm Tra Thử Mã Giảm Giá (Voucher Validate)
```bash
curl -s -X POST "http://127.0.0.1:8000/api/v1/vouchers/validate" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "BEPDI6CHAOBAN",
    "order_amount": 100000
  }'
```

---

### 🛵 Kịch bản 5: Tính Thử Tiền Đơn Hàng & Phí Ship (Checkout Preview)
```bash
curl -s -X POST "http://127.0.0.1:8000/api/v1/checkout/preview" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "option_ids": [1],
        "note": "Ít mỡ hành"
      }
    ],
    "address_id": 1,
    "delivery_type": "ASAP",
    "voucher_code": "BEPDI6CHAOBAN",
    "payment_method": "BANK_TRANSFER"
  }'
```
> Trả về: `subtotal`, `distance_km`, `shipping_fee`, `discount`, `total_amount`.

---

### 🛒 Kịch bản 6: Đặt Đơn Hàng (Chống Trùng Đơn & Lấy Link VietQR)
```bash
curl -s -X POST "http://127.0.0.1:8000/api/v1/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Idempotency-Key: idemp_manual_test_0001" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 2,
        "option_ids": [1],
        "note": "Ít mỡ hành"
      }
    ],
    "address_id": 1,
    "delivery_type": "ASAP",
    "voucher_code": "BEPDI6CHAOBAN",
    "payment_method": "BANK_TRANSFER",
    "note": "Giao trước sảnh chung cư"
  }'
```
> **Kết quả trả về:**
> - `order_code`: Mã đơn hàng dạng `FO...`
> - `status`: `PENDING_CONFIRMATION`
> - `payment.qr_code_url`: Đường dẫn ảnh VietQR có sẵn số tiền và nội dung chuyển khoản chuẩn hóa.

---

### 👨‍💼 Kịch bản 7: Quản Trị Quán & Xác Nhận Đơn Hàng (Staff / Admin)
```bash
# 1. Lấy danh sách đơn hàng cho nhân viên
curl -s -X GET "http://127.0.0.1:8000/api/v1/admin/orders" \
  -H "Authorization: Bearer <ACCESS_TOKEN_CUA_ADMIN_HOAC_STAFF>"

# 2. Nhân viên xác nhận đơn (gọi điện thoại cho khách)
curl -s -X POST "http://127.0.0.1:8000/api/v1/admin/orders/1/confirm" \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"

# 3. Nhân viên xác nhận đã nhận được tiền chuyển khoản VietQR
curl -s -X POST "http://127.0.0.1:8000/api/v1/admin/orders/1/payment/verify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" \
  -d '{
    "actual_paid_amount": 126000,
    "note": "Khớp chính xác số tiền chuyển khoản"
  }'

# 4. Cập nhật tiến độ: Đang chế biến -> Sẵn sàng giao -> Đang giao
curl -s -X POST "http://127.0.0.1:8000/api/v1/admin/orders/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>" \
  -d '{"status": "PREPARING"}'
```

---

## 🛠️ BƯỚC 5: Quản Trị Trực Quan Qua Django Admin

Mở trình duyệt truy cập: **`http://127.0.0.1:8000/admin/`**
- **Username:** `admin`
- **Password:** `admin123`

Trang quản trị cho phép bạn:
1. Xem và sửa toàn bộ dữ liệu CSDL: Khách hàng, Địa chỉ, Danh mục, Món ăn, Tùy chọn, Đơn hàng, Thanh toán, Voucher, Thông báo, Audit Logs.
2. Kiểm tra các bản ghi Snapshot giá tiền và trạng thái đơn hàng thời gian thực.

---

## 🛑 Dừng / Tắt Môi Trường Khi Không Dùng

```bash
# 1. Dừng server Django: Bấm phím Ctrl + C trong terminal chạy runserver

# 2. Dừng container PostgreSQL và Redis:
docker-compose -f infra/docker-compose.yml down

# 3. (Tùy chọn) Xóa sạch dữ liệu CSDL để làm mới hoàn toàn:
docker-compose -f infra/docker-compose.yml down -v
```
