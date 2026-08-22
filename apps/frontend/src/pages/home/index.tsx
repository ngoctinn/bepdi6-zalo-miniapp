import CategoryList from "@/components/common/category-list";
import ProductCard from "@/components/common/product-card";
import { useCategories } from "@/services/category/category.queries";
import { useProducts } from "@/services/product/product.queries";
import { Category } from "@/types/category.types";
import { useEffect, useState } from "react";

export default function HomePage() {
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
    <div className="relative flex flex-col">
      {/* Sticky Header: Tên quán + Thanh tab danh mục dùng dải gradient vàng */}
      <div className="sticky top-0 z-30 flex flex-col bg-yellow-gradient pb-2">
        {/* Tên quán */}
        <div className="header-margin px-3.5 pt-3 pb-1">
          <h1 className="text-[17px] font-extrabold tracking-tight text-green800">
            Bếp Dì 6 - Mắm Chưng Miền Tây
          </h1>
        </div>

        {/* Thanh tab danh mục món (nền trong suốt, dùng chung mẫu Tabs) */}
        <div className="w-full bg-transparent px-3.5 py-1">
          {isLoadingCategories ? (
            <div className="horizontal-scroll w-full gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-amber-200/30"
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
      <div className="flex flex-col gap-3.5 px-3.5 pt-2 pb-24">
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
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-stone-400">
            <p>Chưa có món ăn trong danh mục này</p>
          </div>
        )}
      </div>
    </div>
  );
}
