import { useState, useMemo } from "react";
import { DeliveryProvider, Order } from "@/types/order.types";
import { Icon, Spinner } from "zmp-ui";

interface DispatchOrderModalProps {
  visible: boolean;
  order: Order | null;
  loading?: boolean;
  onClose: () => void;
  onConfirmDispatch: (payload: {
    delivery_provider: DeliveryProvider;
    shipper_name?: string;
    shipper_phone?: string;
    shipper_tracking_code?: string;
  }) => Promise<void>;
}

// Danh sách gợi ý shipper nội bộ quán
const INTERNAL_SHIPPERS = [
  { name: "Anh Tuấn", phone: "0901234567" },
  { name: "Anh Hùng", phone: "0902345678" },
  { name: "Bảo (NV Quán)", phone: "0903456789" },
];

export function DispatchOrderModal({
  visible,
  order,
  loading = false,
  onClose,
  onConfirmDispatch,
}: DispatchOrderModalProps) {
  const [provider, setProvider] = useState<DeliveryProvider>("INTERNAL");
  const [shipperName, setShipperName] = useState("");
  const [shipperPhone, setShipperPhone] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  // Tính ước tính cước Ahamove dựa trên khoảng cách (nếu có)
  const distance = Number(order?.distance_km || 0);
  const estimatedAhamoveFee = useMemo(() => {
    if (!distance) return 20000;
    // Base 4km đầu ~18.000đ - 22.000đ, mỗi km tiếp theo ~5.000đ
    if (distance <= 4) return 22000;
    return Math.round((22000 + (distance - 4) * 5500) / 1000) * 1000;
  }, [distance]);

  if (!visible || !order) return null;

  const handleSelectInternal = (shipper: { name: string; phone: string }) => {
    setShipperName(shipper.name);
    setShipperPhone(shipper.phone);
  };

  const handleSubmit = () => {
    onConfirmDispatch({
      delivery_provider: provider,
      shipper_name:
        provider === "AHAMOVE"
          ? shipperName || "Tài xế Ahamove"
          : provider === "GRAB"
            ? shipperName || "Tài xế GrabExpress"
            : shipperName || "Shipper quán",
      shipper_phone: shipperPhone,
      shipper_tracking_code:
        provider === "AHAMOVE" || provider === "GRAB"
          ? trackingCode || `SHIP-${Date.now().toString().slice(-6)}`
          : trackingCode,
    });
  };

  return (
    <div
      className="backdrop-blur-xs fixed inset-0 z-[1500] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl transition-all sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 px-2 py-0.5 font-mono text-xs font-black text-primary">
                #{order.order_code}
              </span>
              <h3 className="text-base font-black text-neutral900">
                Điều Phối Giao Hàng
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              Giao đến:{" "}
              <span className="font-semibold text-neutral800">
                {order.recipient_name}
              </span>{" "}
              {distance > 0 ? `(${distance} km)` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 active:scale-90"
          >
            <Icon icon="zi-close" className="text-base" />
          </button>
        </div>

        {/* Địa chỉ giao */}
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-stone-50 p-2.5 text-xs text-stone-700">
          <Icon
            icon="zi-location"
            className="mt-0.5 text-sm leading-none text-primary"
          />
          <span className="line-clamp-2 leading-relaxed">
            {order.delivery_address || "Địa chỉ khách hàng"}
          </span>
        </div>

        {/* Lựa chọn kênh vận chuyển (Segment Tabs) */}
        <div className="mt-4">
          <label className="text-2xs font-extrabold uppercase tracking-wider text-stone-400">
            Chọn kênh điều phối
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setProvider("INTERNAL");
                setShipperName("");
                setShipperPhone("");
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all ${
                provider === "INTERNAL"
                  ? "shadow-xs border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="text-lg">🛵</span>
              <span className="mt-1 text-xs font-black">Shipper Quán</span>
              <span className="text-3xs text-stone-500">Nhân viên nội bộ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProvider("AHAMOVE");
                setShipperName("Tài xế Ahamove");
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all ${
                provider === "AHAMOVE"
                  ? "shadow-xs border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="text-lg">⚡</span>
              <span className="mt-1 text-xs font-black">Ahamove</span>
              <span className="text-3xs font-semibold text-amber-700">
                ~{estimatedAhamoveFee.toLocaleString("vi-VN")}đ
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProvider("GRAB");
                setShipperName("Tài xế Grab");
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-all ${
                provider === "GRAB"
                  ? "shadow-xs border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30"
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <span className="text-lg">🟢</span>
              <span className="mt-1 text-xs font-black">GrabExpress</span>
              <span className="text-3xs text-stone-500">Gọi ngoài app</span>
            </button>
          </div>
        </div>

        {/* Nội dung chi tiết theo từng kênh */}
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5">
          {provider === "INTERNAL" ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-stone-500">
                  Chọn nhanh nhân viên giao
                </span>
                <span className="text-3xs text-stone-400">
                  1-tap điền thông tin
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INTERNAL_SHIPPERS.map((s) => (
                  <button
                    key={s.phone}
                    type="button"
                    onClick={() => handleSelectInternal(s)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                      shipperPhone === s.phone
                        ? "shadow-xs border-primary bg-primary text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-3xs font-bold text-stone-500">
                    Tên người giao
                  </label>
                  <input
                    type="text"
                    placeholder="Tên shipper..."
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-stone-500">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="090..."
                    value={shipperPhone}
                    onChange={(e) => setShipperPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900">
                <Icon
                  icon="zi-info-circle"
                  className="text-base text-amber-600"
                />
                <div className="leading-snug">
                  <p className="font-bold">
                    Điều phối xe qua{" "}
                    {provider === "AHAMOVE" ? "Ahamove" : "Grab"}
                  </p>
                  <p className="text-3xs text-amber-700">
                    Khách sẽ nhận được ZNS thông báo mã chuyến & trạng thái
                    shipper đang giao.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-3xs font-bold text-stone-500">
                    Tài xế / Biển số
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Tuấn - 59F1-12345"
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-3xs font-bold text-stone-500">
                    SĐT Tài xế
                  </label>
                  <input
                    type="tel"
                    placeholder="SĐT tài xế..."
                    value={shipperPhone}
                    onChange={(e) => setShipperPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="text-3xs font-bold text-stone-500">
                  Mã theo dõi chuyến (Tracking Code)
                </label>
                <input
                  type="text"
                  placeholder="VD: AHA-982341..."
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="active:scale-98 flex h-12 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 disabled:opacity-50"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-xs font-extrabold text-white shadow-md active:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner visible logo={false} />
                <span>Đang điều phối...</span>
              </>
            ) : (
              <>
                <Icon icon="zi-send" className="text-base" />
                <span>Xác Nhận Xuất Đơn Giao</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
