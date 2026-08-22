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
| Quản trị | Quản lý danh mục, món, voucher, đơn hàng, xác nhận thanh toán, cấu hình quán |

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
- Khi checkout, backend kiểm tra lại toàn bộ: trạng thái mở cửa của quán, giá trị đơn tối thiểu, trạng thái món, giá hiện tại, tùy chọn, địa chỉ, khoảng cách, phí ship, chính sách freeship, voucher.
- Hỗ trợ 2 kiểu thời gian giao: giao ngay hoặc hẹn giờ.
- Frontend lập tức disable nút "Đặt hàng" (loading state) ngay khi bấm để chống spam; Backend sử dụng `Idempotency-Key` để loại bỏ hoàn toàn đơn trùng lặp.

### 3.4 Giao hàng

- Giới hạn bán kính giao hàng tối đa (cấu hình trong Shop Settings). Ngoài bán kính thì từ chối.
- Khoảng cách tính bằng công thức đường chim bay (Haversine) nhân với hệ số bù trừ (x1.3) hoàn toàn nội bộ trên Backend.
- Phí ship tính lũy tiến theo bảng bậc thang cự ly (`shipping_tiers`) do Admin cấu hình, có hỗ trợ miễn phí ship cho đơn đạt ngưỡng (`min_order_for_freeship`).
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
| Chuyển khoản | Hiển thị mã VietQR chứa số tiền và mã đơn dựa trên cấu hình ngân hàng của quán. Nhân viên đối soát và xác nhận thủ công |

Thanh toán có vòng đời riêng, độc lập với trạng thái đơn.

### 3.7 Voucher

- Giảm theo số tiền cố định hoặc phần trăm (có giới hạn giảm tối đa).
- Ràng buộc: thời hạn hiệu lực, giá trị đơn tối thiểu, tổng lượt dùng, lượt dùng trên từng khách.

### 3.8 Thông báo và CSKH

- **Khách hàng**: Nhận thông báo in-app miễn phí cho mọi trạng thái; tin nhắn Zalo OA nếu đã follow; chỉ gửi 1 tin nhắn ZNS khi đơn chuyển sang `DELIVERING` để tối ưu chi phí (quản lý qua feature flag `ENABLE_ZNS_NOTIFICATION`).
- **Nhân viên / Quản trị**: Nhận tin nhắn cảnh báo tức thì qua **Zalo OA vào tài khoản Zalo cá nhân** mỗi khi có đơn mới; Web Admin có cơ chế unlock Autoplay âm thanh ("Bắt đầu ca làm").
- **CSKH**: Nút chat hỗ trợ mở trực tiếp khung chat với Zalo OA của quán.

### 3.9 Cấu hình Quán (Shop Settings)

- **Thông tin chung**: Tên quán, hotline CSKH, địa chỉ quán, tọa độ GPS, banner thông báo.
- **Vận hành**: Bật/tắt mở quán (`is_open`), khung giờ mở/đóng cửa (`open_time`, `close_time`).
- **Ràng buộc đơn hàng**: Giá trị đơn tối thiểu để đặt hàng (`min_order_amount`).
- **Vận chuyển**: Bán kính giao tối đa, hệ số đường đi, bảng bậc thang phí ship (`shipping_tiers`), ngưỡng miễn phí ship (`min_order_for_freeship`).
- **Thanh toán VietQR**: Ngân hàng, số tài khoản, tên chủ tài khoản nhận tiền.

---

## 4. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu |
| :--- | :--- |
| Bảo mật | Phân quyền chặt chẽ. Backend tính toán toàn bộ giá tiền, không tin dữ liệu từ client |
| Hiệu năng | Mini App bundle dưới 10MB. Thời gian tải menu ban đầu dưới 1.5 giây |
| Toàn vẹn dữ liệu | Snapshot đơn giá, tên món và địa chỉ tại thời điểm đặt đơn |
| Độ tin cậy | Không tạo đơn trùng khi khách bấm nhiều lần |
| Audit | Ghi lại các thao tác quan trọng của nhân viên |
