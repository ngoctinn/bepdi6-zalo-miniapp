# ADR 001: Sử dụng Django và Django REST Framework cho Backend

## 1. Trạng thái (Status)
Đã chấp thuận (Accepted)

## 2. Ngữ cảnh (Context)
Hệ thống Food Order yêu cầu xây dựng backend REST API ổn định, bảo mật, hỗ trợ xử lý luồng đặt hàng, giỏ hàng, tính toán phí giao hàng, voucher, và quản lý nghiệp vụ cho nhân viên/admin. Hệ thống cần phát triển nhanh (MVP), dễ mở rộng và có sẵn hệ thống ORM, migration mạnh mẽ, cũng như hệ thống admin tích hợp sẵn cho quản trị viên.

## 3. Quyết định (Decision)
Chọn **Python** kết hợp với **Django** và **Django REST Framework (DRF)** làm nền tảng backend chính cho hệ thống:
- Sử dụng Django ORM để làm việc với cơ sở dữ liệu PostgreSQL và quản lý migration.
- Sử dụng Django REST Framework (DRF) để thiết kế các endpoint API chuẩn RESTful (`/api/v1/...`).
- Sử dụng Django Admin & Role-based authentication cho các nghiệp vụ quản trị nhanh.
- Kết hợp với Celery / Redis để xử lý các background jobs (gửi notification, tích hợp external services).

## 4. Hệ quả (Consequences)
- **Tích cực**:
  - Tốc độ phát triển nhanh, hệ sinh thái phong phú.
  - Xử lý quan hệ dữ liệu phức tạp (Order, OrderItem, Snapshot, Voucher) an toàn với Django Transactions.
  - Hỗ trợ tốt cho việc tích hợp AI / Data analysis trong tương lai (Python ecosystem).
- **Cần lưu ý**:
  - Cần tối ưu hóa query (`select_related`, `prefetch_related`) để tránh N+1 query trong Django ORM.
  - Đảm bảo cơ chế caching (Redis) khi lưu lượng truy cập xem menu tăng cao.
