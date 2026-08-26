# Cấu hình App, Safe Area và Performance — Zalo Mini App

## Key Questions

- `app-config.json` có những thuộc tính nào và cách cấu hình?
- Safe Area handling trên iOS và Android hoạt động thế nào?
- Các quy tắc tối ưu hiệu suất cho Zalo Mini App?

## Findings

### 1. Cấu hình `app-config.json`

File `app-config.json` nằm ở thư mục gốc frontend, cấu hình giao diện ban đầu.

#### Cấu trúc đầy đủ

```json
{
  "pages": ["/index", "/page1", "/page2"],
  "app": {
    "title": "Tên Mini App",
    "headerTitle": "Tiêu đề trên Action bar",
    "headerColor": "#FFFFFF",
    "textColor": "black",
    "statusBar": "normal",
    "actionBarHidden": false,
    "hideAndroidBottomNavigationBar": false,
    "hideIOSSafeAreaBottom": false,
    "leftButton": "back"
  },
  "template": {
    "name": "template-name"
  },
  "listCSS": [],
  "listSyncJS": [],
  "listAsyncJS": []
}
```

#### Bảng thuộc tính `app`

| Thuộc tính | Loại | Giá trị | Mô tả |
|:---|:---|:---|:---|
| `title` | `string` | — | Tên ứng dụng (**bắt buộc**) |
| `headerTitle` | `string` | — | Tiêu đề trên Action bar |
| `headerColor` | `string` | Hex code | Màu nền Action bar + Status bar |
| `textColor` | `string` / `object` | `"white"`, `"black"`, hoặc `{light, dark}` | Màu chữ/icon trên Action bar |
| `statusBar` | `string` | `"normal"`, `"hidden"`, `"transparent"` | Kiểu hiển thị status bar |
| `actionBarHidden` | `boolean` | `true/false` | Ẩn hoàn toàn Action bar |
| `hideAndroidBottomNavigationBar` | `boolean` | `true/false` | Ẩn bottom nav trên Android |
| `hideIOSSafeAreaBottom` | `boolean` | `true/false` | Ẩn Safe Area Bottom trên iOS |
| `leftButton` | `string` | `"none"`, `"back"` | Nút bên trái Action bar |

#### Hỗ trợ Light/Dark Theme

```json
{
  "app": {
    "textColor": {
      "light": "black",
      "dark": "white"
    },
    "headerColor": {
      "light": "#FFFFFF",
      "dark": "#1A1A1A"
    }
  }
}
```

### 2. Safe Area Handling

#### CSS Variables

| Variable | Mô tả |
|:---|:---|
| `--zaui-safe-area-inset-top` | Khoảng an toàn phía trên (status bar, notch) |
| `--zaui-safe-area-inset-bottom` | Khoảng an toàn phía dưới (Home Indicator) |

#### Cách sử dụng

```css
/* Basic usage */
.page-content {
  padding-top: var(--zaui-safe-area-inset-top, 16px);
  padding-bottom: var(--zaui-safe-area-inset-bottom, 16px);
}

/* Đảm bảo padding tối thiểu */
.fixed-bottom-bar {
  padding-bottom: max(16px, var(--zaui-safe-area-inset-bottom, 0px));
}
```

#### Viewport Meta Tag

Để CSS safe area hoạt động đúng:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

#### Lưu ý

- Từ `zmp-ui` phiên bản `1.6.0+`, các component `Header`, `BottomNavigation`, `Sheet` đã tự động xử lý safe area.
- Khi `hideIOSSafeAreaBottom: true`, cần tự xử lý khoảng cách cho Home Indicator.
- SDK khuyến nghị phiên bản `2.25.0+` để CSS variables hoạt động ổn định.

### 3. Tối ưu Hiệu suất (Performance)

#### Virtual List

```tsx
// Cho danh sách lớn (> 50 items)
<List virtualList={true}>
  {items.map(item => <List.Item key={item.id} ... />)}
</List>
```

#### Image Optimization

| Kỹ thuật | Cách thực hiện |
|:---|:---|
| Lazy loading | `<img loading="lazy" />` cho ảnh ngoài viewport |
| Priority loading | `<img fetchpriority="high" />` cho ảnh LCP (đầu trang) |
| Format | Ưu tiên **WebP** thay vì PNG/JPG |
| CDN | Tải ảnh lên CDN, sử dụng kích thước phù hợp |

#### Code Splitting

```tsx
// Tách component nặng
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));

<Suspense fallback={<Spinner />}>
  <HeavyComponent />
</Suspense>
```

#### Checklist Hiệu suất

| Tiêu chí | Chi tiết |
|:---|:---|
| Danh sách lớn | Sử dụng `virtualList={true}` |
| Ảnh thông thường | `loading="lazy"` + WebP |
| Ảnh chính (LCP) | `fetchpriority="high"`, không lazy |
| Code | `React.lazy` + `Suspense` |
| Dependencies | Chỉ import cần thiết, kiểm tra bundle size |
| Props drilling | Sử dụng Store (Zustand) hoặc Context thay vì truyền qua nhiều cấp |
| Core Web Vitals | Theo dõi FCP, LCP — Zalo dùng làm tiêu chí đánh giá |
| DevTools | Chrome Remote DevTools để profile |

### 4. Cấu hình hiện tại của dự án

File `app-config.json` hiện tại:

```json
{
  "app": {
    "title": "bếp dì 6 app",
    "textColor": { "light": "black", "dark": "white" },
    "statusBar": "transparent",
    "headerColor": "#FEF08A",
    "actionBarHidden": true,
    "hideIOSSafeAreaBottom": true,
    "hideAndroidBottomNavigationBar": false
  }
}
```

**Phân tích:**
- `actionBarHidden: true` — App tự quản lý header, cần đảm bảo xử lý safe area top.
- `statusBar: "transparent"` — Nội dung chồng lên status bar, cần padding-top.
- `hideIOSSafeAreaBottom: true` — App tự xử lý safe area bottom (cần `--zaui-safe-area-inset-bottom`).
- `headerColor: "#FEF08A"` — Màu vàng nhạt cho status bar background.

## Sources

- [Zalo Mini App — app-config.json](https://mini.zalo.me/documents/framework/getting-started/app-config/) — _primary_
- [Zalo Mini App — Performance Optimization](https://mini.zalo.me/documents/guides/performance/) — _primary_
- [ZaUI Components — Safe Area](https://mini.zalo.me/documents/component/) — _primary_

## Notes

- `listCSS`, `listSyncJS`, `listAsyncJS` trong app-config cho phép inject CSS/JS ngoài — ít khi cần dùng.
- Khi `statusBar: "transparent"`, `headerColor` vẫn ảnh hưởng màu status bar trên một số thiết bị.
- Với cấu hình `hideIOSSafeAreaBottom: true` hiện tại, cần đặc biệt chú ý xử lý padding-bottom cho bottom bar và các nút cố định phía dưới.
