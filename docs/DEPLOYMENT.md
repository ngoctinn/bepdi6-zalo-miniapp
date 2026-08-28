# Hướng Dẫn Deploy Render & Giữ Thức 24/7 (Keep-Alive Runbook)

Tài liệu này hướng dẫn chi tiết cách triển khai backend **Bếp Dì 6 (Django + uv)** lên **Render.com** (gói Free) và các phương pháp chống "ngủ đông" (spin-down sau 15 phút) hiệu quả nhất.

---

## 1. Cơ Chế Hoạt Động & Ngân Sách Render Free

- **Quy tắc Spin-Down:** Gói Free của Render sẽ tự động tắt (sleep) container nếu không nhận được bất kỳ request nào trong vòng **15 phút**. Request đầu tiên sau khi ngủ sẽ mất **30–60 giây (Cold start)** để khởi động lại.
- **Hạn mức 750 giờ/tháng:** 
  - 1 tháng = $31 \times 24 = 744 \text{ giờ}$.
  - Nếu chỉ có **1 Web Service**: Bạn có thể ping giữ thức 24/7 cả tháng mà không hết giờ.
  - Nếu có **2 Web Service trở lên**: Tuyệt đối không ping 24/7 cho cả 2 service (sẽ tiêu tốn $744 \times 2 = 1488 \text{ giờ} > 750 \text{ giờ}$, tài khoản sẽ bị tạm ngưng vào giữa tháng). Hãy dùng phương pháp hẹn giờ (cron-job.org).

---

## 2. Các Bước Triển Khai Backend Lên Render

### Bước 1: Chuẩn Bị Database (Khuyên dùng Supabase hoặc Neon)
⚠️ **Cảnh báo:** Database PostgreSQL Free trên Render sẽ bị **xóa sạch sau 30 ngày**.
- Khuyến nghị: Đăng ký miễn phí tại [Supabase](https://supabase.com/) hoặc [Neon](https://neon.tech/) để lấy PostgreSQL connection string vĩnh viễn không bị xóa (`DATABASE_URL`).

### Bước 2: Tạo Web Service Trên Render
Có 2 cách:
- **Cách A (Tự động qua Blueprint):**
  1. Đăng nhập [dashboard.render.com](https://dashboard.render.com/).
  2. Chọn **Blueprints** $\rightarrow$ **New Blueprint Instance**.
  3. Kết nối với repo GitHub `bepdi6-zalo-miniapp`. Render sẽ tự đọc file [`render.yaml`](../render.yaml).
- **Cách B (Thủ công):**
  1. Nhấn **New +** $\rightarrow$ **Web Service** $\rightarrow$ Chọn repo.
  2. **Runtime:** `Python 3`
  3. **Build Command:**
     ```bash
     curl -LsSf https://astral.sh/uv/install.sh | sh && export PATH="$HOME/.local/bin:$PATH" && uv sync --frozen && uv run python manage.py migrate
     ```
  4. **Start Command:**
     ```bash
     export PATH="$HOME/.local/bin:$PATH" && uv run gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
     ```
  5. **Health Check Path:** `/healthz`

### Bước 3: Cấu Hình Biến Môi Trường (Environment Variables)
Tại tab **Environment** của Web Service trên Render, thêm các biến:
- `DEBUG`: `False`
- `SECRET_KEY`: `<chuỗi-ngẫu-nhiên-bảo-mật>`
- `ALLOWED_HOSTS`: `.onrender.com,localhost,127.0.0.1`
- `DATABASE_URL`: `postgresql://<user>:<password>@<host>:<port>/<dbname>` (từ Supabase/Neon)
- `CORS_ALLOWED_ORIGINS`: `https://h5.zdn.vn,zbrowser://h5.zdn.vn`
- `PYTHON_VERSION`: `3.12.0`

---

## 3. Cấu Hình Giữ Thức 24/7 (Anti Sleep Keep-Alive)

Sau khi deploy, URL của backend sẽ có dạng: `https://bepdi6-backend.onrender.com`.  
Endpoint kiểm tra sức khỏe siêu nhẹ: `https://bepdi6-backend.onrender.com/healthz`.

### Lựa chọn 1: Dùng UptimeRobot (Khuyên dùng nhất - 24/7 cho 1 service)
1. Đăng ký tài khoản miễn phí tại [uptimerobot.com](https://uptimerobot.com/).
2. Nhấn **+ Add New Monitor**:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Bep Di 6 Backend KeepAlive`
   - **URL (or IP):** `https://<tên-app-của-bạn>.onrender.com/healthz`
   - **Monitoring Interval:** Chọn `5 minutes` hoặc `10 minutes`.
3. Nhấn **Create Monitor**.
$\rightarrow$ UptimeRobot sẽ tự động gửi request GET mỗi 5-10 phút, giữ container không bao giờ bị rơi vào trạng thái ngủ.

---

### Lựa chọn 2: Dùng cron-job.org (Tiết kiệm giờ nếu có nhiều service)
Nếu bạn chạy nhiều service và muốn tiết kiệm giờ instance (chỉ thức trong giờ bán hàng):
1. Đăng ký tại [cron-job.org](https://cron-job.org/).
2. Tạo cron job:
   - **URL:** `https://<tên-app-của-bạn>.onrender.com/healthz`
   - **Schedule:** `Every 10 minutes`.
   - **Time Frame:** Giới hạn từ `07:00` đến `23:00` (GMT+7).
$\rightarrow$ Cách này tiết kiệm được 33% số giờ (chỉ tiêu thụ ~496 giờ/tháng), giúp bạn an tâm chạy thêm service khác.

---

### Lựa chọn 3: Dùng GitHub Actions Tích Hợp Sẵn
Repo đã có sẵn workflow [`.github/workflows/keep-alive.yml`](../.github/workflows/keep-alive.yml).
1. Vào **Settings** của GitHub repo $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Thêm secret:
   - **Name:** `RENDER_BACKEND_URL`
   - **Value:** `https://<tên-app-của-bạn>.onrender.com/healthz`
3. Workflow sẽ tự động ping mỗi 10 phút một lần.

---

## 4. Kiểm Tra Hoạt Động (Verification)
- Mở trình duyệt hoặc curl:
  ```bash
  curl -I https://<tên-app-của-bạn>.onrender.com/healthz
  ```
  Kết quả trả về HTTP `200 OK` với body `{"status": "ok", "app": "bepdi6-backend"}` là thành công.
