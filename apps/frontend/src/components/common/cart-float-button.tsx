import { useState } from "react";
import { CartIcon } from "./vectors";
import CartSheet from "./cart-sheet";
import CheckoutSheet from "./checkout-sheet";
import { useCartStore } from "@/stores/cart.store";
import { Button } from "zmp-ui";
import { copy } from "@/constants/copy";
import { formatCount, formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";

interface CartFloatButtonProps {
  itemCount: number;
}

export default function CartFloatButton({ itemCount }: CartFloatButtonProps) {
  const navigate = useNavigate();
  const [cartSheetVisible, setCartSheetVisible] = useState(false);

  const {
    items,
    subtotal,
    updateQuantity,
    checkoutSheetVisible,
    closeCheckoutSheet,
    openCheckoutSheet,
  } = useCartStore();

  const handleUpdateQuantity = (id: string, quantity: number) => {
    updateQuantity(id, quantity);
  };

  const handleConfirmCart = () => {
    setCartSheetVisible(false);
    openCheckoutSheet();
  };

  const handleCheckout = () => {
    closeCheckoutSheet();
    navigate("/checkout");
  };

  if (itemCount === 0) return null;

  return (
    <>
      <div
        onClick={() => setCartSheetVisible(true)}
        className="absolute -top-16 left-3.5 right-3.5 z-50 flex cursor-pointer items-center justify-between rounded-2xl bg-primary px-4 py-2.5 text-white shadow-lg shadow-emerald-950/20 transition-all active:scale-[0.98]"
        role="button"
        tabIndex={0}
        aria-label="Xem món đang chọn"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-white/20 px-2 text-xs font-extrabold text-white">
            {itemCount}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-medium text-emerald-100">
              {itemCount} món đang chọn
            </span>
            <span className="text-[14px] font-extrabold text-white">
              {formatCurrency(subtotal)}đ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition-all">
          <span>Xem đơn</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>

      <CartSheet
        visible={cartSheetVisible}
        onClose={() => setCartSheetVisible(false)}
        items={items}
        onUpdateQuantity={handleUpdateQuantity}
        onConfirm={handleConfirmCart}
      />

      <CheckoutSheet
        visible={checkoutSheetVisible}
        onClose={closeCheckoutSheet}
        items={items}
        onCheckout={handleCheckout}
      />
    </>
  );
}
