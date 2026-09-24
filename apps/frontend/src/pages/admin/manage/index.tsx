import React from "react";
import { useNavigate } from "react-router-dom";
import {
  useAdminCategories,
  useAdminProducts,
  useAdminVouchers,
} from "@/services/admin/admin.queries";

export default function AdminManageHubPage() {
  const navigate = useNavigate();

  const { data: categories } = useAdminCategories();
  const { data: products } = useAdminProducts();
  const { data: vouchers } = useAdminVouchers();

  const catCount = Array.isArray(categories) ? categories.length : 0;
  const prodCount = Array.isArray(products) ? products.length : 0;
  const voucherCount = Array.isArray(vouchers) ? vouchers.length : 0;

  const MENU_SECTIONS = [
    {
      title: "Thực Đơn & Danh Mục",
      items: [
        {
          id: "categories",
          icon: "📑",
          title: "Danh mục món",
          description: "Quản lý các danh mục món ăn và thứ tự hiển thị",
          badge: `${catCount} mục`,
          path: "/admin/manage/menu",
        },
        {
          id: "products",
          icon: "🍜",
          title: "Danh sách món ăn",
          description: "Bật/tắt hết hàng, giá bán, mô tả, ảnh món",
          badge: `${prodCount} món`,
          path: "/admin/manage/menu/products",
        },
      ],
    },
    {
      title: "Khuyến Mãi & Tiếp Thị",
      items: [
        {
          id: "vouchers",
          icon: "🎟️",
          title: "Mã giảm giá (Voucher)",
          description: "Chiến dịch voucher giảm tiền hoặc phần trăm",
          badge: `${voucherCount} mã`,
          path: "/admin/manage/vouchers",
        },
      ],
    },
    {
      title: "Khách Hàng & Dữ Liệu",
      items: [
        {
          id: "customers",
          icon: "👥",
          title: "Khách hàng & Thành viên",
          description: "Tra cứu lịch sử mua hàng và địa chỉ khách",
          badge: "Sắp ra mắt",
          path: "/admin/manage/customers",
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-20">
      {/* Top Banner */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-4">
        <h1 className="text-lg font-bold text-stone-900">Trung Tâm Quản Lý</h1>
        <p className="mt-0.5 text-xs text-stone-500">
          Quản lý toàn bộ danh mục, món ăn, giá bán và khuyến mãi của quán
        </p>
      </div>

      <div className="space-y-5 p-4">
        {MENU_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-2">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-stone-500">
              {section.title}
            </h2>
            <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="flex cursor-pointer items-center justify-between p-3.5 transition-colors active:bg-stone-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-primary">
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-stone-900">
                        {item.title}
                      </div>
                      <div className="line-clamp-1 text-[11px] text-stone-500">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-600">
                      {item.badge}
                    </span>
                    <span className="text-stone-400">›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
