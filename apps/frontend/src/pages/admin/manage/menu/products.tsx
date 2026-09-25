import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useAdminCategories,
  useAdminProducts,
} from "@/services/admin/admin.queries";
import {
  useCreateProduct,
  useUpdateProduct,
  useToggleProductStatus,
} from "@/services/admin/admin.mutations";
import { AdminProduct } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { Icon, Sheet, Spinner, Switch } from "zmp-ui";

export default function AdminProductManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCatId = searchParams.get("category_id")
    ? Number(searchParams.get("category_id"))
    : undefined;

  const { showSuccess, showError } = useAppToast();
  const { data: categoriesData } = useAdminCategories();
  const { data: productsData, isLoading } = useAdminProducts(
    selectedCatId ? { category_id: selectedCatId } : undefined,
  );

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const toggleStatus = useToggleProductStatus();

  const [searchQuery, setSearchQuery] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );

  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<number>(0);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formStatus, setFormStatus] = useState<
    "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE"
  >("AVAILABLE");

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const products = Array.isArray(productsData) ? productsData : [];

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCatId
      ? p.category_id === selectedCatId || p.category === selectedCatId
      : true;
    const matchesSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategoryId(selectedCatId || (categories[0]?.id ?? 0));
    setFormPrice(0);
    setFormDescription("");
    setFormImageUrl("");
    setFormStatus("AVAILABLE");
    setSheetVisible(true);
  };

  const handleOpenEdit = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategoryId(
      prod.category_id || prod.category || (categories[0]?.id ?? 0),
    );
    setFormPrice(Number(prod.price || 0));
    setFormDescription(prod.description || "");
    setFormImageUrl(prod.image_url || "");
    setFormStatus(
      (prod.status as "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE") || "AVAILABLE",
    );
    setSheetVisible(true);
  };

  const handleToggleStatus = async (
    prod: AdminProduct,
    e?: React.SyntheticEvent,
  ) => {
    e?.stopPropagation?.();
    try {
      await toggleStatus.mutateAsync(prod.id);
      showSuccess(
        prod.status === "AVAILABLE"
          ? "Đã chuyển sang hết món"
          : "Đã bật món sẵn sàng",
      );
    } catch {
      showError("Không thể đổi trạng thái món");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showError("Vui lòng nhập tên món ăn");
      return;
    }
    if (!formCategoryId) {
      showError("Vui lòng chọn danh mục món");
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            name: formName.trim(),
            category_id: formCategoryId,
            price: Number(formPrice),
            description: formDescription.trim(),
            image_url: formImageUrl.trim(),
            status: formStatus,
          },
        });
        showSuccess("Cập nhật món ăn thành công");
      } else {
        await createProduct.mutateAsync({
          name: formName.trim(),
          category_id: formCategoryId,
          price: Number(formPrice),
          description: formDescription.trim(),
          image_url: formImageUrl.trim(),
          status: formStatus,
        });
        showSuccess("Thêm món mới thành công");
      }
      setSheetVisible(false);
    } catch {
      showError("Lỗi lưu thông tin món ăn");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24">
      {/* Action Toolbar */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
              {filteredProducts.length} / {products.length} món
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <Icon icon="zi-plus" className="text-sm" />
            <span>Thêm món</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-2.5">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <Icon icon="zi-search" className="text-sm" />
          </span>
          <input
            type="text"
            placeholder="Tìm nhanh tên món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-xs focus:border-primary focus:outline-none"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              !selectedCatId
                ? "bg-primary text-white"
                : "bg-stone-100 text-stone-600"
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setSearchParams({ category_id: String(c.id) })}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedCatId === c.id
                  ? "bg-primary text-white"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-3 p-4">
        {isLoading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Spinner logo />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Icon icon="zi-inbox" className="text-2xl" />
            </div>
            <p className="mt-2 text-sm font-medium text-stone-600">
              Không tìm thấy món ăn nào
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary/10 mt-3 inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold text-primary"
            >
              <Icon icon="zi-plus" className="text-xs" />
              <span>Tạo món ăn đầu tiên</span>
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isAvailable = p.status === "AVAILABLE";
            return (
              <div
                key={p.id}
                onClick={() => handleOpenEdit(p)}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm transition-all active:bg-stone-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-14 w-14 shrink-0 rounded-xl border border-stone-100 object-cover"
                    />
                  ) : (
                    <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-primary">
                      <Icon icon="zi-more-grid" className="text-2xl" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-stone-900">
                        {p.name}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs font-extrabold text-primary">
                      {Number(p.price || 0).toLocaleString("vi-VN")}₫
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-stone-400">
                      <span>{p.category_name || "Món quán"}</span>
                      <span>•</span>
                      <span className="inline-flex items-center">
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                            isAvailable ? "bg-emerald-500" : "bg-stone-400"
                          }`}
                        />
                        {isAvailable ? "Còn món" : "Tạm hết"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Toggle Out of Stock */}
                <div
                  className="ml-3 flex shrink-0 flex-col items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Switch
                    checked={isAvailable}
                    onChange={() => handleToggleStatus(p)}
                  />
                  <span className="text-[10px] font-medium text-stone-400">
                    {isAvailable ? "Còn hàng" : "Hết hàng"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sheet Form Create/Edit */}
      <Sheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        mask
        handler
        swipeToClose
        title={editingProduct ? "Chỉnh Sửa Món Ăn" : "Thêm Món Ăn Mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-3 p-4 pb-8">
          <div>
            <label className="text-xs font-semibold text-stone-700">
              Tên món ăn *
            </label>
            <input
              type="text"
              placeholder="VD: Cơm tấm sườn bì chả đặc biệt"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Danh mục *
              </label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Giá bán (₫) *
              </label>
              <input
                type="number"
                step="1000"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Mô tả món ăn
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả nguyên liệu, hương vị món ăn..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Link ảnh món (URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Trạng thái bán
            </label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="AVAILABLE">Sẵn sàng bán (Available)</option>
              <option value="OUT_OF_STOCK">Tạm hết món (Out of stock)</option>
              <option value="INACTIVE">Ngừng bán / Ẩn món (Inactive)</option>
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={createProduct.isPending || updateProduct.isPending}
              className="w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
            >
              {createProduct.isPending || updateProduct.isPending
                ? "Đang lưu..."
                : "Lưu món ăn"}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
