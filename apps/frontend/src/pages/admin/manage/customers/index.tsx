import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "zmp-ui";
import { useAdminCustomers } from "@/services/admin/admin.queries";
import { AdminCustomer } from "@/types/admin.types";
import { formatCurrency, formatDateTime } from "@/utils/format";

export default function AdminCustomerPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Simple debounce
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const timeout = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const {
    data: customersData,
    isLoading,
    refetch,
  } = useAdminCustomers({ search: debouncedSearch || undefined });

  const customers: AdminCustomer[] = Array.isArray(customersData)
    ? customersData
    : [];

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/manage")}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700 active:scale-95"
          >
            <Icon icon="zi-arrow-left" className="shrink-0 text-base" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-stone-900">
              Quản Lý Khách Hàng
            </h1>
            <p className="text-[10px] text-stone-500">
              {customers.length} khách hàng trong hệ thống
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700 active:scale-95"
        >
          <Icon icon="zi-reload" className="shrink-0 text-base" />
        </button>
      </div>

      <div className="space-y-3 p-4">
        {/* Search Bar */}
        <div className="relative">
          <Icon
            icon="zi-search"
            className="absolute left-3.5 top-1/2 shrink-0 -translate-y-1/2 text-sm text-stone-400"
          />
          <input
            type="text"
            placeholder="Tìm theo tên, số điện thoại..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs text-stone-800 placeholder-stone-400 shadow-sm focus:border-primary focus:outline-none"
          />
        </div>

        {/* List of Customers */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-stone-500">
            Đang tải dữ liệu khách hàng...
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Icon icon="zi-user-circle" className="shrink-0 text-2xl" />
            </div>
            <p className="mt-3 text-xs font-semibold text-stone-700">
              Không tìm thấy khách hàng nào
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              Thử tìm kiếm với từ khóa khác
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {customers.map((c) => (
              <div
                key={c.id}
                className="shadow-xs flex flex-col gap-2 rounded-2xl border border-stone-200/80 bg-white p-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {c.avatar_url ? (
                      <img
                        src={c.avatar_url}
                        alt={c.name}
                        className="h-10 w-10 shrink-0 rounded-full border border-stone-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon icon="zi-user" className="shrink-0 text-lg" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-xs font-bold text-stone-900">
                          {c.name || "Khách hàng Zalo"}
                        </h2>
                        {Number(c.total_orders) >= 5 && (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[11px] text-stone-500">
                        {c.phone || "Chưa có SĐT"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-primary">
                      {formatCurrency(Number(c.total_spent || 0))}
                    </span>
                    <p className="text-[10px] text-stone-400">
                      {c.total_orders} đơn hàng
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-500">
                  <span>Tham gia: {formatDateTime(c.created_at)}</span>
                  <span>
                    Đơn gần nhất:{" "}
                    {c.last_order_at
                      ? formatDateTime(c.last_order_at)
                      : "Chưa có"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
