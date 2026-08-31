import React, { useMemo } from "react";
import { DeliveryType } from "@/types/order.types";
import { ShopInfo } from "@/types/shop.types";

interface DeliveryTimePickerProps {
  deliveryType: DeliveryType;
  shopInfo?: ShopInfo | null;
  scheduledTime?: string; // ISO string or empty string for ASAP
  onChange: (timeISO: string | undefined) => void;
}

export const DeliveryTimePicker: React.FC<DeliveryTimePickerProps> = ({
  deliveryType,
  shopInfo,
  scheduledTime,
  onChange,
}) => {
  const prepTimeMinutes = shopInfo?.prep_time_minutes ?? 20;

  // Tính toán thời gian giao/lấy ước tính cho ASAP
  const asapEstimateText = useMemo(() => {
    if (deliveryType === "PICKUP") {
      return `~${prepTimeMinutes} phút`;
    }
    const totalEst = prepTimeMinutes + 15;
    return `~${totalEst}-${totalEst + 15} phút`;
  }, [deliveryType, prepTimeMinutes]);

  // Tạo danh sách các slot thời gian hẹn trong ngày
  const timeSlots = useMemo(() => {
    const slots: { label: string; timeText: string; value: string }[] = [];
    const now = new Date();

    // Sớm nhất là now + prepTime + buffer 10-25 phút
    const leadMinutes =
      deliveryType === "PICKUP" ? prepTimeMinutes + 10 : prepTimeMinutes + 25;
    const startMinutes = now.getMinutes() + leadMinutes;

    // Làm tròn lên mốc 15 phút gần nhất
    const roundedStart = new Date(now);
    roundedStart.setMinutes(Math.ceil(startMinutes / 15) * 15, 0, 0);

    // Xác định giờ đóng cửa của quán
    let closeHour = 22;
    let closeMinute = 0;
    if (shopInfo?.close_time) {
      const [h, m] = shopInfo.close_time.split(":").map(Number);
      if (!isNaN(h)) closeHour = h;
      if (!isNaN(m)) closeMinute = m;
    }

    const closeDate = new Date(now);
    closeDate.setHours(closeHour, closeMinute, 0, 0);

    // Tạo các slot cách nhau 30 phút
    const current = new Date(roundedStart);
    while (current < closeDate && current.getDate() === now.getDate()) {
      const hours = String(current.getHours()).padStart(2, "0");
      const mins = String(current.getMinutes()).padStart(2, "0");
      const timeText = `${hours}:${mins}`;

      slots.push({
        label:
          deliveryType === "PICKUP"
            ? `Lấy lúc ${timeText}`
            : `Giao lúc ${timeText}`,
        timeText,
        value: current.toISOString(),
      });

      current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
  }, [deliveryType, prepTimeMinutes, shopInfo?.close_time]);

  const isAsap = !scheduledTime;

  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="px-1">
        <span className="text-xs font-bold uppercase text-neutral900">
          THỜI GIAN {deliveryType === "PICKUP" ? "LẤY MÓN" : "GIAO HÀNG"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {/* Lựa chọn 1: Càng sớm càng tốt */}
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.99] ${
            isAsap
              ? "shadow-xs border-primary/40 bg-olive50/90 font-semibold text-olive900"
              : "border-black/[0.06] bg-white font-medium text-neutral800 hover:border-black/10"
          }`}
        >
          <div className="flex flex-col">
            <span
              className={`text-xs ${isAsap ? "font-semibold text-olive900" : "font-medium text-neutral900"}`}
            >
              Càng sớm càng tốt
            </span>
            <span className="mt-0.5 text-xxsmall text-neutral500">
              Ước tính khoảng {asapEstimateText}
            </span>
          </div>

          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${
              isAsap
                ? "shadow-xs border border-primary/40 bg-primary text-white"
                : "border border-stone-300 bg-transparent"
            }`}
          >
            {isAsap && (
              <svg
                className="h-3 w-3 fill-current text-white"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </span>
        </button>

        {/* Lựa chọn 2: Hẹn giờ hôm nay */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (isAsap && timeSlots.length > 0) {
                onChange(timeSlots[0].value);
              }
            }}
            className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.99] ${
              !isAsap
                ? "shadow-xs border-primary/40 bg-olive50/90 font-semibold text-olive900"
                : "border-black/[0.06] bg-white font-medium text-neutral800 hover:border-black/10"
            }`}
          >
            <div className="flex flex-col">
              <span
                className={`text-xs ${!isAsap ? "font-semibold text-olive900" : "font-medium text-neutral900"}`}
              >
                Hẹn giờ nhận hôm nay
              </span>
              <span className="mt-0.5 text-xxsmall text-neutral500">
                Chọn khung giờ bạn muốn nhận món
              </span>
            </div>

            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-150 ${
                !isAsap
                  ? "shadow-xs border border-primary/40 bg-primary text-white"
                  : "border border-stone-300 bg-transparent"
              }`}
            >
              {!isAsap && (
                <svg
                  className="h-3 w-3 fill-current text-white"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </button>

          {!isAsap && (
            <div className="shadow-xs rounded-xl border border-black/[0.06] bg-white p-3">
              {timeSlots.length > 0 ? (
                <div className="grid max-h-36 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5">
                  {timeSlots.map((slot) => {
                    const isSelected = scheduledTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => onChange(slot.value)}
                        className={`rounded-lg py-2 text-center text-xs transition-all duration-150 active:scale-95 ${
                          isSelected
                            ? "shadow-xs border border-primary/40 bg-primary font-bold text-white"
                            : "border border-black/[0.06] bg-stone-50/70 font-medium text-neutral700 hover:border-black/10"
                        }`}
                      >
                        {slot.timeText}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-1 text-center text-xxsmall italic text-neutral500">
                  Hiện đã gần giờ đóng cửa, vui lòng chọn &quot;Càng sớm càng
                  tốt&quot;.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
