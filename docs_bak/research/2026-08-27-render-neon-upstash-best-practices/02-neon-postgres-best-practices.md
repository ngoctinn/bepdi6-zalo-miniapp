# Best Practices: Tối Ưu Neon Serverless Postgres với Django

## 1. Connection Pooling (PgBouncer Built-in)
- **Sử dụng Pooled Endpoint**: Luôn sử dụng connection string có đuôi `-pooler` (ví dụ `ep-xxxx-pooler.c-11.us-east-1.aws.neon.tech`). Neon tích hợp sẵn PgBouncer chạy ở chế độ **Transaction Mode**, giúp giải quyết bài toán giới hạn `max_connections` (thường chỉ 10-20 connections trên free tier).
- **Lưu ý với Migrations**: Với các lệnh DDL phức tạp hoặc migration (`python manage.py migrate`), có thể dùng Direct endpoint nếu gặp vấn đề với session variables, tuy nhiên đa số migration thông thường vẫn chạy tốt qua pooler.

## 2. Cấu Hình Kết Nối & SSL trong Django Settings
- **Bắt buộc SSL**: Neon yêu cầu SSL toàn diện. Cấu hình `sslmode=verify-full` hoặc `sslmode=require`.
- **Quản lý Persistent Connections (`CONN_MAX_AGE`)**:
  - Với Pooled Connection, đặt `CONN_MAX_AGE = 600` (10 phút) để tái sử dụng kết nối HTTP request mà không phải thiết lập lại TCP/TLS handshake.
  - Thêm `CONN_HEALTH_CHECKS = True` (Django 4.1+) để tự động kiểm tra tính khả dụng của connection trước khi execute query.

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "OPTIONS": {
            "sslmode": "require",
        },
        "CONN_MAX_AGE": 600,
        "CONN_HEALTH_CHECKS": True,
    }
}
```

## 3. Ứng Phó Với Cơ Chế "Scale to Zero"
- **Cold Wakeup**: Neon tự động sleep compute khi không có truy vấn để tiết kiệm tài nguyên. Thời gian đánh thức mất ~300ms - 1s.
- **Connection Retry**: Cấu hình backend không throw 500 ngay khi connection timeout mà retry lại 1 lần nếu gặp `OperationalError`.
- **Tránh Session State**: Tránh sử dụng các tính năng phụ thuộc session postgres như `LISTEN/NOTIFY`, `TEMPORARY TABLE` hoặc `SET/RESET` cục bộ vì PgBouncer transaction pooling sẽ reset state giữa các queries.
