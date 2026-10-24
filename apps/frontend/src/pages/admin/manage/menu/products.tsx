import React, { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useAdminCategories,
  useAdminProducts,
} from "@/services/admin/admin.queries";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useToggleProductStatus,
  useUploadAdminImage,
} from "@/services/admin/admin.mutations";
import { AdminOptionGroupInput, AdminProduct } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { Icon, Sheet, Spinner, Switch } from "zmp-ui";
import { ConfirmModal } from "@/components/common/confirm-modal";

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
  const deleteProduct = useDeleteProduct();
  const toggleStatus = useToggleProductStatus();
  const uploadImage = useUploadAdminImage();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(
    null,
  );
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState<number>(0);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formStatus, setFormStatus] = useState<
    "AVAILABLE" | "OUT_OF_STOCK" | "INACTIVE"
  >("AVAILABLE");
  const [formOptionGroups, setFormOptionGroups] = useState<
    AdminOptionGroupInput[]
  >([]);

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
    setFormOptionGroups([]);
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
    const groups: AdminOptionGroupInput[] = (prod.option_groups || []).map(
      (og) => ({
        id: og.id,
        name: og.name,
        is_required: Boolean(og.is_required),
        min_select: og.min_select ?? 0,
        max_select: og.max_select ?? 1,
        sort_order: og.sort_order ?? 0,
        options: (og.options || []).map((o) => ({
          id: o.id,
          name: o.name,
          price: Number(o.price || 0),
          status: (o.status as "AVAILABLE" | "INACTIVE") || "AVAILABLE",
          sort_order: o.sort_order ?? 0,
        })),
      }),
    );
    setFormOptionGroups(groups);
    setSheetVisible(true);
  };

  const handleToggleStatus = async (
    prod: AdminProduct,
    e?: React.SyntheticEvent,
  ) => {
    e?.stopPropagation?.();
    if (togglingIds.has(prod.id)) return;

    setTogglingIds((prev) => new Set(prev).add(prod.id));
    try {
      await toggleStatus.mutateAsync(prod.id);
      showSuccess(
        prod.status === "AVAILABLE"
          ? "Đã chuyển sang tạm hết món"
          : "Đã bật món sẵn sàng",
      );
    } catch {
      showError("Không thể đổi trạng thái món");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(prod.id);
        return next;
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Vui lòng chọn file hình ảnh hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("Dung lượng ảnh không được vượt quá 5MB");
      return;
    }

    try {
      const res = await uploadImage.mutateAsync(file);
      if (res?.image_url) {
        setFormImageUrl(res.image_url);
        showSuccess("Tải ảnh WebP thành công!");
      }
    } catch {
      showError("Không thể tải ảnh lên máy chủ, vui lòng thử lại");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Option Group Helpers
  const handleAddOptionGroup = () => {
    setFormOptionGroups((prev) => [
      ...prev,
      {
        name: "",
        is_required: false,
        min_select: 0,
        max_select: 1,
        sort_order: prev.length,
        options: [{ name: "", price: 0, status: "AVAILABLE", sort_order: 0 }],
      },
    ]);
  };

  const handleRemoveOptionGroup = (groupIndex: number) => {
    setFormOptionGroups((prev) => prev.filter((_, idx) => idx !== groupIndex));
  };

  const handleUpdateOptionGroup = (
    groupIndex: number,
    field: keyof AdminOptionGroupInput,
    value: any,
  ) => {
    setFormOptionGroups((prev) =>
      prev.map((g, idx) => (idx === groupIndex ? { ...g, [field]: value } : g)),
    );
  };

  const handleAddOption = (groupIndex: number) => {
    setFormOptionGroups((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g;
        const currentOptions = g.options || [];
        return {
          ...g,
          options: [
            ...currentOptions,
            {
              name: "",
              price: 0,
              status: "AVAILABLE",
              sort_order: currentOptions.length,
            },
          ],
        };
      }),
    );
  };

  const handleRemoveOption = (groupIndex: number, optionIndex: number) => {
    setFormOptionGroups((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g;
        return {
          ...g,
          options: (g.options || []).filter((_, oIdx) => oIdx !== optionIndex),
        };
      }),
    );
  };

  const handleUpdateOption = (
    groupIndex: number,
    optionIndex: number,
    field: string,
    value: any,
  ) => {
    setFormOptionGroups((prev) =>
      prev.map((g, idx) => {
        if (idx !== groupIndex) return g;
        const options = (g.options || []).map((opt, oIdx) =>
          oIdx === optionIndex ? { ...opt, [field]: value } : opt,
        );
        return { ...g, options };
      }),
    );
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

    // Clean up empty option groups and options
    const cleanedOptionGroups: AdminOptionGroupInput[] = formOptionGroups
      .filter((g) => g.name.trim())
      .map((g, gIdx) => ({
        ...g,
        name: g.name.trim(),
        sort_order: gIdx,
        options: (g.options || [])
          .filter((o) => o.name.trim())
          .map((o, oIdx) => ({
            ...o,
            name: o.name.trim(),
            price: Number(o.price || 0),
            sort_order: oIdx,
          })),
      }));

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
            option_groups: cleanedOptionGroups,
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
          option_groups: cleanedOptionGroups,
        });
        showSuccess("Thêm món mới thành công");
      }
      setSheetVisible(false);
    } catch {
      showError("Lỗi lưu thông tin món ăn");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      const res = await deleteProduct.mutateAsync(deletingProduct.id);
      if (res?.soft_deleted) {
        showSuccess(
          "Món đã có trong đơn hàng nên được chuyển sang trạng thái Đã ẩn",
        );
      } else {
        showSuccess("Đã xoá hoàn toàn món ăn khỏi hệ thống");
      }
      setDeletingProduct(null);
      setSheetVisible(false);
    } catch {
      showError("Không thể xoá món ăn này");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24 font-sans">
      {/* Action Toolbar */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              {filteredProducts.length} / {products.length} món
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <Icon icon="zi-plus" className="shrink-0 text-base" />
            <span>Thêm món</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-2.5">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
            <Icon icon="zi-search" className="shrink-0 text-base" />
          </span>
          <input
            type="text"
            placeholder="Tìm nhanh tên món..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
          />
        </div>

        {/* Category Pills Filter */}
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              !selectedCatId
                ? "bg-primary text-white shadow-sm"
                : "bg-stone-100 text-stone-700"
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              onClick={() => setSearchParams({ category_id: String(c.id) })}
              className={`min-h-[36px] whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                selectedCatId === c.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-stone-100 text-stone-700"
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
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <Icon icon="zi-inbox" className="shrink-0 text-2xl" />
            </div>
            <p className="mt-2 text-sm font-medium text-stone-700">
              Không tìm thấy món ăn nào
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-4 text-xs font-bold text-primary active:scale-95"
            >
              <Icon icon="zi-plus" className="shrink-0 text-xs" />
              <span>Tạo món ăn đầu tiên</span>
            </button>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isAvailable = p.status === "AVAILABLE";
            const isToggling = togglingIds.has(p.id);
            const optionGroupsCount = (p.option_groups || []).length;

            return (
              <div
                key={p.id}
                onClick={() => handleOpenEdit(p)}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-3.5 shadow-sm transition-all active:bg-stone-50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-14 w-14 shrink-0 rounded-xl border border-stone-100 object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon icon="zi-more-grid" className="shrink-0 text-2xl" />
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
                    <div className="mt-1 flex items-center gap-1.5 truncate text-xs text-stone-500">
                      <span>{p.category_name || "Món quán"}</span>
                      {optionGroupsCount > 0 && (
                        <>
                          <span>•</span>
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                            {optionGroupsCount} nhóm chọn
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${
                          p.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-600"
                            : p.status === "OUT_OF_STOCK"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                            p.status === "AVAILABLE"
                              ? "bg-emerald-500"
                              : p.status === "OUT_OF_STOCK"
                                ? "bg-amber-500"
                                : "bg-stone-400"
                          }`}
                        />
                        {p.status === "AVAILABLE"
                          ? "Còn món"
                          : p.status === "OUT_OF_STOCK"
                            ? "Tạm hết"
                            : "Đã ẩn"}
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
                    disabled={isToggling}
                    onChange={(e) => handleToggleStatus(p, e)}
                  />
                  <span className="text-xs font-medium text-stone-500">
                    {isToggling
                      ? "Đang lưu..."
                      : isAvailable
                        ? "Còn hàng"
                        : "Hết hàng"}
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
        swipeToClose={false}
        title={editingProduct ? "Chỉnh Sửa Món Ăn" : "Thêm Món Ăn Mới"}
      >
        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] space-y-4 overflow-y-auto p-4 pb-12"
        >
          <div>
            <label
              htmlFor="prod-name-input"
              className="text-xs font-semibold text-stone-700"
            >
              Tên món ăn *
            </label>
            <input
              id="prod-name-input"
              type="text"
              placeholder="VD: Cơm tấm sườn bì chả đặc biệt"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="prod-cat-select"
                className="text-xs font-semibold text-stone-700"
              >
                Danh mục *
              </label>
              <select
                id="prod-cat-select"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
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
              <label
                htmlFor="prod-price-input"
                className="text-xs font-semibold text-stone-700"
              >
                Giá bán (₫) *
              </label>
              <input
                id="prod-price-input"
                type="number"
                step="1000"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="prod-desc-input"
              className="text-xs font-semibold text-stone-700"
            >
              Mô tả món ăn
            </label>
            <textarea
              id="prod-desc-input"
              rows={2}
              placeholder="Mô tả nguyên liệu, hương vị món ăn..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="mt-1 min-h-[56px] w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-base text-stone-900 focus:border-primary focus:outline-none md:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="prod-image-file"
              className="text-xs font-semibold text-stone-700"
            >
              Ảnh món ăn
            </label>

            {/* Hidden File Input */}
            <input
              id="prod-image-file"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Image Preview & Upload Buttons */}
            <div className="mt-1.5 flex items-center gap-3">
              {formImageUrl ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-stone-200">
                  <img
                    src={formImageUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormImageUrl("")}
                    className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                    title="Xoá ảnh"
                  >
                    <Icon icon="zi-close" className="shrink-0 text-xs" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50 text-stone-400">
                  <Icon icon="zi-photo" className="shrink-0 text-2xl" />
                </div>
              )}

              <div className="flex flex-1 flex-col gap-1.5">
                <button
                  type="button"
                  disabled={uploadImage.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-800 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Icon icon="zi-photo" className="shrink-0 text-sm" />
                  <span>
                    {uploadImage.isPending
                      ? "Đang nén WebP..."
                      : formImageUrl
                        ? "Đổi ảnh từ máy"
                        : "Chọn ảnh từ máy"}
                  </span>
                </button>
              </div>
            </div>

            {/* URL Fallback */}
            <input
              id="prod-image-url"
              type="url"
              placeholder="Hoặc nhập link ảnh (https://...)"
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="prod-status-select"
              className="text-xs font-semibold text-stone-700"
            >
              Trạng thái bán
            </label>
            <select
              id="prod-status-select"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as any)}
              className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
            >
              <option value="AVAILABLE">Sẵn sàng bán (Available)</option>
              <option value="OUT_OF_STOCK">Tạm hết món (Out of stock)</option>
              <option value="INACTIVE">Ngừng bán / Ẩn món (Inactive)</option>
            </select>
          </div>

          {/* Option Groups & Topping Section */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-stone-900">
                  Nhóm tùy chọn & Topping/Size
                </h4>
                <p className="text-[11px] text-stone-500">
                  Cấu hình các tuỳ chọn món như Size ly, Topping, mức đường/đá
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddOptionGroup}
                className="flex h-9 items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary active:scale-95"
              >
                <Icon icon="zi-plus" className="shrink-0 text-xs" />
                <span>Thêm nhóm</span>
              </button>
            </div>

            {formOptionGroups.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-stone-200 bg-white p-4 text-center text-xs text-stone-500">
                Chưa có nhóm tùy chọn nào cho món này
              </div>
            ) : (
              <div className="mt-3 space-y-4">
                {formOptionGroups.map((group, gIdx) => (
                  <div
                    key={gIdx}
                    className="shadow-xs rounded-xl border border-stone-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2">
                      <input
                        type="text"
                        placeholder="Tên nhóm (VD: Chọn Size, Topping...)"
                        value={group.name}
                        onChange={(e) =>
                          handleUpdateOptionGroup(gIdx, "name", e.target.value)
                        }
                        className="h-10 flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 text-sm font-bold text-stone-900 focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionGroup(gIdx)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50 active:scale-95"
                        title="Xoá nhóm"
                      >
                        <Icon icon="zi-delete" className="shrink-0 text-sm" />
                      </button>
                    </div>

                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600">
                          Bắt buộc
                        </label>
                        <select
                          value={group.is_required ? "true" : "false"}
                          onChange={(e) =>
                            handleUpdateOptionGroup(
                              gIdx,
                              "is_required",
                              e.target.value === "true",
                            )
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-medium text-stone-800"
                        >
                          <option value="false">Không</option>
                          <option value="true">Bắt buộc</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600">
                          Tối thiểu
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={group.min_select}
                          onChange={(e) =>
                            handleUpdateOptionGroup(
                              gIdx,
                              "min_select",
                              Number(e.target.value),
                            )
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-medium text-stone-800"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-stone-600">
                          Tối đa
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={group.max_select}
                          onChange={(e) =>
                            handleUpdateOptionGroup(
                              gIdx,
                              "max_select",
                              Number(e.target.value),
                            )
                          }
                          className="mt-1 h-9 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-medium text-stone-800"
                        />
                      </div>
                    </div>

                    {/* Options inside Group */}
                    <div className="mt-3 space-y-2 border-t border-stone-100 pt-2.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                        <span>Danh sách lựa chọn / Topping con:</span>
                        <button
                          type="button"
                          onClick={() => handleAddOption(gIdx)}
                          className="flex items-center gap-1 text-xs font-bold text-primary active:opacity-75"
                        >
                          <Icon icon="zi-plus" className="shrink-0 text-xs" />
                          <span>Thêm lựa chọn</span>
                        </button>
                      </div>

                      {(group.options || []).map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="flex items-center gap-2 rounded-lg bg-stone-50 p-2"
                        >
                          <input
                            type="text"
                            placeholder="Tên (VD: Trân châu...)"
                            value={opt.name}
                            onChange={(e) =>
                              handleUpdateOption(
                                gIdx,
                                oIdx,
                                "name",
                                e.target.value,
                              )
                            }
                            className="h-9 flex-1 rounded border border-stone-200 bg-white px-2 text-xs font-medium text-stone-900"
                          />
                          <div className="flex w-24 items-center">
                            <input
                              type="number"
                              step="1000"
                              placeholder="Giá +₫"
                              value={opt.price}
                              onChange={(e) =>
                                handleUpdateOption(
                                  gIdx,
                                  oIdx,
                                  "price",
                                  Number(e.target.value),
                                )
                              }
                              className="h-9 w-full rounded border border-stone-200 bg-white px-2 text-xs font-bold text-primary"
                            />
                          </div>
                          <select
                            value={opt.status || "AVAILABLE"}
                            onChange={(e) =>
                              handleUpdateOption(
                                gIdx,
                                oIdx,
                                "status",
                                e.target.value,
                              )
                            }
                            className="h-9 rounded border border-stone-200 bg-white px-1.5 text-xs text-stone-700"
                          >
                            <option value="AVAILABLE">Còn</option>
                            <option value="INACTIVE">Hết</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(gIdx, oIdx)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-stone-400 hover:text-red-500"
                          >
                            <Icon
                              icon="zi-close"
                              className="shrink-0 text-xs"
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-3">
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setSheetVisible(false)}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 shadow-sm active:scale-95"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  createProduct.isPending ||
                  updateProduct.isPending ||
                  uploadImage.isPending
                }
                className="flex h-11 flex-[2] items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
              >
                {createProduct.isPending || updateProduct.isPending
                  ? "Đang lưu..."
                  : "Lưu món ăn"}
              </button>
            </div>

            {editingProduct && (
              <button
                type="button"
                onClick={() => setDeletingProduct(editingProduct)}
                className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition-transform active:scale-95"
              >
                <Icon icon="zi-delete" className="shrink-0 text-base" />
                <span>Xoá món ăn này</span>
              </button>
            )}
          </div>
        </form>
      </Sheet>

      {/* Modal xác nhận xoá món ăn */}
      <ConfirmModal
        visible={!!deletingProduct}
        title="Xoá món ăn?"
        description={
          <span>
            Bạn có chắc muốn xoá món <strong>"{deletingProduct?.name}"</strong>?
            Nếu món đã từng có trong đơn hàng, hệ thống sẽ tự động chuyển sang
            trạng thái <strong>Ngừng bán (Đã ẩn)</strong> để bảo toàn lịch sử
            đơn.
          </span>
        }
        confirmText="Xoá món ăn"
        cancelText="Giữ lại"
        type="danger"
        loading={deleteProduct.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingProduct(null)}
      />
    </div>
  );
}
