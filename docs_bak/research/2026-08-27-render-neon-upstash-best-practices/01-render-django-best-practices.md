# Best Practices: Triển Khai Django trên Render.com

## 1. Môi Trường Runtime & Python Version
- **Khóa chính xác phiên bản Python**: Luôn chỉ định `PYTHON_VERSION=3.11.10` hoặc file `.python-version` ở thư mục gốc repo. Tránh để Render tự động upgrade lên các phiên bản Python thử nghiệm (như 3.14) gây lỗi không tương thích với Django và `django-unfold`.
- **Sử dụng uv Package Manager**: Cài đặt gói siêu tốc và đồng nhất với file lock `uv.lock`. Build script chuẩn:
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  source $HOME/.cargo/env
  uv sync --frozen --no-dev
  ```

## 2. Web Server (Gunicorn) & Static Files (WhiteNoise)
- **Gunicorn WSGI**: Khởi chạy với cấu hình workers phù hợp (VD: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 60`).
- **WhiteNoise Static Storage**: Đặt ngay sau `SecurityMiddleware`. Sử dụng `CompressedManifestStaticFilesStorage` để băm tên file (cache busting vĩnh viễn) và nén gzip/brotli.
- **Build command**: Luôn chạy `uv run python manage.py collectstatic --no-input` trước khi chạy server.

## 3. Quản Lý File Media (Cloudflare R2 qua django-storages)
- **Ephemeral Filesystem**: Render xóa toàn bộ filesystem khi redeploy hoặc restart. Không bao giờ lưu file upload của user trực tiếp vào ổ cứng cục bộ trên tier miễn phí.
- **Tích hợp Cloudflare R2 / S3**: Sử dụng `django-storages[s3]` cùng `boto3`. Thiết lập endpoint S3 tương thích R2 và cấu hình custom domain hoặc public access để giảm chi phí băng thông (Egress $0).

## 4. Xử Lý Cold Start & Health Check
- Free tier trên Render sẽ sleep sau 15 phút idle.
- Thiết lập endpoint `/api/health/` nhẹ nhàng không truy vấn DB nặng để các dịch vụ uptime monitoring (như UptimeRobot, Cron-job.org) có thể ping định kỳ giữ ấm service nếu cần.
