---
slug: 2026-08-25-standardize-ui-and-card-design
auto: true
status: in-progress
---

# Plan: Chuẩn hóa Giao diện, Typography và Card Gọi Món (Bếp Dì 6)

**Mode:** normal
**Created:** 2026-08-25
**Status:** IN PROGRESS

## Overview

Chuẩn hóa toàn bộ hệ thống giao diện frontend theo kết quả nghiên cứu trong `docs/research/2026-08-25-ui-inconsistency-and-card-design/01-ui-research-and-card-bestpractices.md`. Loại bỏ sự phân mảnh màu sắc, khắc phục xung đột font stack tiếng Việt (ưu tiên `Be Vietnam Pro`), chuẩn hóa phân cấp font size/weight và tái cấu trúc `ProductCard` cùng `QuantityStepper` để đạt trải nghiệm F&B tốt nhất.

## Not Building

- Không thay đổi logic backend, API contract hay logic tính giá/giỏ hàng trong `cart.store.ts`.
- Không thêm thư viện ngoài (UI library mới) vào `package.json`.

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
   - If the fix cf-implementer returns `[CF-RESULT: failure]`, STOP autopilot immediately (do NOT consume the second review round). Mark the phase ❌ FAILED (and revert the README phase row from ✅ DONE to ❌ FAILED if applicable). Surface the failure to user.
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

## Progress

| Status  | Phase                                     | File                                     | Tasks   |
| ------- | ----------------------------------------- | ---------------------------------------- | ------- |
| ⬜ TODO | Phase 1: Foundation (Font & Design Tokens) | [phase-1-foundation.md](./phase-1-foundation.md) | 2 tasks |
| ⬜ TODO | Phase 2: Card & Component Standardization | [phase-2-components.md](./phase-2-components.md) | 3 tasks |

## Assumptions

- `Be Vietnam Pro` là font chuẩn xuyên suốt cả ứng dụng.
- Rustic Olive Palette (`#4D7C0F`) là màu sắc chủ đạo; màu cam/vàng template cũ cần được dọn dẹp triệt để.

## Risks

- Một số text hardcoded trong các page phụ có thể bị ảnh hưởng nếu token font size thay đổi. Khắc phục: Giữ tương thích ngược token mapping trong `tokens.js`.

## Next Steps

Sau khi hoàn tất: chạy lint `npm run lint` & build `npm run build` để kiểm tra.
