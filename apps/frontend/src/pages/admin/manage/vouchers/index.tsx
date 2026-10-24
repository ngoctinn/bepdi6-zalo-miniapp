import React, { useState } from "react";
import { useAdminVouchers } from "@/services/admin/admin.queries";
import {
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
} from "@/services/admin/admin.mutations";
import { AdminVoucher } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { Icon, Sheet, Spinner } from "zmp-ui";
import { ConfirmModal } from "@/components/common/confirm-modal";

import React, { useState } from "react";
import { useAdminVouchers } from "@/services/admin/admin.queries";
import {
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
} from "@/services/admin/admin.mutations";
import { AdminVoucher } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { Icon, Sheet, Spinner } from "zmp-ui";
import { ConfirmModal } from "@/components/common/confirm-modal";

const formatLocalDateInput = (dateInput?: Date | string): string => {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  // Format YYYY-MM-DD in Asia/Ho_Chi_Minh local timezone
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function AdminVoucherManagementPage() {
  const { showSuccess, showError } = useAppToast();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { data: vouchersData, isLoading } = useAdminVouchers(
    filterStatus === "ALL" ? undefined : filterStatus,
  );

  const createVoucher = useCreateVoucher();
  const updateVoucher = useUpdateVoucher();
  const deleteVoucher = useDeleteVoucher();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<AdminVoucher | null>(
    null,
  );
  const [deletingVoucher, setDeletingVoucher] = useState<AdminVoucher | null>(
    null,
  );

  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDiscountType, setFormDiscountType] = useState<
    "FIXED" | "PERCENTAGE"
  >("FIXED");
  const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
  const [formMinOrder, setFormMinOrder] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | undefined>(
    undefined,
  );
  const [formUsageLimit, setFormUsageLimit] = useState<number>(100);
  const [formUsagePerCustomer, setFormUsagePerCustomer] = useState<number>(1);
  const [formStartAt, setFormStartAt] = useState("");
  const [formEndAt, setFormEndAt] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const vouchers = Array.isArray(vouchersData) ? vouchersData : [];

  const filteredVouchers = vouchers.filter((v) =>
    filterStatus === "ALL" ? true : v.status === filterStatus,
  );

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setFormCode("");
    setFormName("");
    setFormDiscountType("FIXED");
    setFormDiscountValue(10000);
    setFormMinOrder(50000);
    setFormMaxDiscount(undefined);
    setFormUsageLimit(100);
    setFormUsagePerCustomer(1);
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(now.getMonth() + 1);
    setFormStartAt(formatLocalDateInput(now));
    setFormEndAt(formatLocalDateInput(oneMonthLater));
    setFormStatus("ACTIVE");
    setSheetVisible(true);
  };

  const handleOpenEdit = (v: AdminVoucher) => {
    setEditingVoucher(v);
    setFormCode(v.code);
    setFormName(v.name);
    setFormDiscountType(v.discount_type);
    setFormDiscountValue(Number(v.discount_value));
    setFormMinOrder(Number(v.minimum_order_value || 0));
    setFormMaxDiscount(
      v.maximum_discount ? Number(v.maximum_discount) : undefined,
    );
    setFormUsageLimit(v.usage_limit ?? 100);
    setFormUsagePerCustomer(v.usage_per_customer ?? 1);
    setFormStartAt(formatLocalDateInput(v.start_at));
    setFormEndAt(formatLocalDateInput(v.end_at));
    setFormStatus(v.status || "ACTIVE");
    setSheetVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showError("Vui lòng nhập mã voucher");
      return;
    }
    if (!formName.trim()) {
      showError("Vui lòng nhập tên chương trình voucher");
      return;
    }
    if (formDiscountValue <= 0) {
      showError("Giá trị giảm phải lớn hơn 0");
      return;
    }
    if (formDiscountType === "PERCENTAGE" && formDiscountValue > 100) {
      showError("Mức giảm phần trăm không được vượt quá 100%");
      return;
    }
    if (formStartAt && formEndAt && formEndAt < formStartAt) {
      showError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");
      return;
    }

    try {
      const payload = {
        code: formCode.trim().toUpperCase(),
        name: formName.trim(),
        discount_type: formDiscountType,
        discount_value: Number(formDiscountValue),
        minimum_order_value: Number(formMinOrder),
        maximum_discount:
          formDiscountType === "PERCENTAGE" && formMaxDiscount
            ? Number(formMaxDiscount)
            : null,
        usage_limit: Number(formUsageLimit),
        usage_per_customer: Number(formUsagePerCustomer),
        start_at: formStartAt
          ? `${formStartAt}T00:00:00+07:00`
          : new Date().toISOString(),
        end_at: formEndAt
          ? `${formEndAt}T23:59:59+07:00`
          : new Date().toISOString(),
        status: formStatus,
      };

      if (editingVoucher) {
        await updateVoucher.mutateAsync({
          id: editingVoucher.id,
          data: payload,
        });
        showSuccess("Cập nhật voucher thành công");
      } else {
        await createVoucher.mutateAsync(payload);
        showSuccess("Tạo voucher mới thành công");
      }
      setSheetVisible(false);
    } catch {
      showError("Lỗi lưu voucher, vui lòng thử lại");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingVoucher) return;
    try {
      await deleteVoucher.mutateAsync(deletingVoucher.id);
      showSuccess("Đã xoá voucher");
      setDeletingVoucher(null);
    } catch {
      showError("Không thể xoá voucher này");
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24 font-sans">
      {/* Action Toolbar */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
            {filteredVouchers.length} / {vouchers.length} mã
          </span>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <Icon icon="zi-plus" className="shrink-0 text-base" />
            <span>Tạo mã</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-2.5 flex gap-2">
          {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`min-h-[36px] rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
                filterStatus === st
                  ? "bg-primary text-white shadow-sm"
                  : "bg-stone-100 text-stone-700"
              }`}
            >
              {st === "ALL"
                ? "Tất cả"
                : st === "ACTIVE"
                  ? "Đang áp dụng"
                  : "Đã tạm dừng"}
            </button>
          ))}
        </div>
      </div>

      {/* Voucher Cards List */}
      <div className="space-y-3 p-4">
        {isLoading ? (
          <div className="flex h-48 w-full items-center justify-center">
            <Spinner logo />
          </div>
        ) : filteredVouchers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-500">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
              <Icon icon="zi-inbox" className="shrink-0 text-2xl" />
            </div>
            <p className="mt-2 text-sm font-medium text-stone-700">
              {vouchers.length === 0
                ? "Chưa có mã giảm giá nào"
                : "Không có mã nào phù hợp bộ lọc"}
            </p>
            {vouchers.length === 0 && (
              <button
                onClick={handleOpenCreate}
                className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-4 text-xs font-bold text-primary active:scale-95"
              >
                <Icon icon="zi-plus" className="shrink-0 text-xs" />
                <span>Tạo voucher đầu tiên</span>
              </button>
            )}
          </div>
        ) : (
          filteredVouchers.map((v) => {
            const isPercent = v.discount_type === "PERCENTAGE";
            const isExpired = Boolean(
              v.end_at && new Date(v.end_at) < new Date(),
            );
            const isActive = v.status === "ACTIVE" && !isExpired;

            return (
              <div
                key={v.id}
                onClick={() => handleOpenEdit(v)}
                className="relative cursor-pointer overflow-hidden rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm transition-all active:scale-[0.99]"
              >
                {/* Dải trang trí cạnh trái kiểu coupon */}
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1.5 ${
                    isActive ? "bg-primary" : "bg-stone-300"
                  }`}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-extrabold uppercase tracking-wider text-primary">
                        {v.code}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          isExpired
                            ? "bg-red-50 text-red-600"
                            : isActive
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <span
                          className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${
                            isExpired
                              ? "bg-red-500"
                              : isActive
                                ? "bg-emerald-500"
                                : "bg-stone-400"
                          }`}
                        />
                        {isExpired
                          ? "Đã hết hạn"
                          : isActive
                            ? "Hoạt động"
                            : "Tạm dừng"}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-bold text-stone-900">
                      {v.name}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingVoucher(v);
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-500 active:scale-95"
                    title="Xoá voucher"
                  >
                    <Icon icon="zi-delete" className="shrink-0 text-base" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-primary">
                    {isPercent
                      ? `Giảm ${v.discount_value}%`
                      : `Giảm ${Number(v.discount_value).toLocaleString("vi-VN")}₫`}
                  </span>
                  {v.minimum_order_value &&
                  Number(v.minimum_order_value) > 0 ? (
                    <span className="text-xs text-stone-600">
                      • Đơn từ{" "}
                      {Number(v.minimum_order_value).toLocaleString("vi-VN")}₫
                    </span>
                  ) : null}
                </div>

                <div className="mt-2.5 flex items-center justify-between border-t border-stone-100 pt-2 text-xs text-stone-500">
                  <span>
                    Đã dùng: {v.used_count ?? 0} /{" "}
                    {v.usage_limit === 0 ? "Vô hạn" : `${v.usage_limit} lượt`}
                  </span>
                  <span>
                    HSD:{" "}
                    {v.end_at
                      ? new Date(v.end_at).toLocaleDateString("vi-VN")
                      : "Không thời hạn"}
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
        title={editingVoucher ? "Chỉnh Sửa Voucher" : "Tạo Mã Voucher Mới"}
      >
        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] space-y-4 overflow-y-auto p-4 pb-12"
        >
          <div>
            <label
              htmlFor="voucher-code-input"
              className="text-xs font-semibold text-stone-700"
            >
              Mã voucher (Code) *
            </label>
            <input
              id="voucher-code-input"
              type="text"
              placeholder="VD: BEPDI6, CHAOBANMOI, GIAM20K..."
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 font-mono text-base uppercase text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="voucher-name-input"
              className="text-xs font-semibold text-stone-700"
            >
              Tên chiến dịch *
            </label>
            <input
              id="voucher-name-input"
              type="text"
              placeholder="VD: Giảm 20K đơn đầu tiên"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="voucher-discount-type"
                className="text-xs font-semibold text-stone-700"
              >
                Hình thức giảm *
              </label>
              <select
                id="voucher-discount-type"
                value={formDiscountType}
                onChange={(e) => {
                  const newType = e.target.value as "FIXED" | "PERCENTAGE";
                  setFormDiscountType(newType);
                  if (newType === "PERCENTAGE" && formDiscountValue > 100) {
                    setFormDiscountValue(10);
                  }
                }}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              >
                <option value="FIXED">Giảm tiền trực tiếp (₫)</option>
                <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="voucher-discount-val"
                className="text-xs font-semibold text-stone-700"
              >
                {formDiscountType === "PERCENTAGE"
                  ? "Mức giảm (%) *"
                  : "Số tiền giảm (₫) *"}
              </label>
              <input
                id="voucher-discount-val"
                type="number"
                min="1"
                max={formDiscountType === "PERCENTAGE" ? 100 : undefined}
                value={formDiscountValue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (formDiscountType === "PERCENTAGE") {
                    setFormDiscountValue(Math.min(val, 100));
                  } else {
                    setFormDiscountValue(val);
                  }
                }}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              />
            </div>
          </div>

          <div
            className={`grid gap-3 ${
              formDiscountType === "PERCENTAGE" ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            <div>
              <label
                htmlFor="voucher-min-order"
                className="text-xs font-semibold text-stone-700"
              >
                Đơn tối thiểu (₫)
              </label>
              <input
                id="voucher-min-order"
                type="number"
                step="1000"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
            {formDiscountType === "PERCENTAGE" && (
              <div>
                <label
                  htmlFor="voucher-max-discount"
                  className="text-xs font-semibold text-stone-700"
                >
                  Giảm tối đa (₫)
                </label>
                <input
                  id="voucher-max-discount"
                  type="number"
                  step="1000"
                  placeholder="Không giới hạn"
                  value={formMaxDiscount || ""}
                  onChange={(e) =>
                    setFormMaxDiscount(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="voucher-limit-input"
                className="text-xs font-semibold text-stone-700"
              >
                Tổng lượt (0 = vô hạn)
              </label>
              <input
                id="voucher-limit-input"
                type="number"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="voucher-cust-limit"
                className="text-xs font-semibold text-stone-700"
              >
                Lượt / Mỗi khách
              </label>
              <input
                id="voucher-cust-limit"
                type="number"
                value={formUsagePerCustomer}
                onChange={(e) =>
                  setFormUsagePerCustomer(Number(e.target.value))
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="voucher-start-at"
                className="text-xs font-semibold text-stone-700"
              >
                Ngày bắt đầu
              </label>
              <input
                id="voucher-start-at"
                type="date"
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="voucher-end-at"
                className="text-xs font-semibold text-stone-700"
              >
                Ngày kết thúc
              </label>
              <input
                id="voucher-end-at"
                type="date"
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="voucher-status-select"
              className="text-xs font-semibold text-stone-700"
            >
              Trạng thái phát hành
            </label>
            <select
              id="voucher-status-select"
              value={formStatus}
              onChange={(e) =>
                setFormStatus(e.target.value as "ACTIVE" | "INACTIVE")
              }
              className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
            >
              <option value="ACTIVE">Kích hoạt áp dụng ngay (ACTIVE)</option>
              <option value="INACTIVE">Tạm dừng áp dụng (INACTIVE)</option>
            </select>
          </div>

          <div className="flex gap-2.5 pt-3">
            <button
              type="button"
              onClick={() => setSheetVisible(false)}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-700 shadow-sm active:scale-95"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={createVoucher.isPending || updateVoucher.isPending}
              className="flex h-11 flex-[2] items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
            >
              {createVoucher.isPending || updateVoucher.isPending
                ? "Đang lưu..."
                : "Lưu voucher"}
            </button>
          </div>
        </form>
      </Sheet>

      {/* Modal xác nhận xoá voucher */}
      <ConfirmModal
        visible={!!deletingVoucher}
        title="Xoá voucher?"
        description={
          <span>
            Bạn có chắc muốn xoá mã voucher{" "}
            <strong>"{deletingVoucher?.code}"</strong>? Khách hàng sẽ không thể
            áp dụng mã này được nữa.
          </span>
        }
        confirmText="Xoá voucher"
        cancelText="Giữ lại"
        type="danger"
        loading={deleteVoucher.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingVoucher(null)}
      />
    </div>
  );
}
