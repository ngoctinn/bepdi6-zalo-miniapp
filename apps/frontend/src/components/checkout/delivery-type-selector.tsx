import { DeliveryType } from "@/types/order.types";
import { copy } from "@/constants/copy";
import { Tabs, Tab } from "@/components/common/tabs";

interface DeliveryTypeSelectorProps {
  deliveryType: DeliveryType;
  onChange: (type: DeliveryType) => void;
}

export function DeliveryTypeSelector({
  deliveryType,
  onChange,
}: DeliveryTypeSelectorProps) {
  const tabs: Tab<DeliveryType>[] = [
    {
      value: "DELIVERY",
      label: copy.checkout.delivery,
      icon: (
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
      ),
    },
    {
      value: "PICKUP",
      label: copy.checkout.pickup,
      icon: (
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
      ),
    },
  ];

  return (
    <div className="w-full">
      <Tabs<DeliveryType>
        tabs={tabs}
        activeTab={deliveryType}
        onChange={onChange}
        fullWidth
      />
    </div>
  );
}
