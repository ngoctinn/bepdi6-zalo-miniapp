# Điều hướng và Bố cục — Zalo Mini App

## Key Questions

- Thanh điều hướng (Navigation Bar), Menu cố định, Bottom Bar hoạt động thế nào?
- Cấu trúc Header component (ZUI) bao gồm những gì?
- Quy tắc bắt buộc về vị trí các thành phần điều hướng?

## Findings

### 1. Thanh điều hướng (Navigation Bar / Action Bar)

Zalo Mini App cung cấp thanh điều hướng mặc định ở phía trên.

**Cấu trúc Header Bar:**

```
┌─────────────────────────────────────────────┐
│  [←Back]     [Title Text]      [⋯ Menu]    │
│  Left        Center             Right       │
└─────────────────────────────────────────────┘
```

- **Left Button (Nút trái):** Thường là nút "back". Chỉ nên hiển thị ở **trang thứ cấp** (không phải trang chủ). **Không hiển thị nút "home"** ở khu vực này.
- **Title (Tiêu đề):** Hiển thị tên màn hình, chức năng hiện tại hoặc tên Mini App. Yêu cầu: ngắn gọn, dễ hiểu, tối ưu để hiển thị đầy đủ trên màn hình.
- **Right (Menu cố định):** Menu hệ thống cố định của Zalo — không thể tùy chỉnh vị trí.

**Cấu hình qua `app-config.json`:**

| Thuộc tính | Loại | Mô tả |
|:---|:---|:---|
| `headerTitle` | `string` | Tiêu đề hiển thị trên Action bar |
| `headerColor` | `string` | Màu nền Action bar + Status bar (hex) |
| `textColor` | `string` | Màu chữ/icon: `"white"` hoặc `"black"` |
| `actionBarHidden` | `boolean` | Ẩn hoàn toàn Action bar |
| `leftButton` | `string` | `"none"` hoặc `"back"` |

**Lưu ý quan trọng:**
- Không nên hiển thị thêm thanh điều hướng custom bên dưới navigation bar mặc định.
- Nếu `actionBarHidden: true`, cần tự quản lý chiều cao header và safe area phía trên.

### 2. Menu cố định (Fixed Menu)

Menu hệ thống cố định nằm ở **góc trên bên phải** trên tất cả các màn hình.

**Quy tắc bắt buộc:**

| Quy tắc | Chi tiết |
|:---|:---|
| Không tùy chỉnh vị trí | Menu luôn ở góc trên bên phải |
| Không đặt nội dung bên dưới | Tuyệt đối không đặt button, icon, hoặc nội dung quan trọng ở khu vực menu |
| Kiểm tra va chạm | Đảm bảo các button khác không bị menu che khuất hoặc khó chạm |
| Chọn màu phù hợp | Chọn chế độ sáng (light) hoặc tối (dark) tùy thiết kế, đảm bảo độ tương phản |

### 3. Nút "Trở lại" (Back Button)

- **Android:** Nên giữ nút back ở góc trên bên trái các trang phụ.
- **iOS:** Người dùng có thể vuốt từ mép trái màn hình (swipe-back gesture).
- Nên luôn cung cấp nút back trên các trang thứ cấp cho tất cả thiết bị.

### 4. Bottom Navigation Bar (Thanh điều hướng dưới)

Dùng để điều hướng giữa các chức năng/trang chính.

**Quy tắc:**

| Quy tắc | Chi tiết |
|:---|:---|
| Giới hạn tab | **Tối đa 4 tab** — nhiều hơn sẽ làm icon khó nhận diện, vùng bấm bị thu nhỏ |
| Phản hồi trạng thái | Đổi màu icon/text để cho biết tab hiện tại (sử dụng `activeKey` prop) |
| Không chứa content | Bottom navigation chỉ chứa liên kết, không render nội dung bên trong |
| Cấu hình | Sử dụng `hideAndroidBottomNavigationBar` trong `app-config.json` để ẩn trên Android |

**Implementation:**

```tsx
import { BottomNavigation } from "zmp-ui";

<BottomNavigation activeKey={activeTab} onChange={(key) => setActiveTab(key)}>
  <BottomNavigation.Item key="home" label="Trang chủ" icon={<HomeIcon />} />
  <BottomNavigation.Item key="category" label="Danh mục" icon={<CategoryIcon />} />
  <BottomNavigation.Item key="orders" label="Đơn hàng" icon={<OrderIcon />} />
  <BottomNavigation.Item key="account" label="Tài khoản" icon={<AccountIcon />} />
</BottomNavigation>
```

### 5. Header Bar Container (Custom Header)

Khi ẩn header mặc định (`actionBarHidden: true`):

- Cần tự hiển thị nội dung header phù hợp với chiều cao Action bar.
- Phải xử lý safe area phía trên (status bar height).
- Sử dụng CSS variable `--zaui-safe-area-inset-top` để tính toán padding.

### 6. Cấu trúc trang điển hình

```
┌─────────────────────────────────────┐
│       Status Bar (transparent)      │
├─────────────────────────────────────┤
│  [←]  Title              [⋯Menu]  │  ← Navigation Bar / Custom Header
├─────────────────────────────────────┤
│                                     │
│                                     │
│         Page Content                │  ← Scrollable Area
│         (overflow: auto)            │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏠    📋    📦    👤             │  ← Bottom Navigation (max 4 tabs)
├─────────────────────────────────────┤
│       Safe Area Bottom              │  ← iOS Home Indicator
└─────────────────────────────────────┘
```

## Sources

- [Zalo Mini App Design Guidelines](https://mini.zalo.me/documents/design/) — _primary_
- [Zalo Platform Document Hub — app-config](https://mini.zalo.me/documents/framework/getting-started/app-config/) — _primary_
- [ZaUI Components — BottomNavigation](https://mini.zalo.me/documents/component/bottom-navigation/) — _primary_

## Notes

- Khi sử dụng `statusBar: "transparent"`, nội dung trang sẽ chồng lên vùng status bar. Cần tính toán padding-top phù hợp.
- Bottom Navigation không hoạt động tốt nếu page container có `overflow: hidden` — luôn kiểm tra CSS `overflow` của các phần tử cha.
