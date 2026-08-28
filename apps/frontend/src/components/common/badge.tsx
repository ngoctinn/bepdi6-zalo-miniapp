import React from "react";
import { cn } from "@/utils/cn";

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "accent";

export type BadgeSize = "small" | "medium";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-olive100 text-olive900 border border-olive600/30",
  success: "bg-olive50 text-olive900 border border-olive600/30",
  warning: "bg-amber100 text-amber700 border border-amber500/30",
  error: "bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]/60",
  neutral: "bg-neutral100 text-neutral600 border border-neutral200",
  accent: "bg-amber100 text-amber700 border border-amber500/30",
};

const sizeStyles: Record<BadgeSize, string> = {
  small: "px-1.5 py-0.5 text-[11px] font-semibold leading-tight",
  medium: "px-2 py-0.5 text-xs font-semibold leading-normal",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  size = "small",
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[4px] tracking-tight",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
