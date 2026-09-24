import { PaymentMethod } from "@/types/order.types";
import { copy } from "@/constants/copy";
import { CheckIcon } from "@/components/common/vectors";
import { Badge } from "@/components/common/badge";
import { cn } from "@/utils/cn";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  paymentMethod,
  onChange,
}: PaymentMethodSelectorProps) {
  const isCod = paymentMethod === "COD";
  const isBankTransfer = paymentMethod === "BANK_TRANSFER";

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="px-1">
        <span className="text-xs font-bold uppercase text-neutral900">
          {copy.checkout.paymentMethodSection}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {/* Chuyển Khoản Ngân Hàng - Khuyên dùng (Ưu tiên hiển thị đầu tiên) */}
        <button
          type="button"
          onClick={() => onChange("BANK_TRANSFER")}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border p-3.5 text-xs transition-all duration-150 active:scale-[0.99]",
            isBankTransfer
              ? "shadow-xs border-primary/40 bg-olive50/90 font-semibold text-olive900"
              : "border-black/[0.06] bg-white font-medium text-neutral800 hover:border-black/10",
          )}
        >
          <div className="flex flex-1 flex-col pr-2 text-left">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs leading-snug",
                  isBankTransfer
                    ? "font-semibold text-olive900"
                    : "font-medium text-neutral800",
                )}
              >
                {copy.checkout.paymentBankTransfer || "Chuyển khoản"}
              </span>
              <Badge variant="recommended" size="small">
                {copy.checkout.recommendedBadge || "Khuyên dùng"}
              </Badge>
            </div>
            <span className="mt-0.5 text-xxsmall font-medium text-neutral500">
              {copy.orderDetail.bankName} • Quét mã VietQR tự động xác nhận
              trong 5s
            </span>
          </div>

          {/* Custom Soft Radio Indicator */}
          <span
            className={cn(
              "ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150",
              isBankTransfer
                ? "shadow-xs border-primary/40 border bg-primary text-white"
                : "border border-stone-300 bg-transparent",
            )}
          >
            {isBankTransfer && <CheckIcon className="h-3 w-3 text-white" />}
          </span>
        </button>

        {/* Tiền mặt khi nhận hàng (COD) */}
        <button
          type="button"
          onClick={() => onChange("COD")}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border p-3.5 text-xs transition-all duration-150 active:scale-[0.99]",
            isCod
              ? "shadow-xs border-primary/40 bg-olive50/90 font-semibold text-olive900"
              : "border-black/[0.06] bg-white font-medium text-neutral800 hover:border-black/10",
          )}
        >
          <span
            className={cn(
              "text-xs leading-snug",
              isCod
                ? "font-semibold text-olive900"
                : "font-medium text-neutral800",
            )}
          >
            {copy.checkout.cash}
          </span>

          {/* Custom Soft Radio Indicator */}
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150",
              isCod
                ? "shadow-xs border-primary/40 border bg-primary text-white"
                : "border border-stone-300 bg-transparent",
            )}
          >
            {isCod && <CheckIcon className="h-3 w-3 text-white" />}
          </span>
        </button>
      </div>
    </div>
  );
}
