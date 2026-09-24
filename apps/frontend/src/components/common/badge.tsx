import React from "react";
import { cn } from "@/utils/cn";

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "neutral"
  | "accent"
  | "recommended";

export type BadgeSize = "small" | "medium";
export type BadgeShape = "rounded" | "pill";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: "bg-primaryLight text-primaryDark border border-primary/20",
  success: "bg-emerald-50 text-emerald-800 border border-emerald-300/40",
  warning: "bg-amber-100 text-amber-800 border border-amber-300/50",
  error: "bg-red-50 text-red-700 border border-red-200/60",
  neutral: "bg-neutral100 text-neutral700 border border-neutral200/60",
  accent: "bg-amber-100 text-amber-800 border border-amber-300/50",
  recommended:
    "bg-amber-50 text-amber-900 border border-amber-400/50 font-bold",
};

const shapeStyles: Record<BadgeShape, string> = {
  rounded: "rounded-md",
  pill: "rounded-full",
};

const sizeStyles: Record<BadgeSize, string> = {
  small: "px-1.5 py-0.5 text-[11px] font-semibold leading-tight",
  medium: "px-2 py-0.5 text-xs font-semibold leading-normal",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  size = "small",
  shape = "rounded",
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center tracking-tight",
        shapeStyles[shape],
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
