import { Product } from "@/types/product.types";
import { formatCurrency } from "@/utils/format";
import { useNavigate } from "react-router-dom";

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

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const imageUrl =
    product.effective_image_url ||
    product.image_url ||
    product.image ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60";

  const isOutOfStock = product.status === "OUT_OF_STOCK";

  return (
    <div
      className="group flex w-full cursor-pointer flex-col transition-all active:opacity-85"
      onClick={handleCardClick}
    >
      {/* Large Product Image */}
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-amber-100/40 shadow-xs ring-1 ring-black/5">
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
            <span className="rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white">
              TẠM HẾT
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
        <div className="line-clamp-2 min-h-[38px] text-[14px] font-bold leading-snug text-neutral-900">
          {product.name}
        </div>
        {product.description && (
          <div className="mt-0.5 line-clamp-1 text-[11.5px] leading-snug text-neutral-500">
            {product.description}
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between pt-1">
        <div className="text-[15px] font-extrabold tracking-tight text-[#0F172A]">
          {formatCurrency(product.price)}
          <span className="ml-0.5 text-xs font-semibold text-slate-600">
            đ
          </span>
        </div>

        {!isOutOfStock && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddToCart) {
                onAddToCart();
              } else {
                handleCardClick();
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-xs transition-transform active:scale-90"
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
    </div>
  );
}
