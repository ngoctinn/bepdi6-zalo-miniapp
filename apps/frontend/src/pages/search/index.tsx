import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/common/product-card";
import SearchBar from "@/components/common/search-bar";
import { useProducts } from "@/services/product/product.queries";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const { data: products, isLoading } = useProducts(
    searchQuery.trim() ? { search: searchQuery.trim() } : undefined,
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="relative mx-3.5 mb-6 flex h-full flex-col gap-3">
      <div className="mb-2">
        <SearchBar
          clearable
          autoFocus
          value={searchQuery}
          onChange={(e) =>
            handleSearchChange((e.target as HTMLInputElement).value)
          }
        />
      </div>
      <div className="no-scrollbar flex flex-1 flex-col gap-2 overflow-y-scroll pb-20">
        {isLoading ? (
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
          <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-neutral400">
            {searchQuery.trim() ? (
              <p>Không tìm thấy món ăn phù hợp với "{searchQuery}"</p>
            ) : (
              <p>Nhập tên món ăn để tìm kiếm</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
