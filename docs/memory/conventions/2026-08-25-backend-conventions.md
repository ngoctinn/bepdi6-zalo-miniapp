---
title: "Quy chuẩn mã nguồn và phát triển Backend"
description: "Quy ước API Envelope format, giao dịch atomic, ruff lint, và quy tắc an toàn dữ liệu"
tags: [conventions, coding-standards, envelope-response, ruff, safety]
created: 2026-08-25
updated: 2026-08-25
type: "preference"
importance: 3
source: scan
---

# Quy chuẩn mã nguồn và phát triển Backend

## Overview
Dự án tuân thủ các quy chuẩn nghiêm ngặt về chất lượng code, tính nhất quán của API và bảo toàn dữ liệu giao dịch.

## Key Points
- **API Envelope Pattern**: Toàn bộ endpoint trả về response bọc dạng `{success: true, data: ...}` khi thành công, hoặc `{success: false, error: {code: "ERROR_CODE", message: "Chi tiết"}}` khi gặp lỗi (xử lý tự động qua `EnvelopeJSONRenderer` và `custom_exception_handler`).
- **Database & Tooling**:
  - Dùng `uv` độc quyền: `uv run pytest`, `uv run ruff format . && uv run ruff check --fix .`, `uv run pyright`.
  - Không sửa file migration đã áp dụng.
  - Không chỉnh sửa dữ liệu đơn hàng ở trạng thái kết thúc (`COMPLETED`, `CANCELLED`).
- **Nghiệp vụ tính toán**: Không tin cậy dữ liệu tính toán giá, phí ship từ frontend; tất cả được validate và tính toán lại ở Backend service.
- **Bất đồng bộ**: Mọi lệnh gọi ra ngoài mạng (Zalo OA OpenAPI, ZNS) đều phải gửi qua Celery task chạy nền sau khi commit transaction (`transaction.on_commit`).

## Related
- `AGENTS.md`
- `apps/backend/config/renderers.py`
- `apps/backend/config/exceptions.py`
- `pyproject.toml`
