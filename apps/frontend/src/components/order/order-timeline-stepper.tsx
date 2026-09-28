import { Order, OrderStatus } from "@/types/order.types";
import { CheckIcon } from "@/components/common/vectors";
import { copy } from "@/constants/copy";

interface OrderTimelineStepperProps {
  order: Order;
}

const DELIVERY_STATUS_STEPS: Array<{
  id: string;
  label: string;
  matches: (status: OrderStatus) => boolean;
}> = [
  {
    id: "PLACED",
    label: copy.order.stepper?.placed || "Đã nhận đơn",
    matches: (s) => s === "PENDING_CONFIRMATION" || s === "CONFIRMED",
  },
  {
    id: "PREPARING",
    label: copy.order.stepper?.cooking || "Đang chuẩn bị",
    matches: (s) => s === "PREPARING",
  },
  {
    id: "DELIVERING",
    label: copy.order.stepper?.delivering || "Đang giao hàng",
    matches: (s) => s === "READY" || s === "DELIVERING",
  },
  {
    id: "COMPLETED",
    label: copy.order.status.completed || "Hoàn tất",
    matches: (s) => s === "COMPLETED",
  },
];

const PICKUP_STATUS_STEPS: Array<{
  id: string;
  label: string;
  matches: (status: OrderStatus) => boolean;
}> = [
  {
    id: "PLACED",
    label: copy.order.stepper?.placed || "Đã nhận đơn",
    matches: (s) => s === "PENDING_CONFIRMATION" || s === "CONFIRMED",
  },
  {
    id: "PREPARING",
    label: copy.order.stepper?.cooking || "Đang chuẩn bị",
    matches: (s) => s === "PREPARING",
  },
  {
    id: "READY_PICKUP",
    label: copy.order.status.readyForPickup || "Mời đến lấy",
    matches: (s) => s === "READY" || s === "DELIVERING",
  },
  {
    id: "COMPLETED",
    label: copy.order.status.pickedUp || "Đã nhận món",
    matches: (s) => s === "COMPLETED",
  },
];

const getStepIndex = (status: OrderStatus, isPickup: boolean): number => {
  if (status === "PENDING_CONFIRMATION" || status === "CONFIRMED") return 0;
  if (status === "PREPARING") return 1;
  if (status === "READY" || status === "DELIVERING") return 2;
  if (status === "COMPLETED") return 3;
  return 0;
};

export function OrderTimelineStepper({ order }: OrderTimelineStepperProps) {
  const isPickup = order.delivery_type === "PICKUP";
  const steps = isPickup ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS;
  const isCancelled = order.status === "CANCELLED";
  const currentStep = getStepIndex(order.status, isPickup);

  return (
    <div className="shadow-xs rounded-2xl border border-black/[0.06] bg-white p-4">
      <span className="mb-3 block text-xs font-bold text-neutral900">
        {copy.orderDetail.timelineSection}
      </span>

      {isCancelled ? (
        <div className="rounded-xl border border-red-200/70 bg-red-50 p-3 text-xs text-red-700">
          {copy.orderDetail.cancelledNotice}
          {order.cancellation_reason && (
            <span className="mt-0.5 block text-neutral600">
              {copy.orderDetail.cancelReasonPrefix} {order.cancellation_reason}
            </span>
          )}
        </div>
      ) : (
        <div className="relative flex items-start justify-between px-2 pt-2">
          {/* Progress Line */}
          <div className="absolute left-8 right-8 top-5 -z-0 h-0.5 bg-stone-200" />
          <div
            className="absolute left-8 top-5 -z-0 h-0.5 bg-primary transition-all duration-500"
            style={{
              width: `calc(${(currentStep / Math.max(1, steps.length - 1)) * 100}% - 16px)`,
            }}
          />

          {steps.map((step, idx) => {
            const isPassed = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step.id}
                className="z-10 flex w-16 flex-col items-center text-center"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all ${
                    isPassed
                      ? "shadow-xs bg-primary text-white"
                      : "border border-black/[0.08] bg-stone-100 text-neutral400"
                  } ${isCurrent ? "ring-primary/20 scale-110 ring-4" : ""}`}
                >
                  {isPassed && idx < currentStep ? (
                    <CheckIcon className="h-3.5 w-3.5 shrink-0 text-white" />
                  ) : (
                    <span className="text-xxsmall font-bold">{idx + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xxsmall leading-tight ${
                    isCurrent
                      ? "font-bold text-olive900"
                      : isPassed
                        ? "font-medium text-neutral800"
                        : "text-neutral400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OrderTimelineStepper;
