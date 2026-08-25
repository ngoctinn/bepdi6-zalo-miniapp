---
slug: 2026-08-25-rustic-olive-color-palette
auto: false
status: done
---

# Plan: Triển Khai Bảng Màu "Rustic Olive & Warm Ginger" (Phương Án 2)

**Mode:** normal
**Created:** 2026-08-25
**Status:** ✅ DONE

## Context

Sau khi thảo luận và nghiên cứu về đặc trưng món ăn truyền thống **Mắm Chưng Miền Tây**, màu xanh lá công nghệ (`#16A34A`) đã được xác định là quá sáng và thiếu chiều sâu ẩm thực truyền thống. Người dùng đã chọn **Phương Án 2: "Rustic Olive & Warm Ginger" (Lá Chuối Hấp & Gừng Sả)** để mang lại cảm giác mộc mạc, tự nhiên, sang trọng và chuẩn vị quê hương.

---

## Chi Tiết Bảng Màu "Rustic Olive & Warm Ginger"

### 1. Brand Primary (Xanh Rêu Miền Tây / Rustic Olive Green)
- **Primary Base**: `#4D7C0F` (Lime/Olive 700) — Tone xanh lá chuối hấp/rau rừng dịu mát, mộc mạc và sang trọng.
- **Primary Dark / Active**: `#3F6212` (Olive 800) — Khi nhấn nút hoặc hover.
- **Primary Light / Tint**: `#ECFCCB` (Olive 100) — Dùng cho badge nhẹ hoặc nền phụ trợ.
- **Primary Soft Background**: `#F7FEE7` (Olive 50) — Nền chip/feature.

### 2. Accent & Secondary (Vàng Mật Ong Gừng / Ginger Amber)
- **Accent**: `#D97706` (Amber 600) — Điểm nhấn cho voucher, ưu đãi, thời gian giao hàng, pickup badge.
- **Accent Light**: `#FEF3C7` (Amber 100) / `#FFFBEB` (Amber 50).

### 3. Neutrals & Canvas Background
- **Background**: `#FBFBFA` (Warm Off-white / Mộc tự nhiên) tạo nền sạch nhưng ấm áp.
- **Surface**: `#FFFFFF` (Trắng tinh tế).
- **Text Primary / Title**: `#1C1917` (Stone 900) hoặc `#0F172A` (Slate 900) sắc nét.
- **Text Secondary**: `#57534E` (Stone 600) & `#78716C` (Stone 500).

### 4. Semantic Functional Colors
- **Success / Completed**: `#4D7C0F` (Rustic Olive) / `#ECFCCB`.
- **Warning / Pending**: `#D97706` (Amber 600) / `#FEF3C7`.
- **Danger / Destructive**: `#DC2626` (Red 600) / `#FEE2E2` (Chỉ dùng cho Hủy đơn, Xóa địa chỉ, Lỗi validation).

---

## Assumptions

- Toàn bộ component UI (CTA Buttons, Cart Float Button, CategoryList, Tabs, QuantityStepper, BottomNavigation active, ZaUI inputs) sẽ chuyển sang dùng hệ màu `#4D7C0F` (Rustic Olive).
- Giữ vững cấu trúc tokens và CSS variables chuẩn mực đã thiết lập ở bước trước.
- Không thay đổi bất kỳ logic nghiệp vụ hoặc API nào.

---

## Not Building

- Không thay đổi logic backend hay database.
- Không thay đổi cấu trúc layout component.

---

## Progress

| Status  | Phase   | Task |
| ------- | ------- | ---- |
| ✅ DONE | Phase 1 | Cập nhật hệ thống Design Tokens (`tokens.js`, `tailwind.config.js` nếu cần) sang Rustic Olive (`#4D7C0F`) |
| ✅ DONE | Phase 1 | Cập nhật ZaUI CSS Variables trong `app.scss` để đồng bộ toàn bộ button, tabbar, inputs sang tone Rustic Olive |
| ✅ DONE | Phase 1 | Chuẩn hóa các Component UI (`cart-float-button`, `product-card`, `category-list`, `tabs`, `vectors.tsx`, v.v.) |
| ✅ DONE | Phase 1 | Kiểm tra toàn diện lint, build và xác minh visual |

---

## Tasks

#### Phase 1 [sequential]

1. **Cập nhật hệ thống Design Tokens (`tokens.js`)**
   - Files: `apps/frontend/src/tokens.js`
   - Actions:
     - Định nghĩa dải màu `olive`: `olive50: "#F7FEE7"`, `olive100: "#ECFCCB"`, `olive600: "#65A30D"`, `olive700: "#4D7C0F"`, `olive800: "#3F6212"`.
     - Cập nhật `semantic.colors.primary` sang `base.colors.olive700` (`#4D7C0F`).
     - Cập nhật `semantic.colors.primaryDark` sang `base.colors.olive800` (`#3F6212`).
     - Cập nhật `semantic.colors.primaryLight` sang `base.colors.olive100` (`#ECFCCB`).
     - Cập nhật các component badge, chip, sub_cate border trong tokens.
   - Verify: `npm run lint`.

2. **Cập nhật ZaUI CSS Variables (`app.scss`)**
   - Files: `apps/frontend/src/css/app.scss`
   - Actions:
     - Cập nhật `--zaui-primary-color`, button backgrounds, focus ring, spinner dot, checkbox/radio sang `#4D7C0F` (pressed: `#3F6212`, secondary bg: `#ECFCCB`, secondary text: `#3F6212`).
   - Verify: Chạy thử và kiểm tra biến CSS.

3. **Cập nhật & Chuẩn hóa các Component UI**
   - Files:
     - `apps/frontend/src/components/common/vectors.tsx` (cập nhật active color icon).
     - `apps/frontend/src/components/common/category-list.tsx` (active tab dùng olive tone).
     - `apps/frontend/src/components/common/tabs.tsx` (active tab dùng olive tone).
     - `apps/frontend/src/components/common/cart-float-button.tsx` (shadow & badge tone).
     - `apps/frontend/src/components/common/product-card.tsx` (quantity controls & cart badge).
     - `apps/frontend/src/pages/order-detail/index.tsx` (timeline progress bar & badge).
   - Verify: Các thành phần UI hiển thị mộc mạc, đồng bộ tone Rustic Olive.

4. **Kiểm tra & Xác minh hoàn tất (DoD)**
   - Actions:
     - Chạy `npm run lint` (0 errors).
     - Chạy `npm run build` (build thành công 100%).
   - Verify: Hoàn tất kiểm tra chất lượng.

---

## Risks

- **Risk**: Một số class Tailwind cứng (như `text-green-800` hoặc `bg-emerald-50`) có thể bị lệch màu nếu không thay bằng semantic `primary` hoặc dải `olive/lime`.
  - **Mitigation**: Rà soát kỹ và chuyển sang dùng class `text-primary`, `bg-primary/10`, `border-primary` hoặc cấu hình token nhất quán trong Tailwind.

---

## Next Steps

Sau khi bạn duyệt kế hoạch này, tôi sẽ bắt đầu triển khai ngay từng bước!
