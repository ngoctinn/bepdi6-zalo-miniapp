import { MapPinIcon, ChevronRightIcon } from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { ShopInfo } from "@/types/shop.types";
import { Address } from "@/types/customer.types";
import { DeliveryType } from "@/types/order.types";
import { DeliveryTypeSelector } from "./delivery-type-selector";
import { useNavigate } from "react-router-dom";

interface DeliveryAddressCardProps {
  deliveryType: DeliveryType;
  onDeliveryTypeChange: (type: DeliveryType) => void;
  selectedAddress: Address | null;
  shopInfo?: ShopInfo;
  isLocating: boolean;
  distanceKm?: number;
  pickupName: string;
  pickupPhone: string;
  onPickupNameChange: (val: string) => void;
  onPickupPhoneChange: (val: string) => void;
}

export function DeliveryAddressCard({
  deliveryType,
  onDeliveryTypeChange,
  selectedAddress,
  shopInfo,
  isLocating,
  distanceKm,
  pickupName,
  pickupPhone,
  onPickupNameChange,
  onPickupPhoneChange,
}: DeliveryAddressCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2.5">
      {/* Tab chuyển đổi: Giao tận nơi vs Tự đến lấy */}
      <DeliveryTypeSelector
        deliveryType={deliveryType}
        onChange={onDeliveryTypeChange}
      />

      {/* Card thông tin địa chỉ / nhận hàng */}
      <div className="shadow-xs rounded-2xl border border-black/[0.06] bg-white p-4">
        {deliveryType === "DELIVERY" ? (
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-neutral900">
                {copy.checkout.deliveryAddressSection}
              </span>
              {selectedAddress && (
                <button
                  type="button"
                  onClick={() => navigate("/select-location")}
                  className="text-xxsmall font-semibold text-primary transition-opacity hover:opacity-80"
                >
                  {copy.common.edit}
                </button>
              )}
            </div>

            {isLocating ? (
              <div className="flex animate-pulse items-center gap-3 py-1 text-xs text-primaryDark">
                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="font-medium">{copy.checkout.locatingGps}</span>
              </div>
            ) : selectedAddress ? (
              <div
                onClick={() => navigate("/select-location")}
                className="flex cursor-pointer items-start justify-between text-xs text-neutral700 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0 text-primary">
                    <MapPinIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral900">
                        {selectedAddress.recipient_name} •{" "}
                        {selectedAddress.phone}
                      </span>
                      {(!selectedAddress.id || selectedAddress.id === 0) && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-olive100 px-1.5 py-0.5 text-xxxxsmall font-bold text-olive900">
                          <MapPinIcon className="h-2.5 w-2.5 text-primary" />
                          <span>{copy.checkout.currentGpsLocation}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-1 line-clamp-2 leading-relaxed text-neutral600">
                      {selectedAddress.address_text}
                    </div>
                    {distanceKm !== undefined && (
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-primary/20 bg-olive50/90 px-1.5 py-0.5 text-xxsmall font-medium text-primaryDark">
                        <span>
                          {copy.checkout.distanceEstimate} ~
                          {distanceKm.toFixed(1)} km
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-neutral400" />
              </div>
            ) : (
              <div
                onClick={() => navigate("/select-location")}
                className="flex cursor-pointer items-center justify-between py-1 text-xs text-primary transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 font-medium">
                  <MapPinIcon className="h-4 w-4 text-primary" />
                  <span>{copy.checkout.selectAddressHint}</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-neutral400" />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div>
              <div className="text-xs leading-relaxed text-neutral700">
                <div className="font-semibold text-neutral900">
                  {shopInfo?.shop_name || copy.brand.name}
                </div>
                <div className="mt-0.5 text-neutral600">
                  {shopInfo?.address_text ||
                    "123 Đường Số 1, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}
                </div>
                {shopInfo?.hotline && (
                  <div className="mt-1 text-xxsmall font-semibold text-primary">
                    Hotline: {shopInfo.hotline}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 border-t border-black/[0.05] pt-3">
              <div>
                <label className="mb-1 block text-xxsmall font-semibold text-neutral700">
                  {copy.checkout.pickupName}
                </label>
                <input
                  type="text"
                  value={pickupName}
                  onChange={(e) => onPickupNameChange(e.target.value)}
                  placeholder={copy.checkout.pickupNamePlaceholder}
                  className="w-full rounded-xl border border-black/[0.08] bg-stone-50/50 p-2.5 text-xs text-neutral900 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xxsmall font-semibold text-neutral700">
                  {copy.checkout.pickupPhone}
                </label>
                <input
                  type="tel"
                  value={pickupPhone}
                  onChange={(e) => onPickupPhoneChange(e.target.value)}
                  placeholder={copy.checkout.pickupPhonePlaceholder}
                  className="w-full rounded-xl border border-black/[0.08] bg-stone-50/50 p-2.5 text-xs text-neutral900 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
