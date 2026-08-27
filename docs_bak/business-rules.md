# Business Rules

## 1. Món ăn và Tùy chọn

**BR-PROD-001** — Mỗi món thuộc đúng một danh mục.

**BR-PROD-002** — Khách không thể đặt món ở trạng thái OUT_OF_STOCK hoặc INACTIVE.

**BR-PROD-003** — Combo là một món thông thường với giá cố định, không tách lẻ.

**BR-PROD-004** — Nếu nhóm tùy chọn được đánh dấu bắt buộc, khách phải chọn đủ số lượng tối thiểu trước khi thêm vào giỏ.

**BR-PROD-005** — Đơn giá và giá tùy chọn phải được snapshot cố định vào đơn hàng tại thời điểm đặt. Giá menu thay đổi sau đó không ảnh hưởng đến đơn cũ.

**BR-PROD-006** — Ảnh món ăn và danh mục phải được chuẩn hóa lưu trữ qua Object Storage (Cloudflare R2 / AWS S3 / Media Storage). Khi tải lên, hệ thống tự động nén định dạng WebP và tối ưu kích thước để đảm bảo thời gian tải dưới 500ms trên thiết bị di động.

**BR-PROD-007** — Hỗ trợ cả 2 phương thức nhập ảnh: Tải file trực tiếp (Admin Upload) hoặc dán đường dẫn ảnh tĩnh (Direct CDN URL).

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

**BR-ORD-004** — Nhân viên phải gọi điện cho khách để xác nhận. Nhân viên chỉ có quyền điều chỉnh món, số lượng, thời gian trước khi xác nhận ĐỐI VỚI ĐƠN COD. Nếu đơn thanh toán qua VietQR, nhân viên KHÔNG ĐƯỢC PHÉP sửa đơn. Nếu bắt buộc sửa, nhân viên phải hủy đơn để khách đặt lại.

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

**BR-DELI-001** — Đơn chỉ được chấp nhận nếu khoảng cách nằm trong bán kính giao hàng tối đa cấu hình (`max_delivery_radius_km`).

**BR-DELI-002** — Khoảng cách tính bằng công thức đường chim bay (Haversine) nhân với hệ số bù trừ (`haversine_multiplier`, mặc định 1.3) hoàn toàn nội bộ Backend, không gọi API bản đồ bên ngoài.

**BR-DELI-003** — Phí ship do backend tính tự động theo bảng bậc thang cự ly (`shipping_tiers`) của quán. Hỗ trợ miễn phí ship (0đ) khi giá trị tạm tính của đơn hàng đạt hoặc vượt mức `min_order_for_freeship` (nếu có cấu hình > 0).

**BR-DELI-004** — Hỗ trợ 2 hình thức: giao ngay (ASAP) hoặc hẹn giờ (SCHEDULED).

---

## 6. Voucher

**BR-VOU-001** — Voucher chỉ hợp lệ khi đang ACTIVE, trong thời hạn hiệu lực, và chưa đạt tổng lượt dùng.

**BR-VOU-002** — Tạm tính đơn hàng phải đạt giá trị tối thiểu yêu cầu.

**BR-VOU-003** — Số lần khách đã dùng mã này không được vượt quá giới hạn trên từng khách.

**BR-VOU-004** — Số tiền giảm không được vượt quá giới hạn giảm tối đa và không vượt quá tạm tính đơn.

**BR-VOU-005** — Nếu đơn hàng bị hủy (CANCELLED) hoặc nhân viên sửa đơn COD làm giá trị đơn không còn thỏa điều kiện voucher, hệ thống phải tự động hoàn lại lượt dùng (RELEASED) cho voucher.

---

## 7. Thanh toán

**BR-PAY-001** — Hỗ trợ 2 phương thức: COD và chuyển khoản ngân hàng.

**BR-PAY-002** — Với chuyển khoản, hệ thống tạo mã VietQR chứa số tiền, mã đơn và thông tin tài khoản ngân hàng từ cấu hình quán. Nhân viên đối soát và xác nhận thủ công.

**BR-PAY-003** — Đơn COD chỉ được đánh dấu đã thanh toán sau khi giao hàng thành công.

**BR-PAY-004** — Nếu số tiền khách chuyển khoản qua VietQR bị lệch (thừa/thiếu) so với tổng đơn, Admin phải tự thương lượng và khi xác nhận thanh toán thủ công bắt buộc phải nhập số tiền thực nhận (`actual_paid_amount`) và lý do (`note`).

---

## 8. Phân quyền
 
**BR-SEC-001** — Khách chỉ xem được đơn hàng, thông báo và địa chỉ của chính mình.

**BR-SEC-002** — Chỉ tài khoản Staff hoặc Admin mới được truy cập các chức năng quản trị. Riêng việc cập nhật Cấu hình Quán (Shop Settings) chỉ dành riêng cho quyền Admin.

---

## 9. Thông báo & Trải nghiệm Người dùng (UX/Operation)

**BR-NOTI-001** — Mọi đơn mới (`PENDING_CONFIRMATION`) phải tự động kích hoạt Celery task gửi tin nhắn cảnh báo kèm tóm tắt đơn qua Zalo OA đến tài khoản Zalo cá nhân của nhân viên trực ca.

**BR-NOTI-002** — ZNS chỉ được kích hoạt khi đơn sang trạng thái `DELIVERING` và khi cờ cấu hình `ENABLE_ZNS_NOTIFICATION = True`. Mọi trạng thái khác ưu tiên in-app notification và Zalo OA message.

**BR-UX-001** — Frontend Checkout bắt buộc khóa nút bấm (disable) ngay khi người dùng chạm "Đặt hàng" để triệt tiêu spam request từ phía UI.

---

## 10. Cấu hình Quán (Shop Settings)

**BR-SHOP-001** — Cửa hàng duy trì một bản ghi cấu hình duy nhất (Singleton Pattern). Mọi thông tin mở quán, địa chỉ, ngân hàng và phí ship đều được ưu tiên đọc động từ Database.

**BR-SHOP-002** — Khi quán đóng cửa (`is_open = False` hoặc ngoài giờ hoạt động), backend từ chối tính toán checkout và tạo đơn với mã lỗi `SHOP_CLOSED`.

**BR-SHOP-003** — Khách hàng chỉ có thể đặt đơn khi giá trị tạm tính đạt tối thiểu `min_order_amount` (nếu được cấu hình > 0). Nếu chưa đạt, backend trả về lỗi `ORDER_AMOUNT_BELOW_MINIMUM`.

**BR-SHOP-004** — Bảng bậc thang phí ship (`shipping_tiers`) được lưu dưới dạng danh sách mốc khoảng cách `{from_km, to_km, fee}`. Backend tự động validate tính hợp lệ của các mốc (không âm, mốc sau lớn hơn mốc trước).

**BR-SHOP-005** — Mọi thay đổi trong Cấu hình Quán đều tự động ghi nhận vào `AuditLog` để phục vụ đối soát.

