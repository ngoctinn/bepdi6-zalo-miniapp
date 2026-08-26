---
slug: 2026-08-26-frontend-ui-refinement
auto: false
status: done
---

# Kế hoạch Chuẩn hóa Giao diện Frontend Bếp Dì 6 (Zalo Mini App Design Guidelines)

**Mã Task:** `2026-08-26-frontend-ui-refinement`  
**Chế độ:** Normal  
**Thời gian tạo:** 26/08/2026  
**Trạng thái:** ✅ DONE  

---

## 1. Bối cảnh (Context)
Dựa trên kết quả Audit giao diện theo tài liệu **Zalo Mini App Design Guidelines** (Official Guide) & Best Practices, và yêu cầu loại bỏ tính năng **Tìm kiếm món** không cần thiết để tinh gọn luồng trải nghiệm, kế hoạch này đã thực hiện:
1. Dọn dẹp / loại bỏ route và component tìm kiếm món (`/menu/search`, `SearchBar`, `SearchPage`).
2. Nâng cấp vùng chạm (Touch Target) đạt chuẩn **7mm - 9mm** (>= 28px-36px - 44px) cho các nút điều khiển nhỏ (`QuantityStepper`, nút xóa trong `select-location`, các icon action).
3. Đảm bảo 100% các trang con tuân thủ Header & Safe-area Zalo (`header-margin`, `pr-24` tránh nút Menu 3 chấm Zalo, nút Back ở góc trên bên trái).

---

## 2. Tiến độ thực hiện (Progress)

| Trạng thái | Giai đoạn | Nội dung |
| :--- | :--- | :--- |
| ✅ DONE | Phase 1 | Dọn dẹp & Loại bỏ Tìm kiếm món ăn (`/menu/search`, `SearchBar`, `SearchPage`) |
| ✅ DONE | Phase 2 | Tối ưu Touch Targets chuẩn Zalo (7mm - 9mm) cho Stepper & Buttons |
| ✅ DONE | Phase 3 | Chuẩn hóa Header, Safe-area & Kiểm tra Build Lint (0 errors) |

---

## 3. Chi tiết các công việc đã hoàn thành (Completed Tasks)

#### Phase 1: Dọn dẹp & Loại bỏ tính năng Tìm kiếm món
1. **Gỡ bỏ Route Tìm kiếm món trong Router**
   - Files: [router.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/router.tsx)
   - Xóa bỏ lazy load và route `/menu/search`.
2. **Xóa bỏ các file liên quan đến Search**
   - Đã xóa [pages/search/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/search/index.tsx) và [components/common/search-bar.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/search-bar.tsx).

#### Phase 2: Tối ưu Touch Targets chuẩn Zalo (7mm - 9mm)
1. **Nâng kích thước nút QuantityStepper**
   - Files: [quantity-stepper.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/quantity-stepper.tsx)
   - Size `small`: tăng từ 24px lên 28px (`w-7 h-7 min-w-[28px] min-h-[28px]`).
   - Size `medium`: tăng từ 28px lên 32px (`w-8 h-8 min-w-[32px] min-h-[32px]`).
   - Size `large`: tăng lên 36px (`w-9 h-9 min-w-[36px] min-h-[36px]`).
2. **Tối ưu nút Xóa và các nút action phụ**
   - Files: [select-location/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/select-location/index.tsx), [cart-item-card.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/cart-item-card.tsx)
   - Nút Xóa địa chỉ được đổi thành icon button `h-9 w-9` (36px) có nền nhẹ và hiệu ứng bấm nảy.
   - Nút Sửa tùy chọn trong card món ăn được thêm padding rộng rãi.

#### Phase 3: Chuẩn hóa Header, Safe-area & Kiểm tra Verification
1. **Trang Đặt hàng thành công (`/order-success`)**
   - Files: [order-success/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/order-success/index.tsx)
   - Bổ sung thanh 2 nút điều hướng rõ ràng: "Về trang chủ" & "Xem đơn hàng".
2. **Kiểm tra chất lượng mã nguồn**
   - `npm run lint`: Passed 100% (Prettier match).
   - `npm run build`: Vite build thành công 100% không lỗi.
