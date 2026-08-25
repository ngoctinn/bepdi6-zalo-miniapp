# Báo cáo Nghiên cứu: Tích hợp Zalo Native APIs & Tối giản Điều hướng F&B

**Ngày:** 2026-08-25  
**Chủ đề:** Khảo sát tài liệu chính thức `zmp-sdk` (Zalo Mini App Developer Docs) về Địa chỉ / Vị trí, CSKH và Phương án loại bỏ trang Profile dư thừa.

---

## 1. Nghiên cứu Tài liệu Zalo for Developers (`zmp-sdk`)

### A. Về Vị trí & Địa chỉ giao hàng (Location & Address)
Tài liệu chính thức Zalo Mini App xác định:
1. **`getLocation()`**:
   - Zalo **chỉ cung cấp tọa độ địa lý (GPS)** hoặc trả về **token bảo mật** để Server Mini App giải mã lấy `(latitude, longitude)`.
   - Zalo **KHÔNG có sẵn sổ địa chỉ người dùng (Address Book API)** do chính sách bảo mật thông tin người dùng của VNG/Zalo.
   - Do đó, Mini App F&B cần tự quản lý Sổ địa chỉ (`Address` model) trên Backend của mình (như Bếp Dì 6 đang làm rất chuẩn).
2. **`openMap()` / `chooseLocation()`**:
   - Cho phép mở bản đồ trực quan của thiết bị/Zalo để người dùng ghim vị trí hoặc dẫn đường.

### B. Về Chăm sóc khách hàng & Liên hệ Quán (CSKH Native)
Zalo cung cấp 2 API native cực kỳ tiện lợi:
1. **`openChat({ type: 'oa', id: '<OA_ID>' })`**:
   - Bấm 1 chạm mở ngay khung chat trực tiếp giữa khách hàng và Zalo Official Account của quán.
2. **`openPhone({ phoneNumber: '<HOTLINE>' })`**:
   - Bấm 1 chạm mở ứng dụng gọi điện thoại tới hotline quán.
3. **`followOA({ id: '<OA_ID>' })`**:
   - Mời khách quan tâm OA để nhận tin tức, khuyến mãi và thông báo đơn ZNS.

---

## 2. Đánh giá Kiến trúc: Bỏ hẳn trang Profile & CSKH riêng

### Nhận định của bạn là HOÀN TOÀN CHÍNH XÁC:
- Người dùng vào Mini App F&B chỉ có **2 nhu cầu cốt lõi**:
  1. **Chọn món & Mua hàng** (Trang chủ / Thực đơn / Giỏ hàng).
  2. **Theo dõi đơn hàng** (Trang Đơn hàng).
- **Trang Profile hiện tại thừa thãi vì:**
  - Avatar / Tên đã có sẵn từ Zalo, người dùng không cần sửa trong app.
  - Sổ địa chỉ chỉ cần xuất hiện dưới dạng **Bottom Sheet / Pop-up chọn nhanh khi đang ở Checkout**.
  - CSKH chỉ cần là **1 nút floating icon Zalo Chat / Hotline** hoặc đặt trong chi tiết đơn hàng (kèm `openChat` OA).

---

## 3. Kiến trúc Bottom Navigation & Header mới (Đề xuất tối ưu)

```
┌────────────────────────────────────────────────────────────┐
│ [Logo Bếp Dì 6]     [🔍 Tìm kiếm]    [💬 Chat CSKH]        │ Top Header
├────────────────────────────────────────────────────────────┤
│                                                            │
│                      NỘI DUNG CHÍNH                        │
│                 (Menu / Món ăn / Chi tiết)                 │
│                                                            │
├────────────────────────────────────────────────────────────┤
│   [🏠 Thực đơn]       [🛍️ Giỏ hàng (3)]     [📋 Đơn hàng]  │ Bottom Nav
└────────────────────────────────────────────────────────────┘
```

1. **Bottom Navigation (3 Tab chuẩn F&B):**
   - **Tab 1: Thực đơn (`/`)**
   - **Tab 2: Giỏ hàng (`/checkout`)** — Có badge số lượng món đỏ nổi bật `[3]`. Bấm vào chuyển thẳng tới màn hình thanh toán.
   - **Tab 3: Đơn hàng (`/order`)** — Theo dõi trạng thái đơn đang nấu / đang giao.
2. **Loại bỏ hoàn toàn route `/profile` và tab "Cá nhân"**:
   - Không còn trang Profile trống trải, app gọn nhẹ và mượt mà hơn.
3. **Nút CSKH Zalo OA:**
   - Đặt icon Chat Zalo (`openChat`) trên Top Header hoặc đặt trong trang Chi tiết đơn hàng ("Cần hỗ trợ đơn này? -> Nhắn Zalo").
