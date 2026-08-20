# Business Rules

## 1. Món ăn và Tùy chọn

**BR-PROD-001** — Mỗi món thuộc đúng một danh mục.

**BR-PROD-002** — Khách không thể đặt món ở trạng thái OUT_OF_STOCK hoặc INACTIVE.

**BR-PROD-003** — Combo là một món thông thường với giá cố định, không tách lẻ.

**BR-PROD-004** — Nếu nhóm tùy chọn được đánh dấu bắt buộc, khách phải chọn đủ số lượng tối thiểu trước khi thêm vào giỏ.

**BR-PROD-005** — Đơn giá và giá tùy chọn phải được snapshot cố định vào đơn hàng tại thời điểm đặt. Giá menu thay đổi sau đó không ảnh hưởng đến đơn cũ.

---

## 2. Khách hàng và Địa chỉ

**BR-CUST-001** — Khách hàng được định danh duy nhất qua tài khoản Zalo.

**BR-CUST-002** — Số điện thoại được xác thực thông qua Zalo Token Exchange. Khách có quyền cập nhật SĐT và tên liên hệ.

**BR-CUST-003** — Khách chỉ có quyền xem, sửa, xóa địa chỉ do chính mình tạo.

**BR-CUST-004** — Địa chỉ giao hàng, tọa độ, khoảng cách và phí ship phải được snapshot cố định vào đơn hàng khi đặt.

---

## 3. Giỏ hàng và Đặt đơn

**BR-ORD-001** — Giỏ hàng lưu tạm tại client. Khi đặt đơn, backend phải validate lại toàn bộ: trạng thái món, giá, tùy chọn, địa chỉ, voucher.

**BR-ORD-002** — Request tạo đơn phải có Idempotency-Key để chống trùng.

**BR-ORD-003** — Đơn mới luôn bắt đầu ở trạng thái PENDING_CONFIRMATION.

**BR-ORD-004** — Nhân viên phải gọi điện cho khách để xác nhận. Nhân viên có quyền điều chỉnh món, số lượng, thời gian trước khi xác nhận.

**BR-ORD-005** — Sau khi đơn được CONFIRMED, khách không thể tự hủy trên ứng dụng.

**BR-ORD-006** — Nếu không liên lạc được khách sau nhiều lần, nhân viên hủy đơn với lý do CUSTOMER_UNREACHABLE.

---

## 4. Vòng đời trạng thái đơn hàng

**BR-STAT-001** — Luồng chuyển đổi hợp lệ:

```
PENDING_CONFIRMATION → CONFIRMED → PREPARING → READY → DELIVERING → COMPLETED
```

Có thể hủy (CANCELLED) từ các trạng thái: PENDING_CONFIRMATION, CONFIRMED, PREPARING.

**BR-STAT-002** — COMPLETED và CANCELLED là trạng thái cuối cùng, không được phép chuyển ngược.

---

## 5. Giao hàng

**BR-DELI-001** — Đơn chỉ được chấp nhận nếu khoảng cách nằm trong bán kính giao hàng tối đa.

**BR-DELI-002** — Khoảng cách tính bằng Mapping/Routing API dựa trên tọa độ shop và khách.

**BR-DELI-003** — Phí ship do backend tính tự động theo bảng biểu phí của shop, không nhận từ frontend.

**BR-DELI-004** — Hỗ trợ 2 hình thức: giao ngay (ASAP) hoặc hẹn giờ (SCHEDULED).

---

## 6. Voucher

**BR-VOU-001** — Voucher chỉ hợp lệ khi đang ACTIVE, trong thời hạn hiệu lực, và chưa đạt tổng lượt dùng.

**BR-VOU-002** — Tạm tính đơn hàng phải đạt giá trị tối thiểu yêu cầu.

**BR-VOU-003** — Số lần khách đã dùng mã này không được vượt quá giới hạn trên từng khách.

**BR-VOU-004** — Số tiền giảm không được vượt quá giới hạn giảm tối đa và không vượt quá tạm tính đơn.

---

## 7. Thanh toán

**BR-PAY-001** — Hỗ trợ 2 phương thức: COD và chuyển khoản ngân hàng.

**BR-PAY-002** — Với chuyển khoản, hệ thống tạo mã VietQR chứa số tiền và mã đơn. Nhân viên đối soát và xác nhận thủ công.

**BR-PAY-003** — Đơn COD chỉ được đánh dấu đã thanh toán sau khi giao hàng thành công.

**BR-PAY-004** — Không thể xác nhận thanh toán nếu số tiền thực nhận không khớp tổng đơn.

---

## 8. Phân quyền

**BR-SEC-001** — Khách chỉ xem được đơn hàng, thông báo và địa chỉ của chính mình.

**BR-SEC-002** — Chỉ tài khoản Staff hoặc Admin mới được truy cập các chức năng quản trị.
