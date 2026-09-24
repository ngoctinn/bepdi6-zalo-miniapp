import { Spinner, Icon } from "zmp-ui";
import { Order } from "@/types/order.types";
import { copy } from "@/constants/copy";

interface CancelOrderModalProps {
  visible: boolean;
  order: Order | null;
  cancelReason: string;
  customReason: string;
  loading?: boolean;
  onClose: () => void;
  onSelectReason: (reason: string) => void;
  onChangeCustomReason: (reason: string) => void;
  onConfirmCancel: () => Promise<void>;
}

export function CancelOrderModal({
  visible,
  order,
  cancelReason,
  customReason,
  loading = false,
  onClose,
  onSelectReason,
  onChangeCustomReason,
  onConfirmCancel,
}: CancelOrderModalProps) {
  if (!visible) return null;

  return (
    <div
      className="animate-fadeIn fixed inset-0 z-[1500] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="safe-bottom animate-slideUp flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="flex w-full items-center justify-center pb-2 pt-0.5">
          <div className="h-1.5 w-12 rounded-full bg-stone-300" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Icon icon="zi-warning-solid" className="text-xl leading-none" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral900">
                {copy.staff.cancel.title}
              </h3>
              {order && (
                <p className="mt-0.5 font-mono text-xxsmall font-medium text-stone-500">
                  Đơn #{order.order_code} • {order.recipient_name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-transform active:scale-95"
            aria-label="Đóng"
          >
            <Icon icon="zi-close" className="text-base" />
          </button>
        </div>

        {/* Warning Callout Banner */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 p-2.5 text-xs text-rose-900">
          <Icon
            icon="zi-warning-circle-solid"
            className="mt-0.5 shrink-0 text-sm leading-none text-rose-600"
          />
          <p className="text-xxsmall leading-relaxed text-rose-800">
            Đơn hàng sau khi hủy sẽ <strong>không thể hoàn tác</strong>. Hệ
            thống sẽ ghi nhận lý do và cập nhật trạng thái đơn.
          </p>
        </div>

        {/* Reason Section Title */}
        <p className="mt-3.5 text-xs font-bold text-stone-700">
          {copy.staff.cancel.prompt}
        </p>

        {/* Reason Options with Polished Radio Feedback */}
        <div className="mt-2 space-y-2">
          {copy.staff.cancel.reasons.map((reason) => {
            const isSelected = cancelReason === reason;
            return (
              <button
                key={reason}
                type="button"
                onClick={() => onSelectReason(reason)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-xs transition-all active:scale-[0.99] ${
                  isSelected
                    ? "shadow-xs border-rose-400 bg-rose-50/70 font-bold text-rose-950"
                    : "border-stone-200/90 bg-white font-medium text-stone-700 hover:border-stone-300"
                }`}
              >
                <span>{reason}</span>
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected
                      ? "border-rose-600 bg-white"
                      : "border-stone-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-rose-600" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Reason Textarea if 'Khác' is selected */}
        {cancelReason === copy.staff.cancel.otherReasonKey && (
          <div className="mt-2.5">
            <textarea
              rows={3}
              placeholder={copy.staff.cancel.customPlaceholder}
              value={customReason}
              onChange={(e) => onChangeCustomReason(e.target.value)}
              className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-rose-400 focus:bg-white focus:ring-1 focus:ring-rose-200"
            />
          </div>
        )}

        {/* Balanced Drawer Action Buttons */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 transition-colors hover:bg-stone-200 active:scale-[0.98] disabled:opacity-50"
          >
            {copy.staff.cancel.back}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirmCancel}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 text-xs font-bold text-white shadow-sm transition-colors hover:bg-rose-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner visible logo={false} />
                <span>{copy.staff.cancel.cancelling}</span>
              </>
            ) : (
              copy.staff.cancel.confirm
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
