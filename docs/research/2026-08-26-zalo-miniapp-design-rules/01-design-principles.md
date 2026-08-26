# Nguyên tắc Thiết kế Cốt lõi — Zalo Mini App

## Key Questions

- Các nguyên tắc thiết kế nền tảng mà mọi Zalo Mini App phải tuân thủ là gì?
- Những quy tắc nào bắt buộc để vượt qua quy trình xét duyệt của Zalo?

## Findings

### 1. Thân thiện và Nhanh chóng (Friendly & Fast)

Giao diện phải đơn giản, loại bỏ sự phức tạp và gián đoạn không cần thiết.

**Quy tắc cụ thể:**

- **Làm nổi bật điểm quan trọng:** Mỗi trang chỉ nên có **một điểm tập trung chính** (focal point). Các thông tin phụ giữ mức vừa phải, gọn gàng.
- **Tối ưu luồng trải nghiệm:** Đưa người dùng đến mục đích sử dụng dịch vụ nhanh nhất có thể. Loại bỏ mọi thành phần không liên quan đến mục đích chính.
- **Không yêu cầu quyền truy cập ngay lập tức:** Không được yêu cầu số điện thoại hoặc quyền hệ thống khi vừa mở app. Tách luồng không cần quyền (trải nghiệm trước) và luồng cần quyền (chỉ xin khi cần).

### 2. Rõ ràng và Mạch lạc (Clear & Coherent)

Người dùng luôn biết mình đang ở đâu và có thể điều hướng dễ dàng.

**Quy tắc cụ thể:**

- Cung cấp **phản hồi rõ ràng** về trạng thái xử lý: đang tải (loading), thành công, lỗi, mất kết nối.
- Hiển thị trạng thái loading hoặc thông báo phản hồi khi người dùng thực hiện thao tác.
- Điều hướng phải trực quan — người dùng luôn biết cách quay lại trang trước.

### 3. Nhất quán và Ổn định (Consistent & Stable)

Tuân thủ các nguyên tắc nhất quán giữa tất cả các trang.

**Quy tắc cụ thể:**

- Sử dụng **tối đa** các điều khiển (controls) và chế độ tương tác tiêu chuẩn do Zalo cung cấp (ZaUI).
- Giảm sự khó chịu khi chuyển trang bằng cách giữ nhất quán vị trí, màu sắc, typography.
- Tránh tự thiết kế các thành phần điều khiển phức tạp nếu đã có component ZaUI tương ứng.

### 4. Tiện lợi và Thanh lịch (Convenient & Elegant)

Giao diện phải có tính thẩm mỹ cao, chuyên nghiệp.

**Quy tắc cụ thể:**

- Giữ giao diện sạch sẽ, tối giản.
- Sử dụng khoảng trắng hợp lý.
- Đảm bảo các thành phần tương tác có kích thước vùng chạm (touch target) từ **7mm đến 9mm**.

### 5. Yêu cầu Xét duyệt (Review Requirements)

Để Mini App được phê duyệt, cần đáp ứng:

- Logo, tên, mô tả phải rõ ràng, phản ánh đúng chức năng.
- Ứng dụng phải hoàn thiện — không để trạng thái "đang phát triển" hay trang trắng.
- Dữ liệu trong app phải là dữ liệu thực tế (sản phẩm, dịch vụ, thông tin).
- Không chứa nội dung gian lận, quảng cáo trái phép.
- Đảm bảo bảo mật dữ liệu người dùng — không công khai API Key ra client.
- Xét duyệt mất tối đa **72 giờ làm việc**.

## Sources

- [Zalo Mini App Design Guidelines](https://mini.zalo.me/documents/design/) — _primary_
- [Zalo Platform Document Hub](https://zaloplatforms.com) — _primary_

## Notes

- Nguyên tắc "không yêu cầu quyền ngay lập tức" là nguyên nhân phổ biến nhất khiến Mini App bị từ chối khi xét duyệt.
- Touch target 7-9mm tương đương khoảng 44-56px trên thiết bị mật độ pixel tiêu chuẩn.
