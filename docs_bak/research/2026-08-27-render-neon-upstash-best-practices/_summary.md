# Tổng Quan Nghiên Cứu: Best Practices Triển Khai Render.com + Neon Postgres + Upstash Redis

**Mã nghiên cứu**: `2026-08-27-render-neon-upstash-best-practices`  
**Ngày thực hiện**: 27/08/2026

## 1. Mục Đích & Bối Cảnh
Tài liệu tổng hợp các quy chuẩn kỹ thuật và best practices tối ưu khi vận hành hệ thống Django Backend (Bếp Dì 6) trên nền tảng Cloud Serverless kết hợp:
- **Render.com**: Hosting dịch vụ Web & Gunicorn WSGI.
- **Neon Postgres**: Cơ sở dữ liệu quan hệ Serverless PostgreSQL.
- **Upstash Redis**: In-memory data store cho Cache & Celery background workers.
- **Cloudflare R2**: Object Storage lưu trữ ảnh món ăn và media.

---

## 2. Danh Mục Các Phần Phân Tích Chi Tiết
1. [Part 1: Render.com & Django WSGI/Static/Python Best Practices](./01-render-django-best-practices.md)
   - Khóa phiên bản Python runtime (`PYTHON_VERSION=3.11.10` / `.python-version`) để tránh crash template rendering.
   - Nén & phân phát static files qua WhiteNoise Manifest Storage.
   - Xử lý cơ chế Ephemeral Disk bằng Cloudflare R2 / S3 Storage.
2. [Part 2: Neon Serverless Postgres Tối Ưu Cho Django](./02-neon-postgres-best-practices.md)
   - Sử dụng PgBouncer Connection Pooler endpoint (`-pooler`) tránh cạn kiệt connection limits.
   - Bật `CONN_HEALTH_CHECKS = True` và cấu hình `CONN_MAX_AGE = 600`.
   - Lưu ý về Transaction Mode và tránh phụ thuộc Session State.
3. [Part 3: Upstash Redis & Celery Message Broker Best Practices](./03-upstash-redis-celery-best-practices.md)
   - Bắt buộc giao thức mã hóa `rediss://` và cấu hình SSL params.
   - Tiết kiệm hạn ngạch commands (10k/ngày) bằng cách tinh chỉnh heartbeat, prefetch multiplier và tắt `CELERY_RESULT_BACKEND` khi không cần thiết.
   - Phân tách DB `/0` (Cache) và DB `/1` (Broker).

---

## 3. Kiến Nghị Hành Động Kế Tiếp
- Khởi tạo file `.python-version` chứa `3.11.10` và commit lên repo để Render luôn chọn đúng môi trường.
- Bổ sung `CONN_HEALTH_CHECKS = True` trong file [settings.py](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/backend/config/settings.py).
