import { PaymentMethod } from "@/types/order.types";
import { copy } from "@/constants/copy";

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export function PaymentMethodSelector({
  paymentMethod,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5">
      <span className="block text-xs font-bold text-neutral900">
        {copy.checkout.paymentMethodSection}
      </span>
      <div className="space-y-2">
        {/* COD */}
        <label
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
            paymentMethod === "COD"
              ? "border-primary bg-primary/5"
              : "border-black/5 bg-transparent hover:bg-black/[0.02]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <input
              type="radio"
              name="payment_method"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={() => onChange("COD")}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-xs font-medium text-neutral900">
              {copy.checkout.cash}
            </span>
          </div>
        </label>

        {/* VietQR Chuyển Khoản Tức Thì */}
        <label
          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
            paymentMethod === "BANK_TRANSFER"
              ? "border-primary bg-primary/5"
              : "border-black/5 bg-transparent hover:bg-black/[0.02]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <input
              type="radio"
              name="payment_method"
              value="BANK_TRANSFER"
              checked={paymentMethod === "BANK_TRANSFER"}
              onChange={() => onChange("BANK_TRANSFER")}
              className="h-4 w-4 accent-primary"
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral900">
                {copy.checkout.vietqr}
              </span>
              <span className="text-xxsmall text-primary">
                {copy.orderDetail.bankName}
              </span>
            </div>
          </div>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xxxxsmall font-bold text-primary">
            {copy.checkout.recommended || "Khuyên dùng"}
          </span>
        </label>
      </div>
    </div>
  );
}
