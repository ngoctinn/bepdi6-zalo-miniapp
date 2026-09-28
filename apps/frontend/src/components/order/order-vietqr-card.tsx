import { useState } from "react";
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
  const { showError } = useAppToast();
  const [isSavingQr, setIsSavingQr] = useState(false);
  const [isSavedQrSuccess, setIsSavedQrSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isBankTransfer = order.payment_method === "BANK_TRANSFER";

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

  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("Copy command failed");
        }
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1500);
    } catch (err) {
      console.warn("[Clipboard] copy failed:", err);
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

  return (
    <div className="shadow-xs border-primary/25 space-y-3 rounded-2xl border bg-olive50/60 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral900">
          {copy.orderDetail.vietqrTitle}
        </span>
        <Badge
          variant={isPaid ? "primary" : "warning"}
          size="small"
          className={isPaid ? "" : "animate-pulse"}
        >
          {isPaid
            ? copy.orderDetail.paidStatus
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

          <button
            type="button"
            onClick={handleSaveQr}
            disabled={isSavingQr}
            aria-label={copy.orderDetail.saveQrToGallery || "Lưu mã QR vào máy"}
            className={cn(
              "shadow-2xs inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all active:scale-95",
              isSavedQrSuccess
                ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-700"
                : "border-primary/30 bg-white text-primary active:bg-olive50",
            )}
          >
            {isSavingQr ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : isSavedQrSuccess ? (
              <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <DownloadIcon className="h-4 w-4 shrink-0" />
            )}
            <span>
              {isSavedQrSuccess
                ? "Đã lưu vào máy!"
                : copy.orderDetail.saveQrToGallery}
            </span>
          </button>

          <div className="w-full space-y-2.5 rounded-xl border border-black/5 bg-black/[0.02] p-3.5 text-left text-xs">
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
                {copy.orderDetail.accountNumberLabel}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">
                  {bankAccountNo}
                </span>
                <button
                  type="button"
                  aria-label="Sao chép số tài khoản"
                  onClick={() =>
                    handleCopy(
                      bankAccountNo,
                      "bankAccountNo",
                      copy.orderDetail.accountNumberLabel,
                    )
                  }
                  className={cn(
                    "shadow-2xs inline-flex min-h-[38px] min-w-[76px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                    copiedKey === "bankAccountNo"
                      ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-700"
                      : "border-primary/30 active:bg-primary/10 bg-white text-primary",
                  )}
                >
                  {copiedKey === "bankAccountNo" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
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
                    "shadow-2xs inline-flex min-h-[38px] min-w-[76px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                    copiedKey === "amount"
                      ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-700"
                      : "border-primary/30 active:bg-primary/10 bg-white text-primary",
                  )}
                >
                  {copiedKey === "amount" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
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
                    "shadow-2xs inline-flex min-h-[38px] min-w-[76px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                    copiedKey === "orderCode"
                      ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-700"
                      : "border-primary/30 active:bg-primary/10 bg-white text-primary",
                  )}
                >
                  {copiedKey === "orderCode" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
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
        <div className="border-primary/30 bg-primary/10 mt-2 rounded-lg border p-2.5 text-xs text-primaryDark">
          {copy.orderDetail.paidSuccessMessage}
        </div>
      )}
    </div>
  );
}

export default OrderVietQrCard;
