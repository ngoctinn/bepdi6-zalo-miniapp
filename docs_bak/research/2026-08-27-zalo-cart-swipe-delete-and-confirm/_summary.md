# Nghiên cứu Hướng dẫn Zalo Mini App: Cảnh báo xóa món & Thao tác Vuốt xóa (Swipe to Delete)

## 1. Tổng quan & Thực trạng trên Zalo Mini App (ZaUI)

Theo tài liệu chính thức từ **Zalo Mini App Design Guidelines & ZaUI Component Specs**:

### 1.1. Cảnh báo khi người dùng xóa món / xóa hết giỏ hàng (Confirmation Dialog)
* **Tài liệu Zalo Mini App**: Trong [ZaUI Modal / Dialog](https://mini.zalo.me/docs/zaui/modal/), Zalo quy định sử dụng **Confirmation Dialog** cho các hành vi mang tính phá hủy (Destructive actions) hoặc ảnh hưởng lớn đến ngữ cảnh của người dùng (như xóa đơn, xóa sạch giỏ hàng, hủy phiên).
* **Quy chuẩn UX từ Zalo**:
  - Hộp thoại cần có tiêu đề rõ ràng (Title) và mô tả ngắn (Description).
  - Gồm 2 nút: Nút Hủy (Secondary) và Nút Hành động chính (Destructive/Danger action). Nút xác nhận xóa cần được đánh dấu màu nổi bật hoặc màu cảnh báo đỏ (`danger: true`).
  - Trong dự án `bepdi6-zalo-miniapp`, component [`ConfirmModal`](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/confirm-modal.tsx) đã được tạo sẵn theo đúng chuẩn này bằng `zmp-ui` Modal.

---

### 1.2. Thao tác vuốt để xóa món (Swipe to Delete)
* **Thực trạng ZaUI (`zmp-ui`)**:
  - Bộ thư viện chuẩn `zmp-ui` (hiện tại v1.11.x) **chưa cung cấp sẵn** component `SwipeAction` hay built-in `SwipeToDelete` cho `List.Item` hay `Card`.
  - Môi trường Zalo Mini App chạy trên nền tảng **React Web (WebView)**, do đó Zalo khuyến nghị các mini app có thể linh hoạt sử dụng các gesture touch hoặc thư viện React tối ưu hiệu năng trên di động để tạo thao tác Swipe.
* **Các phương án khả thi**:
  1. **Tự viết hook/component với Touch Events + CSS transform**: Sử dụng `onTouchStart`, `onTouchMove`, `onTouchEnd` kết hợp CSS `transform: translateX(...)`. Ưu điểm: siêu nhẹ, không cần cài thêm thư viện phụ thuộc (`0 dependencies`), hoàn toàn kiểm soát được giao diện/nút xóa theo token màu của Mini App.
  2. **Dùng thư viện chuyên dụng**: `react-swipeable-list` hoặc `react-swipeable`.

---

## 2. Thiết kế Giải pháp Đề xuất

### Luồng 1: Xác nhận trước khi xóa món / xóa hết giỏ hàng
1. **Khi giảm số lượng về 0**:
   - Khi bấm dấu `-` trên món có `quantity === 1` hoặc bấm icon thùng rác / nút xóa / vuốt xóa:
   - Hiển thị `ConfirmModal`:
     - Tiêu đề: *"Xóa món khỏi giỏ hàng?"*
     - Nội dung: *"Bạn có chắc chắn muốn bỏ [Tên món] ra khỏi giỏ hàng không?"*
     - Nút: *"Hủy"* / *"Xóa món"* (màu đỏ - danger).
2. **Nút "Xóa tất cả" / Xóa món cuối cùng trong giỏ hàng**:
   - Nếu giỏ hàng còn 1 món duy nhất và xóa món đó (khiến giỏ hàng rỗng) hoặc người dùng chọn dọn sạch giỏ hàng:
   - Hiển thị `ConfirmModal`:
     - Tiêu đề: *"Xóa tất cả món?"*
     - Nội dung: *"Thao tác này sẽ làm trống giỏ hàng hiện tại của bạn."*

---

### Luồng 2: Triển khai Thao tác Vuốt qua để xóa (Swipe to Delete)

Có thể bọc `CartItemCard` trong một wrapper `SwipeableCartItem`:
* Khi vuốt sang trái (Swipe Left):
  - Khung món trượt sang trái (`translateX(-80px)`), lộ ra nút Thùng rác (màu đỏ) phía sau.
  - Vuốt quá một ngưỡng (threshold ví dụ > 120px) hoặc bấm vào nút thùng rác sẽ kích hoạt dialog xác nhận xóa món.
* Sử dụng CSS `transform` và `transition` để đảm bảo mượt mà (60fps) trên WebView Zalo.

---

## 3. Tài liệu tham khảo chính thức
1. [ZaUI Modal Documentation](https://mini.zalo.me/docs/zaui/modal/)
2. [Zalo Mini App UX Guidelines](https://mini.zalo.me/docs/)
