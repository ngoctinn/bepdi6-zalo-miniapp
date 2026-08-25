---
title: "Kiến trúc tổng thể Backend & Tech Stack"
description: "Django REST Framework 5.1, uv, PostgreSQL, Redis Celery và tích hợp Zalo OpenAPI / VietQR"
tags: [architecture, tech-stack, backend, django, celery, postgresql]
created: 2026-08-25
updated: 2026-08-25
type: "context"
importance: 3
source: scan
---

# Kiến trúc tổng thể Backend & Tech Stack

## Overview
Hệ thống backend cho ứng dụng Bếp Dì 6 Zalo Mini App được xây dựng bằng Python 3.11+ và Django REST Framework (Django 5.1), quản lý dependency bằng `uv`.

## Key Points
- **Quản trị Dependency & Môi trường**: Sử dụng `uv` độc quyền (`uv run pytest`, `uv run ruff`, `uv run python manage.py`).
- **Data Layer**: PostgreSQL là Source of Truth. Đơn hàng thực hiện snapshot đầy đủ giá món, tuỳ chọn, địa chỉ giao hàng.
- **Async & Caching**: Redis làm message broker cho Celery xử lý tác vụ thông báo nền (ZNS, Zalo OA OpenAPI alert).
- **Security & Phân quyền**: SimpleJWT với các vai trò Customer, Staff, Admin. Dữ liệu khách hàng được cô lập (`customer_id`).
- **Giao tiếp Frontend**: API trả về định dạng Envelope chuẩn `{success: true, data: ...}` hoặc `{success: false, error: {code, message}}`.

## Related
- `apps/backend/config/settings.py`
- `apps/backend/config/renderers.py`
- `apps/backend/config/exceptions.py`
- `docs/architecture.md`
- `pyproject.toml`
