import { VariantOption } from "@/types/product.types";
import { formatCurrency } from "@/utils/format";

interface RadioOptionProps {
  option: VariantOption;
  isSelected: boolean;
  groupName: string;
  onSelect: (optionId: string) => void;
}

export default function RadioOption({
  option,
  isSelected,
  groupName,
  onSelect,
}: RadioOptionProps) {
  const id = `${groupName}-${option.id}`;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between py-2.5 transition active:bg-black/[0.02]"
    >
      <input
        id={id}
        type="radio"
        name={groupName}
        value={option.id}
        checked={isSelected}
        onChange={() => onSelect(option.id)}
        className="hidden"
      />

      <div className="flex items-center gap-2">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
            isSelected
              ? "border-primary bg-primary text-white"
              : "border-stone-300 bg-white"
          } `}
        >
          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <span className="ml-1 text-sm font-normal text-neutral900">
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
    </label>
  );
}
