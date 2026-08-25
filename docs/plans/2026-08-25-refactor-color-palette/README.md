---
slug: 2026-08-25-refactor-color-palette
auto: true
status: done
---

# Plan: Chuẩn Hóa Bảng Màu Dự Án Theo Best Practice (Loại Bỏ Màu Đỏ Đô)

**Mode:** normal
**Created:** 2026-08-25
**Status:** ✅ DONE

## Context

Ứng dụng hiện tại có một số điểm dùng màu đỏ đất (`#C0392B` - `redTerracotta`) cho header/tiêu đề thương hiệu ("Bếp Dì 6 - Mắm Chưng Miền Tây"), cùng với việc pha trộn giữa dải gradient vàng và các biến màu rải rác. Yêu cầu đặt ra là:
1. Rà soát toàn bộ hệ màu của giao diện (tokens, CSS/SCSS, Tailwind, component inline styles).
2. **Loại bỏ hoàn toàn màu đỏ đô / đỏ đất (`redTerracotta`, v.v.)** khỏi header và hệ thống định danh chính.
3. Nghiên cứu bảng màu sạch sẽ, cao cấp và chuyên nghiệp hơn theo chuẩn ẩm thực hiện đại & Zalo Mini App UX best practice.
4. Tổ chức hệ thống Design Tokens màu sắc chuẩn mực (Primitive/Base Tokens -> Semantic Tokens -> Component Tokens), dễ mở rộng và bảo trì.

---

## Nghiên cứu & Định Hướng Bảng Màu Sạch Sẽ (Clean Food Palette)

### 1. Bảng màu chủ đạo được đề xuất (Forest Sage & Warm Clean Neutral):
- **Brand Primary (Xanh lá sạch / Botanical Forest)**: `#16A34A` (Emerald 600) / Active `#15803D` (Emerald 700) / Background tint `#F0FDF4` (Emerald 50) -> Đại diện cho thực phẩm tươi sạch, an tâm, phong cách ẩm thực miền quê thanh sạch.
- **Brand Identity / Accent Title**: Thay vì dùng đỏ đô cho tiêu đề quán, chuyển sang tone **Slate / Charcoal Black sâu (`#0F172A` / `#1E293B`)** kết hợp badge điểm nhấn **Emerald/Warm Amber**, mang lại cảm giác cực kỳ sạch sẽ (clean minimalist), hiện đại và dễ chịu cho mắt.
- **Background & Canvas**: Nền sạch tone ấm nhẹ nhàng `#FAFAF9` (Stone 50) hoặc nền trắng `#FFFFFF` với Header trong trẻo, tinh gọn thay thế cho dải gradient vàng gắt.
- **Functional Colors (Status & Alerts)**:
  - **Success**: `#16A34A` / bg: `#DCFCE7`
  - **Warning / Pending**: `#D97706` (Amber 600) / bg: `#FEF3C7`
  - **Danger / Cancelled**: Chuẩn hóa thành màu Error tiêu chuẩn UI `#E11D48` hoặc `#DC2626` (chỉ dùng thuần túy cho trạng thái lỗi/hủy/xóa, không dùng trang trí hay đặt tên thương hiệu).

---

## Assumptions

- Toàn bộ màu đỏ trong dự án sẽ chỉ dùng cho Semantic Error/Destructive Actions (hủy đơn, xóa địa chỉ, validation error).
- Tiêu đề thương hiệu, header bar sẽ dùng màu nhận diện sạch sẽ, trung tính cao cấp (`#0F172A` / `#1E293B`) kết hợp cùng hệ xanh lá chủ đạo.
- Không làm gãy API hoặc các luồng đặt hàng, chỉ tái cấu trúc styling & tokens.

---

## Not Building

- Không thay đổi logic backend hay APIs.
- Không sửa layout cấu trúc chức năng của các trang ngoài việc chuẩn hóa style/color.

---

## AUTOPILOT (IMPORTANT — DO NOT DEVIATE EVEN IN LONG CONVERSATIONS)

This plan was created with `--auto`. When resuming or continuing this plan, follow this contract exactly. Do NOT ask the user for confirmation between phases.

**Per-phase loop:**

1. Dispatch all tasks in the current phase using the standard cf-implementer protocol (sequential or parallel as marked). **Progress checkpoints are mandatory:** before each dispatch, edit the Progress table `⬜ TODO` → `🔄 IN PROGRESS`; on `[CF-RESULT: success]`, edit `🔄 IN PROGRESS` → `✅ DONE` — never skip `🔄 IN PROGRESS`, even under autopilot. Apply normal retry rules. If a task ends ❌ FAILED after retry → STOP autopilot, mark the failing task ❌ FAILED in the plan file (and revert the phase row in `README.md` from ✅ DONE to ❌ FAILED for big plans if it was already flipped), report to user.
2. After all tasks in the phase reach ✅ DONE, run `/cf-review` on the uncommitted changes (no extra arguments — reviews everything that has not been committed yet, which is this phase's work).
3. Parse review findings:
   - 🚨 **Critical** and ⚠️ **Important** → must be fixed.
   - 💡 **Suggestions** → log them in the upcoming commit body, do NOT block.
4. If Critical/Important findings exist:
   - Dispatch one cf-implementer call with a fix task that lists the findings verbatim. Files: union of files referenced by the findings.
   - If the fix cf-implementer returns `[CF-RESULT: failure]`, STOP autopilot immediately (do NOT consume the second review round). Mark the phase ❌ FAILED (and revert the README phase row if applicable). Surface the failure to user.
   - Otherwise, re-run `/cf-review`.
   - If Critical/Important still present after this 2nd review → STOP autopilot, mark phase ❌ FAILED (and revert the README phase row if applicable), report both review outputs to user.
   - Maximum 2 review rounds per phase total (initial + 1 fix attempt).
5. Once review is clean (no Critical/Important):
   - `git add -A`
   - `git commit -m "<type>(<scope>): <phase-name>` (conventional commit). Body lists tasks completed + any Suggestion-level findings that were intentionally left as follow-ups.
   - NEVER use `--no-verify`. NEVER include AI/Claude co-author lines (project rule #6).
6. Immediately proceed to the next phase. Do NOT ask "Continue? (y/n)". The user already authorized autopilot at plan approval.

**Stop conditions (only these):**

- Task fails after its 1 retry.
- The fix cf-implementer returns `[CF-RESULT: failure]` (do not consume the second review round).
- Review round 2 still has Critical or Important findings.
- Review output from `/cf-review` cannot be reliably parsed.
- `git commit` fails repeatedly after attempted hook fixes.
- User explicitly interrupts (Ctrl+C, message).
- Plan file shows all phases ✅ DONE.

**Drift guard:** if Claude finds itself about to ask the user "should I commit?" or "should I continue to the next phase?" while running an `auto: true` plan, that is a drift bug. Re-read this section and proceed.

---

## Progress

| Status  | Phase   | Task |
| ------- | ------- | ---- |
| ✅ DONE | Phase 1 | Cập nhật hệ thống Design Tokens (`tokens.js`, `app.scss`) theo chuẩn best practice và loại bỏ `redTerracotta` |
| ✅ DONE | Phase 1 | Cập nhật Header & tiêu đề thương hiệu tại các trang (`home`, `order`, `profile`, `header.tsx`) sang bảng màu sạch |
| ✅ DONE | Phase 1 | Rà soát và làm sạch các component UI (`product-card`, `tabs`, `category-list`, `order-item-card`, `product-detail-sheet`, `checkout`, `order-detail`) |
| ✅ DONE | Phase 1 | Kiểm tra toàn diện lint, build và giao diện tổng thể |

---

## Tasks

#### Phase 1 [sequential]

1. **Cập nhật hệ thống Design Tokens (`tokens.js`, `app.scss`)**
   - Files:
     - `apps/frontend/src/tokens.js`
     - `apps/frontend/src/css/app.scss`
   - Actions:
     - Xóa bỏ `redTerracotta` và `redTerracottaDark`.
     - Cấu trúc lại Semantic Colors: `primary`, `surface`, `background`, `text.primary`, `text.secondary`, `text.brand`, `status.error`, `status.warning`, `status.success`, `status.info`.
     - Cập nhật biến SCSS `:root` để đồng bộ hoàn toàn với palette sạch, loại bỏ gradient vàng chói sang nền mềm mại / kính mờ cao cấp (`backdrop-blur`).
   - Verify: `npm run lint` & kiểm tra tokens import trong dự án.

2. **Cập nhật Header & Tiêu đề thương hiệu trên toàn bộ ứng dụng**
   - Files:
     - `apps/frontend/src/components/layout/header.tsx`
     - `apps/frontend/src/pages/home/index.tsx`
     - `apps/frontend/src/pages/order/index.tsx`
     - `apps/frontend/src/pages/profile/index.tsx`
   - Actions:
     - Thay class `text-redTerracotta` bằng `text-neutral-900` / `text-stone-900` font bold sắc nét.
     - Thay `bg-yellow-gradient` bằng nền sạch `bg-white/95 backdrop-blur-md border-b border-black/5` hoặc `bg-stone-50/95`.
   - Verify: Chạy thử và xác nhận không còn class `text-redTerracotta` hoặc gradient vàng gắt ở header.

3. **Rà soát & Chuẩn hóa các Component UI còn lại**
   - Files:
     - `apps/frontend/src/components/common/category-list.tsx`
     - `apps/frontend/src/components/common/tabs.tsx`
     - `apps/frontend/src/components/common/product-card.tsx`
     - `apps/frontend/src/components/common/order-item-card.tsx`
     - `apps/frontend/src/components/common/product-detail-sheet.tsx`
     - `apps/frontend/src/pages/checkout/index.tsx`
     - `apps/frontend/src/pages/order-detail/index.tsx`
     - `apps/frontend/src/pages/select-location/index.tsx`
   - Actions:
     - Chuẩn hóa các badge, pill active/inactive sang hệ Emerald/Stone đồng bộ.
     - Giữ màu đỏ chỉ dành cho Error / Hủy đơn / Xóa mục (chuẩn UI `#DC2626` / `text-rose-600` / `text-red-600`), không lạm dụng ở các vị trí không cần thiết.
   - Verify: Kiểm tra hiển thị nhất quán trên các trang.

4. **Kiểm tra & Xác minh hoàn tất (DoD)**
   - Actions:
     - Chạy `npm run lint` (0 errors).
     - Chạy `npm run build` (build thành công 100%).
   - Verify: Toàn bộ kiểm tra vượt qua.

---

## Risks

- **Risk**: Vỡ màu nền ở dark theme hoặc trên một số thiết bị Zalo.
  - **Mitigation**: Sử dụng màu chuẩn có độ tương phản cao (WCAG AA) trên nền sáng, dùng biến CSS token chuẩn của hệ thống.

---

## Next Steps

Sau khi kế hoạch được duyệt, hệ thống Autopilot sẽ tiến hành thực thi từng bước, chạy linter, build xác minh và commit hoàn tất.
