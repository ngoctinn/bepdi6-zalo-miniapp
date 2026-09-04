import { MapPinIcon, ChevronRightIcon } from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { DEFAULT_SHOP_ADDRESS } from "@/constants/shop";
import { ShopInfo } from "@/types/shop.types";
import { Address } from "@/types/customer.types";
import { DeliveryType } from "@/types/order.types";
import { DeliveryTypeSelector } from "./delivery-type-selector";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useAppToast } from "@/hooks/use-app-toast";
import { isZaloRuntime } from "@/utils/zalo-permissions";

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
  const { requestPhoneNumber } = useAuth();
  const { showWarning } = useAppToast();

  return (
    <div className="flex flex-col gap-3">
      {/* Tab chuyển đổi: Giao tận nơi vs Tự đến lấy */}
      <DeliveryTypeSelector
        deliveryType={deliveryType}
        onChange={onDeliveryTypeChange}
      />

      {deliveryType === "DELIVERY" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase text-neutral900">
              {copy.checkout.deliveryAddressSection}
            </span>
            {selectedAddress && (
              <button
                type="button"
                onClick={() => navigate("/select-location")}
                className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
              >
                {copy.common.edit}
              </button>
            )}
          </div>
          {isLocating ? (
            <div className="shadow-xs rounded-2xl border border-black/[0.06] bg-white p-4 transition-all">
              <div className="flex animate-pulse items-center gap-3 py-2 text-sm text-primaryDark">
                <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="font-medium">{copy.checkout.locatingGps}</span>
              </div>
            </div>
          ) : selectedAddress ? (
            <div
              onClick={() => navigate("/select-location")}
              className="shadow-xs flex cursor-pointer items-start justify-between rounded-2xl border border-black/[0.06] bg-white p-4 text-sm text-neutral700 transition-all active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0 text-primary">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral900">
                      {selectedAddress.recipient_name} • {selectedAddress.phone}
                    </span>
                    {(!selectedAddress.id || selectedAddress.id === 0) && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-olive100 px-1.5 py-0.5 text-xs font-bold text-olive900">
                        <MapPinIcon className="h-3 w-3 text-primary" />
                        <span>{copy.checkout.currentGpsLocation}</span>
                      </span>
                    )}
                  </div>
                  <div className="mt-1 line-clamp-2 leading-relaxed text-neutral600">
                    {selectedAddress.address_text}
                  </div>
                  {distanceKm !== undefined && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-primary/20 bg-olive50/90 px-2 py-1 text-xs font-medium text-primaryDark">
                      <span>
                        {copy.checkout.distanceEstimate} ~
                        {distanceKm.toFixed(1)} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <ChevronRightIcon className="mt-1 h-5 w-5 shrink-0 text-neutral400" />
            </div>
          ) : (
            <div
              onClick={() => navigate("/select-location")}
              className="shadow-xs flex cursor-pointer items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-4 text-sm transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3 font-semibold text-neutral900">
                <div className="shrink-0 text-primary">
                  <MapPinIcon className="h-5 w-5" />
                </div>
                <span>{copy.checkout.selectAddressHint}</span>
              </div>
              <ChevronRightIcon className="h-5 w-5 text-neutral400" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Thông tin cửa hàng */}
          <div className="flex flex-col gap-2">
            <div className="px-1">
              <span className="text-xs font-bold uppercase text-neutral900">
                Thông tin cửa hàng
              </span>
            </div>
            <div className="shadow-xs rounded-2xl border border-black/[0.06] bg-white p-4">
              <div className="text-sm leading-relaxed text-neutral700">
                <div className="font-semibold text-neutral900">
                  {shopInfo?.shop_name || copy.brand.name}
                </div>
                <div className="mt-1 text-neutral600">
                  {shopInfo?.address_text || DEFAULT_SHOP_ADDRESS}
                </div>
                {shopInfo?.hotline && (
                  <div className="mt-2 text-xs font-semibold text-primary">
                    Hotline: {shopInfo.hotline}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin người nhận */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase text-neutral900">
                Thông tin người đến lấy
              </span>
              {isZaloRuntime() && (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
                  onClick={async () => {
                    try {
                      const phone = await requestPhoneNumber();
                      if (phone) {
                        onPickupPhoneChange(phone);
                      }
                    } catch (e) {
                      showWarning("Không thể lấy số điện thoại từ Zalo");
                    }
                  }}
                >
                  Lấy SĐT Zalo
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Tên người đến lấy"
                value={pickupName}
                onChange={(e) => onPickupNameChange(e.target.value)}
                className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
              <input
                type="tel"
                placeholder="Số điện thoại liên hệ"
                value={pickupPhone}
                onChange={(e) => onPickupPhoneChange(e.target.value)}
                className="shadow-xs w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-2.5 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
