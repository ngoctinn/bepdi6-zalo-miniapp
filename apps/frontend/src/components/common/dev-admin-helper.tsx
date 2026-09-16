import React, { useState } from "react";
import { isDevelopmentRuntime } from "@/utils/zma";
import { fetchZaloUserInfo, isZaloRuntime } from "@/utils/zalo-permissions";
import { useAuth } from "@/hooks/use-auth";
import { useAppToast } from "@/hooks/use-app-toast";

/**
 * DevAdminHelper:
 * Chỉ hiển thị trong môi trường Development/Testing (không bao giờ hiển thị ở production).
 * Dùng getUserInfo() từ zmp-sdk để lấy chính xác `userInfo.id`.
 * Hỗ trợ copy ID 1-chạm kèm hiển thị vai trò (role) hiện tại được cấp bởi backend.
 */
export function DevAdminHelper() {
  const isDev = isDevelopmentRuntime();
  const { customer, refetchCustomer } = useAuth();
  const { showSuccess, showError } = useAppToast();

  const [isOpen, setIsOpen] = useState(false);
  const [zaloUserId, setZaloUserId] = useState<string | null>(null);
  const [zaloUserName, setZaloUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Không bao giờ render ở Production
  if (!isDev) {
    return null;
  }

  const handleGetZaloId = async () => {
    setIsLoading(true);
    try {
      if (isZaloRuntime()) {
        const userInfo = await fetchZaloUserInfo();
        if (userInfo?.id) {
          setZaloUserId(userInfo.id);
          setZaloUserName(userInfo.name || "");
        } else {
          showError("Không lấy được userInfo.id từ Zalo SDK");
        }
      } else {
        // Fallback giả lập trên trình duyệt web dev
        const mockId = customer?.zalo_user_id || "5746042945227030407";
        setZaloUserId(mockId);
        setZaloUserName(customer?.name || "Dev Mock User");
      }
    } catch (err: any) {
      showError(err?.message || "Lỗi khi gọi getUserInfo()");
    } finally {
      setIsLoading(false);
    }
  };

  const currentDisplayId = zaloUserId || customer?.zalo_user_id;

  const handleCopy = async () => {
    const textToCopy = currentDisplayId;
    if (!textToCopy) {
      handleGetZaloId();
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showSuccess("Đã sao chép Zalo User ID!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Không thể tự động copy, vui lòng chọn và copy thủ công");
    }
  };

  return (
    <>
      {/* Nút badge nổi góc dưới bên phải - chỉ trong Dev */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && !zaloUserId) {
            handleGetZaloId();
          }
        }}
        className="fixed bottom-20 right-3 z-50 flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md active:scale-95"
        title="Admin ID Helper (Dev Only)"
      >
        <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
        <span>Dev Admin ID</span>
      </button>

      {/* Modal / Popup xem và copy Zalo User ID */}
      {isOpen && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/10 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  DEV MODE
                </span>
                <h3 className="text-sm font-bold text-stone-900">
                  Zalo User ID Admin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs leading-relaxed text-stone-600">
                ID này được lấy trực tiếp qua API chính thức{" "}
                <code className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[11px] text-primary">
                  getUserInfo()
                </code>{" "}
                của ZMP SDK.
              </p>

              {/* Box hiển thị ID */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <div className="mb-1 text-[11px] font-medium text-stone-500">
                  Zalo User ID của bạn:
                </div>
                {isLoading ? (
                  <div className="animate-pulse text-xs font-medium text-stone-400">
                    Đang gọi getUserInfo()...
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="select-all break-all font-mono text-xs font-bold text-stone-800">
                      {currentDisplayId || "Chưa lấy được ID"}
                    </span>
                    {currentDisplayId && (
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                          copied
                            ? "bg-emerald-600 text-white"
                            : "bg-primary text-white hover:opacity-90"
                        }`}
                      >
                        {copied ? "Đã chép ✓" : "Copy"}
                      </button>
                    )}
                  </div>
                )}
                {zaloUserName && (
                  <div className="mt-1.5 text-[11px] text-stone-500">
                    Tên hiển thị:{" "}
                    <span className="font-medium text-stone-700">
                      {zaloUserName}
                    </span>
                  </div>
                )}
              </div>

              {/* Trạng thái quyền hiện tại từ backend */}
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">
                    Quyền hiện tại (Backend):
                  </span>
                  <span
                    className={`font-bold ${
                      customer?.role === "ADMIN"
                        ? "text-emerald-600"
                        : customer?.role === "STAFF"
                          ? "text-blue-600"
                          : "text-stone-600"
                    }`}
                  >
                    {customer?.role || "CUSTOMER"}
                  </span>
                </div>
                {customer?.role !== "ADMIN" && (
                  <p className="mt-2 text-[11px] leading-normal text-stone-500">
                    👉 Copy ID trên, dán vào biến môi trường{" "}
                    <code className="rounded bg-stone-200 px-1 py-0.5 font-mono text-[10px] text-stone-800">
                      ADMIN_ZALO_IDS
                    </code>{" "}
                    trong file cấu hình backend và khởi động lại.
                  </p>
                )}
              </div>

              {/* Nút hành động */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGetZaloId}
                    disabled={isLoading}
                    className="flex-1 rounded-xl border border-stone-300 bg-white py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? "Đang lấy..." : "Lấy lại ID"}
                  </button>
                  <button
                    type="button"
                    onClick={() => refetchCustomer()}
                    className="flex-1 rounded-xl border border-stone-300 bg-white py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 active:scale-95"
                  >
                    Làm mới thông tin
                  </button>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.removeItem("bepdi6_access_token");
                    localStorage.removeItem("bepdi6_refresh_token");
                    showSuccess("Đang đăng nhập lại để nhận quyền ADMIN...");
                    window.location.reload();
                  }}
                  className="shadow-xs w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 active:scale-95"
                >
                  ⚡ Đăng nhập lại để nhận quyền mới
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
