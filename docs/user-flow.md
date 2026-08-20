# Food Order — User Flow

## 1. Customer mở ứng dụng

```text
Mở Zalo Mini App
        ↓
Zalo Authentication
        ↓
Lấy thông tin Customer
        ↓
Trang chủ / Menu
```

---

## 2. Xem Menu

```text
Trang chủ
   ↓
Danh mục
   ↓
Danh sách Product
   ↓
Product Detail
```

Customer có thể:

- Xem hình ảnh.
- Xem tên.
- Xem giá.
- Xem mô tả.
- Xem trạng thái.
- Chọn Option nếu có.
- Thêm vào Cart.

---

## 3. Add to Cart

```text
Product Detail
      ↓
Chọn Option (nếu có)
      ↓
Nhập số lượng
      ↓
Nhập Note (nếu cần)
      ↓
Add to Cart
```

Ví dụ Note:

```text
Ít cơm
Không hành
```

---

## 4. Cart

```text
Cart
├── Product 1
├── Product 2
└── Product 3
```

Customer có thể:

- Tăng số lượng.
- Giảm số lượng.
- Xóa sản phẩm.
- Xem subtotal.

Sau đó:

```text
Cart
 ↓
Checkout
```

---

## 5. Checkout

```text
Checkout
   │
   ├── Customer information
   │
   ├── Delivery address
   │
   ├── Delivery time
   │
   ├── Voucher
   │
   ├── Payment method
   │
   └── Order summary
```

---

## 6. Chọn địa chỉ

```text
Checkout
   ↓
Saved Addresses
   ├── Chọn địa chỉ cũ
   └── Thêm địa chỉ mới
```

Nếu thêm mới:

```text
Nhập địa chỉ
   ↓
Validate Delivery Area
   ↓
Tính Distance
   ↓
Tính Shipping Fee
```

Nếu ngoài khu vực:

```text
Không thể giao đến địa chỉ này
```

---

## 7. Chọn thời gian giao

Customer chọn:

```text
ASAP
```

hoặc:

```text
SCHEDULED
     ↓
Chọn thời gian
```

---

## 8. Chọn Payment

```text
Payment
├── COD
└── Bank Transfer
```

---

## 9. Áp dụng Voucher

```text
Nhập Voucher
      ↓
Validate Voucher
      ↓
Voucher hợp lệ?
   ┌──┴──┐
  Có     Không
   ↓       ↓
Discount  Error
```

---

## 10. Create Order

```text
Checkout
   ↓
Validate
   ├── Product availability
   ├── Address
   ├── Delivery area
   ├── Shipping fee
   ├── Voucher
   └── Payment
   ↓
Create Order
   ↓
PENDING_CONFIRMATION
```

Customer nhận thông báo:

> Đơn hàng đã được tiếp nhận.

---

## 11. Staff Confirm Order

```text
New Order
    ↓
Staff xem Order
    ↓
Gọi Customer
    ↓
Xác nhận:
    ├── Món
    ├── Số lượng
    ├── Địa chỉ
    ├── Thời gian giao
    └── Payment
```

Staff có thể:

```text
Edit Order
```

sau đó:

```text
CONFIRMED
```

hoặc:

```text
CANCELLED
```

---

## 12. Customer không nghe máy

```text
PENDING_CONFIRMATION
        ↓
Staff gọi
        ↓
Không nghe
        ↓
Order vẫn PENDING_CONFIRMATION
```

Staff có thể tiếp tục liên hệ.

Nếu không thể liên hệ:

```text
PENDING_CONFIRMATION
        ↓
CANCELLED
Reason:
CUSTOMER_UNREACHABLE
```

---

## 13. Chuẩn bị Order

```text
CONFIRMED
    ↓
PREPARING
    ↓
READY
```

Customer nhận notification khi trạng thái thay đổi.

---

## 14. Delivery

```text
READY
  ↓
Chọn Delivery Method
  ├── SELF_DELIVERY
  └── THIRD_PARTY
  ↓
DELIVERING
  ↓
COMPLETED
```

MVP không quản lý thông tin shipper.

---

## 15. Payment Flow — COD

```text
Order
 ↓
CONFIRMED
 ↓
PREPARING
 ↓
READY
 ↓
DELIVERING
 ↓
Customer nhận hàng
 ↓
Customer trả tiền
 ↓
Payment = PAID
 ↓
Order = COMPLETED
```

---

## 16. Payment Flow — Bank Transfer

```text
Customer chọn Bank Transfer
        ↓
Order được tạo
        ↓
Staff xác nhận Order
        ↓
Hiển thị / gửi thông tin chuyển khoản
        ↓
Customer chuyển tiền
        ↓
Staff kiểm tra
        ↓
Payment = PAID
```

Khách cũng có thể chuyển khoản trước khi Staff gọi xác nhận.

---

## 17. Order History

```text
Customer
   ↓
Order History
   ↓
Order Detail
```

Có thể xem:

- Sản phẩm.
- Số lượng.
- Giá.
- Voucher.
- Shipping fee.
- Total.
- Payment.
- Delivery.
- Status.
- Thời gian.

---

## 18. Notification Flow

```text
Order Created
    ↓
Thông báo:
"Đã nhận đơn"

CONFIRMED
    ↓
"Đơn đã được xác nhận"

PREPARING
    ↓
"Đang chuẩn bị món"

DELIVERING
    ↓
"Đơn đang được giao"

COMPLETED
    ↓
"Đơn đã hoàn thành"
```

Nếu Cancelled:

```text
CANCELLED
    ↓
"Đơn hàng đã bị hủy"
```
