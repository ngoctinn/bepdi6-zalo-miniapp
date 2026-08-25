# Plan: Delivery & Pickup Scheduled Time Selection and Shop Prep Time Config

**Mode:** normal  
**Created:** 2026-08-25  
**Status:** IN PROGRESS  

## Overview
Implement time slot / scheduled delivery and pickup feature along with configurable store preparation time (`prep_time_minutes`) in `ShopConfig`. Users can choose between "Càng sớm càng tốt" (ASAP) or schedule a specific time slot today.

## Not Building
- Cross-day advance pre-orders (scheduling for tomorrow/next week) — limited to same-day operating hours.
- Per-product preparation times (using store-wide `prep_time_minutes` with rush-hour flexibility).

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

| Status  | Phase | Task |
| ------- | ----- | ---- |
| ✅ DONE | Phase 1: Backend Prep Time & Scheduled Validation | Task 1: Add `prep_time_minutes` to `ShopConfig` model, admin, serializers, and migration |
| ✅ DONE | Phase 1: Backend Prep Time & Scheduled Validation | Task 2: Update Order serializers & backend validation for `scheduled_delivery_at` |
| ✅ DONE | Phase 1: Backend Prep Time & Scheduled Validation | Task 3: Backend tests for prep time & scheduled time validation |
| ✅ DONE | Phase 2: Frontend Time Selection & Checkout UI | Task 1: Update TypeScript types (`ShopInfo`, `Order`, `CreateOrderRequest`) |
| ✅ DONE | Phase 2: Frontend Time Selection & Checkout UI | Task 2: Create `DeliveryTimePicker` component with ASAP / Scheduled slot options |
| ✅ DONE | Phase 2: Frontend Time Selection & Checkout UI | Task 3: Integrate `DeliveryTimePicker` into Checkout & Order Detail pages |

## Tasks

#### Phase 1: Backend Prep Time & Scheduled Validation [sequential]

1. **Add `prep_time_minutes` to `ShopConfig` model, admin, serializers, and run migration**
   - Files:
     - `apps/backend/apps/shipping/models.py`
     - `apps/backend/apps/shipping/serializers.py`
     - `apps/backend/apps/shipping/admin.py`
   - Action: Add integer field `prep_time_minutes` (default=20, min 5, max 180) to `ShopConfig`. Include in `PublicShopInfoSerializer` and `AdminShopConfigSerializer`. Run `uv run python apps/backend/manage.py makemigrations shipping` and `uv run python apps/backend/manage.py migrate`.
   - Verify: `uv run python -c "from apps.shipping.models import ShopConfig; print(ShopConfig.get_solo().prep_time_minutes)"`

2. **Update Order serializers & backend validation for `scheduled_delivery_at`**
   - Files:
     - `apps/backend/apps/orders/serializers.py`
     - `apps/backend/apps/orders/services.py`
     - `apps/backend/apps/orders/models.py`
   - Action: 
     - Expose `scheduled_delivery_at` in `OrderDetailSerializer` and `OrderListSerializer`.
     - In `OrderService.create_order` / validation, check: if `scheduled_delivery_at` is provided, ensure it is within open hours and `>= now() + (prep_time_minutes / 2)`.
   - Verify: `uv run pyright` and `uv run ruff check .`

3. **Backend tests for prep time & scheduled time validation**
   - Files:
     - `apps/backend/apps/shipping/tests/test_shop_config.py`
     - `apps/backend/apps/orders/tests/test_order_creation.py`
   - Action: Add test cases verifying public shop config returns `prep_time_minutes`, and orders with valid/invalid `scheduled_delivery_at` behave properly.
   - Verify: `uv run pytest apps/backend/apps/shipping/ apps/backend/apps/orders/ -q`

#### Phase 2: Frontend Time Selection & Checkout UI [sequential]

1. **Update TypeScript types (`ShopInfo`, `Order`, `CreateOrderRequest`)**
   - Files:
     - `apps/frontend/src/types/shop.types.ts`
     - `apps/frontend/src/types/order.types.ts`
   - Action: Add `prep_time_minutes` to `ShopInfo`. Add `scheduled_delivery_at?: string` to `CreateOrderRequest` and `Order`.
   - Verify: `npm run lint`

2. **Create `DeliveryTimePicker` component with ASAP / Scheduled slot options**
   - Files:
     - `apps/frontend/src/components/checkout/delivery-time-picker.tsx`
   - Action: Create a clean, elegant time picker supporting:
     - "Giao ngay / Lấy ngay" (ASAP) with estimated time (`~20 phút` for pickup, `~35-45 phút` for delivery).
     - "Hẹn giờ" with dynamic slots generation based on current time + prep_time + shop open/close hours.
   - Verify: `npm run build`

3. **Integrate `DeliveryTimePicker` into Checkout & Order Detail pages**
   - Files:
     - `apps/frontend/src/pages/checkout/index.tsx`
     - `apps/frontend/src/pages/order-detail/index.tsx`
   - Action:
     - Wire `DeliveryTimePicker` to both "DELIVERY" and "PICKUP" tabs on Checkout.
     - Pass `scheduled_delivery_at` in `payload` to `createOrderMutation`.
     - Show scheduled time tag on `OrderDetailPage` when order has `scheduled_delivery_at`.
   - Verify: `npm run lint && npm run build`

## Risks

- Timezone offsets between frontend browser and backend UTC/local time: Format and parse ISO 8601 strings with timezone or Vietnam offset (UTC+7).
- Store closing hour edge cases: If current time is close to `close_time`, disable slots that exceed `close_time`.

## Next Steps

Execute plan with autopilot: `/cf-plan-resume 2026-08-25-delivery-pickup-scheduled-time` or approve to start.
