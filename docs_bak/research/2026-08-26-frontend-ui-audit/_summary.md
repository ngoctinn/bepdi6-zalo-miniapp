# Báo cáo Audit Toàn diện Giao diện Frontend Bếp Dì 6 (Zalo Mini App)

**Mã tài liệu:** `docs/research/2026-08-26-frontend-ui-audit/_summary.md`  
**Ngày thực hiện:** 26/08/2026  
**Tiêu chuẩn đối chiếu:** Zalo Mini App Design Guidelines (Official Guide) & Best Practices 2026  

---

## I. Tổng quan đánh giá (Executive Summary)

Đợt audit này rà soát toàn bộ cấu trúc giao diện Frontend của Mini App **Bếp Dì 6** (React 18 + ZMP SDK + Tailwind CSS).

| Trụ cột tiêu chuẩn Zalo | Hiện trạng | Đánh giá rủi ro |
| :--- | :--- | :--- |
| **1. Thân thiện & Nhanh chóng** | Giao diện đã chuyển hướng phẳng/không lồng thẻ (cardless), tập trung vào hình ảnh món ăn trực quan và giỏ hàng nổi. | **TỐT (8.5/10)** — Cần tối ưu thêm Skeleton loading & Empty states. |
| **2. Rõ ràng & Mạch lạc (Navigation & Header)** | Đã có `header-margin` theo safe-area Zalo, nút Back ở trang con, chừa `pr-24` tránh nút Menu mặc định Zalo ở góc trên bên phải. Tuy nhiên vẫn còn một số trang con thiếu Header nhất quán (`/menu/search`). | **KHÁ (7.5/10)** — Cần chuẩn hóa cấu hình Router handle cho trang con. |
| **3. Tiện lợi & Thanh lịch (Input & Touch Targets)** | Vùng bấm (Touch Target) đã đạt chuẩn trên hầu hết các nút bấm chính (>= 36px - 44px ~ 7mm - 9mm). Đã tích hợp GPS getLocation tự động. Tuy nhiên vẫn còn một vài nút nhỏ (nút xóa `h-3.5`, nút tăng giảm size `w-6 h-6`). | **KHÁ (7.8/10)** — Cần nâng min-size vùng bấm lên tối thiểu 36px. |
| **4. Tính nhất quán & Ổn định (Consistency & Stability)** | Đã thống nhất bộ màu Rustic Olive (`#4D7C0F`), Be Vietnam Pro font, bo góc `rounded-2xl` (16px). Bottom Sheet 80vh theo chuẩn food app. | **RẤT TỐT (9.0/10)** — Đã chuẩn hóa qua token & Tailwind theme. |
| **5. Tiêu chuẩn thị giác (Visual Standards)** | Màu sắc tương phản sắc nét (`text-neutral900`), hiển thị giá tiền rõ ràng (`đ`), không bị lệch focus ring xanh của trình duyệt di động. | **RẤT TỐT (9.2/10)**. |

---

## II. Chi tiết Audit theo 5 Nguyên tắc Design Guidelines

### 1. Thân thiện và nhanh chóng (Simplicity & Frictionless Flow)
* **Điểm đạt chuẩn:**
  * Luồng đặt hàng rút gọn trực diện: Mở app -> Chọn món (ProductDetailSheet 80vh) -> Thanh giỏ hàng nổi -> Chuyển thẳng sang Xác nhận đơn -> Đặt hàng.
  * Không bắt buộc đăng nhập phức tạp: Tự động lấy profile qua Zalo Login hook hoặc cho phép nhập thông tin tối thiểu khi mua hàng.
* **Điểm cần cải thiện:**
  * **[Cần bổ sung]** Tại trang [search/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/search/index.tsx), khi người dùng chưa gõ gì thì nên có các tag "Từ khóa gợi ý / Món bán chạy" (ví dụ: *Mắm chưng hột vịt muối, Cơm cháy mắm hành, Cá linh kho*) để người dùng chỉ việc chạm 1 chạm thay vì phải gõ bàn phím.

### 2. Rõ ràng và mạch lạc (Navigation, Back Button & Zalo Header Menu)
* **Quy chuẩn Zalo:**
  * Góc trên bên phải mọi màn hình có menu 3 chấm cố định và nút đóng app của Zalo Client. Tiêu đề và nội dung header tuyệt đối không được đè lên góc này (khoảng trống safe zone `pr-24` hoặc `margin-right: 90px`).
  * Tất cả các trang con (subpages) BẮT BUỘC có nút **"Trở lại" (Back Button)** ở góc trên bên trái.
* **Điểm đạt chuẩn:**
  * Component [header.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/layout/header.tsx) đã xử lý chuẩn: `header-margin flex h-10 items-center gap-2 px-3.5 pr-24 pt-2` và nút Back tròn `h-8 w-8`.
  * Các trang `/checkout`, `/select-location`, `/order/:orderId` đều đã cấu hình `handle: { title: "...", back: true, hideFooter: true }`.
* **Điểm phát hiện & Cần khắc phục:**
  * **Trang Tìm kiếm `/menu/search`**: Chưa được khai báo `handle: { title: "Tìm kiếm món", back: true, hideFooter: true }` trong [router.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/router.tsx). Khi vào trang search, Header bị ẩn hoặc không có nút Back chuẩn, người dùng Android bị mất nút quay lại trực quan.
  * **Trang Đặt hàng thành công `/order-success`**: Cần nút hành động điều hướng rõ ràng quay về Trang chủ hoặc Danh sách đơn hàng (tránh người dùng bị kẹt màn hình).

### 3. Tiện lợi và thanh lịch (Touch Targets 7-9mm & Giảm thiểu nhập liệu)
* **Quy chuẩn Zalo:**
  * Vùng chạm (Touch target) của các button/control trên điện thoại cần từ **7mm đến 9mm** (tương đương tối thiểu **36px × 36px**, khuyến nghị **44px × 44px**) để tránh bấm trượt hoặc bấm nhầm.
* **Điểm đạt chuẩn:**
  * Các nút CTA chính (`ĐẶT HÀNG`, `Thêm vào giỏ`, `Thanh toán`) đều có chiều cao lớn (>= 48px), padding rộng rãi, hiệu ứng active bấm nảy nhẹ (`active:scale-[0.98]`).
  * Tích hợp sẵn `getLocation({})` từ `zmp-sdk/apis` tại [select-location/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/select-location/index.tsx#L47-L63) giúp khách hàng lấy tọa độ GPS chuẩn xác chỉ với 1 chạm.
* **Điểm phát hiện & Cần nâng cấp:**
  1. **Nút xóa tìm kiếm trong SearchBar ([search-bar.tsx:L47](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/search-bar.tsx#L47)):** Kích thước hiện tại `h-3.5 w-3.5` (14px) là quá nhỏ, dễ gây khó khăn khi bấm xóa trên màn hình cảm ứng. Cần mở rộng touch target padding lên `min-w-[36px] min-h-[36px]`.
  2. **Nút QuantityStepper dạng small ([quantity-stepper.tsx:L32](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/quantity-stepper.tsx#L32)):** Size `small` có kích thước `w-6 h-6` (24px). Cần nâng lên tối thiểu `w-7 h-7` (28px - 32px) để ngón tay dễ chạm vào nút `+` / `-`.
  3. **Nút Xóa địa chỉ ([select-location/index.tsx:L143](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/select-location/index.tsx#L143)):** Kích thước chữ nhỏ và vùng bấm sát mép phải, nên bổ sung padding tối thiểu để tránh bấm nhầm vào chọn địa chỉ.

### 4. Tính nhất quán và ổn định (UI Consistency & Component Uniformity)
* **Điểm đạt chuẩn:**
  * Bộ màu thương hiệu chuẩn: **Rustic Olive (`#4D7C0F`)** mộc mạc phong cách ẩm thực Miền Tây phối cùng tông nền ấm **Stone 50 (`#FAFAF9`)** và điểm xuyết **Warm Ginger (`#D97706`)**.
  * Typography: Sử dụng toàn bộ font chữ tiếng Việt chuẩn **Be Vietnam Pro** với hệ phân cấp cỡ chữ rõ ràng, không lỗi dấu Unicode tiếng Việt.
  * Các Bottom Sheet (Chi tiết món, Giỏ hàng) thống nhất bo góc trên `rounded-t-3xl`, chiều cao 80vh không che khuất hoàn toàn ngữ cảnh, có nút đóng `CloseIcon` và thanh kéo `handler`.
  * Không dùng bảng/lồng card dày cộp (no card-in-card); các mục thông tin được ngăn cách bằng viền kẻ mảnh tinh tế `border-black/5` tạo cảm giác thanh thoát, nhẹ nhàng.

---

## III. Danh mục các điểm cần hành động (Actionable Recommendations)

| Thứ tự | Hạng mục | File cần chỉnh sửa | Nội dung đề xuất |
| :---: | :--- | :--- | :--- |
| **1** | Bổ sung Header & Back Button cho Search | [router.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/router.tsx) | Thêm `handle: { title: "Tìm kiếm món ăn", back: true, hideFooter: true }` cho route `/menu/search`. |
| **2** | Tối ưu Touch Target nút Clear trong SearchBar | [search-bar.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/search-bar.tsx) | Tăng kích thước nút Clear hoặc bọc trong vùng bấm tối thiểu 36px. |
| **3** | Tối ưu Touch Target Stepper & Card Actions | [quantity-stepper.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/quantity-stepper.tsx) | Điều chỉnh size nút `small` từ 24px lên 28px - 32px để vừa vặn chuẩn 7-9mm. |
| **4** | Bổ sung Tag Gợi ý Tìm kiếm Nhanh | [search/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/search/index.tsx) | Thêm danh sách tag món nổi bật (chips) khi ô tìm kiếm trống để giảm tải gõ phím. |
| **5** | Đảm bảo nút Đặt hàng ngăn chặn double-click | [checkout/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/checkout/index.tsx) | Tiếp tục duy trì disable button ngay khi `createOrderMutation.isPending` (đã tuân thủ rule AGENTS.md). |

---

## IV. Kết luận

Giao diện Frontend của Mini App Bếp Dì 6 hiện đã bám rất sát **Zalo Mini App Design Guidelines**, có tính thẩm mỹ cao, đậm đà bản sắc ẩm thực truyền thống nhưng hiện đại và mượt mà trên thiết bị di động. Chỉ cần thực hiện một số tinh chỉnh nhỏ về kích thước vùng bấm (Touch Area) và điều hướng đồng bộ ở trang Tìm kiếm là đạt độ hoàn thiện cao nhất.
