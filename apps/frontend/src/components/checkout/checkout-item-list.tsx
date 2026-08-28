import { useState } from "react";
import { CartItem } from "@/types/cart.types";
import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";
import { formatVariantWithPercentage } from "@/utils/cart";
import QuantityStepper from "@/components/common/quantity-stepper";
import SwipeableItem from "@/components/common/swipeable-item";
import ConfirmModal from "@/components/common/confirm-modal";
import defaultProductImg from "@/static/logo.png";
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
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);

  const promptDeleteItem = (itemId: string) => {
    const target = cartItems.find((it) => it.id === itemId);
    if (target) {
      setItemToDelete(target);
    }
  };

  const confirmDeleteItem = () => {
    if (itemToDelete) {
      onUpdateQuantity(itemToDelete.id, 0);
      setItemToDelete(null);
    }
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity <= 1) {
      promptDeleteItem(item.id);
    } else {
      onUpdateQuantity(item.id, item.quantity - 1);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
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

        <div className="flex flex-col gap-2.5">
          {cartItems.map((item) => {
            const optionsTotal = (item.options || []).reduce(
              (s, opt) => s + Number(opt.price || 0) * (opt.quantity || 1),
              0,
            );
            const itemTotal = (item.unit_price + optionsTotal) * item.quantity;
            const imageUrl = item.product_image || defaultProductImg;

            return (
              <SwipeableItem
                key={item.id}
                onDelete={() => promptDeleteItem(item.id)}
                deleteLabel="Xóa"
                className="shadow-xs rounded-2xl border border-black/[0.06] bg-white"
                contentClassName="bg-white p-3.5"
              >
                <div className="flex items-center gap-3">
                  <img
                    draggable={false}
                    src={imageUrl}
                    alt={item.product_name}
                    className="h-14 w-14 shrink-0 rounded-xl bg-neutral100 object-cover ring-1 ring-black/5"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-xs font-semibold leading-snug text-neutral900">
                      {item.product_name}
                    </div>

                    {item.options && item.options.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        <div className="line-clamp-1 text-xxsmall text-neutral500">
                          + {formatVariantWithPercentage(item.options)}
                        </div>
                      </div>
                    )}

                    {item.note && (
                      <div className="mt-0.5 line-clamp-1 text-xxsmall italic text-amber-700">
                        &ldquo;{item.note}&rdquo;
                      </div>
                    )}

                    <div className="mt-1 text-xs font-bold text-neutral900">
                      {formatCurrency(itemTotal)}đ
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="shrink-0 self-center">
                    <QuantityStepper
                      value={item.quantity}
                      minValue={0}
                      size="small"
                      variant="rounded"
                      onDecrease={() => handleDecrease(item)}
                      onIncrease={() =>
                        onUpdateQuantity(item.id, item.quantity + 1)
                      }
                    />
                  </div>
                </div>
              </SwipeableItem>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog: Xóa 1 món */}
      <ConfirmModal
        visible={Boolean(itemToDelete)}
        title="Xóa món khỏi đơn hàng?"
        description={
          itemToDelete ? (
            <span>
              Bạn có chắc chắn muốn bỏ món{" "}
              <strong className="text-neutral900">
                &ldquo;{itemToDelete.product_name}&rdquo;
              </strong>{" "}
              ra khỏi đơn hàng không?
            </span>
          ) : undefined
        }
        confirmText="Xóa món"
        cancelText="Giữ lại"
        type="danger"
        onConfirm={confirmDeleteItem}
        onCancel={() => setItemToDelete(null)}
      />
    </>
  );
}
