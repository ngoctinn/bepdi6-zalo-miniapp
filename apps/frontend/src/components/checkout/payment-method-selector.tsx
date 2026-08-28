import { PaymentMethod } from "@/types/order.types";
import { copy } from "@/constants/copy";
import { CheckIcon } from "@/components/common/vectors";
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
        <span className="text-xs font-bold text-neutral900">
          {copy.checkout.paymentMethodSection}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {/* COD */}
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
                ? "shadow-xs border border-primary/40 bg-primary text-white"
                : "border border-stone-300 bg-transparent",
            )}
          >
            {isCod && <CheckIcon className="h-3 w-3 text-white" />}
          </span>
        </button>

        {/* Chuyển Khoản Ngân Hàng */}
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
                Chuyển khoản
              </span>
              <span className="inline-flex items-center justify-center rounded-md border border-olive600/20 bg-olive100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-olive900">
                Khuyên dùng
              </span>
            </div>
            <span className="mt-0.5 text-xxsmall font-medium text-neutral500">
              {copy.orderDetail.bankName}
            </span>
          </div>

          {/* Custom Soft Radio Indicator */}
          <span
            className={cn(
              "ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150",
              isBankTransfer
                ? "shadow-xs border border-primary/40 bg-primary text-white"
                : "border border-stone-300 bg-transparent",
            )}
          >
            {isBankTransfer && <CheckIcon className="h-3 w-3 text-white" />}
          </span>
        </button>
      </div>
    </div>
  );
}
