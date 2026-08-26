---
slug: 2026-08-26-soft-color-alert-system
auto: false
status: done
---

# Plan: Chuẩn Hóa Hệ Sinh Thái Feedback & Alert (Soft Color, Borderless & Minimal Icon)

**Mode:** normal
**Created:** 2026-08-26
**Status:** DONE

## Context
Chuẩn hóa toàn diện hệ thống thông báo / phản hồi (Toast, Confirm Dialog, Error Alert) theo phong cách thiết kế **Soft Color, Borderless & Minimal Icon** dựa trên nghiên cứu trong `docs/research/2026-08-26-toast-soft-color-ui/_notes.md`.

## Assumptions
- Sử dụng hoàn toàn nền Pastel Tonal nhẹ nhàng, không dùng viền cứng (`border: none`).
- Dạng Toast là Floating Pill `rounded-full` (`border-radius: 9999px`).
- Modal Confirm và Error dùng bo góc `rounded-3xl` và soft shadow.

## Approach
1. Bổ sung tokens `feedback` vào `tokens.js`.
2. Hoàn thiện các rules SCSS trong `app.scss`.
3. Tinh chỉnh `ConfirmModal` và `ErrorModal` sang chuẩn Soft Borderless.
4. Chạy Lint & Build xác minh.

## Not Building
- Không can thiệp logic mutation hoặc business flow ngoài UI layer.

## Progress

| Status  | Phase   | Task |
| ------- | ------- | ---- |
| ✅ DONE | Phase 1 | Cập nhật `tokens.js` với bộ màu Soft Feedback |
| ✅ DONE | Phase 1 | Cập nhật `ConfirmModal` & `ErrorModal` sang phong cách Soft Borderless |
| ✅ DONE | Phase 1 | Kiểm tra Linting & Build kiểm thử |

## Tasks

#### Phase 1 [sequential]

1. Cập nhật `tokens.js`
   - Files: `apps/frontend/src/tokens.js`
   - Verify: Export đầy đủ tokens `feedback`
2. Cập nhật `ConfirmModal` & `ErrorModal`
   - Files: `apps/frontend/src/components/common/confirm-modal.tsx`, `apps/frontend/src/components/common/error-modal.tsx`
   - Verify: Xóa viền thô cứng, sử dụng soft shadow và nền sáng mềm mại
3. Kiểm tra Lint & Build
   - Files: `apps/frontend/*`
   - Verify: `npm run lint` & `npm run build` pass không lỗi
