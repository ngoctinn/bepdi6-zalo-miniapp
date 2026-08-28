import { Order } from "@/types/order.types";
import { Modal, Input, Icon } from "zmp-ui";

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
  return (
    <Modal
      visible={visible}
      title="Xác nhận hủy đơn hàng"
      onClose={onClose}
      verticalActions
    >
      <div className="flex flex-col gap-3 py-2">
        <p className="text-xs text-stone-600">
          Vui lòng chọn lý do hủy đơn #{order?.order_code}:
        </p>

        <div className="flex flex-col gap-2">
          {CANCEL_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => onSelectReason(reason)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                cancelReason === reason
                  ? "border-primary bg-primary/10 text-primaryDark"
                  : "border-stone-200 bg-white text-stone-700"
              }`}
            >
              <span>{reason}</span>
              {cancelReason === reason && (
                <Icon
                  icon="zi-check-circle-solid"
                  className="text-base text-primary"
                />
              )}
            </button>
          ))}
        </div>

        {cancelReason === "Khác" && (
          <Input
            type="text"
            placeholder="Nhập lý do chi tiết..."
            value={customReason}
            onChange={(e) => onChangeCustomReason(e.target.value)}
            className="mt-1 text-xs"
          />
        )}

        <div className="mt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 active:bg-stone-50"
          >
            Quay lại
          </button>
          <button
            onClick={onConfirmCancel}
            className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white shadow-sm active:bg-red-700"
          >
            Xác nhận hủy
          </button>
        </div>
      </div>
    </Modal>
  );
}
