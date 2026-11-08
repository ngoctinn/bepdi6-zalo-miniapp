import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  useAdminDashboardStats,
  useAdminShopConfig,
} from "@/services/admin/admin.queries";
import { Icon } from "zmp-ui";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { customer } = useAuth();

  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: shopConfig, isLoading: configLoading } = useAdminShopConfig();

  const pendingCount = stats?.pending_count ?? 0;
  const preparingCount = stats?.preparing_count ?? 0;
  const readyCount = stats?.ready_count ?? 0;
  const todayRevenue = stats?.today_revenue ?? 0;
  const todayCompletedCount = stats?.today_completed_count ?? 0;
  const totalProductsCount = stats?.total_products_count ?? 0;
  const activeVouchersCount = stats?.active_vouchers_count ?? 0;

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24 font-sans">
      {/* Top Header Card */}
      <div className="header-margin bg-primary px-4 pb-6 pr-24 pt-4 text-white shadow-sm">
        <div>
          <span className="inline-block rounded-full bg-black/20 px-2.5 py-0.5 text-xs font-bold font-semibold text-white">
            Quản Trị Viên
          </span>
          <h1 className="mt-1 text-xl font-bold">
            Xin chào, {customer?.name || "Admin"}
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-white/90">
            <span>{shopConfig?.shop_name || "Bếp Dì 6"}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-2.5 py-0.5 font-semibold text-white">
              <span
                className={`inline-block h-2 w-2 rounded-full ring-2 ring-white ${
                  shopConfig?.is_open ? "bg-emerald-400" : "bg-rose-400"
                }`}
              />
              {shopConfig?.is_open ? "Đang mở cửa" : "Đang tạm đóng"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-4 px-4">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Đơn chờ xử lý */}
          <div
            onClick={() => navigate("/admin/kitchen")}
            className="cursor-pointer rounded-2xl border border-stone-200/60 bg-white p-3.5 shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">
                Đơn chờ xử lý
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon
                  icon="zi-clock-1"
                  className="shrink-0 text-base leading-none"
                />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums text-stone-900">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-stone-200" />
              ) : (
                pendingCount
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-primary">
              {preparingCount} nấu • {readyCount} chờ giao
            </p>
          </div>

          {/* Doanh thu hôm nay (từ đơn hoàn tất) */}
          <div className="rounded-2xl border border-stone-200/60 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">
                Doanh thu hôm nay
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon
                  icon="zi-poll"
                  className="shrink-0 text-base leading-none"
                />
              </span>
            </div>
            <div className="mt-2 truncate text-xl font-black tabular-nums text-stone-900">
              {statsLoading ? (
                <div className="h-7 w-24 animate-pulse rounded bg-stone-200" />
              ) : (
                `${todayRevenue.toLocaleString("vi-VN")}₫`
              )}
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              {todayCompletedCount} đơn hoàn tất hôm nay
            </p>
          </div>

          {/* Số lượng món trong Menu */}
          <div
            onClick={() => navigate("/admin/manage/menu/products")}
            className="cursor-pointer rounded-2xl border border-stone-200/60 bg-white p-3.5 shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">
                Món trong menu
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon
                  icon="zi-more-grid"
                  className="shrink-0 text-base leading-none"
                />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums text-stone-900">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-stone-200" />
              ) : (
                totalProductsCount
              )}
            </div>
            <p className="mt-1 flex items-center text-xs font-semibold text-blue-600">
              <span>Xem danh sách món</span>
              <Icon
                icon="zi-chevron-right"
                className="ml-0.5 shrink-0 text-xs"
              />
            </p>
          </div>

          {/* Chiến dịch Voucher */}
          <div
            onClick={() => navigate("/admin/manage/vouchers")}
            className="cursor-pointer rounded-2xl border border-stone-200/60 bg-white p-3.5 shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-600">
                Khuyến mãi
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Icon
                  icon="zi-star-solid"
                  className="shrink-0 text-base leading-none"
                />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black tabular-nums text-stone-900">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-stone-200" />
              ) : (
                activeVouchersCount
              )}
            </div>
            <p className="mt-1 flex items-center text-xs font-semibold text-purple-600">
              <span>Mã đang hoạt động</span>
              <Icon
                icon="zi-chevron-right"
                className="ml-0.5 shrink-0 text-xs"
              />
            </p>
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-stone-800">
            Lối tắt tác vụ
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => navigate("/admin/manage/menu")}
              className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 text-left transition-colors active:bg-stone-100"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon
                  icon="zi-list-2"
                  className="shrink-0 text-lg leading-none"
                />
              </span>
              <div>
                <div className="text-xs font-bold text-stone-900">
                  Danh mục món
                </div>
                <div className="text-xs text-stone-500">Phân loại & thứ tự</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/settings")}
              className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 text-left transition-colors active:bg-stone-100"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon
                  icon="zi-setting"
                  className="shrink-0 text-lg leading-none"
                />
              </span>
              <div>
                <div className="text-xs font-bold text-stone-900">
                  Cài đặt quán
                </div>
                <div className="text-xs text-stone-500">
                  Giờ mở, VietQR, ship
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Thông tin nhanh cửa hàng */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-stone-800">
            Thông tin vận hành
          </h2>
          {configLoading ? (
            <div className="space-y-2 py-2">
              <div className="h-6 w-full animate-pulse rounded bg-stone-100" />
              <div className="h-6 w-full animate-pulse rounded bg-stone-100" />
            </div>
          ) : (
            <div className="space-y-2.5 text-xs text-stone-700">
              <div className="flex justify-between border-b border-stone-100 py-1">
                <span className="text-stone-500">Giờ hoạt động</span>
                <span className="font-semibold text-stone-900">
                  {shopConfig?.open_time || "08:00"} -{" "}
                  {shopConfig?.close_time || "22:00"}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 py-1">
                <span className="text-stone-500">Bán kính ship tối đa</span>
                <span className="font-semibold text-stone-900">
                  {shopConfig?.max_delivery_radius_km || 7} km
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 py-1">
                <span className="text-stone-500">Tài khoản VietQR</span>
                <span className="font-semibold text-stone-900">
                  {shopConfig?.vietqr_bank_id} - {shopConfig?.vietqr_account_no}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Hotline hỗ trợ</span>
                <span className="font-semibold text-primary">
                  {shopConfig?.hotline || "0901234567"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
