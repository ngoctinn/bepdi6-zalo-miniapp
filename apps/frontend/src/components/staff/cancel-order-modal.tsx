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
        className="safe-bottom animate-slideUp flex max-h-[88vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="flex w-full items-center justify-center pb-2">
          <div className="h-1.5 w-12 rounded-full bg-stone-300" />
        </div>

        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-red-100 p-1.5 text-red-600">
              <Icon
                icon="zi-warning-solid"
                className="text-base leading-none"
              />
            </span>
            <div>
              <h3 className="text-base font-bold text-neutral900">
                {copy.staff.cancel.title}
              </h3>
              {order && (
                <p className="font-mono text-xs font-semibold text-stone-500">
                  #{order.order_code} • {order.recipient_name}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 active:scale-95"
          >
            <Icon icon="zi-close" className="text-base" />
          </button>
        </div>

        <p className="mt-3 text-xs font-semibold text-stone-600">
          {copy.staff.cancel.prompt}
        </p>

        <div className="mt-2.5 space-y-2">
          {copy.staff.cancel.reasons.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onSelectReason(reason)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-colors active:scale-[0.99] ${
                cancelReason === reason
                  ? "border-primary bg-primary/10 text-primaryDark"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              <span>{reason}</span>
              {cancelReason === reason && (
                <Icon
                  icon="zi-check-circle-solid"
                  className="text-base leading-none text-primary"
                />
              )}
            </button>
          ))}
        </div>

        {cancelReason === copy.staff.cancel.otherReasonKey && (
          <input
            type="text"
            placeholder={copy.staff.cancel.customPlaceholder}
            value={customReason}
            onChange={(e) => onChangeCustomReason(e.target.value)}
            className="mt-2.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-primary focus:bg-white"
          />
        )}

        {/* Action Buttons: Nút 'Quay lại' ưu tiên bảo vệ đơn hàng, Nút 'Hủy' thu hẹp diện tích tránh bấm nhầm */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex h-12 flex-[2] items-center justify-center rounded-xl border border-stone-300 bg-stone-100 text-xs font-bold text-stone-800 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {copy.staff.cancel.back}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirmCancel}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-600 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 active:scale-[0.98] disabled:opacity-50"
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
