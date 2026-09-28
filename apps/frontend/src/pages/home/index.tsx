import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CategoryList from "@/components/common/category-list";
import ProductCard from "@/components/common/product-card";
import { SearchIcon, CloseIcon } from "@/components/common/vectors";
import { useCategories } from "@/services/category/category.queries";
import { useProducts } from "@/services/product/product.queries";
import { useAuth } from "@/hooks/use-auth";
import { Category } from "@/types/category.types";
import { useCartStore } from "@/stores/cart.store";
import { cn } from "@/utils/cn";

import { copy } from "@/constants/copy";

function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: allProducts, isLoading: isLoadingProducts } = useProducts();
  const { customer: userProfile } = useAuth();
  const items = useCartStore((state) => state.items);
  const hasCartItems = items.length > 0;

  const [activeCategoryId, setActiveCategoryId] = useState<
    number | string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Filter products by search query
  const searchResults = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || !allProducts) return [];
    const normalized = removeVietnameseTones(trimmed);
    return allProducts.filter((product) => {
      const nameNorm = removeVietnameseTones(product.name || "");
      const descNorm = removeVietnameseTones(product.description || "");
      return nameNorm.includes(normalized) || descNorm.includes(normalized);
    });
  }, [searchQuery, allProducts]);

  // Group products by category
  const categorizedProducts = useMemo(() => {
    if (!categories || !allProducts) return [];

    return categories
      .map((cat) => {
        const prods = allProducts.filter(
          (p) => (p.category_id ?? p.category) === cat.id,
        );
        return {
          category: cat,
          products: prods,
        };
      })
      .filter((group) => group.products.length > 0);
  }, [categories, allProducts]);

  // Set initial active category
  useEffect(() => {
    if (categorizedProducts.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categorizedProducts[0].category.id);
    }
  }, [categorizedProducts, activeCategoryId]);

  // Scroll-spy observer on scroll of #main-scroll-container
  useEffect(() => {
    if (categorizedProducts.length === 0) return;

    const scrollContainer = document.getElementById("main-scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const stickyHeaderEl = document.getElementById("home-sticky-header");
      const stickyHeight = stickyHeaderEl?.getBoundingClientRect().height || 85;
      const threshold = stickyHeight + 40;

      // Tìm section đang nằm gần đỉnh sticky header nhất
      let currentActiveId = categorizedProducts[0]?.category.id;

      for (let i = 0; i < categorizedProducts.length; i++) {
        const group = categorizedProducts[i];
        const el = document.getElementById(
          `category-section-${group.category.id}`,
        );
        if (el) {
          const elRect = el.getBoundingClientRect();
          const topRelativeToContainer = elRect.top - containerRect.top;
          if (topRelativeToContainer <= threshold) {
            currentActiveId = group.category.id;
          }
        }
      }

      if (currentActiveId && currentActiveId !== activeCategoryId) {
        setActiveCategoryId(currentActiveId);
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [categorizedProducts]);

  const handleCategorySelect = (category: Category) => {
    setActiveCategoryId(category.id);
    isManualScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const scrollContainer = document.getElementById("main-scroll-container");
    const sectionEl = document.getElementById(
      `category-section-${category.id}`,
    );

    if (scrollContainer && sectionEl) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const sectionRect = sectionEl.getBoundingClientRect();
      const stickyHeaderEl = document.getElementById("home-sticky-header");
      const stickyHeight = stickyHeaderEl?.getBoundingClientRect().height || 85;

      const targetScrollTop =
        scrollContainer.scrollTop +
        (sectionRect.top - containerRect.top) -
        stickyHeight +
        4;

      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    }

    // Nhả lock sau khi cuộn dừng hẳn
    scrollTimeoutRef.current = setTimeout(() => {
      isManualScrollingRef.current = false;
    }, 600);
  };

  return (
    <div className="relative flex flex-col">
      {/* Sticky Header: Tên quán + Thanh tab danh mục */}
      <div
        id="home-sticky-header"
        className="sticky top-0 z-30 flex flex-col border-b border-black/5 bg-white/95 pb-2 backdrop-blur-md"
      >
        {/* Tên quán */}
        <div className="header-margin flex items-center justify-between px-3.5 pb-1 pr-20 pt-3">
          <h1 className="text-base font-extrabold tracking-tight text-neutral-900">
            {copy.brand.name}
          </h1>
        </div>

        {/* Thanh tìm kiếm món ăn nhanh */}
        <div className="px-3.5 pb-1 pt-1">
          <div className="relative flex items-center">
            <div className="pointer-events-none absolute left-3 flex items-center text-neutral400">
              <SearchIcon className="h-4 w-4 shrink-0 text-stone-400" />
            </div>
            <input
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm món ngon trong thực đơn..."
              aria-label="Tìm kiếm món ăn trong thực đơn"
              className="focus:ring-primary/30 w-full rounded-xl border border-black/[0.08] bg-stone-50/90 py-2 pl-9 pr-9 text-xs text-neutral900 transition-colors placeholder:text-stone-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 flex h-6 w-6 touch-manipulation items-center justify-center rounded-full text-stone-400 hover:text-stone-600 active:scale-90"
              >
                <CloseIcon className="h-3.5 w-3.5 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* Thanh tab danh mục món hoặc tóm tắt tìm kiếm */}
        {searchQuery.trim() ? (
          <div className="flex items-center justify-between px-3.5 pt-1 text-xs text-stone-500">
            <span>
              Tìm thấy{" "}
              <strong className="font-bold text-neutral900">
                {searchResults.length}
              </strong>{" "}
              món phù hợp
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs font-semibold text-primary underline active:opacity-80"
            >
              Hủy tìm
            </button>
          </div>
        ) : (
          <div className="w-full bg-transparent px-3.5 py-1">
            {isLoadingCategories ? (
              <div className="horizontal-scroll w-full gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-primary/15 h-7 w-20 shrink-0 animate-pulse rounded-full"
                  />
                ))}
              </div>
            ) : (
              <CategoryList
                selectedId={activeCategoryId ?? undefined}
                categories={categories || []}
                onCategorySelect={handleCategorySelect}
              />
            )}
          </div>
        )}
      </div>

      {/* Danh sách món ăn phân theo từng Danh Mục hoặc Kết quả tìm kiếm */}
      <div
        className={cn(
          "flex flex-col gap-6 px-3.5 pt-2",
          hasCartItems ? "pb-24" : "pb-6",
        )}
      >
        {searchQuery.trim() ? (
          /* Danh sách món theo kết quả tìm kiếm */
          <div className="flex flex-col gap-3">
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 text-stone-400">
                  <SearchIcon className="h-6 w-6 shrink-0" />
                </div>
                <p className="text-sm font-bold text-neutral800">
                  Không tìm thấy món ăn nào
                </p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-400">
                  Không có món nào khớp với &quot;{searchQuery}&quot;. Vui lòng
                  thử từ khóa khác.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 touch-manipulation rounded-xl bg-stone-100 px-4 py-2 text-xs font-bold text-neutral700 hover:bg-stone-200 active:scale-95"
                >
                  Xem toàn bộ thực đơn
                </button>
              </div>
            )}
          </div>
        ) : isLoadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col space-y-2">
                <div className="aspect-square animate-pulse rounded-2xl bg-amber-200/30" />
                <div className="h-4 animate-pulse rounded-md bg-amber-200/30" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-amber-200/30" />
              </div>
            ))}
          </div>
        ) : categorizedProducts.length > 0 ? (
          categorizedProducts.map((group, index) => (
            <section
              key={group.category.id}
              id={`category-section-${group.category.id}`}
              className={`flex scroll-mt-[90px] flex-col gap-3 ${
                index > 0 ? "border-t border-black/5 pt-4" : ""
              }`}
            >
              {/* Tiêu đề danh mục */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-neutral900">
                  {group.category.name}
                </h2>
                <span className="text-xxxsmall text-neutral400">
                  {group.products.length} món
                </span>
              </div>

              {/* Grid các món trong danh mục */}
              <div className="grid grid-cols-2 gap-3">
                {group.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-stone-400">
            <p>{copy.home.empty || "Chưa có món ăn nào trong thực đơn"}</p>
          </div>
        )}
      </div>
    </div>
  );
}
