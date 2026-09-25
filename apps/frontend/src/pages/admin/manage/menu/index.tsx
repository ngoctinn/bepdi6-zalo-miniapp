import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCategories } from "@/services/admin/admin.queries";
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/services/admin/admin.mutations";
import { AdminCategory } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { Icon, Sheet, Spinner } from "zmp-ui";
import { ConfirmModal } from "@/components/common/confirm-modal";

export default function AdminCategoryManagementPage() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useAppToast();
  const { data: categoriesData, isLoading } = useAdminCategories();

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] =
    useState<AdminCategory | null>(null);

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formSortOrder, setFormSortOrder] = useState(0);
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const categories = Array.isArray(categoriesData) ? categoriesData : [];

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormImageUrl("");
    setFormSortOrder(categories.length);
    setFormStatus("ACTIVE");
    setSheetVisible(true);
  };

  const handleOpenEdit = (cat: AdminCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || "");
    setFormImageUrl(cat.image_url || "");
    setFormSortOrder(cat.sort_order ?? 0);
    setFormStatus((cat.status as "ACTIVE" | "INACTIVE") || "ACTIVE");
    setSheetVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showError("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          data: {
            name: formName.trim(),
            description: formDescription.trim(),
            image_url: formImageUrl.trim(),
            sort_order: Number(formSortOrder),
            status: formStatus,
          },
        });
        showSuccess("Cập nhật danh mục thành công");
      } else {
        await createCategory.mutateAsync({
          name: formName.trim(),
          description: formDescription.trim(),
          image_url: formImageUrl.trim(),
          sort_order: Number(formSortOrder),
          status: formStatus,
        });
        showSuccess("Tạo danh mục mới thành công");
      }
      setSheetVisible(false);
    } catch {
      showError("Lỗi lưu danh mục, vui lòng thử lại");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      showSuccess("Đã xoá danh mục");
      setDeletingCategory(null);
    } catch {
      showError("Không thể xoá danh mục này");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between border-b border-stone-200/70 bg-white px-4 py-3">
        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
          {categories.length} danh mục
        </span>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          <Icon icon="zi-plus" className="text-sm" />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* List Categories */}
      <div className="space-y-3 p-4">
        {isLoading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Spinner logo />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-400">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
              <Icon icon="zi-inbox" className="text-2xl" />
            </div>
            <p className="mt-2 text-sm font-medium text-stone-600">
              Chưa có danh mục món nào
            </p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary/10 mt-3 inline-flex items-center gap-1 rounded-xl px-4 py-2 text-xs font-bold text-primary"
            >
              <Icon icon="zi-plus" className="text-xs" />
              <span>Tạo danh mục đầu tiên</span>
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white p-3.5 shadow-sm transition-all"
            >
              <div
                onClick={() => handleOpenEdit(cat)}
                className="flex flex-1 cursor-pointer items-center gap-3"
              >
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="h-12 w-12 rounded-xl border border-stone-100 object-cover"
                  />
                ) : (
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl text-primary">
                    <Icon icon="zi-list-1" className="text-xl" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-900">
                      {cat.name}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        cat.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-stone-100 text-stone-400"
                      }`}
                    >
                      <span
                        className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                          cat.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : "bg-stone-400"
                        }`}
                      />
                      {cat.status === "ACTIVE" ? "Hiển thị" : "Đang ẩn"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone-400">
                    Thứ tự: {cat.sort_order ?? 0} •{" "}
                    {cat.description || "Không có mô tả"}
                  </div>
                </div>
              </div>

              <div className="ml-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/admin/manage/menu/products?category_id=${cat.id}`,
                    )
                  }
                  className="flex items-center gap-1 rounded-lg border border-stone-200/60 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-700 active:scale-95"
                  title="Xem món trong mục"
                >
                  <Icon
                    icon="zi-more-grid"
                    className="shrink-0 text-xs text-stone-500"
                  />
                  <span>Món</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingCategory(cat)}
                  className="flex items-center justify-center rounded-lg border border-red-100 bg-red-50 p-1.5 text-red-600 active:scale-95"
                  title="Xoá danh mục"
                >
                  <Icon icon="zi-delete" className="text-sm" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sheet Form Create/Edit */}
      <Sheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        mask
        handler
        swipeToClose
        title={editingCategory ? "Sửa Danh Mục" : "Thêm Danh Mục Mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-3 p-4 pb-8">
          <div>
            <label className="text-xs font-semibold text-stone-700">
              Tên danh mục *
            </label>
            <input
              type="text"
              placeholder="VD: Cơm tấm, Bún mắm, Trà & Nước..."
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả hấp dẫn về các món trong nhóm..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Link ảnh đại diện (URL)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formImageUrl}
              onChange={(e) => setFormImageUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Thứ tự ưu tiên
              </label>
              <input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Trạng thái
              </label>
              <select
                value={formStatus}
                onChange={(e) =>
                  setFormStatus(e.target.value as "ACTIVE" | "INACTIVE")
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="ACTIVE">Hiển thị</option>
                <option value="INACTIVE">Tạm ẩn</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
              className="w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
            >
              {createCategory.isPending || updateCategory.isPending
                ? "Đang lưu..."
                : "Lưu danh mục"}
            </button>
          </div>
        </form>
      </Sheet>

      {/* Modal xác nhận xoá danh mục */}
      <ConfirmModal
        visible={!!deletingCategory}
        title="Xoá danh mục?"
        description={
          <span>
            Bạn có chắc muốn xoá danh mục{" "}
            <strong>"{deletingCategory?.name}"</strong>? Các món ăn trong danh
            mục có thể bị ảnh hưởng.
          </span>
        }
        confirmText="Xoá danh mục"
        cancelText="Giữ lại"
        type="danger"
        loading={deleteCategory.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCategory(null)}
      />
    </div>
  );
}
