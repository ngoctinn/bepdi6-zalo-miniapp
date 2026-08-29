import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  CheckoutPreviewResponse,
  DeliveryType,
  PaymentMethod,
} from "@/types/order.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { ErrorModal } from "@/components/common/error-modal";
import { copy } from "@/constants/copy";
import {
  getZaloLocationCredentials,
  isZaloRuntime,
} from "@/utils/zalo-permissions";

// Modularized Checkout Sub-components
import { DeliveryAddressCard } from "@/components/checkout/delivery-address-card";
import { CheckoutItemList } from "@/components/checkout/checkout-item-list";
import { VoucherInputSection } from "@/components/checkout/voucher-input-section";
import { PaymentMethodSelector } from "@/components/checkout/payment-method-selector";
import { CheckoutOrderSummary } from "@/components/checkout/checkout-order-summary";

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
  const { customer, requestPhoneNumber } = useAuth();

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
  const isCompletingOrderRef = useRef(false);
  const hasRequestedPhoneRef = useRef(false);

  // Mutations
  const previewMutation = usePreviewCheckout();
  const createOrderMutation = useCreateOrder();
  const decodeLocationMutation = useDecodeLocation();
  const createAddressMutation = useCreateAddress();

  useEffect(() => {
    if (customer && !customer.phone && !hasRequestedPhoneRef.current) {
      hasRequestedPhoneRef.current = true;
      void requestPhoneNumber();
    }
  }, [customer, requestPhoneNumber]);

  /**
   * Tự động dò và ghim toạ độ GPS khi khách chưa có địa chỉ nào
   */
  const autoDetectLocation = useCallback(async () => {
    if (isLocating || selectedAddress) return;
    setIsLocating(true);
    try {
      const { token: locationToken, accessToken: userAccessToken } =
        isZaloRuntime()
          ? await getZaloLocationCredentials()
          : {
              token: "dev_browser_mock_location_token",
              accessToken: "dev_browser_mock_access_token",
            };

      const decoded = await decodeLocationMutation.mutateAsync({
        token: locationToken,
        access_token: userAccessToken,
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
        },
        onError: () => {
          // Preview error handled gracefully
        },
      },
    );
  }, [cartItems, selectedAddress, deliveryType, appliedVoucherCode]);

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

  useEffect(() => {
    if (cartItems.length === 0 && !isCompletingOrderRef.current) {
      navigate("/", { replace: true });
    }
  }, [cartItems.length, navigate]);

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

      isCompletingOrderRef.current = true;
      clearCart();
      showSuccess(copy.checkout.orderSuccess);
      navigate(`/order/${order.id}`);
    } catch (err) {
      isCompletingOrderRef.current = false;
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

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-32">
      {/* Banner Quán đóng cửa nếu có */}
      {shopInfo && !shopInfo.is_open && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {copy.checkout.storeClosed}
        </div>
      )}

      {/* Khung Thông Tin Nhận Hàng (Bao gồm tab Giao tận nơi / Tự đến lấy + Địa chỉ) */}
      <DeliveryAddressCard
        deliveryType={deliveryType}
        onDeliveryTypeChange={setDeliveryType}
        selectedAddress={selectedAddress}
        shopInfo={shopInfo}
        isLocating={isLocating}
        distanceKm={previewData?.distance_km}
        pickupName={pickupName}
        pickupPhone={pickupPhone}
        onPickupNameChange={setPickupName}
        onPickupPhoneChange={setPickupPhone}
      />

      {/* Chọn thời gian nhận hàng / lấy món */}
      <DeliveryTimePicker
        deliveryType={deliveryType}
        shopInfo={shopInfo}
        scheduledTime={scheduledDeliveryAt}
        onChange={setScheduledDeliveryAt}
      />

      {/* Danh sách món ăn */}
      <CheckoutItemList
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
      />

      {/* Mã giảm giá (Voucher) */}
      <VoucherInputSection
        voucherCodeInput={voucherCodeInput}
        appliedVoucherCode={appliedVoucherCode}
        discount={previewData?.discount}
        onInputChange={setVoucherCodeInput}
        onApply={handleApplyVoucher}
        onRemove={handleRemoveVoucher}
      />

      {/* Phương thức thanh toán */}
      <PaymentMethodSelector
        paymentMethod={paymentMethod}
        onChange={setPaymentMethod}
      />

      {/* Ghi chú đơn hàng */}
      <div className="flex flex-col gap-2">
        <div className="px-1">
          <span className="text-xs font-bold text-neutral900">
            {copy.checkout.note}
          </span>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={copy.checkout.notePlaceholder}
          rows={2}
          className="shadow-xs w-full rounded-2xl border border-black/[0.08] bg-white p-3 text-xs text-neutral900 transition-colors placeholder:text-neutral400 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Chi tiết thanh toán & Nút Đặt hàng */}
      <CheckoutOrderSummary
        displaySubtotal={displaySubtotal}
        displayShippingFee={displayShippingFee}
        displayDiscount={displayDiscount}
        displayTotal={displayTotal}
        deliveryType={deliveryType}
        distanceKm={previewData?.distance_km}
        isUpdatingFee={previewMutation.isPending}
        isSubmitting={createOrderMutation.isPending}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Tư vấn đặt món & Hotline quán */}
      {Boolean(shopInfo?.hotline) && (
        <div className="shadow-xs flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-4">
          <div>
            <div className="text-xs font-bold text-neutral900">
              {copy.checkout.consultTitle}
            </div>
            <div className="mt-0.5 text-xxsmall text-neutral500">
              Hotline {shopInfo?.hotline} ({copy.checkout.consultSub})
            </div>
          </div>
          <a
            href={`tel:${shopInfo?.hotline || ""}`}
            className="shadow-xs flex shrink-0 items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-all hover:bg-primaryDark active:scale-95"
          >
            <span>{copy.checkout.callShop}</span>
          </a>
        </div>
      )}

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
