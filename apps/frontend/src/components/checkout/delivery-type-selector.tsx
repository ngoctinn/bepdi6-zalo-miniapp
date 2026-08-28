import { DeliveryType } from "@/types/order.types";
import { copy } from "@/constants/copy";

interface DeliveryTypeSelectorProps {
  deliveryType: DeliveryType;
  onChange: (type: DeliveryType) => void;
}

export function DeliveryTypeSelector({
  deliveryType,
  onChange,
}: DeliveryTypeSelectorProps) {
  return (
    <div className="flex rounded-xl border border-black/5 bg-black/[0.03] p-1">
      <button
        type="button"
        onClick={() => onChange("DELIVERY")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
          deliveryType === "DELIVERY"
            ? "shadow-xs border border-primary bg-primary/15 text-primaryDark"
            : "text-stone-600 hover:text-primaryDark"
        }`}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
        <span>{copy.checkout.delivery}</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("PICKUP")}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
          deliveryType === "PICKUP"
            ? "shadow-xs border border-primary bg-primary/15 text-primaryDark"
            : "text-stone-600 hover:text-primaryDark"
        }`}
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span>{copy.checkout.pickup}</span>
      </button>
    </div>
  );
}
