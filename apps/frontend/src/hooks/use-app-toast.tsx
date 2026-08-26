import { useSnackbar, Icon } from "zmp-ui";
import React, { useCallback } from "react";

export type ToastType = "success" | "warning" | "error" | "info" | "default";

export interface ToastOptions {
  duration?: number;
  icon?: string;
  action?: {
    text: string;
    close?: boolean;
    onClick?: () => void;
  };
  zIndex?: number;
}

/**
 * useAppToast: Hook thông báo Toast/Snackbar tuân thủ Zalo Mini App Design Guidelines:
 * - Sử dụng bộ icon chuẩn của Zalo UI (`zmp-ui` Icon): `zi-check-circle`, `zi-warning`, `zi-close-circle`, `zi-info-circle`.
 * - Tự động tắt sau 1.5s (1500ms).
 * - Dạng Soft Color Pastel Tonal & Borderless Pill.
 */
export function useAppToast() {
  const { openSnackbar } = useSnackbar();

  const showToast = useCallback(
    (text: string, type: ToastType = "default", options?: ToastOptions) => {
      const defaultDuration = 1500; // Chuẩn Zalo Guideline: 1.5 giây

      // Sử dụng đúng bộ icon chuẩn Zalo Mini App
      const getZaloIcon = () => {
        switch (type) {
          case "success":
            return (
              <Icon icon="zi-check-circle" className="text-lg text-olive700" />
            );
          case "warning":
            return <Icon icon="zi-warning" className="text-lg text-amber600" />;
          case "error":
            return (
              <Icon icon="zi-close-circle" className="text-lg text-red600" />
            );
          case "info":
            return (
              <Icon icon="zi-info-circle" className="text-lg text-neutral700" />
            );
          default:
            return undefined;
        }
      };

      openSnackbar({
        text,
        type: "default",
        prefixIcon: getZaloIcon(),
        duration: options?.duration ?? defaultDuration,
        action: options?.action,
        zIndex: options?.zIndex,
        className: `zaui-snackbar-${type}`,
      });
    },
    [openSnackbar],
  );

  const showSuccess = useCallback(
    (text: string, options?: ToastOptions) => {
      showToast(text, "success", options);
    },
    [showToast],
  );

  const showError = useCallback(
    (text: string, options?: ToastOptions) => {
      showToast(text, "error", options);
    },
    [showToast],
  );

  const showWarning = useCallback(
    (text: string, options?: ToastOptions) => {
      showToast(text, "warning", options);
    },
    [showToast],
  );

  const showInfo = useCallback(
    (text: string, options?: ToastOptions) => {
      showToast(text, "info", options);
    },
    [showToast],
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
