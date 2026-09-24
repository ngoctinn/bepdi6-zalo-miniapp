import React, { useState } from "react";
import { useAdminVouchers } from "@/services/admin/admin.queries";
import {
  useCreateVoucher,
  useUpdateVoucher,
  useDeleteVoucher,
} from "@/services/admin/admin.mutations";
import { AdminVoucher } from "@/types/admin.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { Sheet, Spinner } from "zmp-ui";

export default function AdminVoucherManagementPage() {
  const { showToast } = useAppToast();
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
    setFormStartAt(now.toISOString().split("T")[0]);
    setFormEndAt(oneMonthLater.toISOString().split("T")[0]);
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
    setFormStartAt(v.start_at ? v.start_at.split("T")[0] : "");
    setFormEndAt(v.end_at ? v.end_at.split("T")[0] : "");
    setFormStatus(v.status || "ACTIVE");
    setSheetVisible(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showToast({ message: "Vui lòng nhập mã voucher", type: "error" });
      return;
    }
    if (!formName.trim()) {
      showToast({
        message: "Vui lòng nhập tên chương trình voucher",
        type: "error",
      });
      return;
    }
    if (formDiscountValue <= 0) {
      showToast({ message: "Giá trị giảm phải lớn hơn 0", type: "error" });
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
          ? `${formStartAt}T00:00:00Z`
          : new Date().toISOString(),
        end_at: formEndAt ? `${formEndAt}T23:59:59Z` : new Date().toISOString(),
        status: formStatus,
      };

      if (editingVoucher) {
        await updateVoucher.mutateAsync({
          id: editingVoucher.id,
          data: payload,
        });
        showToast({ message: "Cập nhật voucher thành công", type: "success" });
      } else {
        await createVoucher.mutateAsync(payload);
        showToast({ message: "Tạo voucher mới thành công", type: "success" });
      }
      setSheetVisible(false);
    } catch {
      showToast({
        message: "Lỗi lưu voucher, vui lòng thử lại",
        type: "error",
      });
    }
  };

  const handleDelete = async (v: AdminVoucher) => {
    if (!window.confirm(`Bạn có chắc muốn xoá voucher "${v.code}"?`)) return;
    try {
      await deleteVoucher.mutateAsync(v.id);
      showToast({ message: "Đã xoá voucher", type: "success" });
    } catch {
      showToast({ message: "Không thể xoá voucher này", type: "error" });
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24">
      {/* Top Header */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">
              Quản Lý Voucher
            </h1>
            <p className="mt-0.5 text-xs text-stone-500">
              Tạo và phát hành mã giảm giá cho khách đặt hàng
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            <span>+ Tạo mã</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mt-3 flex gap-2">
          {["ALL", "ACTIVE", "INACTIVE"].map((st) => (
            <button
              type="button"
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                filterStatus === st
                  ? "bg-primary text-white"
                  : "bg-stone-100 text-stone-600"
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
        ) : vouchers.length === 0 ? (
          <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-stone-400">
            <span className="text-3xl">🎟️</span>
            <p className="mt-2 text-sm">Chưa có mã giảm giá nào</p>
            <button
              onClick={handleOpenCreate}
              className="bg-primary/10 mt-3 inline-block rounded-xl px-4 py-2 text-xs font-bold text-primary"
            >
              + Tạo voucher đầu tiên
            </button>
          </div>
        ) : (
          vouchers.map((v) => {
            const isActive = v.status === "ACTIVE";
            const isPercent = v.discount_type === "PERCENTAGE";
            return (
              <div
                key={v.id}
                onClick={() => handleOpenEdit(v)}
                className="relative cursor-pointer overflow-hidden rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all active:scale-[0.99]"
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
                      <span className="border-primary/20 bg-primary/10 rounded-lg border px-2 py-0.5 font-mono text-sm font-extrabold uppercase tracking-wider text-primary">
                        {v.code}
                      </span>
                      <span
                        className={`py-0.2 rounded-full px-2 text-[10px] font-bold ${
                          isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-stone-100 text-stone-400"
                        }`}
                      >
                        {isActive ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-stone-900">
                      {v.name}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(v);
                    }}
                    className="p-1 text-stone-400 hover:text-red-500 active:scale-95"
                    title="Xoá voucher"
                  >
                    🗑️
                  </button>
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-base font-extrabold text-primary">
                    {isPercent
                      ? `Giảm ${v.discount_value}%`
                      : `Giảm ${Number(v.discount_value).toLocaleString("vi-VN")}₫`}
                  </span>
                  {v.minimum_order_value &&
                  Number(v.minimum_order_value) > 0 ? (
                    <span className="text-xs text-stone-500">
                      • Đơn từ{" "}
                      {Number(v.minimum_order_value).toLocaleString("vi-VN")}₫
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 text-[11px] text-stone-400">
                  <span>
                    Giới hạn:{" "}
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
        swipeToClose
        title={editingVoucher ? "Chỉnh Sửa Voucher" : "Tạo Mã Voucher Mới"}
      >
        <form onSubmit={handleSubmit} className="space-y-3 p-4 pb-8">
          <div>
            <label className="text-xs font-semibold text-stone-700">
              Mã voucher (Code) *
            </label>
            <input
              type="text"
              placeholder="VD: BEPDI6, CHAOBANMOI, GIAM20K..."
              value={formCode}
              onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm uppercase focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Tên chiến dịch *
            </label>
            <input
              type="text"
              placeholder="VD: Giảm 20K đơn đầu tiên"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Hình thức giảm *
              </label>
              <select
                value={formDiscountType}
                onChange={(e) =>
                  setFormDiscountType(e.target.value as "FIXED" | "PERCENTAGE")
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="FIXED">Giảm tiền trực tiếp (₫)</option>
                <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">
                {formDiscountType === "PERCENTAGE"
                  ? "Mức giảm (%) *"
                  : "Số tiền giảm (₫) *"}
              </label>
              <input
                type="number"
                value={formDiscountValue}
                onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Đơn tối thiểu (₫)
              </label>
              <input
                type="number"
                step="1000"
                value={formMinOrder}
                onChange={(e) => setFormMinOrder(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            {formDiscountType === "PERCENTAGE" && (
              <div>
                <label className="text-xs font-semibold text-stone-700">
                  Giảm tối đa (₫)
                </label>
                <input
                  type="number"
                  step="1000"
                  placeholder="Không giới hạn"
                  value={formMaxDiscount || ""}
                  onChange={(e) =>
                    setFormMaxDiscount(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Tổng lượt dùng (0 = vô hạn)
              </label>
              <input
                type="number"
                value={formUsageLimit}
                onChange={(e) => setFormUsageLimit(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Lượt dùng / Mỗi khách
              </label>
              <input
                type="number"
                value={formUsagePerCustomer}
                onChange={(e) =>
                  setFormUsagePerCustomer(Number(e.target.value))
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Ngày bắt đầu
              </label>
              <input
                type="date"
                value={formStartAt}
                onChange={(e) => setFormStartAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-700">
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={formEndAt}
                onChange={(e) => setFormEndAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700">
              Trạng thái phát hành
            </label>
            <select
              value={formStatus}
              onChange={(e) =>
                setFormStatus(e.target.value as "ACTIVE" | "INACTIVE")
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="ACTIVE">Kích hoạt áp dụng ngay (ACTIVE)</option>
              <option value="INACTIVE">Tạm dừng áp dụng (INACTIVE)</option>
            </select>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={createVoucher.isPending || updateVoucher.isPending}
              className="w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-white shadow-md active:scale-95 disabled:opacity-50"
            >
              {createVoucher.isPending || updateVoucher.isPending
                ? "Đang lưu..."
                : "Lưu voucher"}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
