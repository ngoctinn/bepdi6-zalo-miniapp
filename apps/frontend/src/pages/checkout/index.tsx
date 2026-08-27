import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPinIcon, ChevronRightIcon } from "@/components/common/vectors";
import QuantityStepper from "@/components/common/quantity-stepper";
import { DeliveryTimePicker } from "@/components/common/delivery-time-picker";
import { useCartStore } from "@/stores/cart.store";
import { useLocationStore } from "@/stores/location.store";
import {
  useCreateOrder,
  usePreviewCheckout,
} from "@/services/order/order.mutations";
import {
  useAddresses,
  useDecodeLocation,
  useCreateAddress,
} from "@/services/address/address.queries";
import { useShopInfo } from "@/services/shop/shop.queries";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/utils/format";
import {
  CheckoutPreviewResponse,
  DeliveryType,
  PaymentMethod,
} from "@/types/order.types";
import { formatVariantWithPercentage } from "@/utils/cart";
import { useAppToast } from "@/hooks/use-app-toast";
import { ErrorModal } from "@/components/common/error-modal";
import { copy } from "@/constants/copy";
import { getLocation, getAccessToken } from "zmp-sdk/apis";

// Hàm sinh UUID v4 cho Idempotency-Key
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { showSuccess, showWarning } = useAppToast();
  const { customer } = useAuth();

  // Stores
  const { items: cartItems, updateQuantity, clearCart } = useCartStore();
  const { selectedAddress, setSelectedAddress } = useLocationStore();
  const { data: shopInfo } = useShopInfo();
  const { data: userAddresses, isLoading: isLoadingAddresses } = useAddresses();

  // State
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [pickupName, setPickupName] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [note, setNote] = useState("");
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [scheduledDeliveryAt, setScheduledDeliveryAt] = useState<
    string | undefined
  >(undefined);
  const [previewData, setPreviewData] =
    useState<CheckoutPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [hasAttemptedAutoLocate, setHasAttemptedAutoLocate] = useState(false);
  const [orderErrorModal, setOrderErrorModal] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
  }>({
    visible: false,
  });

  // Prefill customer info for Pickup
  useEffect(() => {
    if (customer) {
      if (!pickupName && customer.name) setPickupName(customer.name);
      if (!pickupPhone && customer.phone) setPickupPhone(customer.phone);
    }
  }, [customer]);

  // Idempotency Key cố định cho phiên thanh toán hiện tại
  const idempotencyKeyRef = useRef<string>(generateUUID());

  // Mutations
  const previewMutation = usePreviewCheckout();
  const createOrderMutation = useCreateOrder();
  const decodeLocationMutation = useDecodeLocation();
  const createAddressMutation = useCreateAddress();

  /**
   * Tự động dò và ghim toạ độ GPS khi khách chưa có địa chỉ nào
   */
  const autoDetectLocation = useCallback(async () => {
    if (isLocating || selectedAddress) return;
    setIsLocating(true);
    try {
      let locationToken = "";
      let userAccessToken = "";

      try {
        userAccessToken = await getAccessToken({});
      } catch {
        // Mock fallback outside Zalo
      }

      try {
        const data = await getLocation({});
        if (data && typeof data === "object" && "token" in data && data.token) {
          locationToken = data.token as string;
        } else {
          locationToken = "dev_browser_mock_location_token";
        }
      } catch {
        locationToken = "dev_browser_mock_location_token";
      }

      const decoded = await decodeLocationMutation.mutateAsync({
        token: locationToken,
        access_token: userAccessToken || undefined,
      });

      if (decoded && decoded.latitude && decoded.longitude) {
        const fallbackAddressText =
          decoded.address_text ||
          `${decoded.ward ? decoded.ward + ", " : ""}${decoded.district ? decoded.district + ", " : ""}${decoded.city || "TP. Hồ Chí Minh"}` ||
          copy.checkout.currentGpsLocation;

        const temporaryGpsAddress = {
          id: 0, // Temporary ID indicating unpersisted GPS address
          recipient_name: customer?.name || "Khách Zalo",
          phone: customer?.phone || "0987654321",
          address_text: fallbackAddressText,
          latitude: Number(decoded.latitude),
          longitude: Number(decoded.longitude),
          is_default: false,
        };

        setSelectedAddress(temporaryGpsAddress);
      }
    } catch {
      // User denied or decode failed - degrade gracefully to manual selection
    } finally {
      setIsLocating(false);
      setHasAttemptedAutoLocate(true);
    }
  }, [
    isLocating,
    selectedAddress,
    customer,
    decodeLocationMutation,
    setSelectedAddress,
  ]);

  /**
   * Priority Cascade để gán địa chỉ:
   * 1. selectedAddress đã có trong store -> giữ nguyên
   * 2. userAddresses từ DB -> chọn default address
   * 3. Chưa có gì -> tự động kích hoạt GPS auto-detect
   */
  useEffect(() => {
    if (selectedAddress || isLoadingAddresses || hasAttemptedAutoLocate) {
      return;
    }

    if (userAddresses && userAddresses.length > 0) {
      const defaultAddr =
        userAddresses.find((a) => a.is_default) || userAddresses[0];
      setSelectedAddress(defaultAddr);
      setHasAttemptedAutoLocate(true);
    } else if (userAddresses && userAddresses.length === 0) {
      // Khách chưa có sổ địa chỉ -> Tự động gọi GPS
      autoDetectLocation();
    }
  }, [
    selectedAddress,
    userAddresses,
    isLoadingAddresses,
    hasAttemptedAutoLocate,
    setSelectedAddress,
    autoDetectLocation,
  ]);

  // Chuyển đổi giỏ hàng sang payload backend
  const orderItemsPayload = useMemo(
    () =>
      cartItems.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        note: item.note,
        options: item.options || [],
      })),
    [cartItems],
  );

  // Gọi Preview Checkout từ Backend khi giỏ hàng / địa chỉ / hình thức nhận / voucher thay đổi
  useEffect(() => {
    if (cartItems.length === 0) {
      setPreviewData(null);
      return;
    }

    const lat = selectedAddress?.latitude || 10.762622;
    const lng = selectedAddress?.longitude || 106.660172;

    previewMutation.mutate(
      {
        items: orderItemsPayload,
        delivery_type: deliveryType,
        delivery_latitude: deliveryType === "DELIVERY" ? lat : undefined,
        delivery_longitude: deliveryType === "DELIVERY" ? lng : undefined,
        voucher_code: appliedVoucherCode || undefined,
      },
      {
        onSuccess: (data) => {
          setPreviewData(data);
          setPreviewError(null);
        },
        onError: (err) => {
          setPreviewError(
            err instanceof Error ? err.message : copy.checkout.createOrderError,
          );
        },
      },
    );
  }, [cartItems, selectedAddress, deliveryType, appliedVoucherCode]);

  const handleApplyVoucher = () => {
    if (!voucherCodeInput.trim()) return;
    setAppliedVoucherCode(voucherCodeInput.trim().toUpperCase());
  };

  const handleRemoveVoucher = () => {
    setVoucherCodeInput("");
    setAppliedVoucherCode("");
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      showWarning(copy.checkout.emptyCartWarning);
      return;
    }

    if (deliveryType === "DELIVERY" && !selectedAddress) {
      showWarning(copy.checkout.missingAddressWarning);
      navigate("/select-location");
      return;
    }

    if (deliveryType === "PICKUP") {
      if (!pickupName.trim()) {
        showWarning(copy.checkout.missingPickupNameWarning);
        return;
      }
      if (!pickupPhone.trim()) {
        showWarning(copy.checkout.missingPickupPhoneWarning);
        return;
      }
    }

    if (shopInfo && !shopInfo.is_open) {
      setOrderErrorModal({
        visible: true,
        title: copy.checkout.storeClosedTitle,
        message: copy.checkout.storeClosedDesc,
      });
      return;
    }

    if (previewData && !previewData.is_valid && previewData.message) {
      setOrderErrorModal({
        visible: true,
        title: copy.checkout.invalidOrderTitle,
        message: previewData.message,
      });
      return;
    }

    try {
      const payload =
        deliveryType === "PICKUP"
          ? {
              delivery_type: "PICKUP" as DeliveryType,
              recipient_name: pickupName.trim(),
              phone: pickupPhone.trim(),
              payment_method: paymentMethod,
              note: note.trim() || undefined,
              scheduled_delivery_at: scheduledDeliveryAt,
              voucher_code: appliedVoucherCode || undefined,
              items: orderItemsPayload,
            }
          : {
              delivery_type: "DELIVERY" as DeliveryType,
              recipient_name: selectedAddress?.recipient_name || "",
              phone: selectedAddress?.phone || "",
              delivery_address: selectedAddress?.address_text || "",
              delivery_latitude: selectedAddress?.latitude || 10.762622,
              delivery_longitude: selectedAddress?.longitude || 106.660172,
              payment_method: paymentMethod,
              note: note.trim() || undefined,
              scheduled_delivery_at: scheduledDeliveryAt,
              voucher_code: appliedVoucherCode || undefined,
              items: orderItemsPayload,
            };

      const order = await createOrderMutation.mutateAsync({
        payload,
        idempotencyKey: idempotencyKeyRef.current,
      });

      // Tự động lưu địa chỉ GPS tạm vào danh bạ sổ địa chỉ nếu chưa có ID
      if (
        deliveryType === "DELIVERY" &&
        selectedAddress &&
        (!selectedAddress.id || selectedAddress.id === 0)
      ) {
        try {
          createAddressMutation.mutate({
            recipient_name: selectedAddress.recipient_name,
            phone: selectedAddress.phone,
            address_text: selectedAddress.address_text,
            latitude: selectedAddress.latitude,
            longitude: selectedAddress.longitude,
            is_default: true,
          });
        } catch {
          // Non-blocking
        }
      }

      clearCart();
      showSuccess(copy.checkout.orderSuccess);
      navigate(`/order/${order.id}`);
    } catch (err) {
      setOrderErrorModal({
        visible: true,
        title: copy.checkout.orderFailedTitle,
        message:
          err instanceof Error
            ? err.message
            : copy.checkout.orderFailedDefaultMsg,
      });
      idempotencyKeyRef.current = generateUUID();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-black/[0.03]">
          <svg
            className="h-14 w-14 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h2 className="mb-1 text-base font-bold text-neutral-900">
          {copy.cart.empty}
        </h2>
        <p className="mb-5 max-w-[240px] text-xs text-neutral-500">
          {copy.cart.emptyHint}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primaryDark active:scale-95"
        >
          {copy.order.exploreMenu}
        </button>
      </div>
    );
  }

  // Fallback calculation directly from cart store if preview response is delayed
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
  }, [cartItems]);

  const displaySubtotal = previewData?.subtotal ?? cartSubtotal;
  const displayShippingFee =
    deliveryType === "PICKUP" ? 0 : (previewData?.shipping_fee ?? 0);
  const displayDiscount = previewData?.discount ?? 0;
  const displayTotal =
    previewData?.total_amount ??
    Math.max(0, displaySubtotal + displayShippingFee - displayDiscount);

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-32">
      {/* Banner Quán đóng cửa nếu có */}
      {shopInfo && !shopInfo.is_open && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {copy.checkout.storeClosed}
        </div>
      )}

      {/* Tab chuyển đổi: Giao tận nơi vs Tự đến lấy */}
      <div className="flex rounded-xl border border-black/5 bg-black/[0.03] p-1">
        <button
          type="button"
          onClick={() => setDeliveryType("DELIVERY")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
            deliveryType === "DELIVERY"
              ? "shadow-xs border border-primary bg-primary/15 text-primaryDark"
              : "text-stone-600 hover:text-primaryDark"
          }`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>{copy.checkout.delivery}</span>
        </button>
        <button
          type="button"
          onClick={() => setDeliveryType("PICKUP")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all ${
            deliveryType === "PICKUP"
              ? "shadow-xs border border-primary bg-primary/15 text-primaryDark"
              : "text-stone-600 hover:text-primaryDark"
          }`}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span>{copy.checkout.pickup}</span>
        </button>
      </div>

      {/* Khung Thông Tin Nhận Hàng */}
      {deliveryType === "DELIVERY" ? (
        <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral900">
              {copy.checkout.deliveryAddressSection}
            </span>
            <button
              type="button"
              onClick={() => navigate("/select-location")}
              className="text-xxsmall font-semibold text-primary transition-opacity hover:opacity-80"
            >
              {selectedAddress
                ? copy.common.edit
                : copy.checkout.selectAddressHint}
            </button>
          </div>

          {isLocating ? (
            /* Loading State khi đang tự động dò GPS */
            <div className="flex animate-pulse items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-primary">
              <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="font-medium">{copy.checkout.locatingGps}</span>
            </div>
          ) : selectedAddress ? (
            <div
              onClick={() => navigate("/select-location")}
              className="flex cursor-pointer items-start justify-between rounded-xl border border-black/5 bg-black/[0.02] p-3 text-xs text-neutral700 transition-all hover:bg-black/[0.04] active:scale-[0.99]"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 text-primary">
                  <MapPinIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral900">
                      {selectedAddress.recipient_name} • {selectedAddress.phone}
                    </span>
                    {(!selectedAddress.id || selectedAddress.id === 0) && (
                      <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        📍 {copy.checkout.currentGpsLocation}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 line-clamp-2 leading-relaxed text-neutral600">
                    {selectedAddress.address_text}
                  </div>
                  {previewData?.distance_km !== undefined && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-xxsmall font-medium text-primary">
                      <span>
                        {copy.checkout.distanceEstimate} ~
                        {previewData.distance_km.toFixed(1)} km
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
              className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3.5 text-xs text-primary transition-all hover:bg-primary/10 active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 font-medium">
                <MapPinIcon className="h-4 w-4" />
                <span>{copy.checkout.selectAddressHint}</span>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-neutral400" />
            </div>
          )}
        </div>
      ) : (
        /* Thông tin Lấy tại quán (Pickup) */
        <div className="space-y-3 rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs">
          <div>
            <div className="text-xs leading-relaxed text-neutral700">
              <div className="font-semibold text-neutral900">
                {shopInfo?.shop_name || copy.brand.name}
              </div>
              <div className="text-neutral600">
                {shopInfo?.address_text ||
                  "123 Đường Số 1, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"}
              </div>
              {shopInfo?.hotline && (
                <div className="mt-0.5 text-xxsmall font-medium text-primary">
                  Hotline: {shopInfo.hotline}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-black/5 pt-1">
            <div>
              <label className="mb-1 block font-semibold text-neutral700">
                {copy.checkout.pickupName}
              </label>
              <input
                type="text"
                value={pickupName}
                onChange={(e) => setPickupName(e.target.value)}
                placeholder={copy.checkout.pickupNamePlaceholder}
                className="w-full rounded-xl border border-black/10 bg-transparent p-2 text-xs text-neutral900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-neutral700">
                {copy.checkout.pickupPhone}
              </label>
              <input
                type="tel"
                value={pickupPhone}
                onChange={(e) => setPickupPhone(e.target.value)}
                placeholder={copy.checkout.pickupPhonePlaceholder}
                className="w-full rounded-xl border border-black/10 bg-transparent p-2 text-xs text-neutral900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chọn thời gian nhận hàng / lấy món */}
      <DeliveryTimePicker
        deliveryType={deliveryType}
        shopInfo={shopInfo}
        scheduledTime={scheduledDeliveryAt}
        onChange={setScheduledDeliveryAt}
      />

      {/* Danh sách món ăn */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-neutral900">
            {copy.checkout.orderSummarySection} ({cartItems.length})
          </span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-xxsmall font-semibold text-primary transition-opacity hover:opacity-80"
          >
            {copy.checkout.addItems}
          </button>
        </div>

        <div className="divide-y divide-black/5">
          {cartItems.map((item) => {
            const optionsTotal = (item.options || []).reduce(
              (s, opt) => s + Number(opt.price || 0) * (opt.quantity || 1),
              0,
            );
            const itemTotal = (item.unit_price + optionsTotal) * item.quantity;

            return (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-medium text-neutral900">
                      {item.product_name}
                    </div>

                    {item.options && item.options.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        <div className="text-xxsmall text-neutral500">
                          + {formatVariantWithPercentage(item.options)}
                        </div>
                      </div>
                    )}

                    {item.note && (
                      <div className="mt-0.5 text-xxsmall italic text-amber-700">
                        &ldquo;{item.note}&rdquo;
                      </div>
                    )}

                    <div className="mt-1 text-xs font-bold text-neutral900">
                      {formatCurrency(itemTotal)}đ
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="shrink-0">
                    <QuantityStepper
                      value={item.quantity}
                      minValue={0}
                      size="small"
                      variant="rounded"
                      onDecrease={() =>
                        updateQuantity(item.id, Math.max(0, item.quantity - 1))
                      }
                      onIncrease={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mã giảm giá (Voucher) */}
      <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="block text-xs font-bold text-neutral900">
          {copy.checkout.voucherSection}
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherCodeInput}
            onChange={(e) => setVoucherCodeInput(e.target.value)}
            placeholder={copy.checkout.voucherPlaceholder}
            className="flex-1 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-xs uppercase text-neutral900 placeholder:normal-case placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          {appliedVoucherCode ? (
            <button
              type="button"
              onClick={handleRemoveVoucher}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition-all active:scale-95"
            >
              {copy.checkout.removeVoucher}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApplyVoucher}
              disabled={!voucherCodeInput.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-primaryDark active:scale-95 disabled:opacity-50"
            >
              {copy.checkout.applyVoucher}
            </button>
          )}
        </div>
        {appliedVoucherCode && (
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1.5 text-xxsmall text-primaryDark">
            <span>
              ✓ {copy.checkout.appliedVoucherPrefix} <b>{appliedVoucherCode}</b>
            </span>
            {previewData?.discount ? (
              <span className="font-bold">
                -{formatCurrency(previewData.discount)}đ
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Phương thức thanh toán */}
      <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="block text-xs font-bold text-neutral900">
          {copy.checkout.paymentMethodSection}
        </span>
        <div className="space-y-2">
          {/* COD */}
          <label
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
              paymentMethod === "COD"
                ? "border-primary bg-primary/5"
                : "border-black/5 bg-transparent hover:bg-black/[0.02]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="payment_method"
                value="COD"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-xs font-medium text-neutral900">
                {copy.checkout.cash}
              </span>
            </div>
          </label>

          {/* VietQR Chuyển Khoản Tức Thì */}
          <label
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
              paymentMethod === "BANK_TRANSFER"
                ? "border-primary bg-primary/5"
                : "border-black/5 bg-transparent hover:bg-black/[0.02]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="payment_method"
                value="BANK_TRANSFER"
                checked={paymentMethod === "BANK_TRANSFER"}
                onChange={() => setPaymentMethod("BANK_TRANSFER")}
                className="h-4 w-4 accent-primary"
              />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral900">
                  {copy.checkout.vietqr}
                </span>
                <span className="text-xxsmall text-primary">
                  {copy.orderDetail.bankName}
                </span>
              </div>
            </div>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xxxxsmall font-bold text-primary">
              {copy.checkout.recommended || "Khuyên dùng"}
            </span>
          </label>
        </div>
      </div>

      {/* Ghi chú đơn hàng */}
      <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="block text-xs font-bold text-neutral900">
          {copy.checkout.note}
        </span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={copy.checkout.notePlaceholder}
          rows={2}
          className="w-full rounded-xl border border-black/10 bg-transparent p-2.5 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Chi tiết thanh toán */}
      <div className="space-y-2.5 rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs">
        <span className="block text-xs font-bold text-neutral900">
          {copy.checkout.paymentDetailSection}
        </span>

        <div className="flex justify-between text-neutral600">
          <span>{copy.checkout.subtotal}</span>
          <span className="font-normal text-black">
            {formatCurrency(displaySubtotal)}đ
          </span>
        </div>

        <div className="flex justify-between text-neutral600">
          <span>
            {deliveryType === "PICKUP"
              ? copy.checkout.deliveryMethod || "Hình thức"
              : `${copy.checkout.shippingFee}${
                  previewData?.distance_km !== undefined
                    ? ` (~${previewData.distance_km.toFixed(1)} km)`
                    : ""
                }`}
          </span>
          <span className="font-normal text-black">
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

        <div className="flex items-center justify-between border-t border-black/5 pt-2.5 text-sm font-normal text-black">
          <span>{copy.checkout.total}</span>
          <div className="text-right">
            <div className="text-base font-extrabold text-neutral-900">
              {formatCurrency(displayTotal)}đ
            </div>
            {previewMutation.isPending && (
              <div className="text-xxsmall text-neutral400">
                Đang cập nhật phí...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tư vấn đặt món & Hotline quán */}
      {Boolean(shopInfo?.hotline) && (
        <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs">
          <div>
            <div className="font-bold text-primaryDark">
              {copy.checkout.consultTitle}
            </div>
            <div className="text-xxsmall text-neutral500">
              Hotline {shopInfo?.hotline} ({copy.checkout.consultSub})
            </div>
          </div>
          <a
            href={`tel:${shopInfo?.hotline || ""}`}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xxsmall font-bold text-white transition-all active:scale-95"
          >
            <span>{copy.checkout.callShop}</span>
          </a>
        </div>
      )}

      {/* Nút Đặt Hàng cố định ở đáy màn hình (Anti-Spam Idempotency Safe) */}
      <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-3.5 pt-3.5 shadow-lg backdrop-blur-md">
        <button
          type="button"
          disabled={createOrderMutation.isPending || previewMutation.isPending}
          onClick={handlePlaceOrder}
          className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-primaryDark active:scale-[0.99] disabled:opacity-60"
        >
          <span>
            {createOrderMutation.isPending
              ? copy.checkout.processing
              : copy.checkout.placeOrder}
          </span>
          <div className="flex items-center gap-1 font-extrabold">
            <span>{formatCurrency(displayTotal)}đ</span>
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
          </div>
        </button>
      </div>

      {/* Error Modal theo chuẩn Zalo Guidelines */}
      <ErrorModal
        visible={orderErrorModal.visible}
        title={orderErrorModal.title}
        message={orderErrorModal.message}
        onClose={() =>
          setOrderErrorModal((prev) => ({ ...prev, visible: false }))
        }
      />
    </div>
  );
}
