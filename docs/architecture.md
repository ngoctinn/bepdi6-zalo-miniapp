# Food Order — Architecture

## 1. Mục tiêu

Hệ thống được thiết kế theo hướng:

- Đơn giản.
- Dễ phát triển.
- Dễ mở rộng.
- Tách biệt Business Logic và Infrastructure.
- Có thể thêm AI trong tương lai.

---

## 2. Kiến trúc tổng thể

```text
                    ZALO MINI APP
                          │
                          ▼
                    Django REST API
                          │
          ┌───────────────┼────────────────┐
          │               │                │
          ▼               ▼                ▼
       Customer         Order            Menu
       Service         Service          Service
          │               │                │
          └───────────────┼────────────────┘
                          │
                          ▼
                     PostgreSQL
                          │
                    ┌─────┴─────┐
                    ▼           ▼
                  Redis       Celery
                    │
                    ▼
              Background Jobs

External Services
────────────────────────────
Zalo
Mapping / Routing API
Bank / Payment
Notification
Third-party Delivery
```

---

## 3. Frontend

Frontend là Zalo Mini App.

Chịu trách nhiệm:

- Hiển thị menu.
- Cart.
- Checkout.
- Customer profile.
- Address.
- Order tracking.
- Order history.
- Notification UI.

Frontend không tự quyết định business rule quan trọng.

Ví dụ:

Không được tin:

```text
Frontend:
shipping_fee = 0
```

Backend phải tự tính lại.

---

## 4. Backend

Backend sử dụng:

- Django.
- Django REST Framework.

Backend chịu trách nhiệm:

- Authentication.
- Authorization.
- Product.
- Category.
- Option.
- Customer.
- Address.
- Cart validation.
- Order.
- Payment.
- Voucher.
- Delivery.
- Notification.

---

## 5. Database

Sử dụng PostgreSQL.

PostgreSQL lưu:

- Customer.
- Address.
- Category.
- Product.
- Product Option.
- Order.
- Order Item.
- Payment.
- Voucher.
- Notification.
- Audit Log.

---

## 6. Redis

Redis dùng cho:

- Cache.
- Temporary data.
- Rate limiting nếu cần.
- Background job support.
- Celery broker/result backend nếu lựa chọn Redis.

Không sử dụng Redis làm nguồn dữ liệu chính của Order.

PostgreSQL là source of truth.

---

## 7. Background Jobs

Celery có thể xử lý:

- Gửi notification.
- Gửi thông báo Order.
- Xử lý tác vụ không cần response ngay.
- Đồng bộ external service.
- Các tác vụ định kỳ.

Không đưa các business operation quan trọng vào background job nếu Customer cần kết quả ngay.

---

## 8. Mapping / Routing API

Dùng để tính khoảng cách.

Flow:

```text
Customer Address
      ↓
Geocoding
      ↓
Latitude / Longitude
      ↓
Routing API
      ↓
Distance
      ↓
Shipping Rule
      ↓
Shipping Fee
```

Backend là nơi quyết định shipping fee.

External API chỉ cung cấp dữ liệu khoảng cách.

---

## 9. Order Service

Order là domain quan trọng nhất.

Order Service xử lý:

- Create Order.
- Validate Product.
- Snapshot price.
- Calculate subtotal.
- Calculate discount.
- Calculate shipping fee.
- Calculate total.
- Confirm Order.
- Cancel Order.
- Change Order status.

---

## 10. Payment Service

Payment tách khỏi Order.

```text
Order
  │
  └── Payment
```

Payment Service xử lý:

- COD.
- Bank Transfer.
- Payment status.
- Manual verification.
- Refund nếu cần.

---

## 11. Voucher Service

Voucher Service chịu trách nhiệm:

- Validate code.
- Kiểm tra thời gian.
- Kiểm tra minimum order.
- Kiểm tra usage limit.
- Tính discount.
- Ghi nhận usage.

Không để frontend tự tính discount.

---

## 12. Notification

Notification Service nhận event:

```text
OrderCreated
OrderConfirmed
OrderPreparing
OrderDelivering
OrderCompleted
OrderCancelled
```

Sau đó gửi thông báo cho Customer.

---

## 13. External Delivery

MVP không xây Delivery Management.

Hệ thống chỉ lưu:

```text
SELF_DELIVERY
THIRD_PARTY
```

Nếu dùng bên thứ ba, việc xử lý shipper và delivery failure nằm ngoài hệ thống MVP.

---

## 14. Security

Các nguyên tắc:

- Authentication ở Backend.
- Authorization theo Role.
- Customer chỉ truy cập dữ liệu của mình.
- Không tin dữ liệu tính toán từ Frontend.
- Validate toàn bộ request.
- Rate limit các API nhạy cảm.
- Không lưu secret trong source code.
- Secret dùng environment variables.

---

## 15. Transaction

Các thao tác quan trọng cần transaction.

Ví dụ Create Order:

```text
Validate Cart
    ↓
Validate Product
    ↓
Calculate Price
    ↓
Apply Voucher
    ↓
Calculate Shipping
    ↓
Create Order
    ↓
Create Order Items
    ↓
Create Payment
```

Nếu một bước quan trọng thất bại, transaction phải rollback.

---

## 16. Idempotency

Create Order cần chống duplicate request.

Ví dụ Customer bấm:

```text
ĐẶT HÀNG
```

hai lần do mạng chậm.

Backend không được tạo hai Order giống nhau.

Có thể sử dụng:

```text
Idempotency-Key
```

cho Create Order.

---

## 17. Audit Log

Ghi nhận các thao tác quan trọng:

```text
Staff A
2026-08-20 10:32
Order #1001
PENDING_CONFIRMATION → CONFIRMED
```

Hoặc:

```text
Staff A
Product "Cơm sườn"
AVAILABLE → OUT_OF_STOCK
```

---

## 18. AI — Future Architecture

AI không nằm trong MVP core.

Sau này có thể thêm:

```text
                 AI Assistant
                       │
                       ▼
                 AI Orchestrator
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
        Order Tool  Sales Tool  Product Tool
             │         │         │
             └─────────┼─────────┘
                       ▼
                   PostgreSQL
```

AI có thể hỗ trợ:

- Tra cứu đơn.
- Phân tích doanh thu.
- Tìm sản phẩm bán chạy.
- Trả lời câu hỏi nghiệp vụ.
- Tìm chính sách bằng RAG.

AI không được tự ý thay đổi Order hoặc Payment nếu không có authorization/business validation.
