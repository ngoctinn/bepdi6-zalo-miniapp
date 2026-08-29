import { copy } from "@/constants/copy";
import { formatCurrency } from "@/utils/format";

interface CheckoutOrderSummaryProps {
  displaySubtotal: number;
  displayShippingFee: number;
  displayDiscount: number;
  displayTotal: number;
  deliveryType: "DELIVERY" | "PICKUP";
  distanceKm?: number;
  isUpdatingFee: boolean;
  isSubmitting: boolean;
  onPlaceOrder: () => void;
}

export function CheckoutOrderSummary({
  displaySubtotal,
  displayShippingFee,
  displayDiscount,
  displayTotal,
  deliveryType,
  distanceKm,
  isUpdatingFee,
  isSubmitting,
  onPlaceOrder,
}: CheckoutOrderSummaryProps) {
  return (
    <>
      {/* Chi tiết thanh toán */}
      <div className="shadow-xs space-y-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-xs">
        <span className="block text-xs font-bold text-neutral900">
          {copy.checkout.paymentDetailSection}
        </span>

        <div className="flex justify-between text-neutral600">
          <span>{copy.checkout.subtotal}</span>
          <span className="font-medium text-neutral900">
            {formatCurrency(displaySubtotal)}đ
          </span>
        </div>

        <div className="flex justify-between text-neutral600">
          <span>
            {deliveryType === "PICKUP"
              ? copy.checkout.deliveryMethod || "Hình thức"
              : `${copy.checkout.shippingFee}${
                  distanceKm !== undefined
                    ? ` (~${distanceKm.toFixed(1)} km)`
                    : ""
                }`}
          </span>
          <span className="font-medium text-neutral900">
            {deliveryType === "PICKUP"
              ? copy.checkout.selfPickupFree || "Tự đến lấy (0đ)"
              : displayShippingFee > 0
                ? `${formatCurrency(displayShippingFee)}đ`
                : copy.checkout.freeShipping}
          </span>
        </div>

        {displayDiscount > 0 && (
          <div className="flex justify-between font-medium text-primary">
            <span>{copy.checkout.discount}</span>
            <span>-{formatCurrency(displayDiscount)}đ</span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-black/[0.05] pt-3 text-sm">
          <span className="font-bold text-neutral900">
            {copy.checkout.total}
          </span>
          <div className="text-right">
            <div className="text-base font-extrabold text-neutral900">
              {formatCurrency(displayTotal)}đ
            </div>
            {isUpdatingFee && (
              <div className="text-xxsmall text-neutral400">
                Đang cập nhật phí...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nút Đặt Hàng cố định ở đáy màn hình (Anti-Spam Idempotency Safe) */}
      <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-3.5 pt-3.5 shadow-lg backdrop-blur-md">
        <button
          type="button"
          disabled={isSubmitting || isUpdatingFee}
          onClick={onPlaceOrder}
          className="flex min-h-[48px] w-full touch-manipulation items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primaryDark active:scale-[0.99] disabled:opacity-75"
        >
          <div className="flex items-center gap-2">
            {isUpdatingFee && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            <span>
              {isSubmitting
                ? copy.checkout.processing
                : isUpdatingFee
                  ? "Đang tính phí giao hàng..."
                  : copy.checkout.placeOrder}
            </span>
          </div>
          <div className="flex items-center gap-1 font-extrabold">
            <span>{formatCurrency(displayTotal)}đ</span>
            {!isUpdatingFee && !isSubmitting && (
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
