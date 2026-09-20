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
      className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-base font-bold text-stone-900">
          {copy.staff.cancel.title}
        </h3>
        <p className="mb-3 text-xs text-stone-600">
          {copy.staff.cancel.prompt} #{order?.order_code}:
        </p>

        <div className="flex flex-col gap-2">
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

        {cancelReason === "Khác" && (
          <input
            type="text"
            placeholder={copy.staff.cancel.customPlaceholder}
            value={customReason}
            onChange={(e) => onChangeCustomReason(e.target.value)}
            className="mt-2.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-primary focus:bg-white"
          />
        )}

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {copy.staff.cancel.back}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirmCancel}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-xs font-bold text-white shadow-sm transition-colors active:scale-[0.98] disabled:opacity-50"
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
