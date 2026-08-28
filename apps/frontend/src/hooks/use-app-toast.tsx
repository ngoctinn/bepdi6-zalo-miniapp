import React, { useCallback, useEffect } from "react";
import { create } from "zustand";

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

interface ToastState {
  id: number;
  visible: boolean;
  type: ToastType;
  options: ToastOptions;
}

interface ToastStore {
  currentToast: ToastState | null;
  show: (type: ToastType, options: ToastOptions) => void;
  hide: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let toastCounter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  currentToast: null,
  show: (type, options) => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    const id = ++toastCounter;
    set({
      currentToast: {
        id,
        visible: true,
        type,
        options,
      },
    });

    const duration = options.duration ?? (type === "loading" ? 10000 : 2500);

    toastTimer = setTimeout(() => {
      set((state) => {
        if (state.currentToast?.id === id) {
          return { currentToast: { ...state.currentToast, visible: false } };
        }
        return state;
      });
    }, duration);
  },
  hide: () => {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    set((state) => {
      if (state.currentToast) {
        return { currentToast: { ...state.currentToast, visible: false } };
      }
      return state;
    });
  },
}));

/**
 * useAppToast: custom toast aligned with the soft design tokens.
 * Staff screens still use ZaUI snackbar, so app.scss keeps the SDK overrides.
 */
export function useAppToast() {
  const show = useToastStore((state) => state.show);
  const hide = useToastStore((state) => state.hide);

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

      show(type, opts);
    },
    [show],
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
    hideToast: hide,
  };
}

/**
 * AppToastContainer: Component hiển thị Toast nổi toàn cục
 */
export const AppToastContainer: React.FC = () => {
  const currentToast = useToastStore((state) => state.currentToast);
  const hide = useToastStore((state) => state.hide);

  if (!currentToast) return null;

  const { visible, type, options } = currentToast;
  const position = options.position ?? "bottom";

  const renderIcon = () => {
    if (options.icon) return options.icon;

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

  const getVariantStyles = () => {
    switch (type) {
      case "success":
        return {
          card: "bg-[#F7FEE7] border-[#4D7C0F]/30 text-[#365314] shadow-lime-900/10",
          title: "text-[#365314]",
          desc: "text-[#4D7C0F]",
          action: "text-[#4D7C0F] hover:text-[#3F6212]",
        };
      case "warning":
        return {
          card: "bg-[#FFFBEB] border-[#D97706]/30 text-[#78350F] shadow-amber-900/10",
          title: "text-[#78350F]",
          desc: "text-[#B45309]",
          action: "text-[#D97706] hover:text-[#B45309]",
        };
      case "error":
        return {
          card: "bg-[#FEF2F2] border-[#DC2626]/30 text-[#991B1B] shadow-red-900/10",
          title: "text-[#991B1B]",
          desc: "text-[#DC2626]",
          action: "text-[#DC2626] hover:text-[#B91C1C]",
        };
      case "loading":
        return {
          card: "bg-[#FAFAF9] border-[#4D7C0F]/30 text-[#0F172A] shadow-black/10",
          title: "text-[#0F172A]",
          desc: "text-neutral-500",
          action: "text-primary",
        };
      case "info":
      default:
        return {
          card: "bg-[#FAFAF9] border-black/10 text-[#1C1917] shadow-black/10",
          title: "text-[#1C1917]",
          desc: "text-neutral-600",
          action: "text-primary",
        };
    }
  };

  const variant = getVariantStyles();

  return (
    <div
      style={{ zIndex: options.zIndex ?? 99999 }}
      className={`pointer-events-none fixed left-1/2 -translate-x-1/2 transition-all duration-300 ease-out ${
        position === "top"
          ? "top-[calc(var(--zaui-safe-area-inset-top,16px)+16px)]"
          : "bottom-[calc(var(--zaui-safe-area-inset-bottom,16px)+24px)]"
      } ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : position === "top"
            ? "-translate-y-4 scale-95 opacity-0"
            : "translate-y-4 scale-95 opacity-0"
      }`}
    >
      <div
        onClick={hide}
        className={`pointer-events-auto flex w-[calc(100vw-32px)] max-w-[460px] items-center gap-2.5 rounded-[14px] border p-3 shadow-xl backdrop-blur-md transition-all active:scale-[0.99] ${variant.card}`}
      >
        {/* Icon */}
        {renderIcon()}

        {/* Content */}
        <div className="flex flex-1 flex-col text-left">
          <span
            className={`text-[13.5px] font-bold leading-snug tracking-tight ${variant.title}`}
          >
            {options.title}
          </span>
          {options.description && (
            <span
              className={`mt-0.5 text-xs font-medium leading-normal opacity-90 ${variant.desc}`}
            >
              {options.description}
            </span>
          )}
        </div>

        {/* Action Button */}
        {options.action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (options.action?.close) hide();
              options.action?.onClick?.();
            }}
            className={`shrink-0 pl-2 text-xs font-bold transition-colors ${variant.action}`}
          >
            {options.action.text}
          </button>
        )}
      </div>
    </div>
  );
};
