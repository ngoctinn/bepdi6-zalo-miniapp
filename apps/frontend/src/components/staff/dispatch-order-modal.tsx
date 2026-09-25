import { useState, useEffect } from "react";
import { DeliveryProvider, Order } from "@/types/order.types";
import { Icon, Spinner } from "zmp-ui";
import { MotorbikeIcon, TruckIcon } from "@/components/common/vectors";
import { copy } from "@/constants/copy";

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

// Fallback internal shippers list when no dynamic staff list is configured
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

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  const distance = Number(order?.distance_km || 0);

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
          ? shipperName || copy.staff.dispatch.driverAhamoveDefault
          : provider === "GRAB"
            ? shipperName || copy.staff.dispatch.driverGrabExpressDefault
            : shipperName || copy.staff.dispatch.shipperInternalDefault,
      shipper_phone: shipperPhone,
      shipper_tracking_code:
        provider === "AHAMOVE" || provider === "GRAB"
          ? trackingCode || `SHIP-${Date.now().toString().slice(-6)}`
          : trackingCode,
    });
  };

  return (
    <div
      className="animate-fadeIn fixed inset-0 z-[1500] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="safe-bottom animate-slideUp flex max-h-[88vh] w-full max-w-lg flex-col overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="flex w-full items-center justify-center pb-2">
          <div className="h-1.5 w-12 rounded-full bg-stone-300" />
        </div>

        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 rounded-lg px-2 py-0.5 font-mono text-xs font-bold text-primary">
                #{order.order_code}
              </span>
              <h3 className="text-base font-bold text-neutral900">
                {copy.staff.dispatch.title}
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-stone-500">
              {copy.staff.dispatch.deliverTo}{" "}
              <span className="font-semibold text-neutral800">
                {order.recipient_name}
              </span>{" "}
              {distance > 0 ? `(${distance} km)` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 active:scale-95"
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

        {/* Lựa chọn kênh vận chuyển */}
        <div className="mt-4">
          <label className="text-xxsmall font-bold uppercase tracking-wider text-stone-400">
            {copy.staff.dispatch.selectChannel}
          </label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setProvider("INTERNAL");
                setShipperName("");
                setShipperPhone("");
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-colors active:scale-[0.98] ${
                provider === "INTERNAL"
                  ? "shadow-xs bg-primary/10 ring-primary/20 border-primary text-primary ring-2"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <MotorbikeIcon className="h-6 w-6 shrink-0" />
              <span className="mt-1 text-xs font-bold">
                {copy.staff.dispatch.internalShipper}
              </span>
              <span className="text-xxxsmall text-stone-500">
                {copy.staff.dispatch.internalDesc}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProvider("AHAMOVE");
                setShipperName(copy.staff.dispatch.driverAhamoveDefault);
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-colors active:scale-[0.98] ${
                provider === "AHAMOVE"
                  ? "shadow-xs border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <TruckIcon className="h-6 w-6 shrink-0 text-amber-600" />
              <span className="mt-1 text-xs font-bold">Ahamove</span>
              <span className="text-xxxsmall font-semibold text-amber-700">
                {copy.staff.dispatch.ahamoveFeeLabel}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProvider("GRAB");
                setShipperName(copy.staff.dispatch.driverGrabDefault);
              }}
              className={`flex flex-col items-center justify-center rounded-2xl border p-2.5 text-center transition-colors active:scale-[0.98] ${
                provider === "GRAB"
                  ? "shadow-xs border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              <MotorbikeIcon className="h-6 w-6 shrink-0 text-emerald-600" />
              <span className="mt-1 text-xs font-bold">GrabExpress</span>
              <span className="text-xxxsmall text-stone-500">
                {copy.staff.dispatch.grabDesc}
              </span>
            </button>
          </div>
        </div>

        {/* Nội dung chi tiết theo từng kênh */}
        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/50 p-3.5">
          {provider === "INTERNAL" ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xxsmall font-bold uppercase text-stone-500">
                  {copy.staff.dispatch.quickSelectLabel}
                </span>
                <span className="text-xxxsmall text-stone-400">
                  {copy.staff.dispatch.quickSelectHint}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {INTERNAL_SHIPPERS.map((s) => (
                  <button
                    key={s.phone}
                    type="button"
                    onClick={() => handleSelectInternal(s)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors active:scale-[0.98] ${
                      shipperPhone === s.phone
                        ? "shadow-xs border-primary bg-primary text-white"
                        : "border-stone-200 bg-white text-stone-700"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xxxsmall font-bold text-stone-500">
                    {copy.staff.dispatch.shipperNameLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={copy.staff.dispatch.shipperNamePlaceholder}
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xxxsmall font-bold text-stone-500">
                    {copy.staff.dispatch.shipperPhoneLabel}
                  </label>
                  <input
                    type="tel"
                    placeholder={copy.staff.dispatch.shipperPhonePlaceholder}
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
                    {copy.staff.dispatch.dispatchVia}{" "}
                    {provider === "AHAMOVE" ? "Ahamove" : "Grab"}
                  </p>
                  <p className="text-xxxsmall text-amber-700">
                    {copy.staff.dispatch.dispatchingNote}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xxxsmall font-bold text-stone-500">
                    {copy.staff.dispatch.driverLicenseLabel}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      copy.staff.dispatch.driverAhaLicensePlaceholder
                    }
                    value={shipperName}
                    onChange={(e) => setShipperName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xxxsmall font-bold text-stone-500">
                    {copy.staff.dispatch.driverPhoneLabel}
                  </label>
                  <input
                    type="tel"
                    placeholder={copy.staff.dispatch.driverPhonePlaceholder}
                    value={shipperPhone}
                    onChange={(e) => setShipperPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-neutral900 outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="mt-2">
                <label className="text-xxxsmall font-bold text-stone-500">
                  {copy.staff.dispatch.trackingCodeLabel}
                </label>
                <input
                  type="text"
                  placeholder={copy.staff.dispatch.trackingCodePlaceholder}
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
            className="flex h-12 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {copy.staff.dispatch.close}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white shadow-md transition-colors active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Spinner visible logo={false} />
                <span>{copy.staff.dispatch.dispatching}</span>
              </>
            ) : (
              <>
                <Icon icon="zi-send-solid" className="text-base" />
                <span>{copy.staff.dispatch.confirmDispatch}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
