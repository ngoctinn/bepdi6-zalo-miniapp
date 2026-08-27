# Tiêu chuẩn Thị giác — Zalo Mini App

## Key Questions

- Quy tắc về typography (font, size, weight) cho Zalo Mini App?
- Bảng màu chuẩn (color tokens) bao gồm những gì?
- Spacing system hoạt động như thế nào?
- Corner radius (bo góc) tiêu chuẩn?

## Findings

### 1. Typography

#### Font chữ hệ thống

Zalo Mini App sử dụng font hệ thống — không có custom font.

| Nền tảng | Font Stack |
|:---|:---|
| iOS | SF Pro Text, SF Pro Display, SF UI Text, SF UI Display |
| Android | Roboto |

#### Kích thước font phổ biến

Các kích thước font được khuyến nghị (đơn vị: pt):

| Mục đích | Kích thước |
|:---|:---|
| Tiêu đề lớn (xLarge) | 20pt |
| Tiêu đề vừa | 18pt |
| Tiêu đề nhỏ / Text chính | 16pt |
| Text bình thường | 15pt |
| Text phụ / Label | 14pt |
| Caption / Ghi chú | 12pt |
| Micro text | 10pt |

#### Phân cấp Typography

Typography được chia thành 2 loại chính:

- **Header Text**: Tiêu đề, headings — thường bold hoặc semibold.
- **Body Text**: Nội dung chính, mô tả — thường regular weight.

### 2. Bảng màu (Color System)

#### Font Colors (Semantic)

| Token | Hex | Dùng cho |
|:---|:---|:---|
| `text-primary` (NL300) | `#141415` | Nội dung chính, tiêu đề |
| `text-secondary` (NL700) | `#767A7F` | Nội dung phụ, ghi chú, thời gian |
| `text-description` (NL500) | — | Đoạn văn bản mô tả lớn |
| `text-disable` | `#B9BDC1` | Text bị vô hiệu hóa |

#### Functional Colors

| Token | Hex | Dùng cho |
|:---|:---|:---|
| `BL300` (Blue) | `#006AF5` | Liên kết, primary actions |
| `GL300` (Green) | — | Hành động thành công |
| `OL300` (Orange) | — | Cảnh báo (warning) |
| `RL300` (Red) | — | Lỗi (error) |

#### Background Colors

| Token | Hex | Dùng cho |
|:---|:---|:---|
| `page-bg-default` | `#E9EBED` | Nền trang mặc định |
| `page-bg-white` | `#FFFFFF` | Nền trắng (card, section) |
| `page-bg-gray` | `#F4F5F6` | Nền xám nhẹ |

#### Border & Divider Colors

| Token | Hex | Dùng cho |
|:---|:---|:---|
| `divider-01` | `#E9EBED` | Đường ngăn cách chính |
| `divider-02` | `#D6D9DC` | Đường ngăn cách đậm hơn |

#### Brand Primary Color

| Token | Hex | Dùng cho |
|:---|:---|:---|
| `B60` / `brand-primary` | `#006AF5` | Màu chủ đạo thương hiệu Zalo |

### 3. Spacing System

Spacing dựa trên **bội số 4px**:

| Token | Giá trị |
|:---|:---|
| `U` (Base) | 4px |
| `U2` | 8px |
| `U3` | 12px |
| `U4` | 16px |
| `U5` | 20px |

Spacing không được quản lý bằng CSS variables riêng trong ZaUI. Thay vào đó:
- Sử dụng Tailwind CSS utilities hoặc inline styles.
- Luôn tuân thủ bội số 4px cho padding/margin.

### 4. Corner Radius (Bo góc)

| Token | Giá trị | Dùng cho |
|:---|:---|:---|
| `corner_04` | 4px | Elements nhỏ (tags, badges) |
| `corner_08` | 8px | Cards nhỏ, buttons tiêu chuẩn |
| `corner_12` | 12px | Cards lớn, containers |
| `corner_16` | 16px | Modal, bottom sheet |
| `corner_100` | 9999px | Pill-shape buttons, avatars tròn |

**Gợi ý sử dụng:**

- **Card**: 8px hoặc 12px tùy kích thước
- **Button tiêu chuẩn**: 8px hoặc 12px
- **Button pill-shape**: 9999px
- **Modal content**: Thường 16px hoặc cao hơn

### 5. Touch Target

- Kích thước tối thiểu vùng chạm: **7mm → 9mm** (tương đương ~44px → 56px ở 160dpi).
- Áp dụng cho tất cả buttons, links, interactive elements.

### 6. Icons

- Sử dụng bộ icon chuẩn từ ZaUI (`zmp-ui` cung cấp component `<Icon>`).
- Icon phải rõ ràng, dễ nhận dạng ở kích thước nhỏ.
- Đảm bảo đồng nhất style giữa tất cả icon trong app.

## Code Examples

### Tùy chỉnh Theme Color qua CSS Variables

```css
:root {
  /* Màu chủ đạo */
  --zmp-theme-color: #006AF5;
  --zmp-theme-color-rgb: 0, 104, 255;
  --zmp-theme-color-shade: #0057D6;   /* hover/active */
  --zmp-theme-color-tint: #2980FF;

  /* Button styles */
  --zmp-button-pressed-bg-color-primary: var(--zmp-theme-color-shade);
  --zmp-button-bg-color-secondary: #ffffff;
  --zmp-button-border-color-secondary: var(--zmp-theme-color);
}
```

### Font Stack CSS

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}
```

## Sources

- [Zalo Mini App Design Guidelines — Visual Standards](https://mini.zalo.me/documents/design/) — _primary_
- [Zalo Platform Document Hub — Foundation](https://zaloplatforms.com) — _primary_
- [ZaUI Components — Styling](https://mini.zalo.me/documents/component/) — _primary_

## Notes

- Hex codes cho `GL300` (green), `OL300` (orange), `RL300` (red) không được công bố rõ ràng trong tài liệu công khai. Sử dụng ZaUI components sẽ tự áp dụng đúng màu.
- Biến `--zmp-theme-color` (prefix `--zmp-`) là biến chính thức, không phải `--zaui-`.
- Biến `--zaui-safe-area-*` là exception duy nhất dùng prefix `--zaui-`.
