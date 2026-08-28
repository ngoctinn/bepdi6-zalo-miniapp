interface QuantityStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  minValue?: number;
  maxValue?: number;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "default" | "rounded";
  displaySuffix?: string;
  className?: string;
}

export default function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  minValue = 0,
  maxValue,
  disabled = false,
  size = "medium",
  variant = "default",
  displaySuffix = "",
  className = "",
}: QuantityStepperProps) {
  const isDecreaseDisabled = disabled || value <= minValue;
  const isIncreaseDisabled =
    disabled || (maxValue !== undefined && value >= maxValue);

  const sizeClasses = {
    small: {
      button: "w-6 h-6 text-sm min-w-[24px] min-h-[24px]",
      display: "min-w-[20px] px-1 text-center text-xs font-bold",
    },
    medium: {
      button: "w-7 h-7 text-base min-w-[28px] min-h-[28px]",
      display: "min-w-[24px] text-center text-sm font-semibold",
    },
    large: {
      button: "w-9 h-9 text-xl min-w-[36px] min-h-[36px]",
      display: "w-9 text-center text-base font-semibold",
    },
  };

  const variantClasses = {
    default: "border border-divider01 rounded-xl px-3 py-2",
    rounded: "gap-1.5",
  };

  const buttonBaseClasses =
    variant === "rounded"
      ? "rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-black/[0.12] bg-white text-neutral800 hover:border-black/20 hover:bg-stone-50 active:scale-95 shadow-xs"
      : "flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      className={`flex items-center ${variantClasses[variant]} ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={isDecreaseDisabled}
        className={`${buttonBaseClasses} ${sizeClasses[size].button} font-bold`}
        aria-label="Giảm"
      >
        <span>−</span>
      </button>
      <span
        className={`${sizeClasses[size].display} text-xs font-semibold text-neutral900`}
      >
        {value}
        {displaySuffix}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={isIncreaseDisabled}
        className={`${buttonBaseClasses} ${sizeClasses[size].button} font-bold`}
        aria-label="Tăng"
      >
        <span>+</span>
      </button>
    </div>
  );
}
