import React from "react";

export interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message?: React.ReactNode;
  closeText?: string;
  actionText?: string;
  onClose: () => void;
  onAction?: () => void;
}

/**
 * ErrorModal: Thông báo lỗi dạng Modal thuần React + Tailwind độc lập, loại bỏ hoàn toàn lỗi backdrop overlay freeze từ zmp-ui.
 */
export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title = "Đã có lỗi xảy ra",
  message = "Không thể hoàn tất thao tác. Vui lòng thử lại sau.",
  closeText = "Đóng",
  actionText,
  onClose,
  onAction,
}) => {
  if (!visible) return null;

  return (
    <div className="backdrop-blur-xs fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-[320px] rounded-2xl bg-white p-5 text-center shadow-2xl">
        {/* Soft Error Icon badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-danger">
          <svg
            className="h-8 w-8 text-danger"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>

        <h3 className="mb-2 break-words text-base font-bold text-neutral900">
          {title}
        </h3>

        <div className="mb-6 break-words text-sm leading-relaxed text-neutral600">
          {message}
        </div>

        <div className="flex gap-3">
          {actionText && onAction && (
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl bg-stone100 text-sm font-semibold text-neutral700 transition-all hover:bg-stone200 active:scale-[0.98]"
            >
              {closeText}
            </button>
          )}

          <button
            type="button"
            onClick={onAction || onClose}
            className="h-11 flex-1 rounded-xl bg-danger text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {actionText || closeText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
