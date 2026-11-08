import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAcceptStaffInvite } from "@/services/admin/admin.mutations";
import { useAuth } from "@/hooks/use-auth";
import { useAppToast } from "@/hooks/use-app-toast";
import { setStoredTokens } from "@/lib/api-client";
import { Icon, Spinner } from "zmp-ui";

export default function StaffInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();
  const { customer, refetchCustomer } = useAuth();
  const { showSuccess, showError } = useAppToast();
  const acceptInviteMutation = useAcceptStaffInvite();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleAccept = async () => {
    if (!token) {
      showError("Link mời không hợp lệ hoặc thiếu mã token.");
      return;
    }

    try {
      const res = await acceptInviteMutation.mutateAsync({ token });
      if (res.access_token) {
        setStoredTokens(res.access_token, res.refresh_token);
      }
      await refetchCustomer();
      setIsSuccess(true);
      showSuccess(
        `Chúc mừng! Bạn đã trở thành ${
          res.role === "ADMIN" ? "Quản trị viên" : "Nhân viên Bếp"
        } của Bếp Dì 6.`,
      );

      // Chuyển hướng sau 1.5s
      setTimeout(() => {
        if (res.role === "ADMIN") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/admin/kitchen", { replace: true });
        }
      }, 1500);
    } catch (err: unknown) {
      showError(
        (err as Error)?.message ||
          "Mã mời không tồn tại, đã hết hạn hoặc đã được sử dụng.",
      );
    }
  };

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-full max-w-sm rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon icon="zi-check-circle-solid" className="text-3xl" />
        </div>

        <h2 className="mt-4 text-lg font-black text-stone-900">
          Gia Nhập Đội Ngũ Bếp Dì 6
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-stone-600">
          Bạn nhận được lời mời tham gia quản trị / vận hành hệ thống Bếp Dì 6
          trên Zalo Mini App.
        </p>

        {customer && (
          <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
            <span className="text-stone-500">Tài khoản Zalo của bạn:</span>
            <div className="mt-1 font-bold text-stone-800">
              {customer.name} {customer.phone ? `(${customer.phone})` : ""}
            </div>
          </div>
        )}

        {!token ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            Link mời này không chứa mã token hợp lệ. Vui lòng liên hệ chủ quán
            để nhận lại link mới.
          </div>
        ) : isSuccess ? (
          <div className="mt-5 space-y-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
              Xác nhận thành công! Đang chuyển hướng vào hệ thống...
            </div>
            <Spinner />
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={acceptInviteMutation.isPending}
              onClick={handleAccept}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50"
            >
              {acceptInviteMutation.isPending ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-check" className="text-base" />
                  <span>Đồng Ý Tham Gia Ngay</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-600 active:scale-95"
            >
              Quay về trang mua sắm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
