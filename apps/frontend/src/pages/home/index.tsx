import CategoryList from "@/components/common/category-list";
import ProductCard from "@/components/common/product-card";
import SearchBar from "@/components/common/search-bar";
import SectionTitle from "@/components/common/section-title";
import { AlertCircleIcon, SparklesIcon } from "@/components/common/vectors";
import { useCategories } from "@/services/category/category.queries";
import { useProducts } from "@/services/product/product.queries";
import { useShopInfo } from "@/services/shop/shop.queries";
import { Category } from "@/types/category.types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { copy } from "@/constants/copy";

export default function HomePage() {
  const navigate = useNavigate();

  const { data: shopInfo } = useShopInfo();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const { data: products, isLoading: isLoadingProducts } = useProducts(
    selectedCategory ? { category: selectedCategory.id } : undefined,
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Banner trạng thái quán nếu đóng cửa */}
      {shopInfo && !shopInfo.is_open && (
        <div className="mx-3.5 mb-2.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
          <div className="min-w-0 flex-1">
            <span className="font-semibold">Quán đang tạm ngưng nhận đơn</span>
            {shopInfo.open_time && (
              <span className="ml-1 text-red-600/80">
                (Giờ mở cửa: {shopInfo.open_time.slice(0, 5)} -{" "}
                {shopInfo.close_time?.slice(0, 5)})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Banner ưu đãi ngắn gọn, súc tích, không emoji */}
      {shopInfo?.announcement_banner && (
        <div className="shadow-2xs mx-3.5 mb-2.5 flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-900">
          <SparklesIcon className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="truncate">{shopInfo.announcement_banner}</span>
        </div>
      )}

      {/* Thanh tìm kiếm & Danh mục cuộn ngang */}
      <div className="mb-3.5 flex flex-col gap-3">
        <div className="mx-3.5">
          <SearchBar onClick={() => navigate("/menu/search")} />
        </div>
        <div className="w-full min-w-0 pl-3.5">
          {isLoadingCategories ? (
            <div className="horizontal-scroll w-full gap-2 pr-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-24 shrink-0 animate-pulse rounded-xl bg-stone-200/60"
                />
              ))}
            </div>
          ) : (
            <CategoryList
              selectedId={selectedCategory?.id}
              categories={categories || []}
              onCategorySelect={(category) => setSelectedCategory(category)}
            />
          )}
        </div>
      </div>

      {/* Danh sách món ăn */}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-scroll px-3.5 pb-24">
        <SectionTitle title={selectedCategory?.name || copy.home.suggestions} />

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
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-stone-400">
            <p>Chưa có món ăn trong danh mục này</p>
          </div>
        )}
      </div>
    </div>
  );
}
