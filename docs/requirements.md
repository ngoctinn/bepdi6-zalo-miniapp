# Food Order — Requirements

## 1. Tổng quan

Food Order là nền tảng đặt đồ ăn online dành cho khách hàng trong khu vực giao hàng của cửa hàng.

Khách hàng sử dụng Zalo Mini App để:

- Xem menu.
- Chọn sản phẩm.
- Thêm sản phẩm vào giỏ hàng.
- Chọn địa chỉ giao hàng.
- Chọn thời gian giao hàng.
- Chọn phương thức thanh toán.
- Áp dụng voucher.
- Đặt hàng.
- Theo dõi trạng thái đơn.
- Xem lịch sử đơn hàng.

Nhân viên/cửa hàng sử dụng hệ thống để:

- Quản lý danh mục và sản phẩm.
- Bật/tắt trạng thái bán hàng.
- Tiếp nhận đơn.
- Gọi điện xác nhận đơn.
- Cập nhật trạng thái đơn.
- Quản lý voucher.
- Xem thông tin khách hàng.

---

## 2. Mục tiêu

### Mục tiêu chính

Xây dựng một hệ thống giúp cửa hàng:

1. Nhận đơn online trực tiếp từ khách hàng.
2. Giảm phụ thuộc vào nền tảng trung gian như GrabFood.
3. Quản lý đơn hàng tập trung.
4. Cho phép khách hàng đặt lại dễ dàng.
5. Hỗ trợ cả COD và chuyển khoản.
6. Hỗ trợ giao ngay hoặc đặt lịch giao.
7. Sử dụng voucher để khuyến khích khách đặt hàng qua Zalo.

### Không nằm trong mục tiêu MVP

- Quản lý bàn.
- POS.
- Quản lý bếp.
- Quản lý shipper.
- Quản lý kho/nguyên liệu.
- Đơn hàng doanh nghiệp.
- Loyalty.
- Đánh giá sản phẩm.
- Dashboard phân tích nâng cao.
- Multi-branch.

---

## 3. Actors

### Customer

Khách hàng đặt đồ ăn.

Có thể:

- Xem menu.
- Xem sản phẩm.
- Thêm sản phẩm vào giỏ.
- Checkout.
- Chọn địa chỉ.
- Chọn thời gian giao.
- Chọn phương thức thanh toán.
- Sử dụng voucher.
- Theo dõi đơn.
- Xem lịch sử đơn.

### Staff

Nhân viên xử lý đơn hàng.

Có thể:

- Xem đơn mới.
- Gọi khách xác nhận.
- Chỉnh sửa đơn trước khi xác nhận.
- Xác nhận hoặc hủy đơn.
- Cập nhật trạng thái đơn.
- Kiểm tra chuyển khoản.
- Quản lý sản phẩm.
- Quản lý voucher.

### Admin

Quản lý hệ thống.

Có quyền của Staff và các quyền quản lý dữ liệu hệ thống.

---

## 4. Menu Requirements

### 4.1 Category

Hệ thống phải hỗ trợ danh mục sản phẩm.

Ví dụ:

- Món cơm
- Bún
- Món thêm
- Mắm
- Combo

Một Category có nhiều Product.

---

### 4.2 Product

Mỗi sản phẩm có tối thiểu:

- Tên.
- Mô tả.
- Hình ảnh.
- Giá.
- Danh mục.
- Trạng thái.
- Loại sản phẩm.

Product type:

- REGULAR
- COMBO

Ví dụ:

- Cơm sườn.
- Bún thịt nướng.
- Cơm thêm.
- Rau thêm.
- Mắm chưng.
- Combo 3 hũ mắm chưng.

---

### 4.3 Product Option

Product có thể có hoặc không có Option.

Option không bắt buộc.

Ví dụ:

```text
Combo cơm + nước
    → Chọn nước
        → Coca
        → Pepsi
        → Trà
```

Không phải Product nào cũng có Option.

---

### 4.4 Combo

Combo được xem như một Product.

Ví dụ:

```text
Combo 3 hũ mắm chưng
Giá: 100.000đ
```

Khách không cần quan tâm đến cấu trúc bên trong combo.

Combo 3 hũ mắm chưng là một sản phẩm duy nhất trong giỏ hàng.

---

### 4.5 Product Status

Sản phẩm có thể:

- AVAILABLE: đang bán.
- OUT_OF_STOCK: hết món.
- INACTIVE: không hiển thị/bán.

Nhân viên có thể chủ động chuyển sản phẩm sang OUT_OF_STOCK.

---

## 5. Customer Requirements

Hệ thống lấy thông tin cơ bản từ Zalo.

Khách có thể điều chỉnh:

- Tên.
- Số điện thoại.

Khách có thể lưu nhiều địa chỉ giao hàng.

Ví dụ:

```text
Nhà
Địa chỉ khác
```

Khi checkout, khách có thể:

- Chọn địa chỉ đã lưu.
- Thêm địa chỉ mới.

---

## 6. Cart Requirements

Customer có thể:

- Thêm Product.
- Xóa Product.
- Tăng/giảm số lượng.
- Xem subtotal.
- Nhập ghi chú cho sản phẩm/đơn hàng.

Cart không cần lưu lâu dài.

Nếu khách đóng app, hệ thống không bắt buộc khôi phục Cart.

---

## 7. Checkout Requirements

Checkout phải cho phép:

- Chọn địa chỉ.
- Kiểm tra khu vực giao hàng.
- Tính khoảng cách.
- Tính phí giao hàng.
- Chọn thời gian giao.
- Chọn phương thức thanh toán.
- Nhập voucher.
- Xem tổng tiền.

Thời gian giao:

```text
ASAP
SCHEDULED
```

---

## 8. Delivery Requirements

Hệ thống phải giới hạn khu vực giao hàng.

Khoảng cách được tính bằng API bản đồ/routing.

Ví dụ:

```text
Shop
 ↓
Mapping API
 ↓
Distance
 ↓
Shipping Rule
 ↓
Shipping Fee
```

Shop có thể:

- Tự giao.
- Sử dụng đơn vị giao hàng thứ ba khi cần.

Hệ thống không quản lý thông tin shipper.

---

## 9. Order Requirements

Khi Customer đặt hàng:

```text
Cart
 ↓
Checkout
 ↓
Validate
 ↓
Create Order
 ↓
PENDING_CONFIRMATION
```

Nhân viên liên hệ Customer để xác nhận.

Nhân viên có thể:

- Xác nhận.
- Hủy.
- Chỉnh sửa đơn trước khi xác nhận.

Sau khi Confirmed:

> Customer không được tự hủy đơn.

---

## 10. Payment Requirements

Hỗ trợ:

- COD.
- BANK_TRANSFER.

Payment được quản lý độc lập với Order.

Payment status:

- UNPAID.
- PENDING.
- PAID.
- FAILED.
- REFUNDED.

Chuyển khoản có thể được thực hiện trước hoặc sau khi nhân viên xác nhận.

MVP cho phép nhân viên kiểm tra và xác nhận chuyển khoản thủ công.

---

## 11. Promotion Requirements

MVP sử dụng Voucher.

Voucher có thể:

- Giảm số tiền cố định.
- Giảm theo phần trăm.
- Có thời gian hiệu lực.
- Có giá trị đơn tối thiểu.
- Có giới hạn số lần sử dụng.
- Có giới hạn số lần sử dụng trên mỗi khách hàng.

Mục tiêu chính của Voucher là khuyến khích khách hàng đặt hàng trực tiếp qua Zalo.

---

## 12. Order History

Customer có thể xem:

- Mã đơn.
- Thời gian đặt.
- Danh sách sản phẩm.
- Tổng tiền.
- Phí giao hàng.
- Voucher.
- Phương thức thanh toán.
- Trạng thái đơn.

---

## 13. Notification Requirements

Customer nhận thông báo khi trạng thái đơn thay đổi.

Các trạng thái chính:

- Đã nhận đơn.
- Đã xác nhận.
- Đang chuẩn bị.
- Đang giao.
- Hoàn thành.
- Hủy.

---

## 14. Non-functional Requirements

### Performance

API thông thường nên phản hồi nhanh và ổn định.

### Security

- Customer chỉ được xem dữ liệu của chính mình.
- Staff/Admin phải được xác thực.
- Không expose thông tin nhạy cảm không cần thiết.
- API phải kiểm tra authorization.

### Reliability

Không được tạo Order trùng do Customer gửi request nhiều lần.

### Audit

Các thao tác quan trọng của Staff/Admin nên được ghi nhận:

- Ai thao tác.
- Thao tác gì.
- Thời gian.
- Dữ liệu trước/sau nếu cần.

---

## 15. MVP

MVP gồm:

### Customer

- Zalo authentication/profile.
- Menu.
- Product.
- Option.
- Cart.
- Checkout.
- Address.
- Voucher.
- COD.
- Bank transfer.
- Order tracking.
- Order history.
- Notification.

### Staff/Admin

- Category management.
- Product management.
- Product option management.
- Order management.
- Voucher management.
- Customer information.
- Xác nhận chuyển khoản.

---

## 16. Out of Scope

Không triển khai trong MVP:

- Inventory.
- Recipe.
- Supplier.
- POS.
- Table.
- Kitchen station.
- Shipper management.
- Loyalty.
- Review.
- Company order.
- Multi-branch.
- Advanced analytics.
