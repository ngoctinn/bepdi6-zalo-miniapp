import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPinIcon,
  ChevronRightIcon,
  BackIcon,
} from "@/components/common/vectors";
import QuantityStepper from "@/components/common/quantity-stepper";
import { DeliveryTimePicker } from "@/components/common/delivery-time-picker";
import { useCartStore } from "@/stores/cart.store";
import { useLocationStore } from "@/stores/location.store";
import {
  useCreateOrder,
  usePreviewCheckout,
} from "@/services/order/order.mutations";
import { useShopInfo } from "@/services/shop/shop.queries";
import { useAuth } from "@/hooks/use-auth";
import { Button, Input, Text, useSnackbar } from "zmp-ui";
import { formatCurrency } from "@/utils/format";
import {
  CheckoutPreviewResponse,
  DeliveryType,
  PaymentMethod,
} from "@/types/order.types";
import { formatVariantWithPercentage } from "@/utils/cart";

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
  const { openSnackbar } = useSnackbar();
  const { customer } = useAuth();

  // Stores
  const { items: cartItems, updateQuantity, clearCart } = useCartStore();
  const { selectedAddress } = useLocationStore();
  const { data: shopInfo } = useShopInfo();

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
            err instanceof Error ? err.message : "Không thể tính phí đơn hàng",
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
      openSnackbar({ text: "Giỏ hàng của bạn đang trống", type: "warning" });
      return;
    }

    if (deliveryType === "DELIVERY" && !selectedAddress) {
      openSnackbar({
        text: "Vui lòng chọn địa chỉ nhận hàng",
        type: "warning",
      });
      navigate("/select-location");
      return;
    }

    if (deliveryType === "PICKUP") {
      if (!pickupName.trim()) {
        openSnackbar({
          text: "Vui lòng nhập tên người nhận món tại quán",
          type: "warning",
        });
        return;
      }
      if (!pickupPhone.trim()) {
        openSnackbar({
          text: "Vui lòng nhập số điện thoại người nhận",
          type: "warning",
        });
        return;
      }
    }

    if (shopInfo && !shopInfo.is_open) {
      openSnackbar({
        text: "Quán đang tạm ngưng nhận đơn hàng",
        type: "warning",
      });
      return;
    }

    if (previewData && !previewData.is_valid && previewData.message) {
      openSnackbar({ text: previewData.message, type: "error" });
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

      clearCart();
      openSnackbar({ text: "Đặt hàng thành công!", type: "success" });
      navigate(`/order/${order.id}`);
    } catch (err) {
      openSnackbar({
        text: err instanceof Error ? err.message : "Đặt hàng thất bại",
        type: "error",
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
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="mb-5 max-w-[240px] text-xs text-neutral-500">
          Hãy chọn các món ăn thơm ngon từ thực đơn Bếp Dì 6 nhé!
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-primaryDark active:scale-95"
        >
          Xem thực đơn
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
          <b>Quán đang ngưng nhận đơn.</b> Bạn có thể xem thực đơn và quay lại
          vào giờ mở cửa.
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
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <span>Giao tận nơi</span>
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
          <span>Tự đến lấy</span>
        </button>
      </div>

      {/* Khung Thông Tin Nhận Hàng */}
      {deliveryType === "DELIVERY" ? (
        <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
          <div className="mb-2">
            <span className="text-xs font-bold text-neutral800">
              ĐỊA CHỈ GIAO HÀNG
            </span>
          </div>

          {selectedAddress ? (
            <div
              onClick={() => navigate("/select-location")}
              className="flex cursor-pointer items-start gap-2.5 rounded-xl py-1 transition-all active:opacity-70"
            >
              <div className="mt-0.5 text-primary">
                <MapPinIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-neutral900">
                    {selectedAddress.recipient_name}
                  </span>
                  <span className="text-xs text-neutral600">
                    {selectedAddress.phone}
                  </span>
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-neutral600">
                  {selectedAddress.address_text}
                </div>
              </div>
              <ChevronRightIcon className="h-4 w-4 self-center text-neutral400" />
            </div>
          ) : (
            <div
              onClick={() => navigate("/select-location")}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] p-3 text-xs text-neutral700 transition-all hover:bg-black/[0.04] active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 font-medium text-primary">
                <MapPinIcon className="h-4 w-4" />
                <span>Chọn địa chỉ nhận hàng</span>
              </div>
              <ChevronRightIcon className="h-4 w-4 text-neutral400" />
            </div>
          )}
        </div>
      ) : (
        /* Thông tin Lấy tại quán (Pickup - Phẳng, không lồng card) */
        <div className="space-y-3 rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs">
          <div>
            <div className="text-xs leading-relaxed text-neutral700">
              <div className="font-semibold text-neutral900">
                {shopInfo?.shop_name || "Bếp Dì 6 - Mắm Chưng Miền Tây"}
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
                Tên người lấy *
              </label>
              <input
                type="text"
                value={pickupName}
                onChange={(e) => setPickupName(e.target.value)}
                placeholder="Tên của bạn"
                className="w-full rounded-xl border border-black/10 bg-transparent p-2 text-xs text-neutral900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-neutral700">
                Số điện thoại *
              </label>
              <input
                type="text"
                value={pickupPhone}
                onChange={(e) => setPickupPhone(e.target.value)}
                placeholder="0901234567"
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
            MÓN ĐÃ CHỌN ({cartItems.length})
          </span>
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-semibold text-primary transition-all hover:text-primaryDark active:opacity-70"
            onClick={() => navigate("/")}
          >
            <span>+ Thêm món</span>
          </button>
        </div>

        <div className="space-y-3 divide-y divide-black/5">
          {cartItems.map((item) => (
            <div key={item.id} className="flex gap-3 pt-2 first:pt-0">
              <img
                src={
                  item.product_image ||
                  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60"
                }
                alt={item.product_name}
                className="h-12 w-12 shrink-0 rounded-xl bg-amber-100/40 object-cover ring-1 ring-black/5"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-normal text-black">
                  {item.product_name}
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="mt-0.5 truncate text-xxsmall text-neutral500">
                    + {formatVariantWithPercentage(item.options)}
                  </div>
                )}
                {item.note && (
                  <div className="mt-0.5 text-xxsmall italic text-amber-700">
                    "{item.note}"
                  </div>
                )}
                <div className="mt-1 text-xs font-normal text-black">
                  {formatCurrency(item.unit_price)}đ
                </div>
              </div>

              <div className="self-center">
                <QuantityStepper
                  value={item.quantity}
                  minValue={0}
                  size="small"
                  variant="rounded"
                  onDecrease={() =>
                    updateQuantity(item.id, Math.max(0, item.quantity - 1))
                  }
                  onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Ghi chú đơn hàng */}
        <div className="mt-3 border-t border-black/5 pt-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú thêm cho shipper hoặc quán..."
            className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2.5 text-xs text-neutral900 placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Mã Khuyến Mãi (Voucher) */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="mb-2 block text-xs font-bold text-neutral800">
          MÃ GIẢM GIÁ
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={voucherCodeInput}
            onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
            placeholder="Nhập mã voucher..."
            className="flex-1 rounded-xl border border-black/10 bg-transparent px-3 py-2 text-xs uppercase text-neutral900 placeholder:text-neutral400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            disabled={Boolean(appliedVoucherCode)}
          />
          {appliedVoucherCode ? (
            <Button
              size="small"
              type="neutral"
              className="bg-red-50 px-3 text-xs font-semibold text-red-600"
              onClick={handleRemoveVoucher}
            >
              Gỡ
            </Button>
          ) : (
            <Button
              size="small"
              className="bg-primary px-4 text-xs font-semibold text-white"
              onClick={handleApplyVoucher}
              disabled={!voucherCodeInput.trim()}
            >
              Áp dụng
            </Button>
          )}
        </div>
        {appliedVoucherCode &&
          previewData?.discount &&
          previewData.discount > 0 && (
            <div className="mt-2 rounded-lg bg-green-50 p-2 text-xs font-medium text-green-700">
              Đã áp dụng mã <b>{appliedVoucherCode}</b> (-
              {formatCurrency(previewData.discount)}đ)
            </div>
          )}
      </div>

      {/* Phương Thức Thanh Toán */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="mb-2.5 block text-xs font-bold text-neutral800">
          PHƯƠNG THỨC THANH TOÁN
        </span>
        <div className="space-y-2">
          <label
            onClick={() => setPaymentMethod("COD")}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
              paymentMethod === "COD"
                ? "border-primary bg-primary/10 font-semibold text-neutral900"
                : "border-black/5 bg-transparent text-neutral600"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              <span className="text-xs">Tiền mặt khi nhận hàng (COD)</span>
            </div>
          </label>

          <label
            onClick={() => setPaymentMethod("BANK_TRANSFER")}
            className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all ${
              paymentMethod === "BANK_TRANSFER"
                ? "border-primary bg-primary/10 font-semibold text-neutral900"
                : "border-black/5 bg-transparent text-neutral600"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "BANK_TRANSFER"}
                onChange={() => setPaymentMethod("BANK_TRANSFER")}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
              <span className="text-xs">Chuyển khoản VietQR tự động</span>
            </div>
          </label>
        </div>
      </div>

      {/* Bảng tính chi phí (Server Calculated Preview) */}
      <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs">
        <span className="mb-1 block text-xs font-bold text-neutral800">
          CHI TIẾT THANH TOÁN
        </span>

        {previewError && (
          <div className="rounded-md bg-red-50 p-2 text-xs font-medium text-red-600">
            {previewError}
          </div>
        )}

        <div className="flex justify-between text-neutral600">
          <span>Tạm tính món ăn</span>
          <span className="font-normal text-black">
            {formatCurrency(displaySubtotal)}đ
          </span>
        </div>

        <div className="flex justify-between text-neutral600">
          <span>
            Phí giao hàng{" "}
            {previewData?.distance_km
              ? `(${previewData.distance_km.toFixed(1)} km)`
              : ""}
          </span>
          <span className="font-normal text-black">
            {displayShippingFee > 0 ? (
              `${formatCurrency(displayShippingFee)}đ`
            ) : (
              <span className="font-normal text-primary">Miễn phí</span>
            )}
          </span>
        </div>

        {displayDiscount > 0 ? (
          <div className="flex justify-between font-normal text-primary">
            <span>Giảm giá voucher</span>
            <span>-{formatCurrency(displayDiscount)}đ</span>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-black/5 pt-2 text-sm font-normal text-black">
          <span>Tổng thanh toán</span>
          <span className="text-base font-bold text-neutral-900">
            {formatCurrency(displayTotal)}đ
          </span>
        </div>
      </div>

      {/* Hotline CSKH Quán */}
      <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs text-neutral600">
        <div>
          <div className="font-semibold text-neutral800">
            Cần tư vấn đặt món?
          </div>
          <div className="text-xxsmall text-neutral500">
            Hotline: {shopInfo?.hotline || "0901234567"} (Hỗ trợ 24/7)
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = `tel:${shopInfo?.hotline || "0901234567"}`;
          }}
          className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all active:scale-95"
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Gọi quán ngay</span>
        </button>
      </div>

      {/* Nút bấm Đặt hàng cố định đáy màn hình (Idempotency Safe & Anti-Spam) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md">
        <Button
          onClick={handlePlaceOrder}
          disabled={
            createOrderMutation.isPending ||
            cartItems.length === 0 ||
            (shopInfo ? !shopInfo.is_open : false) ||
            Boolean(previewError)
          }
          className="active:scale-98 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createOrderMutation.isPending
            ? "Đang xử lý tạo đơn..."
            : `ĐẶT HÀNG • ${formatCurrency(displayTotal)}đ`}
        </Button>
      </div>
    </div>
  );
}
