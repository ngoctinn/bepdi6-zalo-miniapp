# ADR 002: Sử dụng PostgreSQL làm Cơ sở Dữ liệu Chính (Primary Relational Database)

## 1. Trạng thái (Status)
Đã chấp thuận (Accepted)

## 2. Ngữ cảnh (Context)
Dữ liệu của hệ thống Food Order có cấu trúc quan hệ chặt chẽ (Customer -> Address, Order -> OrderItem -> OrderItemOption, Payment, VoucherUsage). Đơn hàng và thanh toán đòi hỏi tính toàn vẹn dữ liệu (ACID), hỗ trợ snapshot dữ liệu (giá, địa chỉ tại thời điểm đặt đơn), đảm bảo không xảy ra race condition khi áp dụng voucher hoặc trùng đơn hàng.

## 3. Quyết định (Decision)
Chọn **PostgreSQL** làm cơ sở dữ liệu quan hệ chính (Source of Truth):
- Sử dụng các tính năng quan hệ mạnh mẽ, khóa ngoại (Foreign Keys), ràng buộc toàn vẹn (Constraints), và Transactions (ACID).
- Hỗ trợ lưu trữ tọa độ địa lý, thông tin snapshot JSON nếu cần, và lịch sử audit log.
- Không sử dụng Redis để lưu dữ liệu đơn hàng lâu dài; Redis chỉ đóng vai trò Cache và Celery Broker.

## 4. Hệ quả (Consequences)
- **Tích cực**:
  - Dữ liệu luôn nhất quán, đáng tin cậy, không bị mất mát dữ liệu tài chính/đơn hàng.
  - Hỗ trợ tốt các transaction phức tạp (tạo đơn, trừ số lượng voucher, snapshot giá).
  - Tương thích hoàn hảo với Django ORM.
- **Cần lưu ý**:
  - Cần đánh index hợp lý trên các trường thường xuyên query (`customer_id`, `order_code`, `status`, `created_at`).
  - Thiết lập backup và replication khi hệ thống bước vào giai đoạn production thực tế.
