import React, { useMemo } from "react";
import { DeliveryType, ShopInfo } from "@/types/shop.types";

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
    <div className="rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-bold text-neutral800">
          THỜI GIAN {deliveryType === "PICKUP" ? "LẤY MÓN" : "GIAO HÀNG"}
        </span>
      </div>

      <div className="space-y-1.5 divide-y divide-black/5">
        {/* Lựa chọn 1: Càng sớm càng tốt */}
        <div
          onClick={() => onChange(undefined)}
          className="flex cursor-pointer items-center justify-between py-2 first:pt-0"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                isAsap
                  ? "border-primary bg-primary"
                  : "border-neutral300 bg-transparent"
              }`}
            >
              {isAsap && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral900">
                Càng sớm càng tốt
              </span>
              <span className="text-xxsmall text-neutral500">
                Ước tính khoảng {asapEstimateText}
              </span>
            </div>
          </div>
        </div>

        {/* Lựa chọn 2: Hẹn giờ hôm nay */}
        <div className="pt-2">
          <div
            onClick={() => {
              if (isAsap && timeSlots.length > 0) {
                onChange(timeSlots[0].value);
              }
            }}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                  !isAsap
                    ? "border-primary bg-primary"
                    : "border-neutral300 bg-transparent"
                }`}
              >
                {!isAsap && (
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral900">
                  Hẹn giờ nhận hôm nay
                </span>
                <span className="text-xxsmall text-neutral500">
                  Chọn khung giờ bạn muốn nhận món
                </span>
              </div>
            </div>
          </div>

          {!isAsap && (
            <div className="pl-6.5 mt-3">
              {timeSlots.length > 0 ? (
                <div className="grid max-h-36 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
                  {timeSlots.map((slot) => {
                    const isSelected = scheduledTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => onChange(slot.value)}
                        className={`rounded-lg py-1.5 text-center text-xs transition-all ${
                          isSelected
                            ? "shadow-xs bg-primary font-bold text-white"
                            : "bg-black/[0.04] font-medium text-neutral700 hover:bg-black/[0.08]"
                        }`}
                      >
                        {slot.timeText}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-1 text-xxsmall italic text-neutral500">
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
