# Requirements

## 1. Tổng quan

Hệ thống đặt đồ ăn online trên Zalo Mini App, phục vụ khách hàng trong bán kính giao hàng của cửa hàng.

**Khách hàng** sử dụng Zalo Mini App để xem menu, đặt hàng, chọn địa chỉ và thời gian giao, áp voucher, thanh toán và theo dõi đơn hàng.

**Nhân viên** sử dụng trang quản trị để quản lý thực đơn, tiếp nhận đơn, gọi điện xác nhận, cập nhật trạng thái và xác nhận thanh toán chuyển khoản.

---

## 2. Phạm vi MVP

### Có trong MVP

| Nhóm | Chức năng |
| :--- | :--- |
| Xác thực | Đăng nhập qua Zalo, lấy SĐT qua Zalo Token Exchange |
| Thực đơn | Danh mục, món ăn, tùy chọn món, combo |
| Đặt hàng | Giỏ hàng, checkout, lưu nhiều địa chỉ, chọn giờ giao |
| Thanh toán | COD, chuyển khoản ngân hàng qua VietQR |
| Khuyến mãi | Voucher giảm giá cố định hoặc theo phần trăm |
| Theo dõi | Xem trạng thái đơn, lịch sử đơn hàng |
| Thông báo | Thông báo in-app, ZNS / Zalo OA khi đổi trạng thái |
| CSKH | Chat trực tiếp với OA qua nút hỗ trợ |
| Quản trị | Quản lý danh mục, món, voucher, đơn hàng, xác nhận thanh toán |

### Không có trong MVP

Quản lý bàn, POS, điều phối bếp, tồn kho, nguyên liệu, shipper, loyalty, đánh giá, multi-branch, analytics nâng cao.

---

## 3. Yêu cầu chức năng

### 3.1 Thực đơn

**Danh mục** — Phân loại món ăn. Ví dụ: Món cơm, Món nước, Món thêm, Nước uống, Combo.

**Món ăn** — Mỗi món có tên, mô tả, hình ảnh, giá bán, danh mục và trạng thái. Combo được quản lý như một món thông thường với giá cố định.

**Trạng thái món:**

| Trạng thái | Ý nghĩa |
| :--- | :--- |
| AVAILABLE | Đang bán, khách có thể đặt |
| OUT_OF_STOCK | Hết món, không đặt được |
| INACTIVE | Ẩn khỏi menu |

**Tùy chọn món** — Nhóm tùy chọn gắn theo từng món. Hỗ trợ cấu hình bắt buộc hay không, số lượng chọn tối thiểu và tối đa. Ví dụ: Combo cơm + nước → Chọn nước: Coca, Pepsi, Trà.

### 3.2 Khách hàng và Địa chỉ

- Lấy thông tin cơ bản từ Zalo khi đăng nhập.
- Số điện thoại được xác thực qua Zalo Token Exchange.
- Khách có thể cập nhật tên và SĐT nhận hàng.
- Lưu nhiều địa chỉ giao hàng, mỗi địa chỉ gồm tên người nhận, SĐT, địa chỉ chi tiết và tọa độ.

### 3.3 Giỏ hàng và Checkout

- Giỏ hàng lưu tại client, không bắt buộc khôi phục khi đóng app.
- Khi checkout, backend kiểm tra lại toàn bộ: trạng thái món, giá hiện tại, tùy chọn, địa chỉ, khoảng cách, phí ship, voucher.
- Hỗ trợ 2 kiểu thời gian giao: giao ngay hoặc hẹn giờ.
- Sử dụng Idempotency-Key để chống tạo đơn trùng.

### 3.4 Giao hàng

- Giới hạn bán kính giao hàng tối đa. Ngoài bán kính thì từ chối.
- Khoảng cách tính bằng Mapping/Routing API dựa trên tọa độ shop và khách.
- Phí ship tính lũy tiến theo khoảng cách, do backend quyết định.
- Cửa hàng tự giao hoặc thuê bên thứ ba. Không quản lý shipper trong hệ thống.

### 3.5 Đơn hàng

Vòng đời trạng thái đơn:

```
PENDING_CONFIRMATION → CONFIRMED → PREPARING → READY → DELIVERING → COMPLETED
```

Đơn có thể bị hủy (CANCELLED) ở các trạng thái trước READY.

Quy trình xử lý:
1. Khách đặt đơn → đơn ở trạng thái chờ xác nhận.
2. Nhân viên gọi điện xác nhận, có thể chỉnh sửa trước khi duyệt.
3. Sau khi xác nhận, khách không thể tự hủy đơn.

### 3.6 Thanh toán

| Phương thức | Mô tả |
| :--- | :--- |
| COD | Khách trả tiền mặt khi nhận hàng |
| Chuyển khoản | Hiển thị mã VietQR chứa số tiền và mã đơn. Nhân viên đối soát và xác nhận thủ công |

Thanh toán có vòng đời riêng, độc lập với trạng thái đơn.

### 3.7 Voucher

- Giảm theo số tiền cố định hoặc phần trăm (có giới hạn giảm tối đa).
- Ràng buộc: thời hạn hiệu lực, giá trị đơn tối thiểu, tổng lượt dùng, lượt dùng trên từng khách.

### 3.8 Thông báo và CSKH

- Thông báo in-app khi đơn hàng đổi trạng thái.
- Gửi thông báo qua ZNS hoặc tin nhắn Zalo OA.
- Nút chat hỗ trợ mở trực tiếp khung chat với Zalo OA của quán.

---

## 4. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu |
| :--- | :--- |
| Bảo mật | Phân quyền chặt chẽ. Backend tính toán toàn bộ giá tiền, không tin dữ liệu từ client |
| Hiệu năng | Mini App bundle dưới 10MB. Thời gian tải menu ban đầu dưới 1.5 giây |
| Toàn vẹn dữ liệu | Snapshot đơn giá, tên món và địa chỉ tại thời điểm đặt đơn |
| Độ tin cậy | Không tạo đơn trùng khi khách bấm nhiều lần |
| Audit | Ghi lại các thao tác quan trọng của nhân viên |
