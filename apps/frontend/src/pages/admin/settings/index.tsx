import React, { useState, useEffect, useMemo } from "react";
import { useAdminShopConfig } from "@/services/admin/admin.queries";
import { useUpdateShopConfig } from "@/services/admin/admin.mutations";
import { useAppToast } from "@/hooks/use-app-toast";
import { useAuth } from "@/hooks/use-auth";
import { Icon, Spinner, Switch } from "zmp-ui";
import { ShippingTier } from "@/types/shop.types";

const NAPAS_BANKS = [
  { code: "MB", name: "MB Bank (Quân Đội)" },
  { code: "VCB", name: "Vietcombank" },
  { code: "TCB", name: "Techcombank" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "ICB", name: "VietinBank" },
  { code: "BIDV", name: "BIDV" },
  { code: "VPB", name: "VPBank" },
  { code: "TPB", name: "TPBank" },
  { code: "STB", name: "Sacombank" },
  { code: "VIB", name: "VIB" },
  { code: "SHB", name: "SHB" },
  { code: "HDB", name: "HDBank" },
  { code: "VBA", name: "Agribank" },
  { code: "OCB", name: "OCB" },
  { code: "MSB", name: "MSB" },
  { code: "EIB", name: "Eximbank" },
];

export default function AdminSettingsPage() {
  const { showSuccess, showError } = useAppToast();
  const { customer } = useAuth();
  const isAdmin = customer?.role === "ADMIN";

  const { data: config, isLoading } = useAdminShopConfig();
  const updateConfig = useUpdateShopConfig();

  const [formData, setFormData] = useState({
    shop_name: "",
    hotline: "",
    address_text: "",
    announcement_banner: "",
    latitude: 10.7769,
    longitude: 106.7009,
    haversine_multiplier: 1.3,
    is_open: true,
    open_time: "",
    close_time: "",
    prep_time_minutes: 20,
    max_delivery_radius_km: 7,
    min_order_amount: 0,
    min_order_for_freeship: 0,
    shipping_tiers: [] as ShippingTier[],
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
        latitude: Number(config.latitude || 10.7769),
        longitude: Number(config.longitude || 106.7009),
        haversine_multiplier: Number(config.haversine_multiplier || 1.3),
        is_open: Boolean(config.is_open),
        open_time: config.open_time || "08:00",
        close_time: config.close_time || "22:00",
        prep_time_minutes: Number(config.prep_time_minutes || 20),
        max_delivery_radius_km: Number(config.max_delivery_radius_km || 7),
        min_order_amount: Number(config.min_order_amount || 0),
        min_order_for_freeship: Number(config.min_order_for_freeship || 0),
        shipping_tiers:
          Array.isArray(config.shipping_tiers) &&
          config.shipping_tiers.length > 0
            ? config.shipping_tiers
            : [
                { from_km: 0, to_km: 2, fee: 15000 },
                { from_km: 2, to_km: 5, fee: 25000 },
                { from_km: 5, to_km: 10, fee: 35000 },
              ],
        vietqr_bank_id: config.vietqr_bank_id || "MB",
        vietqr_account_no: config.vietqr_account_no || "",
        vietqr_account_name: config.vietqr_account_name || "BEP DI 6",
      });
    }
  }, [config]);

  const isDirty = useMemo(() => {
    if (!config) return false;
    return (
      formData.shop_name !== (config.shop_name || "Bếp Dì 6") ||
      formData.hotline !== (config.hotline || "") ||
      formData.address_text !== (config.address_text || "") ||
      formData.announcement_banner !== (config.announcement_banner || "") ||
      formData.latitude !== Number(config.latitude || 10.7769) ||
      formData.longitude !== Number(config.longitude || 106.7009) ||
      formData.haversine_multiplier !==
        Number(config.haversine_multiplier || 1.3) ||
      formData.open_time !== (config.open_time || "08:00") ||
      formData.close_time !== (config.close_time || "22:00") ||
      formData.prep_time_minutes !== Number(config.prep_time_minutes || 20) ||
      formData.max_delivery_radius_km !==
        Number(config.max_delivery_radius_km || 7) ||
      formData.min_order_amount !== Number(config.min_order_amount || 0) ||
      formData.min_order_for_freeship !==
        Number(config.min_order_for_freeship || 0) ||
      formData.vietqr_bank_id !== (config.vietqr_bank_id || "MB") ||
      formData.vietqr_account_no !== (config.vietqr_account_no || "") ||
      formData.vietqr_account_name !==
        (config.vietqr_account_name || "BEP DI 6") ||
      JSON.stringify(formData.shipping_tiers) !==
        JSON.stringify(config.shipping_tiers || [])
    );
  }, [formData, config]);

  const handleToggleIsOpen = async (checked: boolean) => {
    const prevOpen = formData.is_open;
    setFormData((prev) => ({ ...prev, is_open: checked }));
    try {
      await updateConfig.mutateAsync({ is_open: checked });
      showSuccess(checked ? "Đã mở cửa nhận đơn" : "Đã tạm đóng cửa quán");
    } catch {
      setFormData((prev) => ({ ...prev, is_open: prevOpen }));
      showError("Không thể cập nhật trạng thái mở cửa, đã khôi phục lại");
    }
  };

  const handleUpdateShippingTier = (
    index: number,
    field: keyof ShippingTier,
    value: number,
  ) => {
    setFormData((prev) => {
      const tiers = [...prev.shipping_tiers];
      tiers[index] = { ...tiers[index], [field]: value };
      // Ensure continuous range if to_km changes
      if (field === "to_km" && index + 1 < tiers.length) {
        tiers[index + 1] = { ...tiers[index + 1], from_km: value };
      }
      return { ...prev, shipping_tiers: tiers };
    });
  };

  const handleAddShippingTier = () => {
    setFormData((prev) => {
      const tiers = [...prev.shipping_tiers];
      const lastTier = tiers[tiers.length - 1];
      const newFrom = lastTier ? lastTier.to_km : 0;
      tiers.push({
        from_km: newFrom,
        to_km: newFrom + 3,
        fee: (lastTier ? lastTier.fee : 15000) + 10000,
      });
      return { ...prev, shipping_tiers: tiers };
    });
  };

  const handleRemoveShippingTier = (index: number) => {
    setFormData((prev) => {
      if (prev.shipping_tiers.length <= 1) return prev;
      const tiers = prev.shipping_tiers.filter((_, idx) => idx !== index);
      // Re-normalize tiers
      if (tiers.length > 0) {
        tiers[0].from_km = 0;
        for (let i = 1; i < tiers.length; i++) {
          tiers[i].from_km = tiers[i - 1].to_km;
        }
      }
      return { ...prev, shipping_tiers: tiers };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfig.mutateAsync({
        shop_name: formData.shop_name,
        hotline: formData.hotline,
        address_text: formData.address_text,
        announcement_banner: formData.announcement_banner,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        haversine_multiplier: Number(formData.haversine_multiplier),
        is_open: formData.is_open,
        open_time: formData.open_time,
        close_time: formData.close_time,
        prep_time_minutes: Number(formData.prep_time_minutes),
        max_delivery_radius_km: Number(formData.max_delivery_radius_km),
        min_order_amount: Number(formData.min_order_amount),
        min_order_for_freeship: Number(formData.min_order_for_freeship),
        shipping_tiers: formData.shipping_tiers,
        vietqr_bank_id: formData.vietqr_bank_id,
        vietqr_account_no: formData.vietqr_account_no,
        vietqr_account_name: formData.vietqr_account_name.trim().toUpperCase(),
      });
      showSuccess("Lưu cấu hình quán thành công!");
    } catch {
      showError("Lưu cấu hình thất bại, vui lòng kiểm tra lại");
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
    <div className="flex min-h-full flex-col bg-stone-50 pb-24 font-sans">
      <form onSubmit={handleSave} className="space-y-4 p-4">
        {/* Toggle Trạng Thái Mở Cửa */}
        <div className="flex items-center justify-between rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
          <div>
            <div className="text-sm font-bold text-stone-900">
              Trạng thái nhận đơn
            </div>
            <div className="mt-0.5 flex items-center text-xs text-stone-600">
              <span
                className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                  formData.is_open ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <span>
                {formData.is_open
                  ? "Đang mở cửa đón khách"
                  : "Tạm ngưng nhận đơn mới"}
              </span>
            </div>
          </div>
          <Switch
            checked={formData.is_open}
            disabled={updateConfig.isPending}
            onChange={(e) => handleToggleIsOpen(e.target.checked)}
          />
        </div>

        <fieldset
          disabled={!isAdmin || updateConfig.isPending}
          className="space-y-4"
        >
          {/* Thông Tin Cơ Bản */}
          <div className="space-y-3.5 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold text-stone-600">
              Thông tin cửa hàng
            </h2>
            <div>
              <label
                htmlFor="settings-shop-name"
                className="text-xs font-semibold text-stone-700"
              >
                Tên quán *
              </label>
              <input
                id="settings-shop-name"
                type="text"
                value={formData.shop_name}
                onChange={(e) =>
                  setFormData({ ...formData, shop_name: e.target.value })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="settings-hotline"
                className="text-xs font-semibold text-stone-700"
              >
                Hotline quán *
              </label>
              <input
                id="settings-hotline"
                type="tel"
                value={formData.hotline}
                onChange={(e) =>
                  setFormData({ ...formData, hotline: e.target.value })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="settings-address"
                className="text-xs font-semibold text-stone-700"
              >
                Địa chỉ quán *
              </label>
              <textarea
                id="settings-address"
                rows={2}
                value={formData.address_text}
                onChange={(e) =>
                  setFormData({ ...formData, address_text: e.target.value })
                }
                className="mt-1 min-h-[56px] w-full rounded-xl border border-stone-200 bg-stone-50/50 p-3 text-base text-stone-900 focus:border-primary focus:outline-none md:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="settings-banner"
                className="text-xs font-semibold text-stone-700"
              >
                Thông báo banner nổi bật (nếu có)
              </label>
              <input
                id="settings-banner"
                type="text"
                placeholder="VD: Quán khuyến mãi trà tắc cho mọi đơn hôm nay!"
                value={formData.announcement_banner}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    announcement_banner: e.target.value,
                  })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
          </div>

          {/* Giờ Mở Cửa & Chuẩn Bị */}
          <div className="space-y-3.5 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold text-stone-600">
              Thời gian hoạt động
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="settings-open-time"
                  className="text-xs font-semibold text-stone-700"
                >
                  Giờ mở cửa
                </label>
                <input
                  id="settings-open-time"
                  type="time"
                  value={formData.open_time}
                  onChange={(e) =>
                    setFormData({ ...formData, open_time: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="settings-close-time"
                  className="text-xs font-semibold text-stone-700"
                >
                  Giờ đóng cửa
                </label>
                <input
                  id="settings-close-time"
                  type="time"
                  value={formData.close_time}
                  onChange={(e) =>
                    setFormData({ ...formData, close_time: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="settings-prep-time"
                className="text-xs font-semibold text-stone-700"
              >
                Thời gian chuẩn bị món (phút)
              </label>
              <input
                id="settings-prep-time"
                type="number"
                min="5"
                value={formData.prep_time_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    prep_time_minutes: Number(e.target.value),
                  })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
          </div>

          {/* Giao Hàng & Bán Kính */}
          <div className="space-y-3.5 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold text-stone-600">
              Giao hàng & Bán kính
            </h2>

            {/* Geolocation & Haversine Multiplier */}
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="settings-lat"
                    className="text-xs font-semibold text-stone-700"
                  >
                    Vĩ độ (Lat)
                  </label>
                  <input
                    id="settings-lat"
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude: Number(e.target.value),
                      })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-2.5 font-mono text-xs text-stone-900 focus:border-primary focus:outline-none md:h-10"
                  />
                </div>
                <div>
                  <label
                    htmlFor="settings-lng"
                    className="text-xs font-semibold text-stone-700"
                  >
                    Kinh độ (Lng)
                  </label>
                  <input
                    id="settings-lng"
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: Number(e.target.value),
                      })
                    }
                    className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-2.5 font-mono text-xs text-stone-900 focus:border-primary focus:outline-none md:h-10"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="settings-haversine"
                  className="flex items-center justify-between text-xs font-semibold text-stone-700"
                >
                  <span>Hệ số uốn lượn đường đi</span>
                  <span className="font-mono text-[11px] text-stone-400">
                    Mặc định 1.3
                  </span>
                </label>
                <input
                  id="settings-haversine"
                  type="number"
                  step="0.05"
                  min="1"
                  max="2"
                  value={formData.haversine_multiplier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      haversine_multiplier: Number(e.target.value),
                    })
                  }
                  title="Hệ số bù trừ đường cong thực tế so với đường chim bay (mặc định 1.3)"
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-2.5 font-mono text-xs text-stone-900 focus:border-primary focus:outline-none md:h-10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="settings-radius"
                className="text-xs font-semibold text-stone-700"
              >
                Bán kính giao tối đa (km)
              </label>
              <input
                id="settings-radius"
                type="number"
                step="0.5"
                min="1"
                value={formData.max_delivery_radius_km}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_delivery_radius_km: Number(e.target.value),
                  })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="settings-min-order"
                  className="text-xs font-semibold text-stone-700"
                >
                  Đơn tối thiểu (₫)
                </label>
                <input
                  id="settings-min-order"
                  type="number"
                  step="1000"
                  value={formData.min_order_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_order_amount: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="settings-freeship"
                  className="text-xs font-semibold text-stone-700"
                >
                  Freeship từ (₫)
                </label>
                <input
                  id="settings-freeship"
                  type="number"
                  step="1000"
                  value={formData.min_order_for_freeship}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      min_order_for_freeship: Number(e.target.value),
                    })
                  }
                  className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                />
              </div>
            </div>

            {/* Bảng Bậc Phí Giao Hàng (Shipping Tiers) */}
            <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Bảng bậc phí ship theo khoảng cách
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Khoảng cách liên tục từ 0km đến bán kính tối đa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddShippingTier}
                  className="flex h-8 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-xs font-bold text-primary active:scale-95"
                >
                  <Icon icon="zi-plus" className="shrink-0 text-xs" />
                  <span>Thêm bậc</span>
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {formData.shipping_tiers.map((tier, idx) => (
                  <div
                    key={idx}
                    className="shadow-xs flex flex-col gap-2 rounded-xl border border-stone-200/90 bg-stone-50/50 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-stone-700">
                        <span className="rounded border border-stone-200 bg-white px-1.5 py-0.5">
                          {tier.from_km} km
                        </span>
                        <span className="text-stone-400">→</span>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.5"
                            min={tier.from_km + 0.1}
                            value={tier.to_km}
                            onChange={(e) =>
                              handleUpdateShippingTier(
                                idx,
                                "to_km",
                                Number(e.target.value),
                              )
                            }
                            className="h-7 w-16 rounded border border-stone-200 bg-white px-1.5 text-center font-mono font-bold text-stone-800 focus:border-primary focus:outline-none"
                          />
                          <span className="ml-1 text-[11px] font-normal text-stone-500">
                            km
                          </span>
                        </div>
                      </div>
                      {formData.shipping_tiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveShippingTier(idx)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-stone-200 bg-white text-stone-400 hover:text-red-500 active:scale-95"
                          title="Xóa bậc cước này"
                          aria-label="Xóa bậc cước này"
                        >
                          <Icon icon="zi-close" className="shrink-0 text-xs" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-200/60 pt-2">
                      <span className="text-[11px] font-semibold text-stone-500">
                        Cước phí:
                      </span>
                      <div className="flex items-center">
                        <input
                          type="number"
                          step="1000"
                          value={tier.fee}
                          onChange={(e) =>
                            handleUpdateShippingTier(
                              idx,
                              "fee",
                              Number(e.target.value),
                            )
                          }
                          className="h-8 w-28 rounded border border-stone-200 bg-white px-2 text-right font-mono text-xs font-black text-primary focus:border-primary focus:outline-none"
                        />
                        <span className="ml-1 font-bold text-primary">₫</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Thanh Toán & VietQR */}
          <div className="space-y-3.5 rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold text-stone-600">
              Tài khoản nhận tiền VietQR
            </h2>
            <div>
              <label
                htmlFor="settings-bank-select"
                className="text-xs font-semibold text-stone-700"
              >
                Ngân hàng thụ hưởng (NAPAS) *
              </label>
              <select
                id="settings-bank-select"
                value={formData.vietqr_bank_id}
                onChange={(e) =>
                  setFormData({ ...formData, vietqr_bank_id: e.target.value })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 text-base text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              >
                {NAPAS_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="settings-acc-no"
                className="text-xs font-semibold text-stone-700"
              >
                Số tài khoản nhận *
              </label>
              <input
                id="settings-acc-no"
                type="text"
                value={formData.vietqr_account_no}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vietqr_account_no: e.target.value.replace(/\s+/g, ""),
                  })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 font-mono text-base font-bold text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="settings-acc-name"
                className="text-xs font-semibold text-stone-700"
              >
                Tên chủ tài khoản (In hoa không dấu) *
              </label>
              <input
                id="settings-acc-name"
                type="text"
                value={formData.vietqr_account_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vietqr_account_name: e.target.value.toUpperCase(),
                  })
                }
                className="mt-1 h-11 w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 font-mono text-base font-bold uppercase text-stone-900 focus:border-primary focus:outline-none md:h-10 md:text-sm"
                required
              />
            </div>
          </div>

          {/* Nút Submit Lưu */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={updateConfig.isPending || !isDirty}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-md transition-transform active:scale-[0.99] disabled:opacity-50"
            >
              {updateConfig.isPending && <Spinner visible logo={false} />}
              <span>
                {updateConfig.isPending
                  ? "Đang lưu cấu hình..."
                  : isDirty
                    ? "Lưu thay đổi cấu hình"
                    : "Đã lưu (Không có thay đổi)"}
              </span>
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
}
