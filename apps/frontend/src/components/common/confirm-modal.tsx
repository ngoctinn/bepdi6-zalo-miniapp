import React from "react";

export type ConfirmType = "danger" | "warning" | "info" | "primary";

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * ConfirmModal: Popup hộp thoại xác nhận thuần React + Tailwind, loại bỏ hoàn toàn lỗi backdrop overlay freeze từ zmp-ui.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  description,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "primary",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  const getConfirmButtonClasses = () => {
    switch (type) {
      case "danger":
        return "bg-danger text-white hover:opacity-90 active:scale-[0.98]";
      case "warning":
        return "bg-amber-600 text-white hover:opacity-90 active:scale-[0.98]";
      case "info":
      case "primary":
      default:
        return "bg-primary text-white hover:bg-primaryDark active:scale-[0.98]";
    }
  };

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[1500] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 text-center shadow-2xl">
        <h3 className="mb-2 break-words text-base font-bold text-neutral900">
          {title}
        </h3>

        {description && (
          <div className="mb-5 text-xs leading-relaxed text-neutral600">
            {description}
          </div>
        )}

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 flex-1 rounded-xl bg-stone100 text-xs font-semibold text-neutral700 transition-all hover:bg-stone200 active:scale-[0.98] disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex h-11 flex-1 items-center justify-center rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 ${getConfirmButtonClasses()}`}
          >
            {loading ? "Đang xử lý..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
