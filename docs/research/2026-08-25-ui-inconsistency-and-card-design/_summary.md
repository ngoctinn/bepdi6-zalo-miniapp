# Tổng kết Nghiên cứu: UI Inconsistencies & UX/UI Best Practices cho F&B

- **Mã nghiên cứu**: `2026-08-25-ui-inconsistency-and-card-design`
- **Mục tiêu**: Phân tích các nguyên nhân gây phân mảnh, thiếu đồng nhất giao diện ở frontend và xây dựng bộ tiêu chuẩn Typography / Card Design cho ứng dụng ẩm thực Việt Nam (Bếp Dì 6).

## Tài liệu chi tiết
- [01-ui-research-and-card-bestpractices.md](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/docs/research/2026-08-25-ui-inconsistency-and-card-design/01-ui-research-and-card-bestpractices.md)

## Tóm tắt các điểm phát hiện chính

1. **Nguyên nhân gây mất nhất quán UI**:
   - **Xung đột token**: Code vừa dùng token (`text-xxxxsmall`, `text-normal`), vừa dùng Tailwind mặc định (`text-xs`, `text-sm`), vừa dùng arbitrary values (`text-[13.5px]`, `text-[11.5px]`).
   - **Phân mảnh màu sắc**: Tồn tại đồng thời màu template cũ (`orange600`, `yellow100`, `#1E293B`, `#16a34a`) lẫn với Rustic Olive Palette mới (`olive700 #4D7C0F`, `neutral900 #0F172A`).
   - **Tách rời Component**: `ProductCard` tự làm bộ stepper tăng giảm riêng thay vì tái sử dụng `QuantityStepper`, gây lệch về kích thước, bo góc và hiệu ứng chạm.
   - **Xung đột Font Stack**: Cài `Be Vietnam Pro` nhưng font-stack lại ưu tiên `SF Pro`/`Roboto`, gây lỗi lệch baseline và hiển thị dấu tiếng Việt khác nhau trên iOS/Android.

2. **Best Practices Typography cho F&B Việt Nam**:
   - Ưu tiên font `Be Vietnam Pro` lên đầu stack để hiển thị dấu thanh mượt mà, ấm cúng.
   - Tránh tuyệt đối `line-height: 100%` (gây cắt dấu tiếng Việt); duy trì `1.25 - 1.35` cho tiêu đề và `1.4 - 1.5` cho mô tả.
   - Phân cấp rõ ràng: Tên món (`14px font-semibold`), Giá tiền (`14px font-bold text-neutral900 / primary`), Mô tả phụ (`11-12px font-normal text-neutral500`).

3. **Sai phạm của Card gọi món hiện tại**:
   - Tên món dùng `font-normal text-[13.5px]` quá chìm.
   - Giá tiền dùng `font-normal text-[14px]` không nổi bật được yếu tố chốt đơn.
   - Cụm Stepper chiếm quá nhiều sự chú ý (`font-extrabold text-[#1E293B]`), kích thước nút nhỏ (`28px`) khó chạm trên mobile.
   - Thiếu chỉ báo trực quan cho món có Options/Topping bắt buộc.
