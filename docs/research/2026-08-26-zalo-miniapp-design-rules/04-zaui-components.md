# ZaUI Components — Danh sách và Cách sử dụng

## Key Questions

- ZaUI (`zmp-ui`) bao gồm những component nào?
- Cách import và sử dụng các component?
- Component nào nên ưu tiên dùng thay vì tự custom?

## Findings

### 1. Tổng quan

ZaUI (`zmp-ui`) là thư viện UI component chính thức cho Zalo Mini App, dựa trên **ZDS (Zalo Design System)**. Cài đặt qua npm:

```bash
npm install zmp-ui
```

Import components:

```tsx
import { Button, Input, List, Modal, Sheet } from "zmp-ui";
```

### 2. Danh sách Components theo Category

#### General (Chung)

| Component | Mô tả | Props chính |
|:---|:---|:---|
| `Button` | Nút bấm với 3 cấp: Primary, Secondary, Tertiary | `size`, `variant`, `loading`, `disabled` |
| `Header` | Thanh tiêu đề trang | `title`, `showBackIcon` |
| `BottomNavigation` | Thanh điều hướng dưới | `activeKey`, `onChange` |
| `Icon` | Biểu tượng chuẩn hóa | `icon`, `size` |

**Button variants:**

| Loại | Mô tả |
|:---|:---|
| Label Button | Chứa text |
| Icon Button | Chỉ chứa icon |
| Floating Action Button (FAB) | Nút nổi |

**Button sizes:** Large, Medium, Small

**Button states:** Normal, Pressed, Loading, Disabled

#### Container (Chứa)

| Component | Mô tả |
|:---|:---|
| `App` | Thành phần gốc — bọc toàn bộ ứng dụng |
| `Page` | Đại diện cho 1 màn hình/khung nhìn |
| `Box` | Hỗ trợ bố cục (layout helper) |
| `Safe Areas` | Xử lý vùng an toàn trên thiết bị |

#### Data Display (Hiển thị dữ liệu)

| Component | Mô tả | Props chính |
|:---|:---|:---|
| `List` / `List.Item` | Danh sách dữ liệu | `dataSource`, `renderItem`, `divider` |
| `Avatar` | Hình đại diện | `src`, `size` |
| `Text` | Định dạng văn bản | — |
| `Spinner` / `Progress` | Trạng thái chờ/tiến trình | `visible`, `logo` |
| `Tabs` | Tab navigation nội dung | `activeKey`, `onChange` |
| `Swiper` | Carousel/slideshow | `autoplay`, `duration` |
| `ImageViewer` | Xem ảnh toàn màn hình | `images`, `visible` |
| `Calendar` | Hiển thị lịch | — |

#### Data Entry (Nhập liệu)

| Component | Mô tả | Props chính |
|:---|:---|:---|
| `Input` | Text field (1 dòng) | `type`, `clearable`, `errorText` |
| `Input` (textarea) | Text area (nhiều dòng) | `type="textarea"` |
| `Input` (password) | Password field | `type="password"` |
| `Input` (search) | Search field | `type="search"` |
| `Input` (OTP) | OTP input | — |
| `Checkbox` | Checkbox chọn nhiều | `checked`, `onChange` |
| `Radio` | Radio chọn 1 | `checked`, `onChange` |
| `Switch` | Toggle on/off | `checked`, `onChange` |
| `Select` | Dropdown select | `options`, `value` |
| `Picker` | Picker wheel | — |
| `DatePicker` | Chọn ngày | — |
| `Slider` | Thanh trượt | `min`, `max`, `value` |

**Input states:**
- `Enabled` — trạng thái mặc định
- `Focus (Error/Success)` — đang nhập, có lỗi hoặc thành công
- `Activated (Error/Success)` — đã nhập xong
- `Disabled` — vô hiệu hóa

#### Feedback & Overlay (Phản hồi)

| Component | Mô tả | Props chính |
|:---|:---|:---|
| `Modal` | Hộp thoại thông báo/tương tác | `visible`, `title`, `onClose` |
| `Sheet` | Bottom sheet trượt từ dưới lên | `visible`, `onClose`, `height` |
| `Snackbar` | Thông báo nhanh tạm thời | `text`, `type`, `duration` |

### 3. Quy tắc Sử dụng

**Ưu tiên dùng ZaUI component:**

- Luôn ưu tiên sử dụng component ZaUI thay vì tự build.
- ZaUI đã tích hợp sẵn: hiệu ứng cảm ứng (touch feedback), thích ứng màn hình, safe area handling.
- Từ phiên bản `1.6.0+`, các component `Header`, `BottomNavigation`, `Sheet` đã tự động thêm khoảng an toàn.

**Override style:**

```css
/* Override border-radius cho Modal */
.zaui-modal-content {
  border-radius: 24px;
}

/* Override button style */
.zaui-btn-primary {
  background-color: var(--zmp-theme-color);
}
```

**Kiểm tra className:**
- Sử dụng DevTools để kiểm tra class CSS của component.
- Override bằng CSS trong `src/css/`.

### 4. Virtual List (Danh sách ảo)

Cho danh sách lớn (hàng trăm/nghìn items):

```tsx
<List virtualList={true}>
  {/* items */}
</List>
```

- Chỉ render các phần tử trong viewport.
- Các phần tử ngoài viewport tự động unmount.

## Sources

- [ZaUI Components Documentation](https://mini.zalo.me/documents/component/) — _primary_
- [zmp-ui on NPM](https://www.npmjs.com/package/zmp-ui) — _primary_
- [Zalo Platform Document Hub](https://zaloplatforms.com) — _primary_

## Notes

- `zmp-ui` package version "latest" trong `package.json` — nên pin version cụ thể cho production để tránh breaking changes.
- ZaUI classes thường có prefix `.zaui-` hoặc `.zmp-`.
- Để tùy chỉnh theme color toàn cục, sử dụng CSS variables `--zmp-theme-color*` trong `:root`.
