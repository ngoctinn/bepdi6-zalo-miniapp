# User Flow

## 1. Khách hàng

### 1.1 Khởi động và Xác thực

```
Mở Zalo Mini App
    ↓
Zalo xác thực → lấy ID, tên, avatar
    ↓
Xác thực SĐT qua Token Exchange
    ↓
Backend cấp access token → vào trang chủ
```

### 1.2 Xem menu và Thêm vào giỏ

```
Trang chủ → Chọn danh mục → Danh sách món → Chi tiết món
    ↓
Chọn tùy chọn (nếu có) → Nhập số lượng → Ghi chú → Thêm vào giỏ
```

### 1.3 Checkout và Đặt hàng

```
Giỏ hàng → Checkout
    ↓
Chọn hoặc thêm địa chỉ giao hàng
    ↓ (Backend tính khoảng cách và phí ship. Từ chối nếu ngoài bán kính.)
Chọn thời gian giao: Giao ngay hoặc Hẹn giờ
    ↓
Nhập mã voucher (nếu có) → Backend validate và tính giảm giá
    ↓
Chọn thanh toán: COD hoặc Chuyển khoản
    ↓
Bấm Đặt hàng → Tạo đơn (PENDING_CONFIRMATION)
```

### 1.4 Thanh toán chuyển khoản

```
Chọn Chuyển khoản → Hiển thị mã VietQR (chứa STK, số tiền, mã đơn)
    ↓
Khách quét QR qua app ngân hàng và chuyển tiền
    ↓
Nhân viên đối soát sao kê → Xác nhận đã thanh toán trên Admin
```

### 1.5 Theo dõi đơn và Nhận thông báo

```
Khách xem chi tiết đơn → Theo dõi trạng thái cập nhật
    ↓
Nhận thông báo in-app và ZNS/OA khi trạng thái thay đổi
    ↓
Bấm nút Hỗ trợ → Mở khung chat trực tiếp với Zalo OA
```

---

## 2. Nhân viên

### 2.1 Tiếp nhận và Xác nhận đơn

```
Đơn mới (PENDING_CONFIRMATION) → Nhân viên gọi điện cho khách
    ↓
┌── Khách nghe máy
│       ↓
│   Cần sửa? → Sửa món / địa chỉ / giờ giao trên Admin
│       ↓
│   Bấm Xác nhận → Chuyển sang CONFIRMED
│
└── Khách không nghe
        ↓
    Thử gọi lại → Vẫn không được → Bấm Hủy (lý do: không liên lạc được)
```

### 2.2 Vận hành và Hoàn tất

```
CONFIRMED → PREPARING → READY → DELIVERING → COMPLETED

Đơn COD: Thu tiền mặt khi giao → Xác nhận thanh toán
Đơn Chuyển khoản: Khách đã chuyển trước → Đã xác nhận thanh toán
```
