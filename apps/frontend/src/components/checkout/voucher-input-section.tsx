import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";

interface VoucherInputSectionProps {
  voucherCodeInput: string;
  appliedVoucherCode: string;
  discount?: number;
  onInputChange: (val: string) => void;
  onApply: () => void;
  onRemove: () => void;
}

export function VoucherInputSection({
  voucherCodeInput,
  appliedVoucherCode,
  discount,
  onInputChange,
  onApply,
  onRemove,
}: VoucherInputSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1">
        <span className="text-xs font-bold text-neutral900">
          {copy.checkout.voucherSection}
        </span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={voucherCodeInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={copy.checkout.voucherPlaceholder}
          className="shadow-xs flex-1 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs uppercase text-neutral900 transition-colors placeholder:normal-case placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        {appliedVoucherCode ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-all active:scale-95"
          >
            {copy.checkout.removeVoucher}
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={!voucherCodeInput.trim()}
            className="shadow-xs rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-primaryDark active:scale-95 disabled:opacity-40"
          >
            {copy.checkout.applyVoucher}
          </button>
        )}
      </div>
      {appliedVoucherCode && (
        <div className="flex items-center justify-between rounded-xl border border-primary/25 bg-olive50/90 px-3.5 py-2.5 text-xs text-primaryDark">
          <span className="font-medium">
            {copy.checkout.appliedVoucherPrefix} <b>{appliedVoucherCode}</b>
          </span>
          {discount ? (
            <span className="font-bold text-primaryDark">
              -{formatCurrency(discount)}đ
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
