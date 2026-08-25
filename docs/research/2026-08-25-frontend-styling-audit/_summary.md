# Báo Cáo Nghiên Cứu & Audit Toàn Diện Hệ Thống Styling Frontend

**Ngày thực hiện:** 2026-08-25  
**Phạm vi:** Toàn bộ component và pages trong `apps/frontend/src/`  
**Chủ đề:** Rà soát tính nhất quán của Design Tokens, Color Palettes, Hardcoded Colors, Typography, Spacing và Zalo UI Overrides.

---

## 1. Tóm Tắt Thực Trạng (Executive Summary)

Sau khi rà soát toàn bộ codebase frontend, hệ thống styling đã có bước tiến lớn khi chuẩn hóa các Token chủ đạo sang **Rustic Olive (`#4D7C0F`)** và nền sáng ấm. Tuy nhiên, vẫn còn tồn tại một số **điểm không nhất quán (inconsistencies)** do mã nguồn kế thừa:
1. **Hardcoded Color Classes**: Một số file vẫn còn các class Tailwind cũ như `text-green800`, `text-green-700`, `bg-green-50`, `bg-emerald-500/15`, `focus:border-green600` thay vì sử dụng semantic tokens `primary`, `primaryDark`, `primary/10`, `primary/15`.
2. **ZaUI Component CSS Overrides**: Các biến CSS `:root` trong `app.scss` đã được chuyển sang tone `#4D7C0F`, nhưng một số component ZaUI native vẫn cần đảm bảo font và border radius đồng bộ.
3. **Typography & Font Weight**: Tiêu đề đã đồng bộ sang `Slate 900 / Stone 900`, nhưng một số chỗ dùng `text-black` thay vì `text-neutral-900`.

---

## 2. Danh Sách Chi Tiết Các Vị Trí Cần Làm Sạch (Detailed Findings)

| STT | File | Dòng / Vị trí | Lỗi Styling Hiện Tại | Đề Xuất Khắc Phục Chuẩn Hóa |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `note-input.tsx` | Line 38 | `focus:border-green600 focus:ring-green600/30` | Chuyển thành `focus:border-primary focus:ring-primary/30` |
| 2 | `cart-sheet.tsx` | Line 47 | `text-green800` | Chuyển thành `text-primaryDark` hoặc `text-neutral-900` |
| 3 | `quantity-stepper.tsx` | Line 52 | `active:bg-green-50` | Chuyển thành `active:bg-primary/10` |
| 4 | `product-detail-sheet.tsx` | Line 391 | `hover:bg-green800` | Chuyển thành `hover:bg-primaryDark` |
| 5 | `order-detail/index.tsx` | Line 130, 145, 221 | `bg-emerald-500/10`, `bg-emerald-500/15` | Chuyển thành `bg-primary/10`, `bg-primary/15` |
| 6 | `order-detail/index.tsx` | Line 229, 276, 304, 393, 400 | `text-green-700`, `text-green800`, `bg-green-50` | Chuyển thành `text-primary`, `text-primaryDark`, `bg-primary/10` |
| 7 | `select-location/index.tsx` | Line 112, 117, 166, 238, 255 | `border-green600`, `text-green600`, `hover:bg-green800` | Chuyển thành `border-primary`, `text-primary`, `hover:bg-primaryDark` |
| 8 | `checkout/index.tsx` | Line 386, 398, 520, 605, 611, 619 | `focus:border-green600`, `text-green-700`, `text-green800` | Chuyển thành `focus:border-primary`, `text-primary`, `text-primaryDark` |
| 9 | `cart-float-button.tsx` | Line 61, 71 | `shadow-emerald-950/20`, `text-emerald-100` | Chuyển thành `shadow-stone-900/15`, `text-white/90` |
| 10 | `order-item-card.tsx` | Line 38 | `bg-emerald-500/15` | Chuyển thành `bg-primary/15` |

---

## 3. Kiến Trúc Design Tokens Chuẩn (Design Token Architecture Spec)

Hệ thống token nên được tuân thủ nghiêm ngặt theo 3 tầng:

```
[Layer 1: Primitive Tokens] (tokens.js: base.colors)
  ├── stone50: #FAFAF9, stone100: #F5F5F4, stone900: #1C1917
  ├── olive50: #F7FEE7, olive100: #ECFCCB, olive700: #4D7C0F, olive800: #3F6212
  ├── amber50: #FFFBEB, amber100: #FEF3C7, amber600: #D97706
  └── red100: #FEE2E2, red600: #DC2626

[Layer 2: Semantic Tokens] (tokens.js: semantic.colors & tailwind theme)
  ├── primary -> olive700 (#4D7C0F)
  ├── primaryDark -> olive800 (#3F6212)
  ├── primaryLight -> olive100 (#ECFCCB)
  ├── brandAccent -> amber600 (#D97706)
  ├── background -> stone50 (#FAFAF9)
  ├── surface -> #FFFFFF
  └── text.title / text.primary -> Slate 900 / Stone 900

[Layer 3: Component Tokens & Utilities] (Tailwind Classes & ZaUI Overrides)
  ├── bg-primary, text-primary, border-primary
  ├── bg-primary/10 (light tint badges & hover states)
  └── ZaUI CSS Vars: --zaui-primary-color: #4D7C0F
```

---

## 4. Khuyến Nghị & Hành Động Tiếp Theo

1. **Thực hiện làm sạch triệt để (Refactor Clean-up)**: Thay thế toàn bộ 10 điểm hardcoded màu cũ sang class Semantic Token (`primary`, `primaryDark`, `primary/10`).
2. **Kiểm tra độ tương phản (Accessibility Contrast Check)**:
   - Màu chữ trắng trên nền `#4D7C0F` (CTA Buttons): Contrast ratio $\approx 4.8:1$ (Đạt chuẩn WCAG 2.1 AA).
   - Màu chữ `neutral-900` trên nền `stone-50`: Contrast ratio $> 12:1$ (Đạt chuẩn WCAG 2.1 AAA).
