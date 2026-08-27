# Nghiên cứu & Khảo sát Best Practices: Trang Đơn hàng (Order History) & CSKH F&B Mini App

**Ngày thực hiện:** 2026-08-25  
**Mục tiêu:** 
1. Đánh giá bố cục trang "Đơn hàng của tôi" (`/order`).
2. Khảo sát luồng gọi Hotline / CSKH trong giỏ hàng và thanh toán.
3. So sánh chuẩn UX với GrabFood, ShopeeFood, Baemin, Starbucks Mini App.

---

## 1. Khảo sát & Đánh giá Bố cục Trang Đơn Hàng (`/order`)

### Thực trạng hiện tại:
- Bố cục danh sách dùng Tab: `[Tất cả] - [Đang xử lý] - [Hoàn tất] - [Đã hủy]`.
- Mỗi thẻ đơn hàng (`OrderItemCard`) hiển thị:
  - Header: Mã đơn `#{order_code}`, Ngày đặt, Badge trạng thái.
  - Body: Tên món + số lượng + giá từng món.
  - Footer: Tổng số món và Tổng tiền thanh toán.

### Đánh giá theo chuẩn F&B:
* **Hợp lý:** Phân loại theo Tabs trạng thái giúp khách hàng dễ dàng theo dõi ngay đơn "Đang xử lý" (đang nấu / đang giao) mà không bị lẫn vào lịch sử đơn cũ.
* **Điểm yếu & Cần khắc phục ngay:**
  1. **Thẻ đơn hàng quá đơn điệu & Thiếu hình ảnh thu nhỏ:** Thẻ chỉ toàn text, không có thumbnail món ăn hoặc icon phân loại `Giao tận nơi` vs `Tự đến lấy`.
  2. **Thiếu nút Hành động nhanh (Quick Actions):** Khách muốn **"Đặt lại đơn này" (Re-order)** hoặc **"Xem chi tiết"** không có nút rõ ràng (phải click vào cả thẻ).
  3. **Thiếu hiển thị hình thức nhận:** Cần có nhãn rõ ràng: `🛵 Giao tận nơi` hoặc `🛍️ Tự đến lấy` (kèm giờ hẹn nếu có).

---

## 2. Vị trí Nút Gọi Ngay / CSKH trong Giỏ Hàng & Checkout

### So sánh vị trí:

| Vị trí đặt | Trải nghiệm người dùng | Đánh giá |
| :--- | :--- | :--- |
| **Góc Top Header trang chủ** | Khách vào app chưa mua gì đã thấy nút gọi -> Thừa, làm rối thanh tìm kiếm. | ❌ Không tối ưu |
| **Trong Trang Checkout / Giỏ hàng** | Khách đang đặt món có thắc mắc về món ăn, địa chỉ, phí ship -> Bấm gọi ngay để hỏi quán. | ✅ Rất tự nhiên & Hợp lý |
| **Trong Trang Chi tiết đơn hàng** | Đơn đang giao trễ / cần đổi món -> Bấm nút Hotline/Chat trực tiếp với quán. | ✅ Cực kỳ cần thiết |

### Đề xuất thiết kế nút CSKH tại Checkout:
- Đặt một thanh hỗ trợ nhẹ nhàng ngay dưới địa chỉ hoặc phần tổng tiền:
  `Cần hỗ trợ đơn hàng? [📞 Gọi quán ngay 0901234567]` (thiết kế tinh tế, không tranh chấp với nút "Đặt hàng" chính).

---

## 3. Kiến trúc Đề xuất Hoàn Chỉnh cho Trang Đơn Hàng (`OrderItemCard`)

```
┌─────────────────────────────────────────────────────────────┐
│ 🛵 GIAO TẬN NƠI  •  #FO260825-001       [Đang chuẩn bị]     │
├─────────────────────────────────────────────────────────────┤
│ [Ảnh]  Bánh canh tôm nước cốt dừa x2                        │
│        + Canh rong biển, 50% ngọt                           │
│        và 1 món khác...                                     │
├─────────────────────────────────────────────────────────────┤
│ 25/08/2026 11:30                Tổng: 133.900đ (2 món)      │
├─────────────────────────────────────────────────────────────┤
│ [📞 Liên hệ quán]                      [🛍️ Đặt lại đơn này] │
└─────────────────────────────────────────────────────────────┘
```

1. Thêm hình ảnh thu nhỏ của món chính trong đơn.
2. Thêm nhãn hình thức: `Giao tận nơi` / `Tự đến lấy` (kèm giờ hẹn nếu có).
3. Thêm nút hành động: **Đặt lại đơn** và **Chi tiết**.
