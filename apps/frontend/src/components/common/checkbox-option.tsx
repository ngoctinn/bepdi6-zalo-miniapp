import { VariantOption } from "@/types/product.types";
import { formatCurrency } from "@/utils/format";

interface CheckboxOptionProps {
  option: VariantOption;
  isSelected: boolean;
  groupName: string;
  onSelect: (optionId: string) => void;
}

export default function CheckboxOption({
  option,
  isSelected,
  groupName,
  onSelect,
}: CheckboxOptionProps) {
  const id = `${groupName}-${option.id}`;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between py-2.5 transition active:bg-black/[0.02]"
    >
      <input
        id={id}
        type="checkbox"
        name={groupName}
        value={option.id}
        checked={isSelected}
        onChange={() => onSelect(option.id)}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <span className="text-sm font-normal text-neutral900">
          {option.name}
        </span>

        {option.extraPrice > 0 && (
          <span className="text-xs font-normal text-black">
            (+{formatCurrency(option.extraPrice)}đ)
          </span>
        )}
        {option.extraPrice === 0 && (
          <span className="text-xs font-normal text-neutral400">
            (+{formatCurrency(option.extraPrice)}đ)
          </span>
        )}
      </div>
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${isSelected ? "border-primary bg-primary text-white" : "border-stone-300 bg-white"}`}
      >
        {isSelected && (
          <svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path d="M4 10l5 5 8-8" />
          </svg>
        )}
      </div>
    </label>
  );
}
