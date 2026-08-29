import { useMemo } from "react";
import { useCartStore } from "@/stores/cart.store";
import { formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";
import { copy } from "@/constants/copy";

interface CartFloatButtonProps {
  itemCount: number;
}

export default function CartFloatButton({ itemCount }: CartFloatButtonProps) {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const optionsPrice = (item.options || []).reduce(
        (optSum, opt) => optSum + Number(opt.price || 0) * (opt.quantity || 1),
        0,
      );
      return (
        sum + (Number(item.unit_price || 0) + optionsPrice) * item.quantity
      );
    }, 0);
  }, [items]);

  if (itemCount === 0) return null;

  return (
    <>
      <div
        onClick={() => navigate("/checkout")}
        className="absolute -top-16 left-3.5 right-3.5 z-50 flex cursor-pointer items-center justify-between rounded-2xl border border-white/20 bg-primary/80 px-4 py-2.5 text-white backdrop-blur-lg transition-all active:scale-[0.98]"
        role="button"
        tabIndex={0}
        aria-label="Xem món đang chọn"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 min-w-[28px] items-center justify-center rounded-xl bg-white/25 px-2 text-xs font-extrabold text-white">
            {itemCount}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xxxsmall font-medium text-white/80">
              {itemCount} {copy.common.items}
            </span>
            <span className="text-sm font-extrabold text-white">
              {formatCurrency(subtotal)}đ
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/30">
          <span>{copy.common.viewDetails}</span>
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
    </>
  );
}
