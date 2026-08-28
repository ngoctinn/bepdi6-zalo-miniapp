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
  primary: "bg-olive100 text-olive900 border border-olive600/20",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-300/40",
  warning: "bg-amber-100 text-amber-800 border border-amber-300/50",
  error: "bg-red-50 text-red-700 border border-red-200/60",
  neutral: "bg-neutral100 text-neutral700 border border-neutral200/60",
  accent: "bg-amber-100 text-amber-800 border border-amber-300/50",
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
        "inline-flex items-center justify-center rounded-md tracking-tight",
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
