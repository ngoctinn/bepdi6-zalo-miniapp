import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CategoryList from "@/components/common/category-list";
import ProductCard from "@/components/common/product-card";
import ProductDetailSheet from "@/components/common/product-detail-sheet";
import { useCategories } from "@/services/category/category.queries";
import { useProducts } from "@/services/product/product.queries";
import { useAuth } from "@/hooks/use-auth";
import { Category } from "@/types/category.types";
import { Icon } from "zmp-ui";

import { copy } from "@/constants/copy";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: allProducts, isLoading: isLoadingProducts } = useProducts();
  const { customer: userProfile } = useAuth();

  const isDev = import.meta.env.DEV;
  const isStaffOrAdmin =
    isDev || userProfile?.role === "ADMIN" || userProfile?.role === "STAFF";

  const [activeCategoryId, setActiveCategoryId] = useState<
    number | string | null
  >(null);
  const [selectedProductId, setSelectedProductId] = useState<
    string | number | null
  >(null);

  const isManualScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      let currentActiveId = categorizedProducts[0]?.category.id;

      for (const group of categorizedProducts) {
        const el = document.getElementById(
          `category-section-${group.category.id}`,
        );
        if (el) {
          const elRect = el.getBoundingClientRect();
          const topRelativeToContainer = elRect.top - containerRect.top;
          if (topRelativeToContainer <= stickyHeight + 20) {
            currentActiveId = group.category.id;
          }
        }
      }

      if (currentActiveId) {
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
        {/* Tên quán & Shortcut Quản lý Bếp */}
        <div className="header-margin flex items-center justify-between px-3.5 pb-1 pr-20 pt-3">
          <h1 className="text-base font-extrabold tracking-tight text-neutral-900">
            {copy.brand.name}
          </h1>

          {isStaffOrAdmin && (
            <button
              onClick={() => navigate("/staff/orders")}
              className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-900 ring-1 ring-amber-300 active:bg-amber-200"
            >
              <Icon icon="zi-list-1" className="text-sm" />
              <span>Quản lý Bếp</span>
            </button>
          )}
        </div>

        {/* Thanh tab danh mục món (nền trong suốt, dùng chung mẫu Tabs) */}
        <div className="w-full bg-transparent px-3.5 py-1">
          {isLoadingCategories ? (
            <div className="horizontal-scroll w-full gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-primary/15"
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
      </div>

      {/* Danh sách món ăn phân theo từng Danh Mục (Có ngăn cách & Scroll-spy) */}
      <div className="flex flex-col gap-6 px-3.5 pb-24 pt-2">
        {isLoadingProducts ? (
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
                    onClick={() => setSelectedProductId(product.id)}
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

      {/* Product Detail Sheet 80vh theo chuẩn Zalo */}
      <ProductDetailSheet
        productId={selectedProductId}
        visible={Boolean(selectedProductId)}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
