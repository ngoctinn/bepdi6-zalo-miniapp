import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPinIcon,
  ChevronRightIcon,
  BackIcon,
} from "@/components/common/vectors";
import QuantityStepper from "@/components/common/quantity-stepper";
import { useCartStore } from "@/stores/cart.store";
import { useLocationStore } from "@/stores/location.store";
import {
  useCreateOrder,
  usePreviewCheckout,
} from "@/services/order/order.mutations";
import { useShopInfo } from "@/services/shop/shop.queries";
import { Button, Input, Text, useSnackbar } from "zmp-ui";
import { formatCurrency } from "@/utils/format";
import { CheckoutPreviewResponse, PaymentMethod } from "@/types/order.types";
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

  // Stores
  const { items: cartItems, updateQuantity, clearCart } = useCartStore();
  const { selectedAddress } = useLocationStore();
  const { data: shopInfo } = useShopInfo();

  // State
  const [note, setNote] = useState("");
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [previewData, setPreviewData] =
    useState<CheckoutPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

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

  // Gọi Preview Checkout từ Backend khi giỏ hàng / địa chỉ / voucher thay đổi
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
        delivery_latitude: lat,
        delivery_longitude: lng,
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
  }, [cartItems, selectedAddress, appliedVoucherCode]);

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

    if (!selectedAddress) {
      openSnackbar({
        text: "Vui lòng chọn địa chỉ nhận hàng",
        type: "warning",
      });
      navigate("/select-location");
      return;
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
      const order = await createOrderMutation.mutateAsync({
        payload: {
          recipient_name: selectedAddress.recipient_name,
          phone: selectedAddress.phone,
          delivery_address: selectedAddress.address_text,
          delivery_latitude: selectedAddress.latitude,
          delivery_longitude: selectedAddress.longitude,
          payment_method: paymentMethod,
          note: note.trim() || undefined,
          voucher_code: appliedVoucherCode || undefined,
          items: orderItemsPayload,
        },
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
      // Tạo Idempotency Key mới cho lần thử tiếp theo nếu lỗi mạng
      idempotencyKeyRef.current = generateUUID();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-3 text-4xl">🛒</div>
        <h2 className="text-base font-bold text-neutral800">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="mb-4 mt-1 text-xs text-neutral500">
          Hãy chọn các món ăn thơm ngon từ thực đơn Bếp Dì 6 nhé!
        </p>
        <Button
          onClick={() => navigate("/menu")}
          className="bg-primary text-white"
        >
          Xem thực đơn
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-elevation-01">
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3.5 pb-32">
        {/* Banner Quán đóng cửa nếu có */}
        {shopInfo && !shopInfo.is_open && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            ⚠️ <b>Quán đang ngưng nhận đơn.</b> Bạn có thể xem thực đơn và quay
            lại vào giờ mở cửa.
          </div>
        )}

        {/* Địa chỉ giao hàng */}
        <div className="shadow-2xs rounded-xl border border-neutral100 bg-white p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral800">
              📍 ĐỊA CHỈ GIAO HÀNG
            </span>
            <Button
              size="small"
              type="neutral"
              className="bg-transparent p-0 text-xs font-semibold text-primary"
              onClick={() => navigate("/select-location")}
            >
              {selectedAddress ? "Thay đổi" : "Chọn địa chỉ"}
            </Button>
          </div>

          {selectedAddress ? (
            <div
              onClick={() => navigate("/select-location")}
              className="flex cursor-pointer items-start gap-2.5"
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
              className="bg-neutral50 flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-neutral300 p-3 text-xs text-neutral600"
            >
              <span>+ Vui lòng thêm địa chỉ nhận hàng</span>
              <ChevronRightIcon className="h-4 w-4 text-neutral400" />
            </div>
          )}
        </div>

        {/* Danh sách món ăn */}
        <div className="shadow-2xs rounded-xl border border-neutral100 bg-white p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral800">
              🍲 MÓN ĐÃ CHỌN ({cartItems.length})
            </span>
            <Button
              size="small"
              type="neutral"
              className="bg-transparent p-0 text-xs font-medium text-primary"
              onClick={() => navigate("/menu")}
            >
              + Thêm món
            </Button>
          </div>

          <div className="space-y-3 divide-y divide-neutral100">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 pt-2 first:pt-0">
                <img
                  src={
                    item.product_image ||
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=60"
                  }
                  alt={item.product_name}
                  className="h-12 w-12 shrink-0 rounded-lg bg-neutral100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-neutral900">
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
                  <div className="mt-1 text-xs font-bold text-primary">
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
                    onIncrease={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Ghi chú đơn hàng */}
          <div className="mt-3 border-t border-neutral100 pt-3">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm cho shipper hoặc quán..."
              className="text-xs"
            />
          </div>
        </div>

        {/* Mã Khuyến Mãi (Voucher) */}
        <div className="shadow-2xs rounded-xl border border-neutral100 bg-white p-3.5">
          <span className="mb-2 block text-xs font-bold text-neutral800">
            🎟️ MÃ GIẢM GIÁ (VOUCHER)
          </span>
          <div className="flex gap-2">
            <Input
              value={voucherCodeInput}
              onChange={(e) =>
                setVoucherCodeInput(e.target.value.toUpperCase())
              }
              placeholder="Nhập mã voucher..."
              className="text-xs uppercase"
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
                ✅ Đã áp dụng mã <b>{appliedVoucherCode}</b> (-
                {formatCurrency(previewData.discount)}đ)
              </div>
            )}
        </div>

        {/* Phương Thức Thanh Toán */}
        <div className="shadow-2xs rounded-xl border border-neutral100 bg-white p-3.5">
          <span className="mb-2.5 block text-xs font-bold text-neutral800">
            💳 PHƯƠNG THỨC THANH TOÁN
          </span>
          <div className="space-y-2">
            <label
              onClick={() => setPaymentMethod("COD")}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-all ${
                paymentMethod === "COD"
                  ? "border-primary bg-primary/5 font-semibold text-neutral900"
                  : "border-neutral200 text-neutral600"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <span>💵</span>
                <span>Tiền mặt khi nhận hàng (COD)</span>
              </div>
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "COD"}
                onChange={() => setPaymentMethod("COD")}
                className="accent-primary"
              />
            </label>

            <label
              onClick={() => setPaymentMethod("BANK_TRANSFER")}
              className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 transition-all ${
                paymentMethod === "BANK_TRANSFER"
                  ? "border-primary bg-primary/5 font-semibold text-neutral900"
                  : "border-neutral200 text-neutral600"
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <span>📲</span>
                <span>Chuyển khoản VietQR tự động</span>
              </div>
              <input
                type="radio"
                name="payment_method"
                checked={paymentMethod === "BANK_TRANSFER"}
                onChange={() => setPaymentMethod("BANK_TRANSFER")}
                className="accent-primary"
              />
            </label>
          </div>
        </div>

        {/* Bảng tính chi phí (Server Calculated Preview) */}
        <div className="shadow-2xs space-y-2 rounded-xl border border-neutral100 bg-white p-3.5 text-xs">
          <span className="mb-1 block text-xs font-bold text-neutral800">
            📋 CHI TIẾT THANH TOÁN
          </span>

          {previewError && (
            <div className="rounded-md bg-red-50 p-2 text-xs font-medium text-red-600">
              ⚠️ {previewError}
            </div>
          )}

          <div className="flex justify-between text-neutral600">
            <span>Tạm tính món ăn</span>
            <span className="font-semibold text-neutral900">
              {formatCurrency(previewData?.subtotal || 0)}đ
            </span>
          </div>

          <div className="flex justify-between text-neutral600">
            <span>
              Phí giao hàng{" "}
              {previewData?.distance_km
                ? `(${previewData.distance_km.toFixed(1)} km)`
                : ""}
            </span>
            <span className="font-semibold text-neutral900">
              {previewData?.shipping_fee ? (
                `${formatCurrency(previewData.shipping_fee)}đ`
              ) : (
                <span className="font-bold text-green-600">Miễn phí</span>
              )}
            </span>
          </div>

          {previewData?.discount ? (
            <div className="flex justify-between font-medium text-green-700">
              <span>Giảm giá voucher</span>
              <span>-{formatCurrency(previewData.discount)}đ</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-neutral100 pt-2 text-sm font-bold text-neutral900">
            <span>Tổng thanh toán</span>
            <span className="text-base text-primary">
              {formatCurrency(previewData?.total_amount || 0)}đ
            </span>
          </div>
        </div>
      </div>

      {/* Nút bấm Đặt hàng cố định đáy màn hình (Idempotency Safe & Anti-Spam) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral200 bg-white px-4 py-3 shadow-lg">
        <Button
          onClick={handlePlaceOrder}
          disabled={
            createOrderMutation.isPending ||
            previewMutation.isPending ||
            cartItems.length === 0 ||
            (shopInfo ? !shopInfo.is_open : false) ||
            Boolean(previewError)
          }
          className="active:scale-98 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          {createOrderMutation.isPending
            ? "Đang xử lý tạo đơn..."
            : `ĐẶT HÀNG • ${formatCurrency(previewData?.total_amount || 0)}đ`}
        </Button>
      </div>
    </div>
  );
}
