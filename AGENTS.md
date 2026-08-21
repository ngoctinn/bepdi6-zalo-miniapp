# AGENTS.md

## 1. Commands

### Backend (Django + uv)
- Test targeted: `uv run pytest <path_to_file> -k "<test_name>" -q`
- Test file: `uv run pytest <path_to_file> -q`
- Format & Lint: `uv run ruff format . && uv run ruff check --fix .`
- Type check: `uv run pyright`
- Run migrations: `uv run python manage.py migrate`

### Frontend (React 18 + Vite + ZMP SDK)
- Lint: `npm run lint`
- Build: `npm run build`

### Infrastructure
- Start DB & Redis: `docker compose up -d postgres redis`

---

## 2. Safety & Guardrails (Strict)

- Do NOT touch or commit `.env`, secrets, or private keys.
- Do NOT edit committed/applied migration files.
- Do NOT drop database tables or run destructive raw SQL without explicit approval.
- Do NOT push directly to `main`/`master` or trigger automated PRs.
- Do NOT modify order data in terminal states (`COMPLETED`, `CANCELLED`).
- Do NOT use `pip` or `poetry`. Use `uv` exclusively.

---

## 3. Implementation Rules

- **Transactions**: Wrap order creation and status changes in `transaction.atomic`.
- **Idempotency**: Require `Idempotency-Key` header on `POST /orders` and payment endpoints.
- **Snapshots**: Snapshot item prices, option prices, and shipping addresses into the order record at checkout.
- **Business Logic**: Never calculate pricing, shipping fees, or voucher discounts on the frontend.
- **Async**: Route all external network requests (ZNS, Zalo OpenAPI, Routing API) through Celery tasks.
- **Envelope**: Return API responses as `{success: true, data: ...}` or `{success: false, error: {code, message}}`.

---

## 4. Verification & DoD

Before completing any task, ensure:
1. `uv run ruff check .` and `uv run ruff format --check .` pass with 0 errors.
2. `npm run lint` passes (for frontend changes).
3. Targeted tests for modified code pass.
4. No new dependencies added to `pyproject.toml` or `package.json` without confirmation.
