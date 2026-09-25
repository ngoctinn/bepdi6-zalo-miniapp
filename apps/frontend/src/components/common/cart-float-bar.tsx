import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cart.store";
import { calculateCartTotal } from "@/utils/cart";
import { formatCurrency } from "@/utils/format";
import { copy } from "@/constants/copy";
import { ChevronRightIcon } from "@/components/common/vectors";

export default function CartFloatBar() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(() => calculateCartTotal(items), [items]);

  if (totalItems === 0) {
    return null;
  }

  const handleOpenCheckout = () => {
    navigate("/checkout");
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpenCheckout}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenCheckout();
        }
      }}
      aria-label={`Xem giỏ hàng: ${totalItems} món, tạm tính ${formatCurrency(subtotal)} đồng`}
      className="bg-primary/95 absolute bottom-full left-3.5 right-3.5 z-40 mb-2.5 flex h-[54px] cursor-pointer touch-manipulation select-none items-center justify-between rounded-2xl border border-white/20 px-3.5 py-2 text-white shadow-lg shadow-black/15 backdrop-blur-md transition-all active:scale-[0.98]"
    >
      {/* Left: Icon Giỏ hàng + Badge số lượng + Tạm tính */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span
            key={totalItems}
            className="shadow-xs absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] animate-bounce items-center justify-center rounded-full bg-white px-1 text-[10px] font-black leading-none text-primary ring-1 ring-black/5 [animation-iteration-count:2]"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </span>
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[11px] font-medium leading-tight text-white/80">
            {totalItems} {copy.common.items || "món"}
          </span>
          <span className="text-sm font-extrabold leading-tight tracking-tight text-white">
            {formatCurrency(subtotal)}đ
          </span>
        </div>
      </div>

      {/* Right: Nút CTA Xem giỏ hàng */}
      <div className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/25 active:bg-white/30">
        <span>Xem giỏ hàng</span>
        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
