# Nghiên cứu & Phân tích Kiến trúc Navigation và Menu F&B Mini App

**Ngày thực hiện:** 2026-08-25  
**Chủ đề:** Đánh giá luồng chọn địa chỉ, sự cần thiết của tab Profile và giải pháp nút Giỏ hàng trên Mini App F&B (Bếp Dì 6).

---

## 1. Bối cảnh & Câu hỏi nghiên cứu

1. **Thẻ chọn địa chỉ giao hàng ở Checkout:** Có cần tách riêng một trang "Sổ địa chỉ" trong Profile hay tích hợp trực tiếp vào luồng Checkout / Bottom Sheet?
2. **Tab "Profile" (Tài khoản) ở Bottom Navigation:** Với một Mini App F&B bán đồ ăn chạy trong Zalo (người dùng đã đăng nhập tự động qua Zalo OA/Mini App), tab Profile có thực sự cần chiếm 1/3 diện tích thanh điều hướng dưới đáy không?
3. **Chuyển nhanh qua Giỏ hàng:** Khi người dùng đang ở trang chủ duyệt thực đơn, việc chỉ có Floating Button dưới đáy có đủ tiện lợi không? Các app F&B hàng đầu (GrabFood, ShopeeFood, Baemin, Starbucks, Highlands Mini App) thiết kế nút Giỏ hàng và Bottom Bar như thế nào?

---

## 2. Phân tích Best Practices F&B Mobile & Mini App

### A. Đối với Tab Bar (Bottom Navigation) trong F&B Mini App

| Mô hình phổ biến | Cấu trúc Tab Bar | Đánh giá UX cho F&B Mini App |
| :--- | :--- | :--- |
| **Mô hình 3 Tab truyền thống** | `[Trang chủ]` - `[Đơn hàng]` - `[Cá nhân]` | Thường thấy ở app thương mại điện tử lớn. Trong Mini App đồ ăn, tab `Cá nhân` rất nghèo nàn (chỉ có tên, avatar Zalo, sổ địa chỉ) -> **Lãng phí không gian điều hướng chính**. |
| **Mô hình Tập trung chuyển đổi (GrabFood / ShopeeFood style)** | `[Thực đơn / Trang chủ]` - `[Đơn hàng]` + **Header / Floating Action** | Dành toàn bộ diện tích cho hành vi mua sắm và theo dõi đơn. Thông tin tài khoản được đưa lên icon góc Header hoặc Drawer. |
| **Mô hình 4 Tab (kèm Giỏ hàng cố định)** | `[Trang chủ]` - `[Tìm kiếm/Khám phá]` - `[Giỏ hàng (Badge)]` - `[Đơn hàng]` | Rất rõ ràng, khách hàng ở bất kỳ đâu cũng thấy ngay số lượng món trong giỏ và bấm 1 chạm là vào xem giỏ / thanh toán. |

### B. Đối với Luồng Chọn Địa chỉ (Address Selector)

- **Thực tế:** 90% khách hàng chỉ chọn hoặc sửa địa chỉ khi họ **bắt đầu đặt hàng hoặc đang ở bước Thanh toán**. Khách hàng gần như không bao giờ vào "Tab Cá nhân -> Sổ địa chỉ" để ngồi nhập trước địa chỉ nếu chưa có nhu cầu mua.
- **Best Practice:** 
  1. Cho phép chọn/đổi địa chỉ ngay tại **Top Header của Trang chủ** ("Giao đến: [123 Nguyễn Trãi...]").
  2. Cho phép đổi/chọn địa chỉ tại **Trang Checkout** qua Bottom Sheet chọn nhanh địa chỉ đã lưu hoặc tìm vị trí mới.

### C. Đối với Nút Giỏ Hàng (Cart Quick Access)

Hiện tại Bếp Dì 6 có component `CartFloatButton` (`absolute -top-16 left-3.5 right-3.5`) xuất hiện nổi lên trên thanh footer khi `itemCount > 0`.
- **Ưu điểm:** Nổi bật, hiển thị tổng tiền + số lượng món, bấm vào mở `CartSheet` xem nhanh.
- **Nhược điểm hiện tại:** Khi lướt xem menu dài, nếu khách muốn vào giỏ hàng ở các màn hình khác hoặc muốn icon giỏ hàng cố định trên Header như các app thương mại chuẩn thì chưa có.

---

## 3. Lời khuyên & Đề xuất kiến trúc cho Bếp Dì 6

### Khuyến nghị 1: Tái cấu trúc Tab Bar (Bottom Navigation)
- **Phương án tối ưu A (Khuyên dùng - Chuẩn F&B):**
  - **Tab 1: Trang chủ / Thực đơn** (`/`)
  - **Tab 2: Đơn hàng** (`/order` - nơi khách theo dõi đơn đang nấu/đang giao)
  - **Tab 3: Giỏ hàng** (`/checkout` hoặc mở `CartSheet` với Badge số lượng `[3]`)
  - **Thông tin tài khoản (Profile):** Đưa icon Avatar/User thu nhỏ lên góc trên của Header Trang chủ. Bấm vào sẽ mở popup/sheet thông tin cá nhân + lịch sử voucher. Bỏ tab Profile riêng lẻ dưới Bottom Bar.

- **Phương án B (Giữ 3 tab nhưng tối ưu hóa):**
  - Giữ `Trang chủ`, `Đơn hàng`, `Tài khoản`, nhưng thêm **Icon Giỏ hàng có Badge số lượng ở Top Header** (bên cạnh thanh tìm kiếm) để luôn chuyển nhanh qua Giỏ hàng bất kỳ lúc nào.

### Khuyến nghị 2: Tinh chỉnh Thẻ chọn Địa chỉ
- Đặt chọn địa chỉ làm trung tâm: Khách bấm vào ô địa chỉ ở Checkout -> mở trực tiếp danh sách địa chỉ đã lưu (Bottom Sheet) thay vì chuyển trang toàn màn hình nếu không cần thiết, giúp giữ mạch thanh toán liền mạch.
