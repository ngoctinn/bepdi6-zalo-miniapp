import { Input, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";

interface NoteInputProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  label?: string;
  hideLabel?: boolean;
  className?: string;
}

export default function NoteInput({
  value,
  onChange,
  label,
  maxLength,
  hideLabel,
  placeholder,
  className,
}: NoteInputProps) {
  const MAX = maxLength ?? 100;
  return (
    <div className={cn("w-full space-y-1", className)}>
      {!hideLabel && label && (
        <Text size="xSmall" className="text-neutral900">
          {label}
        </Text>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value.slice(0, MAX))}
        maxLength={MAX}
        placeholder={placeholder ?? copy.product.notePlaceholder}
        className="w-full rounded-xl border border-black/10 bg-transparent p-3 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        rows={3}
      />
    </div>
  );
}
