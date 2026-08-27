# Phase 1: Critical Fixes (C1-C4)

**Plan:** [README.md](./README.md)
**Type:** sequential

## Progress

| Status  | Task                                                |
| ------- | --------------------------------------------------- |
| ✅ DONE | 1. Bỏ Google Font, chuyển sang font hệ thống       |
| ✅ DONE | 2. Thêm Safe Area Bottom cho tất cả fixed elements  |
| ✅ DONE | 3. Thống nhất header padding-right tránh menu Zalo  |

## Tasks

### 1. Bỏ Google Font, chuyển sang font hệ thống (C1)

Xóa import Google Font `Be Vietnam Pro` và cập nhật font-family stack thành font hệ thống thuần túy.

- Files:
  - `apps/frontend/src/css/app.scss` — Xóa dòng 1 (`@import url(...Be+Vietnam+Pro...)`), sửa `*` selector (L54-66) bỏ `"Be Vietnam Pro"` khỏi font-family
  - `apps/frontend/src/tokens.js` — Sửa `fontFamily.system` (L63-66) bỏ `"Be Vietnam Pro"` khỏi chuỗi
- Changes:
  ```diff
  # app.scss
  -@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap");
  
  * {
    font-family:
  -    "Be Vietnam Pro",
      -apple-system,
      BlinkMacSystemFont,
      "SF Pro Text",
  ```
  ```diff
  # tokens.js
  fontFamily: {
  -  system: '"Be Vietnam Pro", -apple-system, BlinkMacSystemFont, ...',
  +  system: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Roboto", "Segoe UI", sans-serif',
  },
  ```
- Verify: `npm run build` thành công. Grep `Be Vietnam Pro` trả về 0 kết quả.

---

### 2. Thêm Safe Area Bottom cho tất cả fixed elements (C2 + C3)

Tất cả fixed bottom bars và footer cần padding-bottom tính toán theo `--zaui-safe-area-inset-bottom` để hoạt động đúng trên iPhone có Home Indicator.

- Files:
  - `apps/frontend/src/pages/checkout/index.tsx` (L719) — Fixed bottom bar "Đặt hàng"
  - `apps/frontend/src/pages/order-detail/index.tsx` (L453) — Fixed bottom bar "Hủy đơn"
  - `apps/frontend/src/pages/select-location/index.tsx` (L309) — Fixed bottom bar "Thêm địa chỉ"
  - `apps/frontend/src/components/layout/footer.tsx` (L41) — Bottom navigation bar
  - `apps/frontend/src/css/app.scss` — Thêm utility class `.safe-bottom` để tái sử dụng
- Changes:
  Thêm utility class vào `app.scss`:
  ```css
  .safe-bottom {
    padding-bottom: max(16px, calc(var(--zaui-safe-area-inset-bottom, 16px) + 12px));
  }
  ```
  Áp dụng class `.safe-bottom` hoặc inline style cho từng fixed bottom bar:
  ```diff
  # checkout/index.tsx
  -<div className="fixed bottom-0 ... p-3.5 ...">
  +<div className="fixed bottom-0 ... px-3.5 pt-3.5 safe-bottom ...">
  
  # order-detail/index.tsx
  -<div className="fixed bottom-0 ... p-3 ...">
  +<div className="fixed bottom-0 ... px-3 pt-3 safe-bottom ...">
  
  # select-location/index.tsx
  -<div className="fixed bottom-0 ... p-4 ...">
  +<div className="fixed bottom-0 ... px-4 pt-4 safe-bottom ...">
  
  # footer.tsx
  -<div className="... pb-5 pt-4">
  +<div className="... pt-4 safe-bottom">
  ```
  **Lưu ý:** `order-success/index.tsx` (L29) đã xử lý đúng, KHÔNG cần sửa.
- Verify: `npm run build` thành công. Grep `safe-bottom` xuất hiện ở 5 vị trí (4 files + 1 CSS definition). Không còn file nào có `fixed bottom-0` mà thiếu safe area handling.

---

### 3. Thống nhất header padding-right tránh menu Zalo (C4)

Tất cả custom sticky header cần `pr-20` (80px) để tránh va chạm với menu cố định Zalo ở góc trên phải. Hiện header.tsx có `pr-24` (96px — quá rộng), còn HomePage, OrderPage, ProfilePage hoàn toàn thiếu.

- Files:
  - `apps/frontend/src/components/layout/header.tsx` (L21) — Giảm `pr-24` → `pr-20`
  - `apps/frontend/src/pages/home/index.tsx` (L132) — Thêm `pr-20` vào div tên quán
  - `apps/frontend/src/pages/order/index.tsx` (L51) — Thêm `pr-20` vào div tiêu đề
  - `apps/frontend/src/pages/profile/index.tsx` (L26) — Thêm `pr-20` vào div tiêu đề
- Changes:
  ```diff
  # header.tsx
  -<div className="header-margin flex h-10 items-center gap-2 px-3.5 pr-24 pt-2">
  +<div className="header-margin flex h-10 items-center gap-2 px-3.5 pr-20 pt-2">
  
  # home/index.tsx
  -<div className="header-margin px-3.5 pb-1 pt-3">
  +<div className="header-margin px-3.5 pr-20 pb-1 pt-3">
  
  # order/index.tsx
  -<div className="header-margin px-3.5 pb-1 pt-3">
  +<div className="header-margin px-3.5 pr-20 pb-1 pt-3">
  
  # profile/index.tsx
  -<div className="header-margin px-3.5 pb-1 pt-3">
  +<div className="header-margin px-3.5 pr-20 pb-1 pt-3">
  ```
- Verify: Grep `header-margin` — tất cả kết quả đều có `pr-20`. `npm run build` thành công.
