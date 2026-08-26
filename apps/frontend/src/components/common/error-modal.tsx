import React from "react";
import { Modal, Button, Text, Icon } from "zmp-ui";

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
 * ErrorModal: Thông báo lỗi dạng Modal theo Zalo Mini App Design Guidelines:
 * - Dùng icon Zalo UI chuẩn (`zi-close-circle`).
 * - Cơ chế: Dạng Modal lớp trên cùng (z-index: 9999).
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
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      mask
      maskClosable={false}
      zIndex={9999}
      modalClassName="rounded-2xl max-w-[340px] p-6 text-center shadow-2xl border-0 bg-white"
    >
      <div className="flex flex-col">
        {/* Soft Error Icon badge sử dụng SVG Vector độc lập */}
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

        <Text.Title size="small" className="mb-2 font-bold text-neutral900">
          {title}
        </Text.Title>

        <div className="mb-6 text-sm leading-relaxed text-neutral600">
          {message}
        </div>

        <div className="flex gap-3">
          {actionText && onAction && (
            <Button
              variant="secondary"
              onClick={onClose}
              className="!h-11 flex-1 !rounded-xl !border-0 !bg-stone100 !text-sm !font-semibold !text-neutral700 transition-all hover:!bg-stone200 active:scale-[0.98]"
            >
              {closeText}
            </Button>
          )}

          <Button
            onClick={onAction || onClose}
            className="!h-11 flex-1 !rounded-xl !border-0 !bg-danger !text-sm !font-bold !text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
          >
            {actionText || closeText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ErrorModal;
