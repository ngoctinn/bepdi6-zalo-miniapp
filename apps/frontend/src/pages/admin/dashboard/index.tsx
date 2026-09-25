import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAdminOrders } from "@/services/order/order.queries";
import { useAdminProducts } from "@/services/admin/admin.queries";
import { useAdminVouchers } from "@/services/admin/admin.queries";
import { useAdminShopConfig } from "@/services/admin/admin.queries";
import { Spinner, Icon } from "zmp-ui";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { customer } = useAuth();

  const { data: ordersData, isLoading: ordersLoading } = useAdminOrders();
  const { data: productsData, isLoading: productsLoading } = useAdminProducts();
  const { data: vouchersData, isLoading: vouchersLoading } = useAdminVouchers();
  const { data: shopConfig, isLoading: configLoading } = useAdminShopConfig();

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const pendingOrders = orders.filter(
    (o) => o.status === "PENDING_CONFIRMATION",
  );
  const preparingOrders = orders.filter(
    (o) => o.status === "CONFIRMED" || o.status === "PREPARING",
  );
  const completedOrders = orders.filter((o) => o.status === "COMPLETED");

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCompletedOrders = completedOrders.filter(
    (o) => o.created_at && o.created_at.startsWith(todayStr),
  );
  const todayRevenue = todayCompletedOrders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0,
  );
  const products = Array.isArray(productsData) ? productsData : [];
  const vouchers = Array.isArray(vouchersData) ? vouchersData : [];
  const activeVouchers = vouchers.filter((v) => v.status === "ACTIVE");

  const isLoading = ordersLoading && productsLoading;

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-20">
      {/* Top Header Card */}
      <div className="bg-primary px-4 pb-8 pt-6 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white/90">
              {customer?.role === "ADMIN" ? "Quản Trị Viên" : "Nhân Viên Quán"}
            </span>
            <h1 className="mt-1 text-xl font-bold">
              Xin chào, {customer?.name || "Admin"}
            </h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
              <span>{shopConfig?.shop_name || "Bếp Dì 6"}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    shopConfig?.is_open ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                {shopConfig?.is_open ? "Đang mở cửa" : "Đang tạm đóng"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/admin/kitchen")}
            className="flex flex-col items-center justify-center rounded-xl bg-white/20 p-2.5 text-white backdrop-blur-sm transition-transform active:scale-95"
          >
            <Icon icon="zi-list-1" className="text-xl leading-none" />
            <span className="mt-1 text-[11px] font-bold">Vào Bếp</span>
          </button>
        </div>
      </div>

      <div className="-mt-4 space-y-4 px-4">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Đơn chờ xác nhận */}
          <div
            onClick={() => navigate("/admin/kitchen")}
            className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">
                Đơn chờ xử lý
              </span>
              <span className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-full text-primary">
                <Icon icon="zi-clock-1" className="text-base leading-none" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-stone-900">
              {ordersLoading ? (
                <Spinner visible={true} />
              ) : (
                pendingOrders.length
              )}
            </div>
            <p className="mt-1 text-[11px] font-medium text-primary">
              {preparingOrders.length} đơn đang nấu
            </p>
          </div>

          {/* Doanh thu hôm nay (từ đơn hoàn tất) */}
          <div className="rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">
                Doanh thu HT
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon icon="zi-poll" className="text-base leading-none" />
              </span>
            </div>
            <div className="mt-2 truncate text-xl font-extrabold text-stone-900">
              {ordersLoading ? (
                <Spinner visible={true} />
              ) : (
                `${todayRevenue.toLocaleString("vi-VN")}₫`
              )}
            </div>
            <p className="mt-1 text-[11px] font-medium text-emerald-600">
              {todayCompletedOrders.length} đơn hoàn tất hôm nay
            </p>
          </div>

          {/* Số lượng món trong Menu */}
          <div
            onClick={() => navigate("/admin/manage/menu/products")}
            className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">
                Món trong menu
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon icon="zi-more-grid" className="text-base leading-none" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-stone-900">
              {productsLoading ? <Spinner visible={true} /> : products.length}
            </div>
            <p className="mt-1 flex items-center text-[11px] font-medium text-blue-600">
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
            className="cursor-pointer rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-stone-500">
                Khuyến mãi
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <Icon icon="zi-star-solid" className="text-base leading-none" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-extrabold text-stone-900">
              {vouchersLoading ? (
                <Spinner visible={true} />
              ) : (
                activeVouchers.length
              )}
            </div>
            <p className="mt-1 flex items-center text-[11px] font-medium text-purple-600">
              <span>Đang hoạt động</span>
              <Icon
                icon="zi-chevron-right"
                className="ml-0.5 shrink-0 text-xs"
              />
            </p>
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-stone-800">
            Lối tắt tác vụ
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/manage/menu")}
              className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 p-3 text-left transition-colors active:bg-stone-100"
            >
              <span className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                <Icon icon="zi-list-2" className="text-lg leading-none" />
              </span>
              <div>
                <div className="text-xs font-bold text-stone-800">
                  Danh mục món
                </div>
                <div className="text-[10px] text-stone-500">
                  Phân loại & thứ tự
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin/settings")}
              className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50/50 p-3 text-left transition-colors active:bg-stone-100"
            >
              <span className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg text-primary">
                <Icon icon="zi-setting" className="text-lg leading-none" />
              </span>
              <div>
                <div className="text-xs font-bold text-stone-800">
                  Cài đặt quán
                </div>
                <div className="text-[10px] text-stone-500">
                  Giờ mở, VietQR, ship
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Thông tin nhanh cửa hàng */}
        <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-stone-800">
            Thông tin vận hành
          </h2>
          {configLoading ? (
            <div className="py-4 text-center">
              <Spinner visible={true} />
            </div>
          ) : (
            <div className="space-y-2 text-xs text-stone-600">
              <div className="flex justify-between border-b border-stone-100 py-1">
                <span className="text-stone-500">Giờ hoạt động</span>
                <span className="font-semibold text-stone-800">
                  {shopConfig?.open_time || "08:00"} -{" "}
                  {shopConfig?.close_time || "22:00"}
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 py-1">
                <span className="text-stone-500">Bán kính ship tối đa</span>
                <span className="font-semibold text-stone-800">
                  {shopConfig?.max_delivery_radius_km || 7} km
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-100 py-1">
                <span className="text-stone-500">Tài khoản VietQR</span>
                <span className="font-semibold text-stone-800">
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
