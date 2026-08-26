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
  primary: "bg-primary/10 text-primaryDark border border-primary/20",
  success: "bg-olive50 text-olive900 border border-olive600/20",
  warning: "bg-amber50 text-amber700 border border-amber500/20",
  error: "bg-red-50 text-red-600 border border-red-200/50",
  neutral: "bg-stone100 text-stone800 border border-black/5",
  accent: "bg-amber500/10 text-amber700 border border-amber500/20",
};

const sizeStyles: Record<BadgeSize, string> = {
  small: "px-2 py-0.5 text-[10px] leading-tight",
  medium: "px-2.5 py-0.5 text-xs leading-normal",
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
        "inline-flex items-center justify-center rounded-full font-bold tracking-tight",
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
