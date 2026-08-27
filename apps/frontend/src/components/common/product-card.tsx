import { Product } from "@/types/product.types";
import { formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "@/stores/cart.store";
import { usePrefetchProduct } from "@/services/product/product.queries";
import { copy } from "@/constants/copy";
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

  // Số lượng của món này hiện có trong giỏ hàng
  const cartItemsForProduct = items.filter(
    (item) => item.product_id === product.id,
  );
  const totalQuantityInCart = cartItemsForProduct.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const hasRequiredOptions =
    product.option_groups &&
    product.option_groups.some(
      (group) => group.is_required && group.options && group.options.length > 0,
    );

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    if (totalQuantityInCart === 0) {
      // Khi chưa chọn: Bấm dấu + kích hoạt mở Sheet chi tiết món ăn
      if (onClick) {
        onClick();
      } else {
        navigate(`/product/${product.id}`);
      }
      return;
    }

    // Khi đã có trong giỏ hàng: Tăng số lượng
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
      className="group flex w-full cursor-pointer flex-col transition-all active:opacity-90"
      onClick={handleCardClick}
      onMouseEnter={handlePrefetch}
      onTouchStart={handlePrefetch}
    >
      {/* Large Product Image */}
      <div className="shadow-xs relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-black/5">
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-md bg-black/80 px-2 py-0.5 text-xxxsmall font-semibold tracking-wide text-white">
              {copy.product.outOfStock}
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

      {/* Product Info & Price Below */}
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

      <div className="mt-1.5 flex items-center justify-between pt-0.5">
        <div className="text-sm font-bold text-neutral900">
          {formatCurrency(product.price)}
          <span className="ml-0.5 text-xs font-medium text-neutral500">đ</span>
        </div>

        {!isOutOfStock && (
          <div>
            {totalQuantityInCart > 0 ? (
              <div
                className="flex items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleQuickDecrease}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition-transform active:scale-90"
                  aria-label="Giảm số lượng"
                >
                  <svg
                    width="11"
                    height="11"
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

                <span className="min-w-[16px] text-center text-xs font-bold text-neutral900">
                  {totalQuantityInCart}
                </span>

                <button
                  type="button"
                  onClick={handleQuickAdd}
                  className="shadow-xs flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-90"
                  aria-label="Tăng số lượng"
                >
                  <svg
                    width="11"
                    height="11"
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
                className="shadow-xs flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-90"
                aria-label="Thêm vào giỏ"
              >
                <svg
                  width="13"
                  height="13"
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
