# Hướng Dẫn Triển Khai Backend Thực Tế (Free Tier Stack: Render + Neon + Cloudflare R2)

Tài liệu này hướng dẫn chi tiết quy trình triển khai toàn bộ hệ thống Backend Django lên môi trường Production với chi phí **0 VNĐ**, đảm bảo tính ổn định, bảo mật và tương thích hoàn toàn với các quy chuẩn kỹ thuật.

---

## 1. Tổng Quan Kiến Trúc Hệ Thống

| Thành phần | Nền tảng đề xuất | Giới hạn Free Tier | Vai trò |
| :--- | :--- | :--- | :--- |
| **Database** | [Neon.tech](https://neon.tech) | 0.5 GB Storage, Serverless Postgres | Lưu trữ dữ liệu quan hệ, tự động backup, không bị xóa định kỳ. |
| **Object Storage** | [Cloudflare R2](https://dash.cloudflare.com) | 10 GB Storage, **0đ phí Egress (băng thông tải về miễn phí)** | Lưu trữ hình ảnh món ăn, menu, avatar người dùng. |
| **Backend Service** | [Render.com](https://render.com) | 512 MB RAM, 0.1 CPU, Free SSL | Chạy Django App (WSGI/Gunicorn), tự động build từ Git repo. |
| **Keep-Alive Monitor** | [UptimeRobot](https://uptimerobot.com) | 50 monitors, chu kỳ 5 phút | Ping định kỳ giữ server không bị "ngủ" (chống cold start). |

---

## 2. Quy Trình Triển Khai Chi Tiết (5 Bước)

### Bước 1: Khởi Tạo Managed PostgreSQL Trên Neon.tech

1. Truy cập [Neon.tech](https://neon.tech) và đăng nhập bằng GitHub.
2. Tạo Project mới:
   - **Name**: `bepdi6-db`
   - **Region**: `ap-southeast-1` (Singapore) để tối ưu độ trễ với người dùng Việt Nam.
3. Lấy chuỗi kết nối:
   - Tại màn hình Dashboard, bật checkbox **Connection Pooling**.
   - Copy chuỗi kết nối `DATABASE_URL` có dạng:
     ```text
     postgresql://<user>:<password>@<endpoint>-pooler.ap-southeast-1.aws.neon.tech/<dbname>?sslmode=require
     ```

---

### Bước 2: Tạo Object Storage Trên Cloudflare R2

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/) → Vào menu **R2 Object Storage**.
2. **Tạo Bucket**:
   - Nhấn **Create bucket**.
   - Tên Bucket: `bepdi6-media`.
3. **Tạo API Token (S3 Compatible)**:
   - Nhấn **Manage R2 API Tokens** → **Create API Token**.
   - Quyền hạn (Permissions): **Object Read & Write**.
   - Lưu lại các thông tin:
     - `Account ID`
     - `Access Key ID`
     - `Secret Access Key`
4. **Bật Public URL** (để frontend hiển thị ảnh):
   - Vào bucket `bepdi6-media` → **Settings** → **Public Access**.
   - Bật subdomain `R2.dev` hoặc gắn Custom Domain riêng (ví dụ: `media.yourdomain.com`).

---

### Bước 3: Cấu Hình Dự Án Django

#### 1. Cài đặt các thư viện cần thiết (Sử dụng `uv`)
```bash
uv add dj-database-url psycopg2-binary whitenoise django-storages boto3 gunicorn
```

#### 2. Cấu hình `settings.py`

```python
import os
from pathlib import Path
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# 1. Bảo mật & Hosts
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-development-key")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,.onrender.com").split(
    ","
)
CSRF_TRUSTED_ORIGINS = [
    f"https://{host.strip()}"
    for host in ALLOWED_HOSTS
    if host.strip() and not host.startswith("localhost")
]

# 2. Database (Neon Postgres Pooling)
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL", "sqlite:///db.sqlite3"),
        conn_max_age=600,
        ssl_require=bool(os.getenv("DATABASE_URL")),
    )
}

# 3. Static Files (WhiteNoise)
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Đặt ngay sau SecurityMiddleware
    # ... các middleware khác
]

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# 4. Storage (Cloudflare R2 & WhiteNoise)
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

if os.getenv("USE_R2", "False").lower() == "true":
    AWS_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
    AWS_S3_ENDPOINT_URL = (
        f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com"
    )
    AWS_S3_REGION_NAME = "auto"
    AWS_S3_SIGNATURE_VERSION = "s3v4"
    AWS_S3_CUSTOM_DOMAIN = os.getenv("R2_CUSTOM_DOMAIN")

    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3.S3Storage",
        "OPTIONS": {
            "bucket_name": AWS_STORAGE_BUCKET_NAME,
            "access_key": AWS_ACCESS_KEY_ID,
            "secret_key": AWS_SECRET_ACCESS_KEY,
            "endpoint_url": AWS_S3_ENDPOINT_URL,
            "region_name": AWS_S3_REGION_NAME,
            "custom_domain": AWS_S3_CUSTOM_DOMAIN,
        },
    }
else:
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"
    STORAGES["default"] = {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    }
```

#### 3. Tạo Script `build.sh` tại thư mục ứng dụng backend
```bash
#!/usr/bin/env bash
# Dừng script nếu có lỗi xảy ra
set -o errexit

pip install uv
uv pip install --system -r pyproject.toml

python manage.py collectstatic --no-input
python manage.py migrate
```
*(Ghi nhớ cấp quyền thực thi cho file: `chmod +x build.sh`)*

---

### Bước 4: Khởi Tạo Web Service Trên Render.com

1. Đăng nhập [Render.com](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Chọn Repository Git của dự án.
3. Điền thông tin cấu hình:
   - **Name**: `bepdi6-backend`
   - **Region**: `Singapore (Southeast Asia)`
   - **Branch**: `main`
   - **Root Directory**: `apps/backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - **Plan**: `Free`
4. Cấu hình danh sách **Environment Variables**:

| Biến Môi Trường | Giá Trị Mẫu | Mô Tả |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11` | Phiên bản Python |
| `DEBUG` | `False` | Tắt chế độ debug trên production |
| `SECRET_KEY` | *(Chuỗi ngẫu nhiên dài 50 ký tự)* | Khóa bí mật của Django |
| `DATABASE_URL` | `postgresql://...@...neon.tech/bepdi6?sslmode=require` | Connection String từ Neon |
| `USE_R2` | `True` | Kích hoạt lưu file lên Cloudflare R2 |
| `R2_ACCOUNT_ID` | `c123456789abcdef...` | Account ID Cloudflare |
| `R2_ACCESS_KEY_ID` | `a1b2c3...` | Access Key ID của R2 Token |
| `R2_SECRET_ACCESS_KEY`| `x9y8z7...` | Secret Access Key của R2 Token |
| `R2_BUCKET_NAME` | `bepdi6-media` | Tên Bucket R2 |
| `R2_CUSTOM_DOMAIN` | `pub-xxxx.r2.dev` hoặc domain riêng | Domain xem ảnh công khai |
| `ALLOWED_HOSTS` | `.onrender.com` | Tên miền chấp nhận request |

5. Nhấn **Create Web Service** để bắt đầu quá trình deploy.

---

### Bước 5: Thiết Lập Keep-Alive (Chống Cold Start)

Gói miễn phí của Render sẽ tạm dừng (spin-down) sau 15 phút không nhận được truy cập. Để khắc phục:

1. Tạo một endpoint `health-check` trong Django (`/api/health/`):
   ```python
   from django.http import JsonResponse


   def health_check(request):
       return JsonResponse({"status": "ok"})
```
2. Đăng ký tài khoản miễn phí tại [UptimeRobot](https://uptimerobot.com).
3. Tạo Monitor mới:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `BepDi6 Backend Keep-Alive`
   - **URL**: `https://bepdi6-backend.onrender.com/api/health/`
   - **Monitoring Interval**: `10 minutes` (10 phút/lần)
4. **Kết quả**: Backend luôn ở trạng thái sẵn sàng phục vụ, không bị trễ thời gian phản hồi ở request đầu tiên.
