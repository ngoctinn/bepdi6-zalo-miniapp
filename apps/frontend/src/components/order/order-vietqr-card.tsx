import { useState, useEffect } from "react";
import { Order } from "@/types/order.types";
import { ShopInfo } from "@/types/shop.types";
import { formatCurrency } from "@/utils/format";
import { Badge } from "@/components/common/badge";
import { CheckIcon, DownloadIcon } from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";
import { saveImageToGallery } from "zmp-sdk/apis";
import { useAppToast } from "@/hooks/use-app-toast";
import { DEFAULT_BANK_CONFIG, getVietQrUrl } from "@/constants/shop";
import { copyToClipboard } from "@/utils/clipboard";
import { orderService } from "@/services/order/order.api";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/services/query-keys";

interface OrderVietQrCardProps {
  order: Order;
  shopInfo?: ShopInfo;
  isPaid: boolean;
  isCancelled: boolean;
}

export function OrderVietQrCard({
  order,
  shopInfo,
  isPaid,
  isCancelled,
}: OrderVietQrCardProps) {
  const { showSuccess, showError } = useAppToast();
  const queryClient = useQueryClient();
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [isSavedQrSuccess, setIsSavedQrSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isNotifying, setIsNotifying] = useState(false);
  const [hasNotified, setHasNotified] = useState(
    order.payment?.status === "PENDING",
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isBankTransfer = order.payment_method === "BANK_TRANSFER";

  useEffect(() => {
    if (isPaid || isCancelled || !isBankTransfer) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, isCancelled, isBankTransfer]);

  // Tự động invalidate query mỗi 4 giây để bắt Webhook SePay/Casso nổ về realtime (chỉ khi tab đang active)
  useEffect(() => {
    if (isPaid || isCancelled || !isBankTransfer) return;
    const pollInterval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(order.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.payment(order.id),
      });
    }, 4000);
    return () => clearInterval(pollInterval);
  }, [order.id, isPaid, isCancelled, isBankTransfer, queryClient]);

  if (!isBankTransfer || isCancelled) {
    return null;
  }

  const bankAccountNo =
    shopInfo?.vietqr_account_no || DEFAULT_BANK_CONFIG.accountNumber;
  const bankAccountHolder =
    shopInfo?.vietqr_account_name ||
    DEFAULT_BANK_CONFIG.accountHolderName ||
    copy.orderDetail.accountHolderName;
  const bankCode = shopInfo?.vietqr_bank_id || DEFAULT_BANK_CONFIG.bankCode;
  const bankDisplayName =
    shopInfo?.vietqr_bank_id ||
    DEFAULT_BANK_CONFIG.bankName ||
    copy.orderDetail.bankName;

  const qrUrl =
    order.payment?.qr_code_url ||
    getVietQrUrl({
      amount: order.total_amount,
      orderCode: order.order_code,
      bankCode: bankCode,
      accountNumber: bankAccountNo,
      accountHolderName: bankAccountHolder,
    });

  const handleCopy = async (text: string, key: string, _label: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1500);
    } else {
      showError(
        copy.orderDetail.copyFailedFallback ||
          "Không thể tự động sao chép. Vui lòng sao chép thủ công.",
      );
    }
  };

  const handleSaveQr = async () => {
    if (!qrUrl || isSavingQr) return;
    setIsSavingQr(true);
    try {
      await saveImageToGallery({
        imageUrl: qrUrl,
      });
      setIsSavedQrSuccess(true);
      setTimeout(() => setIsSavedQrSuccess(false), 2000);
    } catch (err) {
      console.warn("[VietQR] saveImageToGallery error:", err);
      showError(copy.orderDetail.savedQrFailed);
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleNotifyTransferred = async () => {
    if (isNotifying || hasNotified) return;
    setIsNotifying(true);
    try {
      await orderService.notifyTransferred(order.id);
      setHasNotified(true);
      showSuccess(
        "Đã báo nhân viên! Bếp đang kiểm tra và chuẩn bị món cho bạn nhé.",
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(order.id),
      });
    } catch (err) {
      console.warn("[VietQR] notifyTransferred error:", err);
      showError("Có lỗi xảy ra khi gửi thông báo. Bạn vui lòng thử lại nhé!");
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="shadow-xs space-y-3 rounded-2xl border border-primary/25 bg-primarySurface/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral900">
          {copy.orderDetail.vietqrTitle}
        </span>
        <Badge
          variant={isPaid ? "primary" : hasNotified ? "warning" : "neutral"}
          size="small"
          className={isPaid ? "" : "animate-pulse"}
        >
          {isPaid
            ? copy.orderDetail.paidStatus
            : hasNotified
              ? "Chờ nhân viên kiểm tra"
              : copy.orderDetail.pendingPayStatus}
        </Badge>
      </div>

      {!isPaid ? (
        <div className="mt-3 flex flex-col items-center space-y-3 text-center">
          <div className="inline-block rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm">
            <img
              src={qrUrl}
              alt="VietQR Bep Di 6"
              className="h-52 w-52 object-contain"
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={handleSaveQr}
              disabled={isSavingQr}
              aria-label={
                copy.orderDetail.saveQrToGallery || "Lưu mã QR vào máy"
              }
              className={cn(
                "shadow-2xs inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-transform active:scale-95",
                isSavedQrSuccess
                  ? "border-primary/40 bg-primarySurface font-bold text-primaryDark"
                  : "border-primary/30 bg-white text-primary active:bg-primaryLight/30",
              )}
            >
              {isSavingQr ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : isSavedQrSuccess ? (
                <CheckIcon className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <DownloadIcon className="h-4 w-4 shrink-0" />
              )}
              <span>
                {isSavedQrSuccess
                  ? "Đã lưu vào bộ sưu tập"
                  : copy.orderDetail.saveQrToGallery || "Lưu mã QR vào máy"}
              </span>
            </button>

            {/* Nút Fallback Dự Phòng Bán Tự Động (0đ) khi hết hạn mức Webhook hoặc mạng trễ */}
            {(elapsedSeconds >= 8 || hasNotified) && (
              <button
                type="button"
                onClick={handleNotifyTransferred}
                disabled={isNotifying || hasNotified}
                className={cn(
                  "shadow-2xs inline-flex min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-transform active:scale-95",
                  hasNotified
                    ? "border-amber-300 bg-amber-50 text-amber-800"
                    : "border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800",
                )}
              >
                {isNotifying ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : hasNotified ? (
                  <CheckIcon className="h-4 w-4 shrink-0 text-amber-700" />
                ) : null}
                <span>
                  {hasNotified
                    ? "Đã báo quán: Đang đợi nhân viên duyệt"
                    : "Tôi đã chuyển khoản xong"}
                </span>
              </button>
            )}
          </div>

          {/* Chi tiết tài khoản nhận tiền */}
          <div className="shadow-2xs w-full space-y-2 rounded-xl bg-white p-3 text-left text-xs">
            {/* Tên ngân hàng */}
            <div className="flex items-center justify-between">
              <span className="text-neutral500">
                {copy.orderDetail.bankLabel}
              </span>
              <span className="font-bold text-neutral900">
                {bankDisplayName}
              </span>
            </div>

            {/* Số tài khoản */}
            <div className="flex items-center justify-between">
              <span className="text-neutral500">
                {copy.orderDetail.accountNoLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-neutral900">
                  {bankAccountNo}
                </span>
                <button
                  type="button"
                  aria-label="Sao chép số tài khoản"
                  onClick={() =>
                    handleCopy(
                      bankAccountNo,
                      "bankAccountNo",
                      copy.orderDetail.accountNoLabel,
                    )
                  }
                  className={cn(
                    "shadow-2xs inline-flex min-h-[38px] min-w-[76px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-transform active:scale-95",
                    copiedKey === "bankAccountNo"
                      ? "border-primary/40 bg-primarySurface font-bold text-primaryDark"
                      : "border-primary/30 bg-white text-primary active:bg-primary/10",
                  )}
                >
                  {copiedKey === "bankAccountNo" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    copy.orderDetail.copy
                  )}
                </button>
              </div>
            </div>

            {/* Tên chủ tài khoản */}
            <div className="flex items-center justify-between">
              <span className="text-neutral500">
                {copy.orderDetail.accountHolderLabel}
              </span>
              <span className="font-bold text-neutral900">
                {bankAccountHolder}
              </span>
            </div>

            {/* Số tiền thanh toán */}
            <div className="flex items-center justify-between">
              <span className="text-neutral500">
                {copy.orderDetail.amountLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-neutral900">
                  {formatCurrency(order.total_amount)}đ
                </span>
                <button
                  type="button"
                  aria-label="Sao chép số tiền thanh toán"
                  onClick={() =>
                    handleCopy(
                      String(order.total_amount),
                      "amount",
                      copy.orderDetail.amountLabel,
                    )
                  }
                  className={cn(
                    "shadow-2xs inline-flex min-h-[38px] min-w-[76px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-transform active:scale-95",
                    copiedKey === "amount"
                      ? "border-primary/40 bg-primarySurface font-bold text-primaryDark"
                      : "border-primary/30 bg-white text-primary active:bg-primary/10",
                  )}
                >
                  {copiedKey === "amount" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    copy.orderDetail.copy
                  )}
                </button>
              </div>
            </div>

            {/* Nội dung chuyển khoản */}
            <div className="flex items-center justify-between">
              <span className="text-neutral500">
                {copy.orderDetail.transferContentLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-neutral900">
                  {order.order_code}
                </span>
                <button
                  type="button"
                  aria-label="Sao chép nội dung chuyển khoản"
                  onClick={() =>
                    handleCopy(
                      order.order_code,
                      "orderCode",
                      copy.orderDetail.transferContentLabel,
                    )
                  }
                  className={cn(
                    "shadow-2xs inline-flex min-h-[38px] min-w-[76px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-transform active:scale-95",
                    copiedKey === "orderCode"
                      ? "border-primary/40 bg-primarySurface font-bold text-primaryDark"
                      : "border-primary/30 bg-white text-primary active:bg-primary/10",
                  )}
                >
                  {copiedKey === "orderCode" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    copy.orderDetail.copy
                  )}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xxsmall italic text-neutral500">
            {copy.orderDetail.autoUpdateNote}
          </p>
        </div>
      ) : (
        <div className="mt-2 rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs text-primaryDark">
          {copy.orderDetail.paidSuccessMessage}
        </div>
      )}
    </div>
  );
}

export default OrderVietQrCard;
