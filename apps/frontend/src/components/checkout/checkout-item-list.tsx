import { CartItem } from "@/types/cart.types";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { formatVariantWithPercentage } from "@/utils/cart";
import QuantityStepper from "@/components/common/quantity-stepper";
import { useNavigate } from "react-router-dom";

interface CheckoutItemListProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
}

export function CheckoutItemList({
  cartItems,
  onUpdateQuantity,
}: CheckoutItemListProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-neutral900">
          {copy.checkout.orderSummarySection} ({cartItems.length})
        </span>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xxsmall font-semibold text-primary transition-opacity hover:opacity-80"
        >
          {copy.checkout.addItems}
        </button>
      </div>

      <div className="divide-y divide-black/5">
        {cartItems.map((item) => {
          const optionsTotal = (item.options || []).reduce(
            (s, opt) => s + Number(opt.price || 0) * (opt.quantity || 1),
            0,
          );
          const itemTotal = (item.unit_price + optionsTotal) * item.quantity;

          return (
            <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-2">
                  <div className="text-xs font-medium text-neutral900">
                    {item.product_name}
                  </div>

                  {item.options && item.options.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      <div className="text-xxsmall text-neutral500">
                        + {formatVariantWithPercentage(item.options)}
                      </div>
                    </div>
                  )}

                  {item.note && (
                    <div className="mt-0.5 text-xxsmall italic text-amber-700">
                      &ldquo;{item.note}&rdquo;
                    </div>
                  )}

                  <div className="mt-1 text-xs font-bold text-neutral900">
                    {formatCurrency(itemTotal)}đ
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="shrink-0">
                  <QuantityStepper
                    value={item.quantity}
                    minValue={0}
                    size="small"
                    variant="rounded"
                    onDecrease={() =>
                      onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
                    }
                    onIncrease={() =>
                      onUpdateQuantity(item.id, item.quantity + 1)
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
