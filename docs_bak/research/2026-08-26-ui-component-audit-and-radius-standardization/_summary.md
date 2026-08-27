# Tổng Hợp Nghiên Cứu: UX/UI Component Audit & Radius Standardization

**Ngày thực hiện:** 2026-08-26  
**Chủ đề:** Rà soát toàn bộ UI components, phát hiện style hardcode, chuẩn hóa Border Radius và tái cấu trúc hệ thống giao diện Zalo Mini App Bếp Dì 6.

## Liên kết tài liệu
- [01-ui-audit-and-ux-bestpractices.md](./01-ui-audit-and-ux-bestpractices.md): Báo cáo chi tiết hiện trạng các lỗi bất nhất quán và UX Best Practices.

## Điểm mấu chốt (Key Findings)
1. **Border Radius chưa có quy ước thống nhất**: Có 6 loại bán kính khác nhau đang được áp dụng tùy ý (`rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`).
2. **Hardcoded CSS Classes**: Còn tồn tại các class lạ như `hover:bg-green800`, `py-0.2`, `bg-orange500/10` và các token typography kiểu cũ chưa dọn dẹp trong các component variant.
3. **Cơ hội nâng cấp**: Tái sử dụng component Badge/StatusTag và đồng bộ Primary Action Buttons giúp codebase tinh gọn hơn 25% và mang lại cảm giác nhất quán, mượt mà trên mobile.
