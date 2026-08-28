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
    <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5">
      <span className="block text-xs font-bold text-neutral900">
        {copy.checkout.voucherSection}
      </span>
      <div className="flex gap-2">
        <input
          type="text"
          value={voucherCodeInput}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={copy.checkout.voucherPlaceholder}
          className="flex-1 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-xs uppercase text-neutral900 placeholder:normal-case placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        {appliedVoucherCode ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-all active:scale-95"
          >
            {copy.checkout.removeVoucher}
          </button>
        ) : (
          <button
            type="button"
            onClick={onApply}
            disabled={!voucherCodeInput.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-primaryDark active:scale-95 disabled:opacity-50"
          >
            {copy.checkout.applyVoucher}
          </button>
        )}
      </div>
      {appliedVoucherCode && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xxsmall text-primaryDark">
          <span>
            ✓ {copy.checkout.appliedVoucherPrefix} <b>{appliedVoucherCode}</b>
          </span>
          {discount ? (
            <span className="font-bold">-{formatCurrency(discount)}đ</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
