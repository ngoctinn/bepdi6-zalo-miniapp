# Phase 2: Card & Component Standardization

**Plan:** [README.md](./README.md)
**Type:** sequential

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

| Status  | Task                                                                 |
| ------- | -------------------------------------------------------------------- |
| ⬜ TODO | Task 2.1: Tái cấu trúc ProductCard theo chuẩn UX/UI Typography & Stepper |
| ⬜ TODO | Task 2.2: Tối ưu và đồng bộ QuantityStepper (touch target & font weight) |
| ⬜ TODO | Task 2.3: Chuẩn hóa CartItemCard, CategoryList & ProductFeatureList |

## Tasks

1. **Task 2.1: Tái cấu trúc ProductCard theo chuẩn UX/UI Typography & Stepper**
   - Files: `apps/frontend/src/components/common/product-card.tsx`
   - Content:
     - Tên món: nâng lên `text-sm font-semibold text-neutral-900 leading-snug`.
     - Giá bán: nâng lên `text-sm font-bold text-neutral-900` (hoặc `text-primary`), ký hiệu `đ` nhỏ `text-xs font-medium text-neutral-500`.
     - Stepper: Đồng bộ kích thước và padding, font số lượng `font-semibold text-xs text-neutral-900` thay vì `font-extrabold text-[#1E293B]`.
     - Badge "TẠM HẾT": Làm mờ nhẹ tinh tế và bố cục lại góc thẻ.
   - Verify: `npm run lint` & `npm run build`

2. **Task 2.2: Tối ưu và đồng bộ QuantityStepper**
   - Files: `apps/frontend/src/components/common/quantity-stepper.tsx`
   - Content: Căn chỉnh lại padding, font weight số lượng hiển thị `font-semibold`, touch target phù hợp mobile.
   - Verify: `npm run lint`

3. **Task 2.3: Chuẩn hóa CartItemCard, CategoryList & ProductFeatureList**
   - Files:
     - `apps/frontend/src/components/common/cart-item-card.tsx`
     - `apps/frontend/src/components/common/category-list.tsx`
     - `apps/frontend/src/components/common/product-feature-list.tsx`
   - Content: Loại bỏ hoàn toàn mã màu template cũ (`yellow100`, `orange600`), chuẩn hóa font-weight và size.
   - Verify: `npm run lint` & `npm run build`
