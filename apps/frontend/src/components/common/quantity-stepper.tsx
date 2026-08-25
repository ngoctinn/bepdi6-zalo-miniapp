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
      button: "w-6 h-6 text-lg",
      display: "w-8 text-center text-sm",
    },
    medium: {
      button: "w-7 h-7 text-base",
      display: "text-center text-base font-normal",
    },
    large: {
      button: "w-8 h-8 text-lg",
      display: "w-8 text-center text-base",
    },
  };

  const variantClasses = {
    default: "border border-divider01 rounded-lg px-3 py-2",
    rounded: "gap-2",
  };

  const buttonBaseClasses =
    variant === "rounded"
      ? "rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-primary text-primary bg-transparent active:bg-primary/10"
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
