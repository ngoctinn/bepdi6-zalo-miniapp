import React from "react";
import { Modal, Button, Text } from "zmp-ui";

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
 * ConfirmModal: Popup hộp thoại xác nhận thao tác của người dùng theo Zalo Mini App Design Guidelines.
 * - Yêu cầu thao tác và quyết định của người dùng cho hướng đi tiếp theo.
 * - Font chữ, màu sắc nút bấm đồng bộ hệ thống Rustic Olive / Danger Semantic.
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
  const getConfirmButtonClasses = () => {
    switch (type) {
      case "danger":
        return "!bg-danger !text-white hover:opacity-90 active:scale-[0.98]";
      case "warning":
        return "!bg-amber-600 !text-white hover:opacity-90 active:scale-[0.98]";
      case "info":
      case "primary":
      default:
        return "!bg-primary !text-white hover:!bg-primaryDark active:scale-[0.98]";
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      mask
      maskClosable={!loading}
      zIndex={1500}
      modalClassName="rounded-2xl w-[calc(100vw-32px)] max-w-[340px] p-5 sm:p-6 text-center shadow-2xl border-0 bg-white overflow-hidden box-border"
    >
      <div className="flex w-full flex-col overflow-hidden">
        <Text.Title
          size="small"
          className="mb-2 break-words font-bold text-neutral900"
        >
          {title}
        </Text.Title>

        {description && (
          <div className="mb-6 text-sm leading-relaxed text-neutral600">
            {description}
          </div>
        )}

        <div className="mt-2 flex gap-3">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="!h-11 flex-1 !rounded-xl !border-0 !bg-stone100 !text-sm !font-semibold !text-neutral700 transition-all hover:!bg-stone200 active:scale-[0.98]"
          >
            {cancelText}
          </Button>

          <Button
            onClick={onConfirm}
            loading={loading}
            className={`!h-11 flex-1 !rounded-xl !border-0 !text-sm !font-bold shadow-md transition-all ${getConfirmButtonClasses()}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
