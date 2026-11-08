import { DeliveryType } from "@/types/order.types";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";
import { TruckIcon } from "@/components/common/vectors";

interface DeliveryTypeSelectorProps {
  deliveryType: DeliveryType;
  onChange: (type: DeliveryType) => void;
}

export function DeliveryTypeSelector({
  deliveryType,
  onChange,
}: DeliveryTypeSelectorProps) {
  const isDelivery = deliveryType === "DELIVERY";
  const isPickup = deliveryType === "PICKUP";

  return (
    <div className="grid w-full grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={() => onChange("DELIVERY")}
        className={cn(
          "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-[color,background-color,border-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]",
          isDelivery
            ? "shadow-xs border-primary/40 bg-primarySurface text-primaryDark"
            : "border-black/[0.06] bg-stone-50/70 text-neutral700 hover:border-black/10 hover:bg-stone-50",
        )}
      >
        <TruckIcon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isDelivery ? "text-primary" : "text-neutral500",
          )}
        />
        <span className="truncate">{copy.checkout.delivery}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("PICKUP")}
        className={cn(
          "flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-[color,background-color,border-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]",
          isPickup
            ? "shadow-xs border-primary/40 bg-primarySurface text-primaryDark"
            : "border-black/[0.06] bg-stone-50/70 text-neutral700 hover:border-black/10 hover:bg-stone-50",
        )}
      >
        <svg
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            isPickup ? "text-primary" : "text-neutral500",
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span className="truncate">{copy.checkout.pickup}</span>
      </button>
    </div>
  );
}
