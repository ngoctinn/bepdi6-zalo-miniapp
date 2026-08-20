# API Specification

## 1. Quy ước

- **Base URL:** /api/v1
- **Format:** application/json
- **Xác thực:** Bearer Token (JWT)

**Response thành công:**
```json
{
  "success": true,
  "data": {}
}
```

**Response lỗi:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi"
  }
}
```

---

## 2. Xác thực

### POST /auth/zalo

Đăng nhập bằng Zalo và đồng bộ SĐT.

**Request:**
```json
{
  "zalo_token": "...",
  "phone_token": "..."
}
```

**Response:**
```json
{
  "access_token": "jwt_token",
  "customer": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "phone": "0987654321"
  }
}
```

---

## 3. Khách hàng và Địa chỉ

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | /customers/me | Lấy thông tin cá nhân |
| PATCH | /customers/me | Cập nhật tên, SĐT |
| GET | /customers/me/addresses | Danh sách địa chỉ |
| POST | /customers/me/addresses | Thêm địa chỉ |
| PATCH | /customers/me/addresses/{id} | Sửa địa chỉ |
| DELETE | /customers/me/addresses/{id} | Xóa địa chỉ |

**Body tạo địa chỉ:**
```json
{
  "label": "Nhà",
  "recipient_name": "Nguyễn Văn A",
  "phone": "0987654321",
  "address_text": "123 Nguyễn Trãi, Q.1, TP.HCM",
  "latitude": 10.7721,
  "longitude": 106.6983,
  "is_default": true
}
```

---

## 4. Thực đơn

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | /categories | Danh sách danh mục đang hoạt động |
| GET | /products | Danh sách món. Query: category_id, status, search |
| GET | /products/{id} | Chi tiết món kèm tùy chọn |

---

## 5. Checkout

### POST /checkout/preview

Tính trước giá trị đơn hàng, khoảng cách và phí ship.

**Request:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "option_ids": [10, 12],
      "note": "Ít cay"
    }
  ],
  "address_id": 5,
  "delivery_type": "ASAP",
  "voucher_code": "GIAM20K",
  "payment_method": "BANK_TRANSFER"
}
```

**Response:**
```json
{
  "subtotal": 90000,
  "distance_km": 2.5,
  "shipping_fee": 15000,
  "discount": 20000,
  "total_amount": 85000,
  "is_deliverable": true
}
```

---

## 6. Đơn hàng

### POST /orders

Tạo đơn hàng. Gửi kèm header Idempotency-Key.

Request body tương tự checkout preview, bổ sung note và scheduled_delivery_at.

**Response:**
```json
{
  "id": 101,
  "order_code": "FO2408200001",
  "status": "PENDING_CONFIRMATION",
  "total_amount": 85000,
  "payment": {
    "method": "BANK_TRANSFER",
    "status": "UNPAID",
    "qr_code_url": "https://img.vietqr.io/..."
  }
}
```

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | /orders | Lịch sử đơn. Query: status, page, limit |
| GET | /orders/{id} | Chi tiết đơn hàng |
| GET | /orders/{id}/payment | Thông tin thanh toán |

---

## 7. Voucher

### POST /vouchers/validate

**Request:**
```json
{
  "code": "GIAM20K",
  "order_amount": 120000
}
```

**Response (hợp lệ):**
```json
{
  "valid": true,
  "discount": 20000
}
```

**Response (không hợp lệ):**
```json
{
  "valid": false,
  "reason": "VOUCHER_EXPIRED"
}
```

---

## 8. Thông báo

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | /notifications | Danh sách thông báo |
| POST | /notifications/{id}/read | Đánh dấu đã đọc |

---

## 9. Quản trị (Staff / Admin)

### Đơn hàng

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | /admin/orders | Danh sách đơn. Query: status, date, search, page |
| POST | /admin/orders/{id}/confirm | Xác nhận đơn (có thể gửi kèm dữ liệu chỉnh sửa) |
| POST | /admin/orders/{id}/cancel | Hủy đơn (gửi kèm reason) |
| POST | /admin/orders/{id}/status | Cập nhật trạng thái (backend kiểm tra transition) |
| POST | /admin/orders/{id}/payment/verify | Xác nhận thanh toán chuyển khoản |

### Thực đơn

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET/POST/PATCH/DELETE | /admin/categories[/{id}] | CRUD danh mục |
| GET/POST/PATCH | /admin/products[/{id}] | CRUD món ăn |
| POST | /admin/products/{id}/toggle-status | Bật/tắt trạng thái món |

### Voucher

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET/POST/PATCH/DELETE | /admin/vouchers[/{id}] | CRUD voucher |

---

## 10. Mã lỗi

| Mã lỗi | Mô tả |
| :--- | :--- |
| UNAUTHORIZED | Token không hợp lệ hoặc hết hạn |
| FORBIDDEN | Không có quyền truy cập |
| PRODUCT_NOT_FOUND | Không tìm thấy món |
| PRODUCT_OUT_OF_STOCK | Món đã hết |
| INVALID_OPTION | Tùy chọn không hợp lệ |
| OUT_OF_DELIVERY_RADIUS | Ngoài bán kính giao hàng |
| VOUCHER_INVALID | Mã giảm giá không hợp lệ |
| VOUCHER_EXPIRED | Mã giảm giá hết hạn |
| VOUCHER_USAGE_LIMIT | Hết lượt sử dụng |
| INVALID_STATE_TRANSITION | Chuyển trạng thái đơn không hợp lệ |
| PAYMENT_AMOUNT_MISMATCH | Số tiền xác nhận không khớp tổng đơn |
| DUPLICATE_ORDER | Idempotency-Key trùng, đơn đã được tạo |
