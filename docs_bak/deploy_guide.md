# Hướng Dẫn Triển Khai Backend Thực Tế (Free Tier Stack: Render + Neon + Cloudflare R2 + Upstash)

Tài liệu này hướng dẫn chi tiết quy trình triển khai toàn bộ hệ thống Backend Django lên môi trường Production với chi phí **0 VNĐ**, đảm bảo tính ổn định, bảo mật và tương thích hoàn toàn với các quy chuẩn kỹ thuật.

---

## 1. Tổng Quan Kiến Trúc Hệ Thống

| Thành phần | Nền tảng đề xuất | Giới hạn Free Tier | Vai trò |
| :--- | :--- | :--- | :--- |
| **Database** | [Neon.tech](https://neon.tech) | 0.5 GB Storage, Serverless Postgres | Lưu trữ dữ liệu quan hệ, tự động backup, không bị xóa định kỳ. |
| **Object Storage** | [Cloudflare R2](https://dash.cloudflare.com) | 10 GB Storage, **0đ phí Egress (băng thông tải về miễn phí)** | Lưu trữ hình ảnh món ăn, menu, avatar người dùng. |
| **Redis & Celery Broker** | [Upstash.com](https://upstash.com) | 500.000 requests/ngày, 256 MB RAM | Hàng đợi Celery tác vụ ngầm (Zalo OA alert, ZNS) & Bộ nhớ đệm (Cache). |
| **Backend Service** | [Render.com](https://render.com) | 512 MB RAM, 0.1 CPU, Free SSL | Chạy Django App (WSGI/Gunicorn), tự động build từ Git repo. |
| **Keep-Alive Monitor** | [UptimeRobot](https://uptimerobot.com) | 50 monitors, chu kỳ 5 phút | Ping định kỳ giữ server không bị "ngủ" (chống cold start). |

---

## 2. Quy Trình Triển Khai Chi Tiết (6 Bước)

### Bước 1: Khởi Tạo Managed PostgreSQL Trên Neon.tech

1. Truy cập [Neon.tech](https://neon.tech) và đăng nhập bằng GitHub.
2. Tạo Project mới:
   - **Name**: `bepdi6-db`
   - **Region**: `ap-southeast-1` (Singapore) hoặc `us-east-1`
3. Lấy chuỗi kết nối:
   - Tại màn hình Dashboard, bật checkbox **Connection Pooling**.
   - Copy chuỗi kết nối `DATABASE_URL` có dạng:
     ```text
     postgresql://<user>:<password>@<endpoint>-pooler.<region>.aws.neon.tech/<dbname>?sslmode=require
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
     - `Endpoint URL`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
4. **Bật Public URL** (để frontend hiển thị ảnh):
   - Vào bucket `bepdi6-media` → **Settings** → **Public Access**.
   - Bật subdomain `R2.dev` hoặc gắn Custom Domain riêng (ví dụ: `media.yourdomain.com`).

---

### Bước 3: Khởi Tạo Redis Miễn Phí Trên Upstash (Phục vụ Cache & Celery)

1. Truy cập [Upstash.com](https://upstash.com) và đăng nhập bằng GitHub.
2. Tạo Database mới:
   - **Name**: `bepdi6-redis`
   - **Type**: `Regional`
   - **Region**: `ap-southeast-1` (Singapore)
   - **TLS (SSL)**: Enabled
3. Lấy chuỗi kết nối:
   - Trong tab **Details** → Copy chuỗi kết nối Redis URL dạng:
     ```text
     rediss://default:<password>@<endpoint>.upstash.io:6379
     ```
   - Cấu hình tách biệt database `0` cho Cache và `1` cho Celery:
     - `REDIS_URL=rediss://default:<password>@<endpoint>.upstash.io:6379/0`
     - `CELERY_BROKER_URL=rediss://default:<password>@<endpoint>.upstash.io:6379/1`

---

### Bước 4: Cấu Hình Dự Án Django

Dự án đã được tích hợp đầy đủ cấu hình trong `apps/backend/config/settings.py` và `apps/backend/build.sh`:
- **Static Files**: Quản lý bằng `WhiteNoise`.
- **Media Files**: Tích hợp `Cloudflare R2` qua `django-storages` & `boto3`.
- **Database**: Tự động nhận diện `DATABASE_URL` từ Neon.
- **Cache & Celery**: Kết nối bảo mật qua `rediss://` tới Upstash.

---

### Bước 5: Khởi Tạo Web Service Trên Render.com

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
| `DATABASE_URL` | `postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require` | Connection String từ Neon |
| `REDIS_URL` | `rediss://default:...@...upstash.io:6379/0` | Cache Redis từ Upstash |
| `CELERY_BROKER_URL` | `rediss://default:...@...upstash.io:6379/1` | Celery Broker từ Upstash |
| `USE_S3_STORAGE` | `True` | Kích hoạt lưu file lên Cloudflare R2 |
| `AWS_ACCESS_KEY_ID` | `bea18cc9d74cc995a2b76e98a417afc4` | Access Key ID của R2 Token |
| `AWS_SECRET_ACCESS_KEY`| `3fa580a708436516cceb27aed7f68025fae861559ec70599d376154d4103b5e0` | Secret Access Key của R2 Token |
| `AWS_STORAGE_BUCKET_NAME`| `bepdi6-media` | Tên Bucket R2 |
| `AWS_S3_ENDPOINT_URL` | `https://008f945c24908989db53b1934f2072d8.r2.cloudflarestorage.com` | Endpoint Cloudflare R2 |
| `AWS_S3_CUSTOM_DOMAIN`| `pub-xxxx.r2.dev` hoặc domain riêng | Domain xem ảnh công khai (tùy chọn) |
| `ALLOWED_HOSTS` | `.onrender.com,localhost,127.0.0.1` | Tên miền chấp nhận request |

5. Nhấn **Create Web Service** để bắt đầu quá trình deploy.

---

### Bước 6: Thiết Lập Keep-Alive (Chống Cold Start)

Gói miễn phí của Render sẽ tạm dừng (spin-down) sau 15 phút không nhận được truy cập. Để khắc phục:

1. Django đã có sẵn endpoint `/api/health/` và `/health/`.
2. Đăng ký tài khoản miễn phí tại [UptimeRobot](https://uptimerobot.com).
3. Tạo Monitor mới:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `BepDi6 Backend Keep-Alive`
   - **URL**: `https://bepdi6-backend.onrender.com/api/health/`
   - **Monitoring Interval**: `10 minutes` (10 phút/lần)
4. **Kết quả**: Backend luôn ở trạng thái sẵn sàng phục vụ, không bị trễ thời gian phản hồi ở request đầu tiên.
