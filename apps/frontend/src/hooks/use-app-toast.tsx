import { useSnackbar, Icon } from "zmp-ui";
import React, { useCallback } from "react";

export type ToastType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "loading"
  | "default";

export interface ToastOptions {
  /** Tiêu đề chính (in đậm) hoặc nội dung ngắn */
  title?: string;
  /** Mô tả chi tiết bên dưới (nếu có) */
  description?: string;
  /** Thời gian tự tắt tính theo ms (mặc định 2200ms) */
  duration?: number;
  /** Tùy chỉnh icon đầu toast */
  icon?: React.ReactNode;
  /** Nút thao tác nhanh */
  action?: {
    text: string;
    close?: boolean;
    onClick?: () => void;
  };
  /** Tùy chỉnh zIndex */
  zIndex?: number;
  /** Vị trí hiển thị: "top" hoặc "bottom" (mặc định "bottom") */
  position?: "top" | "bottom";
}

/**
 * useAppToast: Hệ thống Toast/Snackbar chuẩn Design Guidelines Zalo Mini App & Rustic Olive Theme
 * - Card bo góc 16px (`rounded-card`) đồng bộ toàn app
 * - Bố cục Flexbox căn giữa, Icon cân đối tuyệt đối với nội dung (không bị lệch)
 * - Đầy đủ các biến thể: `success`, `warning`, `error`, `info`, `loading`
 * - Hỗ trợ Single-line text, Multi-line (Title + Description), Action button
 */
export function useAppToast() {
  const { openSnackbar } = useSnackbar();

  const showToast = useCallback(
    (
      messageOrOptions: string | ToastOptions,
      type: ToastType = "default",
      extraOpts?: ToastOptions,
    ) => {
      const opts: ToastOptions =
        typeof messageOrOptions === "string"
          ? { title: messageOrOptions, ...extraOpts }
          : messageOrOptions;

      const duration = opts.duration ?? (type === "loading" ? 10000 : 2200);

      // Render Icon chuyên biệt và cân lề hoàn hảo (Flexbox 24x24) bằng SVG độc lập
      const renderIcon = () => {
        if (opts.icon) return opts.icon;

        switch (type) {
          case "success":
            return (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4D7C0F]/15 text-[#4D7C0F]">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            );
          case "warning":
            return (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D97706]/15 text-[#D97706]">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            );
          case "error":
            return (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/15 text-[#DC2626]">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </div>
            );
          case "loading":
            return (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center text-primary">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
            );
          case "info":
          default:
            return (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900/10 text-neutral-800">
                <svg
                  className="h-3.5 w-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
            );
        }
      };

      // Render nội dung (Title + Description)
      const renderContent = () => {
        return (
          <div className="flex flex-1 flex-col text-left">
            <span className="text-[13.5px] font-bold leading-snug tracking-tight text-neutral-900">
              {opts.title}
            </span>
            {opts.description && (
              <span className="mt-0.5 text-xs font-normal leading-normal text-neutral-600">
                {opts.description}
              </span>
            )}
          </div>
        );
      };

      openSnackbar({
        text: (opts.title || "") as any,
        prefixIcon: renderIcon(),
        duration,
        action: opts.action,
        position: opts.position ?? "bottom",
        zIndex: opts.zIndex ?? 99999,
        className: `zaui-custom-toast zaui-toast-${type}`,
        type: type === "loading" || type === "info" ? "default" : (type as any),
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

  const showLoading = useCallback(
    (text: string, options?: ToastOptions) => {
      showToast(text, "loading", options);
    },
    [showToast],
  );

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };
}
