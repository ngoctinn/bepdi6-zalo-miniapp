# Nghiên Cứu Tài Liệu Chính Thức Zalo Mini App: Họ Tên, Số Điện Thoại & Vị Trí

> **Ngày thực hiện:** 2026-08-27  
> **Mục tiêu:** Xác định nguyên nhân và cách khắc phục khi Zalo Mini App sau khi deploy thực tế vẫn không lấy được Họ tên, Số điện thoại và Vị trí của người dùng.

---

## 1. Bản chất cơ chế bảo mật của Zalo Mini App Platform

Theo tài liệu chính thức từ [Zalo Mini App Docs](https://mini.zalo.me/docs), Zalo áp dụng chính sách bảo mật dữ liệu người dùng nghiêm ngặt (tuân thủ Nghị định 13/2023/NĐ-CP):

| Thông tin | Client SDK API | Dữ liệu Client nhận được | Cách giải mã dữ liệu thực |
| :--- | :--- | :--- | :--- |
| **Họ tên & Avatar** | `getUserInfo({ autoRequestPermission: true })` | Trả về `userInfo.name`, `userInfo.avatar` (khi user bấm Cho phép) | Không cần giải mã server-to-server. |
| **Số điện thoại** | `getPhoneNumber()` | Chỉ trả về `token` (chuỗi mã hóa) | Gửi `token` + `access_token` lên Server backend, Server gọi Zalo Open API cùng `secret_key`. |
| **Vị trí (GPS)** | `getLocation({})` | Chỉ trả về `token` (chuỗi mã hóa) | Gửi `token` + `access_token` lên Server backend, Server gọi Zalo Open API cùng `secret_key`. |

---

## 2. Phân tích nguyên nhân khi test trên App thật vẫn không lấy được

Qua rà soát mã nguồn hiện tại kết hợp tài liệu chính thức:

### Nguyên nhân 1: Chưa gọi xin cấp quyền Số điện thoại (`getPhoneNumber`) và Thông tin (`getUserInfo`) ở Frontend
* Trong code hiện tại của dự án ([use-auth.ts](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/hooks/use-auth.ts)):
  ```ts
  accessToken = await getAccessToken({});
  await mutateLoginAsync({ access_token: accessToken });
  ```
  - App chỉ mới gọi `getAccessToken({})` chứ **chưa hề gọi `getPhoneNumber()` hay `getUserInfo()`** khi đăng nhập.
  - Do đó, Frontend không gửi `phone_token` hay `name` lên backend `POST /api/v1/auth/zalo`.
  - Backend nhận payload không có `phone_token` nên gán mặc định tên `Khách...` và `phone: ""`.

### Nguyên nhân 2: Giải mã vị trí ở Backend thiếu Header `access_token`
* Theo tài liệu Zalo Open API `/v2.0/me/info` cho `getLocation`:
  - Request từ Server lên Zalo cần 3 trường:
    - `access_token` (Access token của user)
    - `code` (Location token từ `getLocation()`)
    - `secret_key` (Secret key của Zalo App)
* Trong file backend [services.py](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/backend/apps/customers/services.py#L198-L203):
  ```python
  res = requests.get(
      "https://graph.zalo.me/v2.0/me/info",
      headers={
          "code": token,
          "secret_key": zalo_app_secret,
      },
      timeout=5,
  )
  ```
  - Backend đang thiếu header `access_token` khi gọi giải mã location, khiến Zalo API từ chối nếu không có token phiên của người dùng.

### Nguyên nhân 3: Cấu hình App Permissions trên Zalo Mini App Console
* Zalo yêu cầu Mini App phải được bật quyền truy cập:
  1. **User Information**: Quyền truy cập thông tin người dùng.
  2. **Phone Number**: Quyền truy cập số điện thoại (Cần Admin cấp hoặc nộp hồ sơ xét duyệt nếu chạy public).
  3. **Location**: Quyền truy cập vị trí thiết bị.
* Nếu tài khoản Zalo test không phải là **Admin / Developer / Tester** được thêm vào Mini App trên trang quản trị Zalo for Developers (`developers.zalo.me`), Zalo sẽ tự động chặn việc cấp `phone_token` và `location_token`.

### Nguyên nhân 4: Biến môi trường Backend (`ZALO_APP_ID`, `ZALO_APP_SECRET`)
* Nếu backend deploy (hoặc local backend) chưa cấu hình chính xác `ZALO_APP_ID` và `ZALO_APP_SECRET` khớp với App ID trên Zalo Developer Console, backend sẽ không thể giải mã token và tự động rơi vào fallback trả về dữ liệu rỗng.

---

## 3. Quy trình chuẩn để khắc phục

### Bước 1: Bật quyền & Phân vai trò trên Zalo Developer Console
1. Truy cập [developers.zalo.me](https://developers.zalo.me/) > Chọn Mini App của bạn.
2. Vào mục **Quản lý quyền (App Permissions)**: Bật quyền `User Profile`, `Phone Number`, `Location`.
3. Vào mục **Thành viên dự án**: Thêm số điện thoại tài khoản Zalo bạn dùng để test vào danh sách **Developer** hoặc **Tester**.

### Bước 2: Cập nhật luồng Đăng nhập tại Frontend ([use-auth.ts](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/hooks/use-auth.ts))
1. Cho phép người dùng bấm nút đăng nhập / liên kết thông tin:
   - Gọi `getUserInfo({ autoRequestPermission: true })` để lấy tên & avatar.
   - Gọi `getPhoneNumber({})` để lấy `phone_token`.
2. Gửi đồng thời `{ access_token, phone_token, name, avatar_url }` lên backend `POST /api/v1/auth/zalo`.

### Bước 3: Hoàn thiện API giải mã vị trí Backend ([services.py](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/backend/apps/customers/services.py))
- Bổ sung `access_token` vào header khi gọi sang `https://graph.zalo.me/v2.0/me/info` để giải mã Location Token.

### Bước 4: Tự động fill thông tin vào Form Thêm địa chỉ ([select-location/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/select-location/index.tsx))
- Khi mở modal thêm địa chỉ mới, tự động khởi tạo `recipient_name: customer.name` và `phone: customer.phone`.
