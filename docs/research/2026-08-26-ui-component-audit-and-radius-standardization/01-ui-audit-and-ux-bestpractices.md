# Nghiên Cứu & Best Practices: UX/UI Design System Cho Zalo Mini App (Bếp Dì 6)

## 1. Bối cảnh & Hiện trạng Audit UI Codebase

Dự án Mini App Bếp Dì 6 đã chuyển đổi thành công sang hệ màu **Rustic Olive** (`#4D7C0F`), font tiếng Việt **Be Vietnam Pro** và phong cách thẻ phẳng tối giản (**Cardless / Borderless Seamless UI**).

Tuy nhiên, qua quá trình rà soát (audit) toàn bộ các component và view (`apps/frontend/src/`):
1. **Phân mảnh Border Radius (Bo góc không nhất quán)**:
   - Các modal / dialog: Lúc dùng `rounded-3xl` (24px), lúc dùng `rounded-2xl` (16px), hoặc `rounded-20px` trong CSS.
   - Thẻ và Containers: Hầu hết dùng `rounded-2xl` (16px), nhưng một số khối con dùng `rounded-xl` (12px), `rounded-lg` (8px), `rounded-md` (6px).
   - Nút bấm (Buttons) & Inputs: Chỗ dùng `rounded-xl` (12px), chỗ dùng `rounded-2xl` (16px - trong `confirm-modal`, `error-modal`), chỗ dùng `rounded-lg` (8px trong `select-location`).
   - Badges / Pills: Có lúc dùng `rounded-full`, có lúc dùng `rounded-md` (`order-item-card.tsx`).
2. **Hardcoded CSS / Tailwind vs Theme Tokens**:
   - Một số component cũ (`variant-select.tsx`, `adjustment-option.tsx`, `quantity-option.tsx`, `checkbox-option.tsx`, `radio-option.tsx`) vẫn dùng token cũ (`text-variant-title`, `text-large`, `text-text-primary`, `border-border-primary`).
   - Hardcoded arbitrary classes: `size-[22px]`, `py-0.2`, `hover:bg-green800` (màu không có trong tokens), `bg-orange500/10` trong `subcategory-sidebar.tsx`.
   - Một số nơi dùng `text-stone-600` / `text-stone-900` thay vì `text-neutral600` / `text-neutral900` hoặc token ngữ nghĩa (`semantic.colors.text.*`).
3. **Thiếu Component dùng chung chuẩn (Lack of Standard Core Primitives)**:
   - Các Button chính (Primary Action Button cố định đáy màn hình) đang được viết lặp lại ở `checkout/index.tsx`, `product-detail-sheet.tsx`, `cart-sheet.tsx`, `order-success/index.tsx`, `select-location/index.tsx` thay vì dùng chung 1 component `PrimaryButton` hoặc Button variant chuẩn.
   - Các Badge/Tag trạng thái (như "Tự lấy", "Giao hàng", "Chờ xác nhận", "Mặc định", "Bắt buộc") viết CSS inline thay vì dùng component `Badge` hoặc `StatusTag`.

---

## 2. Best Practices UX/UI cho F&B Mini App (Zalo / iOS / Android)

### 2.1. Hệ thống Border Radius (Corner Radius Scale)
Trong thiết kế Mobile UI/F&B, quy tắc **Nesting Radius Formula** (`R_outer = R_inner + Padding`) và phân cấp thị giác yêu cầu một thang radius rõ ràng:

| Phân cấp UI | Giá trị Radius | Token đề xuất | Áp dụng cho |
| :--- | :--- | :--- | :--- |
| **Pill / Circular** | `9999px` (`rounded-full`) | `rounded-full` | Tabs pill, Category chips, Quick stepper buttons (+/-), Badges nhỏ, Floating action triggers |
| **Containers / Cards / Sheets** | `16px` (`rounded-2xl`) | `rounded-2xl` | Product Cards, Delivery Cards, Payment Sections, Detail Sheet top corners, Floating cart bar |
| **Interactive Controls** | `12px` (`rounded-xl`) | `rounded-xl` | Primary Action Buttons, Text Inputs, Textareas, Select dropdowns |
| **Nested Sub-items** | `8px` (`rounded-lg`) | `rounded-lg` | Slot times grid, Sub-items inside a container, Checkboxes |
| **Modals / Dialogs** | `20px` (`rounded-[20px]`) | `rounded-modal` / `rounded-2.5xl` | Modal hộp thoại trung tâm (`ConfirmModal`, `ErrorModal`) |

### 2.2. Button & Typography Consistency
- **Primary CTA Button**: Chiều cao chuẩn chạm trên mobile: `48px` (h-12) hoặc `44px` (h-11), bo góc đồng bộ `rounded-xl` (12px) hoặc `rounded-2xl` (16px), font chữ `text-sm font-bold`, màu nền `bg-primary` (`#4D7C0F`), hiệu ứng `active:scale-[0.98]`.
- **Badge / Status Tag**: Bo góc `rounded-full` hoặc `rounded-lg`, màu sắc Soft Tonal (nền nhạt 10-15%, text đậm tone), không dùng border thô cứng.

---

## 3. Kế hoạch Chuẩn Hóa & Tái Cấu Trúc Chi Tiết

1. **Tokens & Theme Sync**: Cập nhật `tokens.js` và `tailwind.config.js` với thang radius chuẩn (`rounded-card`, `rounded-button`, `rounded-badge`, v.v.). Dọn dẹp các token typography cũ không còn sử dụng.
2. **Standardize Core Shared UI Components**:
   - `badge.tsx`: Component hiển thị trạng thái chuẩn (Order status, Delivery type, Required/Optional, Default address).
   - `button.tsx` hoặc chuẩn hóa `zmp-ui Button` / Custom Button wrapper để tất cả Primary CTA trên toàn app có cùng chiều cao, bo góc, bóng mờ và hiệu ứng bấm.
   - `input.tsx` / `note-input.tsx`: Đồng bộ padding, bo góc `rounded-xl`, focus ring Rustic Olive.
3. **Audit & Refactor Pages & Sheets**:
   - `pages/checkout/index.tsx`: Đồng bộ radio boxes, input border-radius, CTA button.
   - `pages/select-location/index.tsx`: Thay `rounded-md`, `rounded-lg` thành thang chuẩn; thay `confirm()` native bằng `ConfirmModal`.
   - `components/common/product-detail-sheet.tsx` & `cart-sheet.tsx`: Đồng bộ button bar, quantity stepper, options list.
   - `components/common/order-item-card.tsx` & `pages/order-detail/index.tsx`: Đồng bộ timeline, status tags và action buttons.
   - `components/common/variant-select.tsx`, `adjustment-option.tsx`, `checkbox-option.tsx`, `radio-option.tsx`, `subcategory-sidebar.tsx`: Dọn triệt để token cũ và hardcoded color cam/vàng/stone không nhất quán.
