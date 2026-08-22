import CategoryList from "@/components/common/category-list";
import ProductCard from "@/components/common/product-card";
import SearchBar from "@/components/common/search-bar";
import { useCategories } from "@/services/category/category.queries";
import { useProducts } from "@/services/product/product.queries";
import { Category } from "@/types/category.types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MenuPage() {
  const navigate = useNavigate();

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
    <div className="relative flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-shrink-0 flex-col gap-3">
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
              categories={categories || []}
              selectedId={selectedCategory?.id}
              onCategorySelect={(category) => setSelectedCategory(category)}
            />
          )}
        </div>
      </div>

      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-scroll px-3.5 pb-24">
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="shadow-2xs space-y-2 rounded-2xl border border-stone-200/50 bg-white p-2.5"
              >
                <div className="aspect-square animate-pulse rounded-xl bg-stone-100" />
                <div className="h-4 animate-pulse rounded-md bg-stone-100" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-stone-100" />
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
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-stone-400">
            <p>Không có món ăn nào trong danh mục này</p>
          </div>
        )}
      </div>
    </div>
  );
}
