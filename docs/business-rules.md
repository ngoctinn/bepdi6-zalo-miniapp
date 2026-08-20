# Food Order — Business Rules

## 1. Product

### BR-PRODUCT-001

Một Product thuộc một Category.

### BR-PRODUCT-002

Product có thể có hoặc không có Option.

### BR-PRODUCT-003

Product có thể ở trạng thái:

- AVAILABLE
- OUT_OF_STOCK
- INACTIVE

### BR-PRODUCT-004

Customer không thể đặt Product ở trạng thái OUT_OF_STOCK hoặc INACTIVE.

### BR-PRODUCT-005

Giá Product có thể thay đổi theo thời gian.

Giá của OrderItem phải được lưu tại thời điểm tạo/điều chỉnh Order.

Ví dụ:

```text
Ngày 1:
Cơm sườn = 35.000đ

Order #001:
Cơm sườn = 35.000đ

Ngày 2:
Cơm sườn = 40.000đ

Order #001 vẫn giữ 35.000đ.
```

---

## 2. Product Option

### BR-OPTION-001

Product không bắt buộc phải có Option.

### BR-OPTION-002

Nếu Option là bắt buộc, Customer phải chọn Option trước khi thêm Product vào Cart.

### BR-OPTION-003

Option được lưu trong OrderItem để đảm bảo Order cũ không bị ảnh hưởng khi menu thay đổi.

---

## 3. Combo

### BR-COMBO-001

Combo được xem là một Product.

### BR-COMBO-002

Customer không cần quản lý cấu trúc bên trong Combo.

Ví dụ:

```text
Combo 3 hũ mắm chưng
```

được xem là một Product.

### BR-COMBO-003

Số lượng trong Cart là số Combo khách mua.

---

## 4. Customer

### BR-CUSTOMER-001

Customer được nhận diện thông qua tài khoản/Zalo.

### BR-CUSTOMER-002

Customer có thể cập nhật:

- Tên.
- Số điện thoại.

### BR-CUSTOMER-003

Customer có thể lưu nhiều địa chỉ.

### BR-CUSTOMER-004

Customer chỉ được xem và sử dụng địa chỉ của chính mình.

---

## 5. Cart

### BR-CART-001

Cart chỉ thuộc về Customer hiện tại.

### BR-CART-002

Cart không bắt buộc phải được lưu persistent khi Customer đóng app.

### BR-CART-003

Product OUT_OF_STOCK không thể được thêm vào Cart.

---

## 6. Order

### BR-ORDER-001

Order được tạo sau khi Customer hoàn tất Checkout.

### BR-ORDER-002

Order mới có trạng thái PENDING_CONFIRMATION.

### BR-ORDER-003

Staff phải liên hệ Customer để xác nhận đơn.

### BR-ORDER-004

Staff có thể chỉnh sửa Order trước khi Confirm.

### BR-ORDER-005

Sau khi Order được CONFIRMED, Customer không thể tự hủy Order.

### BR-ORDER-006

Nếu Customer không nghe máy, Order vẫn giữ PENDING_CONFIRMATION.

### BR-ORDER-007

Staff có thể hủy Order nếu không thể liên hệ Customer.

### BR-ORDER-008

Order đã COMPLETED không thể chuyển ngược về trạng thái PREPARING.

### BR-ORDER-009

Mọi Order phải lưu giá tại thời điểm Order được tạo/xác nhận.

---

## 7. Order Status

Order có lifecycle:

```text
PENDING_CONFIRMATION
        ↓
    CONFIRMED
        ↓
    PREPARING
        ↓
      READY
        ↓
   DELIVERING
        ↓
    COMPLETED
```

Các trạng thái hủy:

```text
PENDING_CONFIRMATION → CANCELLED
CONFIRMED → CANCELLED
PREPARING → CANCELLED
```

Việc hủy sau CONFIRMED/PREPARING chỉ do Staff/Admin thực hiện theo chính sách của shop.

---

## 8. Delivery

### BR-DELIVERY-001

Customer chỉ được đặt hàng nếu địa chỉ nằm trong khu vực giao hàng.

### BR-DELIVERY-002

Khoảng cách được tính từ địa điểm của Shop đến địa chỉ giao hàng.

### BR-DELIVERY-003

Khoảng cách được lấy từ Mapping/Routing API.

### BR-DELIVERY-004

Shipping fee được tính dựa trên Business Rule của Shop.

Ví dụ:

```text
0–2 km     → 10.000đ
2–5 km     → 15.000đ
5–7 km     → 20.000đ
> 7 km     → Không giao
```

Đây chỉ là ví dụ; bảng giá thật sẽ được cấu hình theo Shop.

### BR-DELIVERY-005

Customer có thể chọn:

- ASAP.
- SCHEDULED.

### BR-DELIVERY-006

Shop có thể tự giao hoặc sử dụng bên thứ ba.

### BR-DELIVERY-007

MVP không quản lý thông tin Shipper.

---

## 9. Payment

### BR-PAYMENT-001

Order hỗ trợ:

- COD.
- BANK_TRANSFER.

### BR-PAYMENT-002

Payment có lifecycle riêng với Order.

### BR-PAYMENT-003

COD có thể ở trạng thái UNPAID cho đến khi giao hàng.

### BR-PAYMENT-004

Bank Transfer có thể được thanh toán trước hoặc sau khi Staff xác nhận Order.

### BR-PAYMENT-005

Bank Transfer được Staff xác nhận thủ công trong MVP.

### BR-PAYMENT-006

Không được đánh dấu PAID nếu số tiền xác nhận không phù hợp với số tiền cần thanh toán.

---

## 10. Voucher

### BR-VOUCHER-001

Voucher phải còn hiệu lực tại thời điểm sử dụng.

### BR-VOUCHER-002

Order phải đạt minimum order value nếu Voucher yêu cầu.

### BR-VOUCHER-003

Một Customer không được vượt quá usage_per_customer.

### BR-VOUCHER-004

Voucher không thể được sử dụng vượt quá usage_limit.

### BR-VOUCHER-005

Voucher không được áp dụng nếu đã hết hạn.

### BR-VOUCHER-006

Discount không được lớn hơn giá trị Order theo business rule của Voucher.

---

## 11. Notification

### BR-NOTIFICATION-001

Customer được thông báo khi Order thay đổi trạng thái quan trọng.

### BR-NOTIFICATION-002

Notification phải gắn với đúng Customer và Order.

---

## 12. Authorization

### BR-AUTH-001

Customer chỉ xem được Order của chính mình.

### BR-AUTH-002

Customer không thể thay đổi trạng thái Order.

### BR-AUTH-003

Staff có thể xử lý Order.

### BR-AUTH-004

Chỉ Staff/Admin được quản lý Product và Voucher.

### BR-AUTH-005

Chỉ Staff/Admin được xác nhận Bank Transfer.
