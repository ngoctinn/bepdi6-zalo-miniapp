import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DeliveryTimePicker } from "@/components/common/delivery-time-picker";
import { useCartStore } from "@/stores/cart.store";
import { useLocationStore } from "@/stores/location.store";
import {
  useCreateOrder,
  usePreviewCheckout,
} from "@/services/order/order.mutations";
import { useAddresses } from "@/services/address/address.queries";
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
  const { showSuccess, showWarning, showError } = useAppToast();
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
  const [orderErrorModal, setOrderErrorModal] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
  }>({
    visible: false,
  });

  // Prefill customer info for Pickup.
  useEffect(() => {
    if (!customer) return;
    if (!pickupName && customer.name) setPickupName(customer.name);
    if (!pickupPhone && customer.phone) setPickupPhone(customer.phone);
  }, [customer, pickupName, pickupPhone]);

  // Idempotency Key cố định cho phiên thanh toán hiện tại
  const idempotencyKeyRef = useRef<string>(generateUUID());
  const isCompletingOrderRef = useRef(false);
  const hasRequestedPhoneRef = useRef(false);
  const previewRequestIdRef = useRef(0);

  // Mutations
  const previewMutation = usePreviewCheckout();
  const createOrderMutation = useCreateOrder();

  // Select the default address only; GPS permission is requested from the explicit location-selection action.
  useEffect(() => {
    if (isLoadingAddresses) return;

    // Nếu có địa chỉ đã chọn (có id > 0) từ database, kiểm tra xem nó còn tồn tại trong list không (phòng khi bị xoá)
    if (
      selectedAddress &&
      selectedAddress.id &&
      selectedAddress.id > 0 &&
      userAddresses
    ) {
      const stillExists = userAddresses.some(
        (a) => a.id === selectedAddress.id,
      );
      if (!stillExists) {
        const defaultAddr =
          userAddresses.length > 0
            ? userAddresses.find((a) => a.is_default) || userAddresses[0]
            : null;
        setSelectedAddress(defaultAddr);
        return;
      }
    }

    if (selectedAddress) return;

    if (userAddresses && userAddresses.length > 0) {
      const defaultAddr =
        userAddresses.find((a) => a.is_default) || userAddresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [selectedAddress, userAddresses, isLoadingAddresses, setSelectedAddress]);

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

    const lat = selectedAddress?.latitude;
    const requestId = ++previewRequestIdRef.current;
    setPreviewData(null);
    const lng = selectedAddress?.longitude;

    previewMutation.mutate(
      {
        items: orderItemsPayload,
        delivery_type: deliveryType,
        address_id:
          deliveryType === "DELIVERY" && selectedAddress?.id
            ? selectedAddress.id
            : undefined,
        delivery_latitude: deliveryType === "DELIVERY" ? lat : undefined,
        delivery_longitude: deliveryType === "DELIVERY" ? lng : undefined,
        voucher_code: appliedVoucherCode || undefined,
      },
      {
        onSuccess: (data) => {
          if (requestId !== previewRequestIdRef.current) return;
          setPreviewData(data);
        },
        onError: (err: any) => {
          if (requestId !== previewRequestIdRef.current) return;
          setPreviewData(null);
          const errorMsg =
            err?.response?.data?.error?.message ||
            err?.message ||
            "Không thể tính phí giao hàng. Vui lòng kiểm tra lại địa chỉ.";
          showError(errorMsg);
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

    if (
      deliveryType === "DELIVERY" &&
      (!selectedAddress?.recipient_name?.trim() ||
        !selectedAddress?.phone?.trim())
    ) {
      showWarning(copy.checkout.missingAddressWarning);
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

    if (
      deliveryType === "DELIVERY" &&
      (!previewData || previewData.can_checkout !== true)
    ) {
      setOrderErrorModal({
        visible: true,
        title: copy.checkout.invalidOrderTitle,
        message:
          previewData?.message ||
          "Chưa có báo giá giao hàng hợp lệ. Vui lòng kiểm tra lại địa chỉ.",
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
              address_id:
                selectedAddress?.id && selectedAddress.id > 0
                  ? selectedAddress.id
                  : undefined,
              recipient_name: selectedAddress?.recipient_name || "",
              phone: selectedAddress?.phone || "",
              delivery_address: selectedAddress?.address_text || "",
              delivery_latitude: selectedAddress?.latitude,
              delivery_longitude: selectedAddress?.longitude,
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
        isLocating={false}
        distanceKm={previewData?.distance_km}
        shippingStatus={previewData?.shipping_status}
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
          <span className="text-xs font-bold uppercase text-neutral900">
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
        shippingStatus={previewData?.shipping_status}
        isUpdatingFee={previewMutation.isPending}
        isQuoteReady={
          deliveryType === "PICKUP" || previewData?.can_checkout === true
        }
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
