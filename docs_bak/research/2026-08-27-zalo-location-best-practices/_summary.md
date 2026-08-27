# Nghiên Cứu & Đánh Giá Best Practices: Luồng Lấy Vị Trí Người Dùng Trong Zalo Mini App

**Ngày:** 2026-08-27  
**Chủ đề:** Zalo Mini App `getLocation` API & User Location Flow  
**Tài liệu tham chiếu:** [Zalo Mini App Docs - getLocation](https://mini.zalo.me/docs/api/get-location) & Zalo Open API Docs  

---

## 1. Cơ Chế Hoạt Động Của Zalo Mini App `getLocation` API (Tài Liệu Chính Thức)

Theo quy định bảo mật thông tin người dùng và kiến trúc Zalo Mini App Platform:

### 1.1. Luồng Token Exchange (Server-to-Server)
* **Client-side (`zmp-sdk/apis`):** Khi gọi `await getLocation({})`, Zalo SDK **không trả về tọa độ `latitude` và `longitude` trực tiếp** trong object kết quả. Thay vào đó, API chỉ trả về một chuỗi `token`.
* **Đặc tính của Token:**
  * Chỉ dùng được **1 lần duy nhất (Single-use)**.
  * Hết hạn sau **2 phút**.
* **Server-side (Giải mã qua Zalo Open API):**
  * Backend gửi request đến Zalo Open API endpoint: `https://graph.zalo.me/v2.0/me/info` (hoặc endpoint giải mã location tương ứng) với header `access_token` và `code` (chính là token nhận từ SDK), cùng `secret_key` của Mini App.
  * Zalo Open API sẽ giải mã và trả về thông tin tọa độ thực tế (`latitude`, `longitude`, thông tin quận/huyện/tỉnh thành nếu có).

### 1.2. Yêu Cầu Phân Quyền & Xét Duyệt (Permission & Review Policy)
1. **Scope trên Zalo Developer Dashboard:** Mini App bắt buộc phải đăng ký quyền `getLocation` (User Location) và giải trình mục đích sử dụng trong phần Xét duyệt ứng dụng (App Review).
2. **Quyền riêng tư người dùng:** Khi gọi `getLocation({})`, Zalo Client tự động hiển thị Popup hệ thống xin phép cấp quyền truy cập vị trí. Người dùng có quyền **Từ chối (Deny)** hoặc **Đồng ý (Allow)**.
3. **Môi trường:** API chỉ hoạt động trong Zalo App thật (iOS/Android). Trên trình duyệt web dev (Zalo Mini App Simulator / Chrome devtools) sẽ trả về lỗi hoặc cần mock data.

---

## 2. Đánh Giá Hiện Trạng Frontend Bếp Dì 6 (`apps/frontend`)

Hiện tại, luồng lấy vị trí nằm tại [select-location/index.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/pages/select-location/index.tsx#L61-L77):

```typescript
const handleGetCurrentLocation = async () => {
  setIsGettingLocation(true);
  try {
    const data = await getLocation({});
    if (data && data.latitude && data.longitude) {
      setFormData((prev) => ({
        ...prev,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      }));
    }
  } catch {
    // Fallback
  } finally {
    setIsGettingLocation(false);
  }
};
```

### Các Vấn Đề Phát Sinh & Vi Phạm Best Practice:

| # | Vấn Đề | Mức Độ | Chi Tiết & Rủi Ro |
|---|---|---|---|
| 1 | **Sai lệch dữ liệu trả về từ SDK (`data.latitude` / `longitude`)** | 🔴 **Nghiêm trọng (Bug logic)** | `getLocation({})` của ZMP SDK trả về `{ token: string }`. Code hiện tại giả định SDK trả về `data.latitude` và `data.longitude`. Khi chạy trên Zalo App thật, `data.latitude` sẽ là `undefined`, tọa độ không được cập nhật và giữ nguyên mặc định (10.762622, 106.660172). |
| 2 | **Thiếu Backend API giải mã Token** | 🔴 **Nghiêm trọng (Kiến trúc)** | Chưa có API `/api/v1/customers/location/decode-token/` (hoặc tương tự) để nhận `token` từ frontend, gọi Zalo Open API giải mã ra `(latitude, longitude, address)`. |
| 3 | **Chỉ lấy GPS mà không tự điền địa chỉ chữ (`address_text`)** | 🟡 **Trải nghiệm (UX)** | Người dùng bấm "Lấy vị trí GPS" nhưng ô nhập liệu `Địa chỉ nhận hàng (address_text)` vẫn trống rỗng hoặc bắt người dùng tự gõ tay lại địa chỉ, dễ dẫn đến sai lệch giữa text và tọa độ tính ship. |
| 4 | **Tự động áp đặt vị trí / Thiếu xử lý User Deny Permission** | 🟡 **UX & Zalo Review** | Khi người dùng từ chối cấp quyền, `catch` block nuốt lỗi im lặng, không có Toast/Modal giải thích lý do tại sao cần quyền vị trí và hướng dẫn người dùng bật định vị. |
| 5 | **Không có Geocoding / Reverse Geocoding (hoặc bản đồ chọn điểm)** | 🟡 **Tính chính xác giao hàng** | Khi giao đồ ăn, tính tiền ship dựa vào tọa độ GPS để tính km khoảng cách. Nếu người dùng tự gõ text một đường nhưng tọa độ lưu một nẻo, phí ship tính toán sẽ bị sai. |

---

## 3. Best Practice Chuẩn Cho Luồng Vị Trí Mini App Giao Đồ Ăn

```
[Người dùng bấm "Lấy vị trí hiện tại" hoặc mở Modal thêm địa chỉ]
                          │
                          ▼
            [Gọi ZMP SDK `getLocation({})`]
                          │
             ┌────────────┴────────────┐
             ▼ (Từ chối)               ▼ (Đồng ý)
    [Báo lỗi thân thiện &       [Nhận `token` từ Zalo]
     hướng dẫn tự nhập tay]            │
                                       ▼
                       [POST /api/v1/customers/location/decode-token/]
                                       │
                                       ▼
                       [Backend gọi Zalo Open API giải mã]
                                       │
                                       ▼
                       [Trả về { latitude, longitude, address }]
                                       │
                                       ▼
                [Điền tự động vào Form: address_text + lat + lng]
                                       │
                                       ▼
                [Người dùng kiểm tra, chỉnh sửa số nhà và Lưu]
```

1. **Minh bạch & Cho phép chỉnh sửa:** Không bao giờ âm thầm ghi đè địa chỉ người dùng mà không hiển thị cho họ xem/xác nhận lại số nhà, tên đường.
2. **Xử lý Graceful Fallback:**
   * Môi trường Dev/Browser: Có mock location hoặc cho phép nhập tay địa chỉ.
   * Người dùng từ chối cấp quyền: Hiển thị thông báo và cho phép nhập địa chỉ tay bình thường.
3. **Reverse Geocoding / Geocoding tích hợp:** Tọa độ GPS đi kèm chuỗi địa chỉ dễ hiểu (Phường, Quận, Tỉnh/TP).
