# Food Order — API Specification

## 1. Quy ước

Base URL:

```text
/api/v1
```

Format:

```text
application/json
```

Authentication:

```text
Bearer Token
```

Các API cần authorization phải kiểm tra Role.

---

## 2. Authentication

### POST /auth/zalo

Đăng nhập bằng Zalo.

Request:

```json
{
  "zalo_token": "..."
}
```

Response:

```json
{
  "access_token": "...",
  "customer": {
    "id": 1,
    "name": "...",
    "phone": "..."
  }
}
```

---

## 3. Customer

### GET /customers/me

Lấy thông tin Customer hiện tại.

### PATCH /customers/me

Cập nhật:

```json
{
  "name": "...",
  "phone": "..."
}
```

---

## 4. Address

### GET /customers/me/addresses

Lấy danh sách địa chỉ.

### POST /customers/me/addresses

Tạo địa chỉ.

```json
{
  "label": "Nhà",
  "recipient_name": "...",
  "phone": "...",
  "address_text": "...",
  "latitude": 10.123,
  "longitude": 106.123
}
```

### PATCH /customers/me/addresses/{id}

Cập nhật địa chỉ.

### DELETE /customers/me/addresses/{id}

Xóa địa chỉ.

---

## 5. Categories

### GET /categories

Lấy danh sách Category đang hoạt động.

---

## 6. Products

### GET /products

Query:

```text
category_id
status
search
```

Ví dụ:

```text
GET /products?category_id=1
```

### GET /products/{id}

Lấy chi tiết Product.

Response có:

- Product information.
- Price.
- Status.
- Options nếu có.

---

## 7. Cart

MVP có thể xử lý Cart phía Client.

Backend không bắt buộc lưu persistent Cart.

Tuy nhiên trước khi tạo Order, Backend phải validate lại:

- Product.
- Price.
- Availability.
- Option.
- Quantity.

---

## 8. Calculate Checkout

### POST /checkout/preview

Dùng để tính trước Order.

Request:

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "options": [],
      "note": "Ít cơm"
    }
  ],
  "address_id": 10,
  "delivery_type": "ASAP",
  "voucher_code": "ZALO10",
  "payment_method": "COD"
}
```

Backend trả:

```json
{
  "subtotal": 70000,
  "discount": 10000,
  "shipping_fee": 15000,
  "total": 75000,
  "distance_km": 3.4
}
```

---

## 9. Create Order

### POST /orders

Request tương tự Checkout Preview.

Header:

```text
Idempotency-Key: <unique-key>
```

Backend:

1. Validate Customer.
2. Validate Product.
3. Validate Option.
4. Validate Product availability.
5. Validate Address.
6. Validate Delivery Area.
7. Calculate Distance.
8. Calculate Shipping Fee.
9. Validate Voucher.
10. Calculate Total.
11. Create Order.
12. Create Order Items.
13. Create Payment.
14. Create Notification.

Response:

```json
{
  "id": 1001,
  "order_code": "FO1001",
  "status": "PENDING_CONFIRMATION",
  "total_amount": 75000
}
```

---

## 10. Get My Orders

### GET /orders

Customer xem lịch sử đơn.

Query:

```text
status
page
limit
```

---

## 11. Get Order Detail

### GET /orders/{id}

Customer chỉ được xem Order của chính mình.

Response:

```json
{
  "id": 1001,
  "order_code": "FO1001",
  "status": "CONFIRMED",
  "items": [],
  "subtotal": 70000,
  "discount": 10000,
  "shipping_fee": 15000,
  "total_amount": 75000,
  "payment": {},
  "delivery": {}
}
```

---

## 12. Staff — Orders

### GET /admin/orders

Staff xem danh sách Order.

Query:

```text
status
date
search
page
limit
```

---

## 13. Staff Confirm Order

### POST /admin/orders/{id}/confirm

Staff xác nhận Order.

Có thể gửi dữ liệu đã chỉnh sửa:

```json
{
  "items": [],
  "delivery_address": "...",
  "scheduled_delivery_at": null
}
```

Order:

```text
PENDING_CONFIRMATION
        ↓
CONFIRMED
```

---

## 14. Staff Cancel Order

### POST /admin/orders/{id}/cancel

Request:

```json
{
  "reason": "CUSTOMER_UNREACHABLE"
}
```

Order:

```text
PENDING_CONFIRMATION
        ↓
CANCELLED
```

---

## 15. Staff Update Order Status

### POST /admin/orders/{id}/status

Request:

```json
{
  "status": "PREPARING"
}
```

Allowed transitions phải được Backend kiểm tra.

Không cho phép Client tự gửi bất kỳ status nào.

---

## 16. Payment

### GET /orders/{id}/payment

Xem Payment.

### POST /admin/orders/{id}/payment/verify

Staff xác nhận chuyển khoản.

Request:

```json
{
  "amount": 75000,
  "transaction_reference": "ABC123"
}
```

Response:

```json
{
  "status": "PAID"
}
```

---

## 17. Voucher

### POST /vouchers/validate

Request:

```json
{
  "code": "ZALO10",
  "order_amount": 120000
}
```

Response:

```json
{
  "valid": true,
  "discount": 10000
}
```

Nếu không hợp lệ:

```json
{
  "valid": false,
  "reason": "VOUCHER_EXPIRED"
}
```

---

## 18. Admin — Voucher

### GET /admin/vouchers

Danh sách Voucher.

### POST /admin/vouchers

Tạo Voucher.

### PATCH /admin/vouchers/{id}

Cập nhật Voucher.

### DELETE /admin/vouchers/{id}

Vô hiệu hóa Voucher.

Không nên xóa vật lý Voucher đã được sử dụng trong Order.

---

## 19. Admin — Category

### GET /admin/categories

### POST /admin/categories

### PATCH /admin/categories/{id}

### DELETE /admin/categories/{id}

---

## 20. Admin — Product

### GET /admin/products

### POST /admin/products

### PATCH /admin/products/{id}

### POST /admin/products/{id}/out-of-stock

Chuyển Product thành:

```text
OUT_OF_STOCK
```

### POST /admin/products/{id}/available

Chuyển Product thành:

```text
AVAILABLE
```

---

## 21. Notification

### GET /notifications

Customer xem notification.

### POST /notifications/{id}/read

Đánh dấu đã đọc.

---

## 22. Error Response

Tất cả API nên sử dụng format thống nhất:

```json
{
  "error": {
    "code": "PRODUCT_OUT_OF_STOCK",
    "message": "Sản phẩm hiện đã hết món."
  }
}
```

Một số error code:

```text
PRODUCT_NOT_FOUND
PRODUCT_OUT_OF_STOCK
INVALID_OPTION
INVALID_ADDRESS
OUTSIDE_DELIVERY_AREA
VOUCHER_INVALID
VOUCHER_EXPIRED
VOUCHER_LIMIT_REACHED
ORDER_NOT_FOUND
ORDER_CANNOT_BE_CANCELLED
INVALID_ORDER_STATUS
PAYMENT_NOT_FOUND
PAYMENT_ALREADY_PAID
```

---

## 23. Authorization

Customer:

```text
GET /orders
GET /orders/{id}
```

chỉ được xem dữ liệu của chính mình.

Staff/Admin:

```text
/admin/*
```

được phép xử lý dữ liệu quản trị theo Role.

Backend không dựa vào dữ liệu từ Frontend để quyết định quyền.

---

## 24. API Order State Validation

Backend phải kiểm tra transition.

Ví dụ hợp lệ:

```text
PENDING_CONFIRMATION → CONFIRMED
CONFIRMED → PREPARING
PREPARING → READY
READY → DELIVERING
DELIVERING → COMPLETED
```

Ví dụ không hợp lệ:

```text
COMPLETED → PREPARING
CANCELLED → CONFIRMED
READY → PENDING_CONFIRMATION
```

API phải trả lỗi nếu transition không hợp lệ.
