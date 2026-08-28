# Bếp Dì 6 Design System & Guidelines

> Tự động trích xuất từ `/cf-design scan` cho `@apps/frontend` kết hợp tài liệu quy chuẩn Zalo Mini App Best Practices (`docs/research/2026-08-27-zalo-miniapp-ui-ux-design-guidelines/01-zalo-miniapp-design-guidelines.md`).

---

## 1. Phong Cách Thiết Kế Tổng Thể (Overall Style)
- **Style Archetype:** **Rustic Olive & Warm Ginger Bistro** kết hợp **Light & Airy Mobile-First** (Độ tin cậy: Cao).
- **Cảm hứng & Ngữ cảnh:** Ẩm thực miền Tây mộc mạc, gần gũi, ấm áp (lá chuối hấp, vàng mật ong, thớt gỗ), tối ưu hoá trải nghiệm 1 tay (Thumb-Zone) trên Zalo Mini App.

---

## 2. Bảng Màu Chuẩn (Color System)

### 2.1. Primary & Brand Accents
- **Primary / Brand:** `#4D7C0F` (`olive700` - Xanh rêu lá chuối mộc mạc)
- **Primary Pressed / Dark:** `#3F6212` (`olive800`)
- **Primary Light / Background:** `#ECFCCB` (`olive100`), `#F7FEE7` (`olive50`)
- **Secondary / Warm Amber:** `#D97706` (`amber600`), `#F59E0B` (`amber500`), `#FEF3C7` (`amber100`)

### 2.2. Neutrals & Surfaces
- **Background App:** `#FAFAF9` (`stone50` / `stone100`)
- **Card / Surface Background:** `#FFFFFF`
- **Text Primary (Tiêu đề, Giá, Tên món):** `#0F172A` (`neutral900` / `NG100`)
- **Text Secondary (Mô tả, Thời gian, Placeholder):** `#78716C` (`neutral500` / `NG60`)
- **Border / Divider:** `rgba(0, 0, 0, 0.05)` đến `#E7E5E4` (`neutral200`)

### 2.3. Semantic Colors
- **Success / Completed:** `#16A34A` / `#00A950`
- **Warning / Pending:** `#E57B00` / `#F59E0B`
- **Danger / Cancelled / Error:** `#DC2626` / `#EF4444`

---

## 3. Typography & Kiểu Chữ

- **Font Family:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Roboto", "Segoe UI", sans-serif`
- **Hierarchy Scale:**
  - **H1 / Page Title:** `16px - 20px` (font-extrabold / font-bold), tracking-tight
  - **H2 / Section Title:** `15px - 16px` (font-bold)
  - **Card Title / Food Item:** `14px` (font-semibold, line-clamp-2)
  - **Body / Main Text:** `13px - 14px` (font-normal / font-medium, leading-normal)
  - **Caption / Metadata / Badges:** `10px - 12px` (font-medium / font-bold)

---

## 4. Spacing, Shapes & Layout Tokens

- **Grid Base:** Bội số 4px/8px (`gap-1.5` = 6px, `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px).
- **Gutter Lề 2 bên:** `12px - 16px` (`px-3.5` hoặc `px-4`).
- **Bo góc (Border Radius):**
  - Card & Image: `rounded-2xl` (16px) hoặc `rounded-xl` (12px).
  - Button & Input: `rounded-xl` (12px) hoặc Pill `rounded-full` (cho stepper, floating cart).
  - Badge & Tag: `rounded-md` (6px) hoặc `rounded-full`.
- **Shadows:** Tinh giản, mềm mại (`shadow-xs`, `shadow-sm`, `shadow-md`), hạn chế shadow gắt.

---

## 5. Các Thành Phần Giao Diện (Core Component Patterns)

### 5.1. Header & Zalo Top Safe Area
- Header tuỳ biến `sticky top-0`, `z-30`, nền `bg-white/95 backdrop-blur-md`.
- `pr-20` (padding right 80px) để không che cụm nút `[•••] [X]` mặc định của Zalo.
- Có nút quay lại (`BackIcon`) trên tất cả subpages.

### 5.2. Bottom Navigation & Bottom Action Bar
- Sticky/Fixed đáy màn hình luôn kèm class `safe-bottom` (`padding-bottom: max(16px, calc(var(--app-safe-area-bottom) + 12px))`).
- Giới hạn 3-4 tabs chính (`Thực đơn`, `Giỏ hàng`, `Đơn hàng`, `Bếp/POS` cho Staff).
- Nút CTA chính (Đặt hàng, Thêm giỏ, Xác nhận) cao `44px - 52px` đạt chuẩn Touch Target.

### 5.3. Product Card & Quantity Stepper
- Ảnh tỉ lệ vuông `aspect-square`, bo góc `rounded-2xl`.
- Quick-add & Stepper: Touch target tối thiểu 32px - 44px, có phản hồi haptic/active scale.
- Trạng thái `Hết món` có lớp phủ tối `backdrop-blur-[2px]` và badge rõ ràng.

### 5.4. Bottom Sheet & Modal
- `ProductDetailSheet`, `CartSheet` có nút CTA dính đáy và padding safe area bottom.
- Hỗ trợ vuốt đóng mượt mà.
