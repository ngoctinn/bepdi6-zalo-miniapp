import { copy } from "@/constants/copy";
import { Order } from "@/types/order.types";
import { makePhoneCall } from "@/utils/phone";
import { printOrderReceipt } from "@/utils/print-order";
import { Icon } from "zmp-ui";

interface StaffOrderDetailSheetProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onOpenCancelModal?: (order: Order) => void;
  onOpenDispatchModal?: (order: Order) => void;
}

export function StaffOrderDetailSheet({
  visible,
  order,
  onClose,
  onOpenCancelModal,
  onOpenDispatchModal,
}: StaffOrderDetailSheetProps) {
  if (!visible || !order) return null;

  const isDelivery = order.delivery_type === "DELIVERY";
  const isPaid = order.payment?.status === "PAID";
  const isEnded = order.status === "COMPLETED" || order.status === "CANCELLED";

  return (
    <div
      className="animate-fadeIn fixed inset-0 z-[1500] flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="safe-bottom animate-slideUp flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="flex w-full items-center justify-center pb-1 pt-2.5">
          <div className="h-1.5 w-12 rounded-full bg-stone-300" />
        </div>

        {/* Header Sheet */}
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black text-neutral900">
              #{order.order_code}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-xxsmall font-bold text-stone-700">
              <Icon
                icon={isDelivery ? "zi-location-solid" : "zi-home"}
                className="text-xs leading-none text-primary"
              />
              <span>
                {isDelivery
                  ? copy.staff.deliveryType.delivery
                  : copy.staff.deliveryType.pickup}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition-transform active:scale-95"
            aria-label={copy.staff.dispatch.close}
          >
            <Icon icon="zi-close" className="text-base" />
          </button>
        </div>

        {/* Scrollable Body with overscroll containment */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
          {/* Financial Shield Banner */}
          <div
            className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold ${
              isPaid
                ? "border border-primary/20 bg-primary/10 text-primary"
                : "border-2 border-amber-500 bg-amber-50 text-amber-900 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon
                icon={isPaid ? "zi-check-circle-solid" : "zi-warning-solid"}
                className={`text-lg leading-none ${isPaid ? "text-primary" : "animate-pulse text-amber-600"}`}
              />
              <div>
                <span className="block text-sm font-black leading-tight">
                  {isPaid
                    ? `${copy.staff.financialShield.paidOnline}: ${Number(order.total_amount || 0).toLocaleString("vi-VN")}${copy.common.currency}`
                    : `${copy.staff.financialShield.collectCod} ${Number(order.total_amount || 0).toLocaleString("vi-VN")}${copy.common.currency}`}
                </span>
              </div>
            </div>
            <span
              className={`rounded-lg px-2 py-1 text-xxxxsmall font-black uppercase tracking-wider ${
                isPaid
                  ? "bg-primary/20 text-primary"
                  : "shadow-xs bg-amber-600 text-white"
              }`}
            >
              {isPaid
                ? copy.staff.financialShield.neverCollect
                : copy.staff.financialShield.driverMustCollect}
            </span>
          </div>

          {/* Customer Info Card */}
          <div className="rounded-xl border border-stone-200/90 bg-stone-50/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-stone-500">
                  {copy.staff.customerLabel}
                </p>
                <p className="text-sm font-bold text-neutral900">
                  {order.recipient_name}
                </p>
                <p className="font-mono text-xs font-medium text-stone-600">
                  {order.phone}
                </p>
              </div>
              {order.phone && (
                <button
                  type="button"
                  onClick={() => makePhoneCall(order.phone)}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-primary/40 bg-olive50 px-3.5 text-xs font-bold text-olive900 shadow-sm transition-transform active:scale-95"
                >
                  <Icon icon="zi-call" className="text-sm leading-none" />
                  <span>{copy.staff.callCustomerBtn}</span>
                </button>
              )}
            </div>

            {isDelivery && order.delivery_address && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-stone-200 bg-white p-2 text-xs">
                <Icon
                  icon="zi-location"
                  className="mt-0.5 shrink-0 text-sm leading-none text-primary"
                />
                <span className="font-medium leading-relaxed text-stone-800">
                  {order.delivery_address}
                  {order.distance_km ? ` (${order.distance_km} km)` : ""}
                </span>
              </div>
            )}

            {order.note && (
              <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                <Icon
                  icon="zi-chat"
                  className="mt-0.5 shrink-0 text-sm leading-none text-amber-600"
                />
                <div className="leading-snug">
                  <span className="font-bold uppercase tracking-wide">
                    {copy.staff.customerNotePrefix}{" "}
                  </span>
                  <span>{order.note}</span>
                </div>
              </div>
            )}
          </div>

          {/* Shipper Info (if assigned) */}
          {order.shipper_name && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                    <Icon
                      icon={
                        order.delivery_provider === "INTERNAL"
                          ? "zi-home"
                          : "zi-location-solid"
                      }
                      className="text-xs"
                    />
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xxxxsmall font-bold uppercase text-primary">
                        {order.delivery_provider === "AHAMOVE"
                          ? "Ahamove"
                          : order.delivery_provider === "GRAB"
                            ? "GrabExpress"
                            : copy.staff.dispatch.internalShipper}
                      </span>
                      {order.shipper_tracking_code && (
                        <span className="rounded border border-stone-200 bg-white px-1 py-0.5 font-mono text-xxxxsmall font-bold text-stone-600">
                          {order.shipper_tracking_code}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-neutral900">
                      {order.shipper_name}
                      {order.shipper_phone && ` (${order.shipper_phone})`}
                    </p>
                  </div>
                </div>

                {order.shipper_phone && (
                  <button
                    type="button"
                    onClick={() => makePhoneCall(order.shipper_phone!)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-white text-primary active:scale-95"
                    title={copy.staff.actions.call}
                  >
                    <Icon icon="zi-call" className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Items Detail */}
          <div className="rounded-xl border border-stone-200/90 bg-white p-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              {copy.staff.items.itemCountPrefix} ({order.items?.length || 0})
            </h4>
            <div className="divide-y divide-stone-100">
              {order.items?.map((item, idx) => (
                <div key={item.id || idx} className="py-2 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded bg-neutral900 px-1 text-xs font-bold text-white">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="text-xs font-bold text-neutral900">
                          {item.product_name}
                        </p>
                        {item.options && item.options.length > 0 && (
                          <p className="mt-0.5 text-xxsmall font-semibold text-stone-500">
                            +{" "}
                            {item.options.map((o) => o.option_name).join(", ")}
                          </p>
                        )}
                        {item.note && (
                          <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xxsmall font-semibold text-amber-900">
                            <Icon
                              icon="zi-warning-circle-solid"
                              className="flex shrink-0 items-center justify-center text-xs leading-none text-amber-600"
                            />
                            <span className="leading-none">
                              {copy.staff.itemWarningPrefix}
                              {item.note}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-bold text-stone-700">
                      {Number(item.subtotal || 0).toLocaleString("vi-VN")}
                      {copy.common.currency}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total summary */}
            <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-2 text-xs font-bold">
              <span className="text-stone-600">{copy.common.total}</span>
              <span className="font-mono text-base font-black text-neutral900">
                {Number(order.total_amount || 0).toLocaleString("vi-VN")}
                {copy.common.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 border-t border-stone-100 bg-stone-50/90 p-3">
          <button
            type="button"
            onClick={() => printOrderReceipt(order, "DELIVERY_BAG")}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 shadow-sm transition-transform active:scale-[0.98]"
          >
            <Icon icon="zi-download" className="text-sm" />
            <span>{copy.staff.printBagReceiptBtn}</span>
          </button>

          {isDelivery && onOpenDispatchModal && !isEnded && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDispatchModal(order);
              }}
              className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-transform active:scale-[0.98]"
            >
              <Icon icon="zi-send" className="text-sm" />
              <span>
                {order.shipper_name
                  ? copy.staff.dispatch.changeShipper
                  : copy.staff.dispatch.assignShipper}
              </span>
            </button>
          )}

          {order.status === "PENDING_CONFIRMATION" && onOpenCancelModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCancelModal(order);
              }}
              className="flex h-11 w-16 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 active:bg-red-100"
            >
              {copy.staff.actions.cancel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
