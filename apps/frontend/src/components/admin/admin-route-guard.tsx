import React, { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Icon, Spinner } from "zmp-ui";
import { useAppToast } from "@/hooks/use-app-toast";

interface AdminRouteGuardProps {
  requiredRole?: "ADMIN";
}

export function AdminRouteGuard({}: AdminRouteGuardProps = {}) {
  const { customer, isLoading, refetchCustomer } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showSuccess, showToast } = useAppToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner logo />
      </div>
    );
  }

  const isAdmin = customer?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="relative flex min-h-[80vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Icon icon="zi-lock" className="shrink-0 text-3xl" />
        </div>
        <h2 className="text-base font-bold text-stone-900">
          Chưa Được Cấp Quyền Quản Trị
        </h2>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-600">
          Tài khoản Zalo của bạn chưa được cấp quyền Quản trị viên (ADMIN). Vui
          lòng gửi Zalo User ID bên dưới cho chủ quán để được kích hoạt.
        </p>

        {customer?.zalo_user_id && (
          <div className="mt-5 flex w-full max-w-xs flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
            <span className="font-semibold text-stone-700">
              Zalo User ID của bạn:
            </span>
            <code className="select-all rounded bg-white px-2.5 py-1.5 font-mono text-xs font-bold text-amber-800 shadow-sm">
              {customer.zalo_user_id}
            </code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(customer.zalo_user_id);
                showToast("Đã sao chép Zalo User ID!", "default", {
                  duration: 2000,
                });
              }}
              className="mt-1 flex h-9 items-center justify-center rounded-lg px-3 text-xs font-bold text-primary underline transition-opacity active:opacity-70"
            >
              Sao chép Zalo ID
            </button>
          </div>
        )}

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refetchCustomer();
                await queryClient.invalidateQueries();
                showSuccess("Đã làm mới thông tin quyền!");
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            {isRefreshing && <Spinner visible logo={false} />}
            {isRefreshing ? "Đang kiểm tra..." : "Làm mới quyền truy cập"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-11 w-full items-center justify-center rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 shadow-sm transition-transform active:scale-95"
          >
            Quay về Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default AdminRouteGuard;
