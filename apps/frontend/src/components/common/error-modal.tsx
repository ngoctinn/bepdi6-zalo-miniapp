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
      modalClassName="rounded-[20px] overflow-hidden p-0 max-w-[340px] shadow-2xl border-0"
    >
      <div className="bg-white p-6 text-center">
        {/* Soft Error Icon badge sử dụng Zalo UI Icon chuẩn */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-danger">
          <Icon icon="zi-close-circle" className="text-3xl text-danger" />
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
