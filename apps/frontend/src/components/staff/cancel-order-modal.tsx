import { Order } from "@/types/order.types";

interface CancelOrderModalProps {
  visible: boolean;
  order: Order | null;
  cancelReason: string;
  customReason: string;
  onClose: () => void;
  onSelectReason: (reason: string) => void;
  onChangeCustomReason: (reason: string) => void;
  onConfirmCancel: () => Promise<void>;
}

const CANCEL_REASONS = [
  "Quán quá tải món",
  "Đã hết nguyên liệu",
  "Khách hàng gọi điện hủy",
  "Không liên lạc được khách",
  "Khác",
];

export function CancelOrderModal({
  visible,
  order,
  cancelReason,
  customReason,
  onClose,
  onSelectReason,
  onChangeCustomReason,
  onConfirmCancel,
}: CancelOrderModalProps) {
  if (!visible) return null;

  return (
    <div
      className="backdrop-blur-xs fixed inset-0 z-[1500] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-base font-bold text-stone-900">
          Xác nhận hủy đơn hàng
        </h3>
        <p className="mb-3 text-xs text-stone-600">
          Vui lòng chọn lý do hủy đơn #{order?.order_code}:
        </p>

        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => onSelectReason(reason)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-all active:scale-[0.99] ${
                cancelReason === reason
                  ? "border-primary bg-primary/10 text-primaryDark"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span>{reason}</span>
              {cancelReason === reason && (
                <svg
                  className="h-4 w-4 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>

        {cancelReason === "Khác" && (
          <input
            type="text"
            placeholder="Nhập lý do chi tiết..."
            value={customReason}
            onChange={(e) => onChangeCustomReason(e.target.value)}
            className="mt-2.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-primary focus:bg-white"
          />
        )}

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 transition-all hover:bg-stone-200 active:scale-[0.98]"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={onConfirmCancel}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98]"
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </div>
  );
}
