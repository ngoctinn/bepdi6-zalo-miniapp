import { CartItem } from "@/types/cart.types";
import QuantityStepper from "./quantity-stepper";
import { Button, Text } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import {
  calculateCartItemPrice,
  formatVariantWithPercentage,
} from "@/utils/cart";
import defaultProductImg from "@/static/logo.png";

interface CartItemCardProps {
  item: CartItem;
  variant?: "editable" | "readonly";
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onEdit?: (id: string) => void;
}

export default function CartItemCard({
  item,
  variant = "readonly",
  onUpdateQuantity,
  onEdit,
}: CartItemCardProps) {
  const itemUnitPrice = calculateCartItemPrice(item);
  const imageUrl = item.product_image || defaultProductImg;

  return (
    <div className="shadow-xs flex gap-3 rounded-2xl border border-black/5 bg-transparent p-3">
      <img
        draggable={false}
        src={imageUrl}
        alt={item.product_name}
        className="h-14 w-14 shrink-0 rounded-xl bg-neutral100 object-cover ring-1 ring-black/5"
      />
      <div className="min-w-0 flex-1">
        <Text className="truncate text-sm font-semibold text-neutral900">
          {item.product_name}
        </Text>

        {item.options && item.options.length > 0 && (
          <Text className="mt-0.5 line-clamp-1 text-xxsmall text-neutral500">
            + {formatVariantWithPercentage(item.options)}
          </Text>
        )}

        {item.note && (
          <Text className="mt-0.5 line-clamp-1 text-xxsmall italic text-amber-700">
            "{item.note}"
          </Text>
        )}

        <div className="mt-1 text-xs font-bold text-neutral900">
          {formatCurrency(itemUnitPrice)}
          <span className="ml-0.5 text-xxxsmall font-medium text-neutral500">
            đ
          </span>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(item.id)}
            className="mt-1.5 inline-flex items-center rounded-full border border-black/5 bg-black/[0.04] px-3 py-1 text-xxsmall font-medium text-neutral700 transition-all hover:bg-black/10 active:scale-95"
          >
            {copy.common.edit}
          </button>
        )}
      </div>

      <div className="self-center">
        <QuantityStepper
          value={item.quantity}
          onDecrease={() =>
            onUpdateQuantity?.(item.id, Math.max(0, item.quantity - 1))
          }
          onIncrease={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
          minValue={0}
          size="medium"
          variant="rounded"
        />
      </div>
    </div>
  );
}
