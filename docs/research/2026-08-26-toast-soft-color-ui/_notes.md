# Nghiên Cứu & Thiết Kế Best Practice: Hệ Thống Thông Báo Soft Color & Minimal Icon (Zalo Mini App)

## 1. Bối cảnh & Yêu cầu thiết kế
- **Mục tiêu:** Xây dựng phong cách thông báo (Toast / Snackbar) theo chuẩn UX/UI hiện đại nhất:
  - **Màu nền dạng Soft Color (Pastel / Tông màu dịu nhẹ)**: Không dùng nền tối đặc, không dùng viền cứng (`border: none`).
  - **Icon tối giản (Minimal Icon)**: Icon màu đồng điệu với trạng thái semantic, không gắt.
  - **Typography sắc nét**: Màu chữ trầm đậm (`#1C1917` / `#292524`) bảo đảm chuẩn tiếp cận WCAG AAA trên nền sáng.
  - **Đồng bộ nhận diện Rustic Olive & Warm Ginger** của Bếp Dì 6.

---

## 2. Best Practice Phối Màu Soft Color & Semantic Palette

Theo các Design System hàng đầu cho Mobile & Mini App (Apple Human Interface Guidelines, Material 3 Tonal Palettes, Zalo Design Guidelines):

| Trạng thái | Nền Soft Color (Tonal Background) | Màu Icon Semantic | Màu Chữ Nội Dung | Cảm xúc & Ngữ cảnh UX |
| :--- | :--- | :--- | :--- | :--- |
| **Thành công (Success)** | `olive50` / `stone100` (`#F4FCE3` hoặc `#ECFCCB`) | `olive700` (`#4D7C0F`) | `olive900` (`#1F2937` / `#292524`) | Nhẹ nhàng, dễ chịu, xác nhận thao tác thành công (đặt hàng, sao chép, cập nhật). |
| **Cảnh báo (Warning)** | `amber50` (`#FFFBEB`) | `amber600` (`#D97706`) | `amber900` / `neutral900` (`#78350F` / `#292524`) | Ấm áp, nhắc nhở nhẹ không gây hoảng loạn (quán sắp đóng cửa, giỏ hàng trống). |
| **Lỗi (Error)** | `red50` / `red100` (`#FEF2F2` / `#FEE2E2`) | `red600` (`#DC2626`) | `red900` / `neutral900` (`#991B1B` / `#292524`) | Rõ ràng nhưng không gay gắt chói mắt như nền đỏ tươi. |
| **Thông tin / Mặc định (Info)** | `stone100` / `neutral100` (`#F5F5F4` / `#FAFAF9`) | `neutral700` (`#44403C`) | `neutral900` (`#1C1917`) | Trung tính, thanh lịch, trang nhã. |

---

## 3. Cấu Trúc CSS & Thông Số Kỹ Thuật (Soft & Borderless)

```scss
/* ==========================================================================
   ZaUI Snackbar: Modern Soft Color & Borderless Pill Design
   ========================================================================== */
.zaui-snackbar {
  border: none !important;
  border-radius: 9999px !important; // Dạng Floating Pill bo tròn mềm mại
  padding: 10px 20px !important;
  font-size: 13.5px !important;
  font-weight: 500 !important;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04) !important;
  bottom: calc(var(--zaui-safe-area-inset-bottom, 16px) + 24px) !important;
  backdrop-filter: blur(12px) !important;
}

// Success (Olive Soft)
.zaui-snackbar-success {
  background-color: #f7fee7 !important; // olive50
  color: #365314 !important; // olive900
}
.zaui-snackbar-success .zaui-icon,
.zaui-snackbar-success svg {
  color: #4d7c0f !important; // olive700
  fill: #4d7c0f !important;
}

// Warning (Ginger Soft)
.zaui-snackbar-warning {
  background-color: #fffbeb !important; // amber50
  color: #78350f !important;
}
.zaui-snackbar-warning .zaui-icon,
.zaui-snackbar-warning svg {
  color: #d97706 !important; // amber600
  fill: #d97706 !important;
}

// Error (Red Soft)
.zaui-snackbar-error {
  background-color: #fef2f2 !important; // red50
  color: #991b1b !important;
}
.zaui-snackbar-error .zaui-icon,
.zaui-snackbar-error svg {
  color: #dc2626 !important; // red600
  fill: #dc2626 !important;
}

// Info / Default (Stone Soft)
.zaui-snackbar-info,
.zaui-snackbar-default {
  background-color: #f5f5f4 !important; // stone100
  color: #1c1917 !important;
}
.zaui-snackbar-info .zaui-icon,
.zaui-snackbar-default .zaui-icon,
.zaui-snackbar-info svg,
.zaui-snackbar-default svg {
  color: #44403c !important;
  fill: #44403c !important;
}
```

---

## 4. Đánh giá Ưu Điểm UX/UI
1. **Thị giác (Aesthetics):** Nhìn sang trọng, dịu mắt, hòa quyện hoàn hảo với các tông màu ẩm thực miền Tây và nền sáng của Zalo.
2. **Trải nghiệm đọc (Readability):** Chữ đậm trên nền pastel nhẹ đảm bảo người dùng lướt đọc thông tin chỉ trong 1.5 giây mà không bị mỏi mắt hay giật mình.
3. **Không viền (Borderless Cleanliness):** Sử dụng soft shadow thay cho border giúp loại bỏ cảm giác thô cứng, đạt chuẩn Modern Minimalist.
