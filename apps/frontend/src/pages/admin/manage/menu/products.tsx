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
import { Sheet, Spinner, Switch } from "zmp-ui";

export default function AdminProductManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCatId = searchParams.get("category_id")
    ? Number(searchParams.get("category_id"))
    : undefined;

  const { showToast } = useAppToast();
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

  const filteredProducts = products.filter((p) =>
    searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

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
    setFormCategoryId(prod.category_id || (categories[0]?.id ?? 0));
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
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    try {
      await toggleStatus.mutateAsync(prod.id);
      showToast({
        message:
          prod.status === "AVAILABLE"
            ? "Đã chuyển sang hết món"
            : "Đã bật món sẵn sàng",
        type: "success",
      });
    } catch {
      showToast({ message: "Không thể đổi trạng thái món", type: "error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast({ message: "Vui lòng nhập tên món ăn", type: "error" });
      return;
    }
    if (!formCategoryId) {
      showToast({ message: "Vui lòng chọn danh mục món", type: "error" });
      return;
    }

    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            name: formName.trim(),
            category: formCategoryId,
            price: Number(formPrice),
            description: formDescription.trim(),
            image_url: formImageUrl.trim(),
            status: formStatus,
          },
        });
        showToast({ message: "Cập nhật món ăn thành công", type: "success" });
      } else {
        await createProduct.mutateAsync({
          name: formName.trim(),
          category: formCategoryId,
          price: Number(formPrice),
          description: formDescription.trim(),
          image_url: formImageUrl.trim(),
          status: formStatus,
        });
        showToast({ message: "Thêm món mới thành công", type: "success" });
      }
      setSheetVisible(false);
    } catch {
      showToast({ message: "Lỗi lưu thông tin món ăn", type: "error" });
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24">
      {/* Top Header */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">
              Danh Sách Món Ăn
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Bật/tắt trạng thái hết món và chỉnh sửa giá ({products.length}{" "}
              món)
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <span>+ Thêm món</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="🔍 Tìm nhanh tên món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs focus:border-primary focus:outline-none"
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
          <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-400">
            <span className="text-3xl">🍜</span>
            <p className="mt-2 text-sm">Không tìm thấy món ăn nào</p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary/10 mt-3 inline-block rounded-xl px-4 py-2 text-xs font-bold text-primary"
            >
              + Tạo món ăn đầu tiên
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
                    <div className="bg-primary/10 flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl text-primary">
                      🍽️
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
                    <div className="mt-0.5 truncate text-[10px] text-stone-400">
                      {p.category_name || "Món quán"} •{" "}
                      {isAvailable ? "🟢 Còn món" : "🔴 Tạm hết"}
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
                    onChange={() => handleToggleStatus(p, {} as any)}
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
