import { useState } from "react";
import { Icon } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { BrowseVoucherItem } from "@/types/shop.types";
import { voucherService } from "@/services/voucher/voucher.api";

interface VoucherInputSectionProps {
  voucherCodeInput: string;
  appliedVoucherCode: string;
  subtotal: number;
  discount?: number;
  onInputChange: (val: string) => void;
  onApply: (code?: string) => void;
  onRemove: () => void;
}

export function VoucherInputSection({
  voucherCodeInput,
  appliedVoucherCode,
  subtotal,
  discount,
  onInputChange,
  onApply,
  onRemove,
}: VoucherInputSectionProps) {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<
    BrowseVoucherItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenPicker = async () => {
    setSheetVisible(true);
    setIsLoading(true);
    try {
      const data = await voucherService.browseVouchers(subtotal);
      setAvailableVouchers(Array.isArray(data) ? data : []);
    } catch {
      setAvailableVouchers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVoucher = (v: BrowseVoucherItem) => {
    if (!v.eligible) return;
    onInputChange(v.code);
    onApply(v.code);
    setSheetVisible(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-neutral900">
          {copy.checkout.voucherSection}
        </span>
        <button
          type="button"
          onClick={handleOpenPicker}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary active:scale-95"
        >
          <Icon icon="zi-ticket" className="shrink-0 text-sm" />
          <span>Chọn mã ưu đãi</span>
        </button>
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
            className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-transform active:scale-95"
          >
            {copy.checkout.removeVoucher}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onApply()}
            disabled={!voucherCodeInput.trim()}
            className="shadow-xs rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primaryDark active:scale-95 disabled:opacity-40"
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

      {/* Voucher Picker Bottom Sheet */}
      {sheetVisible && (
        <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="safe-bottom max-h-[75vh] w-full max-w-lg rounded-t-3xl bg-stone-50 p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Mã Giảm Giá Của Quán
                </h3>
                <p className="text-[11px] text-stone-500">
                  Áp dụng cho giỏ hàng hiện tại: {formatCurrency(subtotal)}₫
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSheetVisible(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/80 text-stone-600 active:scale-95"
              >
                <Icon icon="zi-close" className="shrink-0 text-sm" />
              </button>
            </div>

            <div className="mt-3 max-h-[50vh] space-y-2.5 overflow-y-auto">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  Đang kiểm tra mã ưu đãi...
                </div>
              ) : availableVouchers.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-500">
                  Hiện không có mã giảm giá nào.
                </div>
              ) : (
                availableVouchers.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVoucher(v)}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                      v.eligible
                        ? "shadow-xs cursor-pointer border-primary/40 bg-white hover:border-primary active:scale-[0.99]"
                        : "border-stone-200 bg-stone-100/70 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-primary">
                          {v.code}
                        </span>
                        <span className="text-xs font-bold text-stone-800">
                          - {v.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {v.eligible ? (
                          <span className="font-semibold text-emerald-600">
                            Giảm {formatCurrency(v.discount_amount)}₫
                          </span>
                        ) : (
                          <span className="text-stone-500">
                            {v.ineligible_reason || "Chưa đủ điều kiện"}
                          </span>
                        )}
                      </p>
                    </div>

                    {v.eligible ? (
                      <button
                        type="button"
                        className="shadow-xs rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Áp dụng
                      </button>
                    ) : (
                      <span className="rounded bg-stone-200 px-2 py-1 text-[10px] font-semibold text-stone-500">
                        Chưa đủ ĐK
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
