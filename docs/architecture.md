# Architecture

## 1. Tổng quan

```
┌────────────────────────────────────────────────────────┐
│              Zalo Mini App (ZMP SDK)                    │
│              React / Vite / Client State                │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS
                           ▼
┌────────────────────────────────────────────────────────┐
│              Django REST Framework                      │
│              JWT Auth + Role-based Permission            │
├────────────────────────────────────────────────────────┤
│  Customer    Menu       Order      Shipping    Voucher  │
│  Service     Service    Service    Service     Service  │
│                         Payment Service                 │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  PostgreSQL          │    │  Redis + Celery           │
│  Source of Truth      │    │  Cache, Rate Limit, Async │
└──────────────────────┘    └──────────────────────────┘

External Services:
  - Zalo OpenAPI (xác thực, giải mã SĐT)
  - Zalo Notification Service / OA (thông báo đơn hàng)
  - Mapping / Routing API (tính khoảng cách)
  - VietQR (tạo mã QR thanh toán)
```

---

## 2. Frontend — Zalo Mini App

Xây dựng trên ZMP SDK. Chạy bên trong ứng dụng Zalo.

Chịu trách nhiệm:
- Hiển thị menu, giỏ hàng, checkout, theo dõi đơn, lịch sử.
- Quản lý giỏ hàng cục bộ (client state).
- Gọi Zalo SDK để xác thực và lấy SĐT.
- Hiển thị mã VietQR cho phương thức chuyển khoản.
- Mở khung chat OA cho CSKH.

Frontend không tự quyết định giá tiền, phí ship hay giảm giá. Mọi phép tính đều do backend thực hiện.

---

## 3. Backend — Django REST Framework

Chịu trách nhiệm toàn bộ logic nghiệp vụ:

| Service | Vai trò |
| :--- | :--- |
| Customer Service | Quản lý hồ sơ khách hàng, địa chỉ |
| Menu Service | Danh mục, món ăn, tùy chọn món |
| Order Service | Tạo đơn, snapshot dữ liệu, chuyển trạng thái |
| Shipping Service | Tính khoảng cách qua Routing API, áp biểu phí ship |
| Voucher Service | Validate mã, tính giảm giá, ghi nhận lượt dùng |
| Payment Service | Quản lý trạng thái thanh toán, tạo VietQR, xác nhận thủ công |

Nguyên tắc:
- Không tin dữ liệu tính toán từ frontend.
- Validate toàn bộ request trước khi xử lý.
- Sử dụng database transaction cho các thao tác tạo đơn.
- Sử dụng Idempotency-Key để chống trùng đơn.

---

## 4. Database — PostgreSQL

Source of truth cho toàn bộ hệ thống. Lưu trữ khách hàng, địa chỉ, thực đơn, đơn hàng, thanh toán, voucher, thông báo, audit log.

Nguyên tắc quan trọng: Đơn hàng phải snapshot cố định đơn giá, tên món và địa chỉ giao hàng tại thời điểm đặt.

---

## 5. Redis và Celery

- **Redis:** Cache thực đơn, rate limiting, session.
- **Celery:** Gửi thông báo ZNS/OA bất đồng bộ, các tác vụ nền không cần response ngay.

Không sử dụng Redis làm nơi lưu trữ chính. PostgreSQL là source of truth.

---

## 6. Dịch vụ bên ngoài

| Dịch vụ | Mục đích |
| :--- | :--- |
| Zalo OpenAPI | Xác thực người dùng, giải mã SĐT từ token |
| Zalo Notification Service | Gửi thông báo trạng thái đơn qua ZNS hoặc OA |
| Mapping / Routing API | Tính khoảng cách đường đi thực tế giữa shop và khách |
| VietQR | Tạo mã QR thanh toán chuẩn NAPAS chứa số tiền và mã đơn |

---

## 7. Bảo mật

- Xác thực bằng JWT. Phân quyền theo vai trò: Customer, Staff, Admin.
- Customer chỉ truy cập dữ liệu của chính mình.
- Rate limit các API nhạy cảm.
- Secret lưu trong environment variables, không commit vào source code.

---

## 8. Mở rộng trong tương lai

Kiến trúc được thiết kế để có thể thêm AI Assistant sau MVP. Các domain service đã được tách biệt, sẵn sàng để AI gọi qua tool calling (tra cứu đơn, thống kê, gợi ý món).

AI không được phép thay đổi đơn hàng hoặc thanh toán nếu không có xác thực và kiểm tra nghiệp vụ.
