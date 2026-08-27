# Hướng Dẫn Phát Triển Dự Án Bếp Dì 6 (Fullstack Developer Guide)

Tài liệu hướng dẫn chi tiết từ thiết lập môi trường, cấu hình tài khoản Zalo Developer, khởi chạy Backend & Frontend, quy trình kiểm thử thiết bị thật đến quy trình đóng gói và xuất bản.

---

## 1. Yêu Cầu Hệ Thống & Cài Đặt Công Cụ

### 1.1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18 LTS hoặc 20 LTS.
- **Python**: Phiên bản 3.11 trở lên.
- **uv**: Package manager tốc độ cao cho Python ([cài đặt uv](https://github.com/astral-sh/uv)):
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- **Docker & Docker Compose**: Để chạy PostgreSQL 16 và Redis 7.

### 1.2. Cài đặt Zalo Mini App CLI (`zmp-cli`)
Cài đặt công cụ dòng lệnh toàn cục:
```bash
npm install -g zmp-cli
```
Kiểm tra cài đặt:
```bash
zmp --version
```

### 1.3. Cài đặt VS Code Extensions (Khuyên Dùng)
Mở VS Code (`Ctrl + Shift + X`), tìm và cài đặt:
1. **Zalo Mini App Extension** (`zalo-mini-app.zalo-mini-app-extension`):
   - Trình giả lập ZMP Simulator trực tiếp trong IDE.
   - Tạo mã QR để quét thử trên điện thoại thật.
   - Nút Deploy 1-click lên Zalo Cloud.
2. **Tailwind CSS IntelliSense**: Gợi ý class CSS cho template `zaui-bistro`.
3. **Ruff** (`charliermarsh.ruff`): Linter và formatter cho Backend Django.
4. **Prettier - Code Formatter**: Format code TypeScript/React.

---

## 2. Thiết Lập Tài Khoản & Zalo Mini App ID

### 2.1. Đăng ký Mini App trên Cổng Zalo Developers
1. Truy cập [Zalo for Developers](https://developers.zalo.me/) và đăng nhập bằng tài khoản Zalo cá nhân.
2. Chọn **Thêm ứng dụng mới** $\rightarrow$ Chọn loại **Zalo Mini App**.
3. Điền thông tin ứng dụng:
   - **Tên Mini App**: Bếp Dì 6 (hoặc tên thử nghiệm).
   - **Danh mục**: Ẩm thực / F&B.
   - **Liên kết Zalo Official Account (OA)**: Chọn Zalo OA Doanh nghiệp của quán.
4. Sau khi tạo xong, copy **App ID** (chuỗi 18 chữ số, ví dụ `1234567890123456789`).

### 2.2. Cấu hình App ID vào Codebase
Mở file [`apps/frontend/app-config.json`](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/app-config.json) và [`apps/frontend/zmp-cli.json`](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/zmp-cli.json), cập nhật trường `app.title` và `appId` tương ứng.

### 2.3. Đăng nhập CLI trên Máy
Chạy lệnh sau tại thư mục `apps/frontend`:
```bash
cd apps/frontend
zmp login
```
Terminal sẽ hiển thị một mã QR Code. Mở ứng dụng Zalo trên điện thoại, quét mã QR và xác nhận đăng nhập.

---

## 3. Khởi Động Hạ Tầng & Backend Django

### 3.1. Khởi động PostgreSQL & Redis qua Docker
Tại thư mục gốc của dự án (`/home/ngoctin/Projects/bepdi6-zalo-miniapp`):
```bash
# Khởi động container nền cho DB và Cache
docker compose -f infra/docker-compose.yml up -d postgres redis
```
Kiểm tra trạng thái container:
```bash
docker compose -f infra/docker-compose.yml ps
```

### 3.2. Cấu hình biến môi trường
Tạo file `.env` từ mẫu `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và kiểm tra các cấu hình:
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/bepdi6_db`
- `REDIS_URL=redis://localhost:6379/0`
- `CELERY_BROKER_URL=redis://localhost:6379/1`
- `SHOP_LATITUDE=10.7769` & `SHOP_LONGITUDE=106.7009` (Tọa độ quán)
- `HAVERSINE_MULTIPLIER=1.3` (Hệ số bù trừ khoảng cách đường chim bay)

### 3.3. Chạy Migration và Khởi động Server
```bash
# Cài đặt dependency (nếu chưa chạy)
uv sync

# Chạy migration database
uv run python apps/backend/manage.py migrate

# Khởi động Backend API Server (cổng 8000)
uv run python apps/backend/manage.py runserver 0.0.0.0:8000
```

### 3.4. Kiểm tra chất lượng code Backend
```bash
# Kiểm tra lỗi linter và format
uv run ruff check . && uv run ruff format --check .

# Chạy unit tests
uv run pytest -q
```

---

## 4. Khởi Động Frontend Zalo Mini App

Mở một cửa sổ Terminal mới:
```bash
cd apps/frontend

# Khởi động ZMP Dev Server
npm run start
# hoặc: zmp start
```

Khi chạy thành công, terminal sẽ cung cấp:
1. **Web Simulator URL**: `http://localhost:3000` (để xem nhanh trên máy tính).
2. **Terminal QR Code**: Dùng app Zalo trên điện thoại quét để mở ngay ứng dụng thật.

---

## 5. Quy Trình Kiểm Thử & Debug (Testing Workflow)

### 5.1. Khi nào dùng Web Simulator (Máy tính)?
- Sử dụng khi đang căn chỉnh layout, màu sắc Tailwind CSS, tạo component mới, sửa text, hoặc debug logic giỏ hàng cục bộ (Zustand store).
- Mở `http://localhost:3000` trên trình duyệt Chrome/Edge và bật chế độ **Device Toolbar** (`F12` $\rightarrow$ `Ctrl + Shift + M`) chọn khung hiển thị iPhone hoặc Android.

### 5.2. Khi nào BẮT BUỘC dùng Điện thoại thật?
Các tính năng sau của Zalo Mini App **không hoạt động trên trình duyệt web** mà bắt buộc phải test trên điện thoại:
1. **Xác thực SĐT (`getPhoneNumber`)**: Zalo SDK chỉ sinh token SĐT hợp lệ trên ứng dụng Zalo thật.
2. **Lấy thông tin người dùng (`getUserInfo`)**: Tên, avatar, ID Zalo.
3. **Mở khung chat OA (`openChat`)**: Nút liên hệ CSKH với Zalo OA.
4. **Theo dõi OA (`followOA`)**: Nút bấm quan tâm trang OA của quán.

**Cách test trên điện thoại:**
- Mở Zalo trên điện thoại cá nhân (đã đăng nhập tài khoản Developer hoặc đã được thêm vào danh sách Tester của app).
- Quét mã QR hiển thị ở terminal `npm run start`.
- Ứng dụng sẽ nạp trực tiếp phiên bản code mới nhất trên máy tính của bạn qua mạng LAN/Wifi.

---

## 6. Quy Trình Đóng Gói, Deploy & Xuất Bản (Go-Live)

### 6.1. Đóng gói và Deploy bản Testing lên Zalo Cloud
Khi hoàn thành một đợt tính năng và muốn đưa lên cloud để nhân viên/quản lý test thử từ xa:
```bash
cd apps/frontend
zmp deploy
```
- CLI sẽ hỏi loại phiên bản (chọn **Testing**) và yêu cầu nhập mô tả (ví dụ: `v1.0.0 - Hoàn thiện menu và đặt hàng VietQR`).
- Quá trình build Vite sẽ chạy và upload gói ứng dụng (bundle ~670 kB) lên hạ tầng Zalo.
- Sau khi deploy xong, bạn sẽ nhận được một **QR Code cố định** và link phiên bản testing để gửi cho team nội bộ.

### 6.2. Cấu hình Domain Whitelist cho Backend (Bắt Buộc cho Production)
Mọi request gọi API từ Zalo Mini App đến Backend đều bị Zalo kiểm soát:
1. Truy cập [developers.zalo.me](https://developers.zalo.me/) $\rightarrow$ Chọn Mini App của bạn.
2. Vào mục **Thiết lập Mini App** $\rightarrow$ **Cấu hình Domain (Domain Whitelist)**.
3. Thêm domain API của bạn (Bắt buộc phải có HTTPS, ví dụ: `https://api.bepdi6.vn`).

### 6.3. Gửi Xét Duyệt Xuất Bản Chính Thức
1. Trên trang quản trị Zalo Developers, vào mục **Quản lý phiên bản**.
2. Tìm bản Testing đã được kiểm thử ổn định nhất.
3. Bấm **Gửi xét duyệt**.
4. Điền đầy đủ thông tin: Ảnh chụp màn hình ứng dụng, mô tả tính năng, tài khoản test cho đội ngũ kiểm duyệt Zalo.
5. Zalo sẽ duyệt và phản hồi kết quả trong vòng **1 đến 3 ngày làm việc**.

---

## 7. Các Lỗi Phổ Biến & Cách Khắc Phục (Troubleshooting)

| Vấn đề | Nguyên nhân | Cách xử lý |
| :--- | :--- | :--- |
| `zmp: command not found` | Chưa cài đặt `zmp-cli` global hoặc chưa nạp biến môi trường | Chạy `npm install -g zmp-cli` hoặc dùng `npx zmp <command>`. |
| Quét QR không load được Mini App | Điện thoại và máy tính không cùng mạng Wifi (LAN) | Đảm bảo điện thoại và máy tính kết nối chung 1 mạng Wifi, hoặc kiểm tra tường lửa (Firewall) không chặn cổng `3000`. |
| Gọi API Backend báo lỗi `Network Error` | Chưa cấu hình CORS hoặc chưa Whitelist domain | Trên local, kiểm tra `CORS_ALLOW_ALL_ORIGINS = True` trong `settings.py`. Trên production, kiểm tra cấu hình Domain Whitelist trên trang Zalo Dev. |
| `getPhoneNumber` trả về mã lỗi `-1400` | Chưa liên kết OA Doanh nghiệp hoặc app chưa được cấp quyền | Kiểm tra Zalo OA đã xác thực doanh nghiệp và đã bật quyền truy cập SĐT trên Zalo Developer Console. |
