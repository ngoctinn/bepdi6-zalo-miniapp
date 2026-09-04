import { Product } from "@/types/product.types";
import { formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cart.store";
import { usePrefetchProduct } from "@/services/product/product.queries";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";
import defaultProductImg from "@/static/logo.png";

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  onAddToCart?: () => void;
}

export default function ProductCard({
  product,
  onClick,
  onAddToCart,
}: ProductCardProps) {
  const navigate = useNavigate();
  const { items, addToCart, updateQuantity, removeFromCart } = useCartStore();
  const prefetchProduct = usePrefetchProduct();

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const handlePrefetch = () => {
    if (product.id) {
      prefetchProduct(product.id);
    }
  };

  const imageUrl =
    product.effective_image_url ||
    product.image_url ||
    product.image ||
    defaultProductImg;

  const isOutOfStock = product.status === "OUT_OF_STOCK";
  const hasPromo = product.has_promotion && product.effective_price != null;
  const displayPrice = hasPromo
    ? product.effective_price!
    : Number(product.price);
  const originalPrice = Number(product.price);
  const canQuickAddDirectly =
    !product.option_groups ||
    product.option_groups.length === 0 ||
    !product.option_groups.some(
      (group) => group.is_required || group.min_select > 0,
    );

  // Số lượng của món này hiện có trong giỏ hàng
  const cartItemsForProduct = items.filter(
    (item) => item.product_id === product.id,
  );
  const totalQuantityInCart = cartItemsForProduct.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    if (totalQuantityInCart === 0) {
      if (!canQuickAddDirectly) {
        if (onClick) {
          onClick();
        } else {
          navigate(`/product/${product.id}`);
        }
        return;
      }

      addToCart({
        product_id: product.id,
        product_name: product.name,
        product_image: imageUrl,
        unit_price: displayPrice,
        quantity: 1,
        options: [],
      });
      return;
    }

    if (cartItemsForProduct.length > 0) {
      const lastItem = cartItemsForProduct[cartItemsForProduct.length - 1];
      updateQuantity(lastItem.id, lastItem.quantity + 1);
    }
  };

  const handleQuickDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItemsForProduct.length === 0) return;

    const lastItem = cartItemsForProduct[cartItemsForProduct.length - 1];
    if (lastItem.quantity > 1) {
      updateQuantity(lastItem.id, lastItem.quantity - 1);
    } else {
      removeFromCart(lastItem.id);
    }
  };

  return (
    <div
      className={cn(
        "group flex w-full cursor-pointer flex-col transition-all active:opacity-90",
        isOutOfStock && "opacity-60",
      )}
      onClick={handleCardClick}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      {/* Product Image with Overlays */}
      <div className="shadow-xs relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-black/5">
        {/* Out of Stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-md bg-black/80 px-2 py-0.5 text-xxxsmall font-semibold tracking-wide text-white">
              {copy.product.outOfStock}
            </span>
          </div>
        )}

        {/* Sale badge — Soft Amber Discount Tag */}
        {hasPromo && discountPct != null && discountPct > 0 && (
          <div className="shadow-xs backdrop-blur-xs absolute left-2 top-2 z-10 flex items-center rounded-md border border-amber-300/60 bg-amber-100/95 px-1.5 py-0.5">
            <span className="text-[10px] font-bold leading-none tracking-tight text-amber-900">
              -{discountPct}%
            </span>
          </div>
        )}

        <img
          draggable={false}
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Product Info */}
      <div className="mt-2 flex flex-col">
        <div className="line-clamp-2 min-h-[38px] text-sm font-semibold leading-snug text-neutral900">
          {product.name}
        </div>
        {product.description && (
          <div className="mt-0.5 line-clamp-1 text-xs leading-normal text-neutral500">
            {product.description}
          </div>
        )}
      </div>

      {/* Price row + Quick-add stepper */}
      <div className="mt-1.5 flex items-end justify-between gap-1 pt-0.5">
        {/* Price block */}
        <div className="flex min-h-[34px] flex-col justify-end">
          <div
            className={cn(
              "text-sm font-extrabold leading-tight tracking-tight",
              hasPromo ? "text-amber-800" : "text-neutral900",
            )}
          >
            {formatCurrency(displayPrice)}
            <span
              className={cn(
                "ml-0.5 text-xs font-semibold",
                hasPromo ? "text-amber-800/80" : "text-neutral500",
              )}
            >
              đ
            </span>
          </div>
          {hasPromo ? (
            <div className="mt-0.5 text-[11px] font-medium leading-tight text-neutral400 line-through">
              {formatCurrency(originalPrice)}đ
            </div>
          ) : (
            <div className="mt-0.5 h-[14px]" aria-hidden="true" />
          )}
        </div>

        {/* Stepper / Quick-add */}
        {!isOutOfStock && (
          <div className="shrink-0">
            {totalQuantityInCart > 0 ? (
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleQuickDecrease}
                  className="shadow-xs flex h-9 min-h-[36px] w-9 min-w-[36px] touch-manipulation items-center justify-center rounded-full border border-primary/25 bg-olive50/80 text-olive900 transition-transform active:scale-90"
                  aria-label="Giảm số lượng"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>

                <span className="min-w-[20px] text-center text-xs font-bold text-neutral900">
                  {totalQuantityInCart}
                </span>

                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="flex h-9 min-h-[36px] w-9 min-w-[36px] touch-manipulation items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform active:scale-90"
                  aria-label="Tăng số lượng"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="flex h-10 min-h-[40px] w-10 min-w-[40px] touch-manipulation items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all active:scale-90 active:shadow-none"
                aria-label="Thêm vào giỏ"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
