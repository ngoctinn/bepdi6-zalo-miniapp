import React, { useState, useEffect } from "react";
import { useAdminShopConfig } from "@/services/admin/admin.queries";
import { useUpdateShopConfig } from "@/services/admin/admin.mutations";
import { useAppToast } from "@/hooks/use-app-toast";
import { Spinner, Input, Switch } from "zmp-ui";

export default function AdminSettingsPage() {
  const { showToast } = useAppToast();
  const { data: config, isLoading } = useAdminShopConfig();
  const updateConfig = useUpdateShopConfig();

  const [formData, setFormData] = useState({
    shop_name: "",
    hotline: "",
    address_text: "",
    announcement_banner: "",
    is_open: true,
    open_time: "",
    close_time: "",
    prep_time_minutes: 20,
    max_delivery_radius_km: 7,
    min_order_amount: 0,
    min_order_for_freeship: 0,
    vietqr_bank_id: "MB",
    vietqr_account_no: "",
    vietqr_account_name: "",
  });

  useEffect(() => {
    if (config) {
      setFormData({
        shop_name: config.shop_name || "Bếp Dì 6",
        hotline: config.hotline || "",
        address_text: config.address_text || "",
        announcement_banner: config.announcement_banner || "",
        is_open: Boolean(config.is_open),
        open_time: config.open_time || "08:00",
        close_time: config.close_time || "22:00",
        prep_time_minutes: Number(config.prep_time_minutes || 20),
        max_delivery_radius_km: Number(config.max_delivery_radius_km || 7),
        min_order_amount: Number(config.min_order_amount || 0),
        min_order_for_freeship: Number(config.min_order_for_freeship || 0),
        vietqr_bank_id: config.vietqr_bank_id || "MB",
        vietqr_account_no: config.vietqr_account_no || "",
        vietqr_account_name: config.vietqr_account_name || "BEP DI 6",
      });
    }
  }, [config]);

  const handleToggleIsOpen = async (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_open: checked }));
    try {
      await updateConfig.mutateAsync({ is_open: checked });
      showToast({
        message: checked ? "Đã mở cửa nhận đơn" : "Đã tạm đóng cửa quán",
        type: "success",
      });
    } catch {
      showToast({
        message: "Không thể cập nhật trạng thái mở cửa",
        type: "error",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig.mutateAsync({
        shop_name: formData.shop_name,
        hotline: formData.hotline,
        address_text: formData.address_text,
        announcement_banner: formData.announcement_banner,
        open_time: formData.open_time,
        close_time: formData.close_time,
        prep_time_minutes: Number(formData.prep_time_minutes),
        max_delivery_radius_km: Number(formData.max_delivery_radius_km),
        min_order_amount: Number(formData.min_order_amount),
        min_order_for_freeship: Number(formData.min_order_for_freeship),
        vietqr_bank_id: formData.vietqr_bank_id,
        vietqr_account_no: formData.vietqr_account_no,
        vietqr_account_name: formData.vietqr_account_name,
      });
      showToast({ message: "Lưu cấu hình quán thành công!", type: "success" });
    } catch {
      showToast({
        message: "Lưu cấu hình thất bại, vui lòng thử lại",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Spinner logo />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-stone-50 pb-24">
      {/* Top Banner */}
      <div className="border-b border-stone-200/70 bg-white px-4 py-4">
        <h1 className="text-lg font-bold text-stone-900">
          Cài Đặt Vận Hành Quán
        </h1>
        <p className="mt-0.5 text-xs text-stone-500">
          Cấu hình giờ đóng/mở cửa, phạm vi giao hàng, phí ship và thông tin
          VietQR
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 p-4">
        {/* Toggle Trạng Thái Mở Cửa */}
        <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <div>
            <div className="text-sm font-bold text-stone-900">
              Trạng thái nhận đơn
            </div>
            <div className="text-xs text-stone-500">
              {formData.is_open
                ? "🟢 Đang mở cửa đón khách"
                : "🔴 Tạm ngưng nhận đơn mới"}
            </div>
          </div>
          <Switch
            checked={formData.is_open}
            onChange={(e) => handleToggleIsOpen(e.target.checked)}
          />
        </div>

        {/* Thông Tin Cơ Bản */}
        <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Thông tin cửa hàng
          </h2>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Tên quán
            </label>
            <input
              type="text"
              value={formData.shop_name}
              onChange={(e) =>
                setFormData({ ...formData, shop_name: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Hotline quán
            </label>
            <input
              type="tel"
              value={formData.hotline}
              onChange={(e) =>
                setFormData({ ...formData, hotline: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Địa chỉ quán
            </label>
            <textarea
              rows={2}
              value={formData.address_text}
              onChange={(e) =>
                setFormData({ ...formData, address_text: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Thông báo banner nổi bật (nếu có)
            </label>
            <input
              type="text"
              placeholder="VD: Quán khuyến mãi trà tắc cho mọi đơn hôm nay!"
              value={formData.announcement_banner}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  announcement_banner: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Giờ Mở Cửa & Chuẩn Bị */}
        <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Thời gian hoạt động
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-700">
                Giờ mở cửa
              </label>
              <input
                type="text"
                placeholder="08:00"
                value={formData.open_time}
                onChange={(e) =>
                  setFormData({ ...formData, open_time: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-700">
                Giờ đóng cửa
              </label>
              <input
                type="text"
                placeholder="22:00"
                value={formData.close_time}
                onChange={(e) =>
                  setFormData({ ...formData, close_time: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Thời gian chuẩn bị món (phút)
            </label>
            <input
              type="number"
              value={formData.prep_time_minutes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prep_time_minutes: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Giao Hàng & Bán Kính */}
        <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Giao hàng & Phí ship
          </h2>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Bán kính giao tối đa (km)
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.max_delivery_radius_km}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_delivery_radius_km: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-stone-700">
                Đơn tối thiểu (₫)
              </label>
              <input
                type="number"
                step="1000"
                value={formData.min_order_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_order_amount: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-stone-700">
                Freeship từ (₫)
              </label>
              <input
                type="number"
                step="1000"
                value={formData.min_order_for_freeship}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_order_for_freeship: Number(e.target.value),
                  })
                }
                className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Thanh Toán & VietQR */}
        <div className="space-y-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Tài khoản nhận tiền VietQR
          </h2>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Ngân hàng (Bank ID)
            </label>
            <input
              type="text"
              placeholder="VD: MB, VCB, TCB, ACB..."
              value={formData.vietqr_bank_id}
              onChange={(e) =>
                setFormData({ ...formData, vietqr_bank_id: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Số tài khoản nhận
            </label>
            <input
              type="text"
              value={formData.vietqr_account_no}
              onChange={(e) =>
                setFormData({ ...formData, vietqr_account_no: e.target.value })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-700">
              Tên chủ tài khoản
            </label>
            <input
              type="text"
              value={formData.vietqr_account_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vietqr_account_name: e.target.value,
                })
              }
              className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Nút Submit Lưu */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={updateConfig.isPending}
            className="w-full rounded-xl bg-primary py-3.5 text-center text-sm font-bold text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {updateConfig.isPending ? "Đang lưu..." : "Lưu thay đổi cấu hình"}
          </button>
        </div>
      </form>
    </div>
  );
}
