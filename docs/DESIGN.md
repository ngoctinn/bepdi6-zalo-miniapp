# Bếp Dì 6 — Official Design System & UI/UX Standards (Benchmark 2025–2026)

> **Single Source of Truth (SSOT)** cho toàn bộ giao diện khách hàng và vận hành của **Bếp Dì 6 Zalo Mini App** (`@apps/frontend`).  
> Tích hợp chuẩn **Zalo Platform Guidelines**, **Apple Human Interface Guidelines (HIG)**, **Material Design 3**, **WCAG 2.1/2.2 AA**, và **F&B Fast Ordering UX**.

---

## 1. Triết Lý Thiết Kế & Phong Cách Thương Hiệu (Brand & Philosophy)

- **Style Archetype:** **Rustic Olive & Warm Ginger Bistro** kết hợp **Light & Airy Mobile-First**.
- **Cảm hứng:** Ẩm thực miền Tây mộc mạc, tươi ngon, ấm cúng (sắc xanh lá chuối hấp, vàng ấm mật ong & gừng tươi, bề mặt sáng mịn sạch sẽ).
- **Trải nghiệm cốt lõi:**
  1. **Tốc độ (Instant & Frictionless):** ≤ 3–4 chạm từ khi mở Menu đến hoàn tất Checkout.
  2. **Tiện dụng 1 tay (Thumb-Zone Friendly):** 90% thao tác tương tác chính (Quick-add, Stepper, Thanh giỏ hàng, Nút Đặt hàng) nằm trong vùng quét thuận tiện của ngón cái ở nửa dưới màn hình.
  3. **Minh bạch & An tâm:** Giá món, phí giao hàng, trạng thái chế biến và tài khoản chuyển khoản VietQR luôn rõ ràng, chính xác từng số liệu.

---

## 2. Hệ Thống Token Màu Sắc (Color System - Source of Truth)

Toàn bộ mã màu trong tài liệu này đồng bộ 100% với `apps/frontend/src/tokens.js` và biến CSS `:root` tại `apps/frontend/src/css/app.scss`.

### 2.1. Primary & Brand Colors (Khách hàng)
Toàn bộ mã màu theme được khai báo dưới dạng kênh màu RGB phân cách bằng khoảng trắng (`--theme-*-rgb: R G B;`) trong `apps/frontend/src/css/app.scss` và ánh xạ qua `rgb(var(...) / <alpha-value>)` trong `apps/frontend/src/tokens.js`. Điều này cho phép Tailwind v3 hỗ trợ hoàn hảo các class modifier opacity như `bg-primary/20`, `border-primary/30`.

| Token Key | Biến RGB / HEX | Tên gọi & Ứng dụng |
| :--- | :--- | :--- |
| `primary` (`--theme-primary`) | `77 124 15` / `#4D7C0F` | **Primary Brand**: Nút CTA chính, Tab đang active, icon nổi bật, viền nhấn |
| `primaryDark` (`--theme-primary-dark`) | `63 98 18` / `#3F6212` | **Primary Pressed / Hover**: Trạng thái nhấn giữ của nút chính |
| `primaryLight` (`--theme-primary-light`) | `236 252 203` / `#ECFCCB` | Nền phụ, chip lựa chọn, highlight nhẹ |
| `primarySurface` (`--theme-primary-surface`) | `247 254 231` / `#F7FEE7` | Nền block tóm tắt, banner trạng thái đơn đang xử lý, badge active |
| `brandAccent` (`--theme-accent`) | `217 119 6` / `#D97706` | **Warm Amber**: Điểm nhấn ẩm thực, badge giảm giá, hình thức "Tự đến lấy" |
| `amber500` / `amber100` | `#F59E0B` / `#FEF3C7` | Nền nhạt và viền của cảnh báo hoặc badge chuẩn bị món |

### 2.2. Admin & Staff Theme (Vận hành Bếp & Quản trị)
| Token Key | Biến RGB / HEX | Tên gọi & Ứng dụng |
| :--- | :--- | :--- |
| `orange600` (`--theme-primary`) | `234 88 12` / `#EA580C` | Màu chủ đạo cho module Quản trị Bếp & Nhân viên |
| `orange700` / `orange100` | `194 65 12` / `255 237 213` | Trạng thái nhấn & bề mặt phụ giao diện Admin |

### 2.3. Neutrals & Surfaces (Nền & Bề mặt)
| Token Key | Giá trị HEX | Ứng dụng |
| :--- | :--- | :--- |
| `stone50` (`background`) | `#FCFCFB` / `#FAFAF9` | **Page Background**: Nền dịu mắt, chống mỏi mắt trên màn hình OLED mobile |
| `white` (`surface`) | `#FFFFFF` | Nền thẻ Card, Modal, Bottom Sheet, Header |
| `neutral900` (`text-primary`) | `#0F172A` | Tiêu đề H1/H2, tên món, giá tiền chính (độ tương phản sắc nét) |
| `neutral700` / `neutral600` | `#44403C` / `#57534E` | Text nội dung mô tả món, tên người nhận, nhãn trường nhập |
| `neutral500` (`text-tertiary`) | `#78716C` | Thời gian, ghi chú phụ, placeholder text (tối thiểu WCAG 4.5:1) |
| `neutral200` / `border-black/5` | `#E7E5E4` / `rgba(0,0,0,0.05)` | Đường kẻ phân cách (Divider), viền thẻ nhẹ |

### 2.4. Semantic Colors (Trạng thái nghiệp vụ)
| Trạng thái | Mã màu chính | Nền dịu | Ứng dụng |
| :--- | :--- | :--- | :--- |
| **Success** | `#16A34A` / `#00A950` | `bg-emerald-50` | Đơn hoàn tất, Đã chép STK, Lưu mã QR thành công, Áp voucher |
| **Warning** | `#D97706` / `#F59E0B` | `bg-amber-50` | Đơn chờ xác nhận, Đang nấu, Nhắc chuẩn bị tiền mặt COD |
| **Danger / Destructive** | `#DC2626` / `#EF4444` | `bg-red-50` | Báo lỗi hệ thống, Đơn bị hủy, Nút Hủy đơn, Món hết hàng |
| **Info / Delivery** | `#2563EB` | `bg-blue-50` | Badge "GIAO TẬN NƠI", vị trí giao hàng |

---

## 3. Quy Chuẩn Bắt Buộc Zalo Mini App (Platform Constraints)

### 3.1. Top Safe Area & Menu Bar Capsule `[•••] [X]`
- **Ràng buộc:** Góc trên bên phải của Mini App luôn bị chiếm dụng bởi cụm nút cố định hệ sinh thái Zalo: Menu `[•••]` và Nút Đóng `[X]`.
- **Quy tắc bắt buộc:**
  - Mọi Header (cả Home lẫn trang con) phải có padding phải tối thiểu `pr-20` (80px) để không che khuất cụm nút hệ thống này.
  - Sử dụng class `.header-margin` (`margin-top: var(--app-safe-area-top)`) để tránh bị tai thỏ (Notch) hoặc Dynamic Island đè lên tiêu đề.
  - Trong `app-config.json`, đặt `"actionBarHidden": true` khi dùng Custom Header để tránh hiển thị trùng 2 thanh tiêu đề.

### 3.2. Bottom Safe Area & Home Indicator (iOS & Android Gestures)
- **Ràng buộc:** Trong `app-config.json`, `"hideIOSSafeAreaBottom": true` đồng nghĩa với việc WebView Zalo không tự chèn padding đáy.
- **Quy tắc bắt buộc:**
  - Tất cả thành phần dính đáy (`position: fixed` hoặc `sticky bottom-0`) như `CartFloatBar`, `Footer`, nút CTA thanh toán bắt buộc phải áp dụng class `.safe-bottom`:
    ```css
    .safe-bottom {
      padding-bottom: max(16px, calc(var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px)) + 12px)) !important;
    }
    ```
  - Khung nội dung chính cuộn phải có khoảng đệm đệm đáy dự phòng (`pb-28` đến `pb-32`) để thanh cố định không che khuất dòng tổng tiền hoặc nút cuối cùng.

### 3.3. Quy Tắc Xin Quyền Đúng Lúc (Just-in-Time Permissions)
- **Tuyệt đối cấm:** Xin quyền GPS (`getLocation`) hoặc Số điện thoại (`getPhoneNumber`) ngay khi vừa mở ứng dụng hoặc khi render trang chủ.
- **Chỉ xin Just-in-Time:**
  - Quyền GPS: Chỉ kích hoạt khi khách bấm "Lấy vị trí hiện tại" hoặc "Chọn trên bản đồ" tại trang chọn địa chỉ.
  - Quyền Số điện thoại: Chỉ kích hoạt khi khách bấm "Điền nhanh SĐT" hoặc khi bấm nút "Đặt hàng" mà tài khoản chưa có SĐT liên hệ.
  - Luôn hiển thị Dialog giải thích lý do trước khi gọi SDK Zalo (`consentText`).

---

## 4. Chuẩn Mobile Ergonomics & Accessibility (Apple HIG & WCAG 2.1 AA)

### 4.1. Vùng Chạm Ngón Cái (Touch Target Size ≥ 44×44px)
- **Chuẩn kích thước tương tác:**
  - Nút bấm chính (CTA): Chiều cao tối thiểu `44px - 52px` (`min-h-[44px]`).
  - Nút quay lại (Back button) trên Header: Vùng chạm tối thiểu `44×44px` (visual icon 20px, container `w-11 h-11` hoặc padding đệm).
  - Stepper (`QuantityStepper` & Stepper trên thẻ món): Nút cộng `(+)` và trừ `(−)` phải có diện tích chạm ngón tay tối thiểu `44×44px` (hoặc tối thiểu `36px` kèm vùng `after:absolute after:-inset-2.5` đạt 48px hit area).
  - Category Tabs: Chiều cao tối thiểu `min-h-[40px] - 44px`.
  - Nút sao chép STK / Lưu ảnh QR: Tối thiểu `min-h-[36px] - 44px` để tránh bấm trượt.
- **Khoảng cách đệm giữa các nút kề nhau:** Tối thiểu `8px` để triệt tiêu hiện tượng chạm nhầm (fat-finger errors).

### 4.2. Chống Lồng Phần Tử Tương Tác (No Interactive Nesting)
- **Quy tắc nghiêm ngặt W3C §4.10.19:** Tuyệt đối **KHÔNG lồng `<button>` hoặc `<a>` bên trong thẻ cha có `role="button"` hoặc `onClick`**.
- **Giải pháp cho Thẻ món ăn (`ProductCard`) và Thẻ đơn hàng (`OrderItemCard`):**
  - Tách thẻ thành các vùng tương tác độc lập:
    - Vùng hình ảnh & thông tin món: Nhận `onClick` mở trang chi tiết.
    - Cụm Stepper / Nút Quick-Add: Nằm trong container độc lập, có `e.stopPropagation()` và không nằm trong thẻ cha `role="button"`.
  - Triệt tiêu hoàn toàn lỗi "Ghost Click" và "Click Jacking" trên Android WebView.

### 4.3. Typography & Khả Năng Tiếp Cận (Accessibility)
- **Cấm Tuyệt Đối Micro-typography (< 11px) cho Văn Bản:**
  - Đã loại bỏ hoàn toàn `text-xxxxsmall` (10px). Cỡ chữ nhỏ nhất cho toàn bộ nhãn thông tin, metadata, mã vận đơn, số điện thoại, tag shipper là **`11px font-semibold / font-bold`** (`text-[11px]`) hoặc chuẩn **`12px`** (`text-xs`).
  - **Ngoại lệ duy nhất cho 10px:** Badge số lượng hình tròn cực nhỏ (`h-4 min-w-[16px]`) trên icon giỏ hàng dùng `text-[10px] font-black leading-none` để tránh vỡ viền tròn.
- **Tiêu chuẩn Line-Height & Dấu Tiếng Việt:**
  - Hạn chế dùng `leading-none` trên các dòng tiêu đề hoặc đoạn văn đa dòng vì dễ gây cắt ngọn dấu hỏi/ngã/mũ. Luôn đảm bảo `line-height` tối thiểu `1.25` đến `1.35` (`leading-tight` hoặc `leading-snug`).
- **Phản hồi Screen Reader (`aria-live`):**
  - Mọi khu vực cập nhật số lượng giỏ hàng hoặc số lượng trong stepper phải có thuộc tính `aria-live="polite"` để phần mềm đọc màn hình tự động thông báo thay đổi cho người khiếm thị.
- **Quy tắc Icon & Trợ năng:**
  - Tuyệt đối không dùng Icon chay không có `aria-label` trên các nút icon-only (Nút Back, Nút Tăng/Giảm, Nút Xóa, Nút Đóng).
  - Mọi icon hình ảnh mang tính trang trí phải có `aria-hidden="true"`.

### 4.4. Quy Tắc Biểu Tượng & Icon (Icon Guidelines - AGENTS.md Compliance)
- **TUYỆT ĐỐI KHÔNG dùng ký tự Emoji Unicode trực tiếp** (ví dụ: 🔴, 🟢, 🛵, ⚡, 🍜, 🛒, 👥, 🏠, 🥡) làm icon giao diện, chỉ số trạng thái hay mẫu in nhiệt.
- **Chỉ sử dụng:**
  1. Icon chính thức của Zalo Mini App: `zmp-ui <Icon icon="zi-..." />`.
  2. Bộ SVG Vectors đồng bộ tại `apps/frontend/src/components/common/vectors.tsx`.
  3. CSS Dot Badges (ví dụ: `w-2 h-2 rounded-full bg-primary`).
- **Luôn thêm `shrink-0`** vào tất cả các component icon trong flex container để tránh bị bẹp méo trên màn hình di động 360px.

---

## 5. Chuẩn Trải Nghiệm Ứng Dụng F&B Đặt Món Nhanh (Fast Food Ordering UX)

### 5.1. Phân Biệt Quick-Add Trực Tiếp vs Món Có Biến Thể
- **Món đơn giản (Không có Option Groups bắt buộc hoặc tùy chọn):**
  - Bấm nút `(+)` trên thẻ món → **Thêm ngay 1 món vào giỏ hàng (1-Tap Quick Add)** kèm hiệu ứng phản hồi tức thì.
  - Hiển thị Stepper `[-] [Số lượng] [+]` ngay trên thẻ món để khách tăng giảm số lượng nhanh chóng mà không cần rời màn hình menu.
- **Món có biến thể / Topping (Có Option Groups):**
  - Bấm nút `(+)` hoặc bấm vào thẻ món → **Mở trang / Sheet Chi tiết món (`ProductDetailPage`)** để khách chọn size, lượng đường, đá, topping bắt buộc trước khi thêm vào giỏ.

### 5.2. Chống Trùng Đơn & Idempotency (Anti-Spam Submit)
- Khi khách hàng nhấn nút "Đặt hàng" hoặc "Thanh toán":
  1. **Lập tức disable nút** và hiển thị Spinner/Loading state (`isSubmitting: true`).
  2. Gắn cố định header `Idempotency-Key: <UUID-v4>` cho toàn bộ phiên gửi request tạo đơn.
  3. Nếu gặp lỗi mạng / timeout: Giữ nguyên Idempotency-Key để khi khách bấm thử lại (Retry) không bị tạo 2 đơn trùng nhau tại backend.
  4. Chỉ sinh Idempotency-Key mới khi backend phản hồi lỗi xác thực dữ liệu (4xx client error).

### 5.3. Zero-Flash State & Điều Hướng Mượt Mà
- **Không nhấp nháy giỏ hàng rỗng:** Khi hoàn tất tạo đơn và thực hiện `clearCart()`, giao diện Checkout không được chớp màn hình "Giỏ hàng trống" trước khi redirect sang trang Order Detail (`isCompletingOrderRef` check).
- **Trạng thái tải dữ liệu:** Mọi danh mục món, thông tin giỏ, và chi tiết đơn hàng đều phải có **Skeleton Shimmer** tương ứng với khung layout thật, triệt tiêu cảm giác giật cục (layout shift).

### 5.4. Xử Lý Form & Bàn Phím Ảo (Virtual Keyboard Accommodation)
- Tại trang nhập địa chỉ (`SelectLocationPage`), khi focus vào ô "Số nhà" hoặc "Ghi chú", input phải tự động căn chỉnh khoảng cách hoặc cuộn lên trên bàn phím ảo (`scrollIntoView({ behavior: 'smooth', block: 'center' })`), tránh bị bàn phím Android/iOS che lấp nút xác nhận.

---

## 6. Ma Trận Đối Chiếu Chuẩn Thành Phần (Component Benchmark Matrix)

| Thành phần | Hiện trạng Code | Chuẩn Tiêu Chuẩn 2025–2026 | Mức Độ Khắc Phục |
| :--- | :--- | :--- | :--- |
| **Category Tabs** (`CategoryList`) | `min-h-[36px]`, thiếu `role="tab"` | Nâng lên `min-h-[40px]`, thêm `role="tablist"` & `aria-selected` | ⚠️ IMPORTANT |
| **ProductCard Stepper** | Visual `28px - 36px`, nested trong `role="button"` | Tách rời click container, tăng hit-target `≥ 44px`, thêm `aria-live` | 🚨 CRITICAL |
| **Header Back Button** | `h-8 w-8` (32px), thiếu `aria-label` | Nâng vùng chạm lên `min-w-[44px] min-h-[44px]`, `aria-label="Quay lại"` | ⚠️ IMPORTANT |
| **VietQR Copy Buttons** | `min-h-[28px]` nhỏ khó bấm | Tăng vùng chạm `min-h-[38px] - 44px`, feedback rõ ràng | ⚠️ IMPORTANT |
| **OrderDetailPage** | Monolithic file 964 dòng | Tách 4 module độc lập: VietQR, Timeline, ShipperCard, OrderItems | 📋 REFACTOR PLAN |
| **Home Search** | Chưa có thanh tìm kiếm món | Bổ sung thanh Search món ăn hỗ trợ tìm kiếm nhanh | 💡 SUGGESTION |
