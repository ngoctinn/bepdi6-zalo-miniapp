import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useOrder } from "@/services/order/order.queries";
import { useShopInfo } from "@/services/shop/shop.queries";
import { useCancelOrder } from "@/services/order/order.mutations";
import { useCartStore } from "@/stores/cart.store";
import { useAuth } from "@/hooks/use-auth";
import { Button, Spinner, Text } from "zmp-ui";
import {
  AlertCircleIcon,
  StoreIcon,
  TruckIcon,
} from "@/components/common/vectors";
import { Order } from "@/types/order.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { Badge } from "@/components/common/badge";
import { copy } from "@/constants/copy";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
  getDeliveryTypeLabel,
} from "@/utils/order-display";

// Modularized Order Sub-components
import { OrderTimelineStepper } from "@/components/order/order-timeline-stepper";
import { OrderShipperCard } from "@/components/order/order-shipper-card";
import { OrderVietQrCard } from "@/components/order/order-vietqr-card";
import { OrderDetailItems } from "@/components/order/order-detail-items";

export default function OrderDetailPage() {
  useAuth();
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useAppToast();
  const { addToCart } = useCartStore();

  const initialOrder = (location.state as { order?: Order } | null | undefined)
    ?.order;
  const {
    data: order,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useOrder(orderId, {
    initialData:
      initialOrder && String(initialOrder.id) === String(orderId)
        ? initialOrder
        : undefined,
  });
  const { data: shopInfo } = useShopInfo();
  const cancelOrderMutation = useCancelOrder();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleReorder = () => {
    if (!order?.items || order.items.length === 0) return;
    for (const item of order.items) {
      const productId = item.product_id ?? item.product;
      if (!productId) continue;
      addToCart({
        product_id: productId,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        note: item.note,
        options: (item.options || []).map((opt) => ({
          option_id: (opt.option_id ?? opt.option) as number,
          option_name: opt.option_name,
          price: opt.price,
          quantity: opt.quantity,
        })),
      });
    }
    showSuccess(copy.order.reorderSuccess || "Đã thêm các món vào giỏ hàng!");
    navigate("/checkout");
  };

  const handleConfirmCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({
        orderId: order.id,
        reason:
          copy.orderDetail.cancelDefaultReason || "Khách hàng yêu cầu hủy",
      });
      showSuccess(copy.orderDetail.cancelSuccess);
      setShowCancelModal(false);
      refetch();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : copy.orderDetail.cancelFailed,
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 bg-background p-6">
        <Spinner />
        <Text size="small" className="text-neutral500">
          {copy.orderDetail.loading}
        </Text>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircleIcon className="h-6 w-6 shrink-0" />
        </div>
        <Text size="small" className="font-semibold text-neutral800">
          {copy.orderDetail.loadError}
        </Text>
        <p className="max-w-[260px] text-xs text-neutral500">
          {error instanceof Error ? error.message : "Vui lòng thử lại sau"}
        </p>
        <div className="mt-2 flex w-full max-w-xs items-center gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/order")}
            className="flex-1 bg-stone-100 text-neutral700"
          >
            {copy.orderDetail.viewOrdersList}
          </Button>
          <Button
            size="small"
            loading={isFetching}
            onClick={() => refetch()}
            className="flex-1 bg-primary text-white"
          >
            {copy.orderDetail.retryButton || "Thử lại"}
          </Button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertCircleIcon className="h-6 w-6 shrink-0" />
        </div>
        <Text size="small" className="font-medium text-neutral700">
          {copy.orderDetail.notFound}
        </Text>
        <p className="max-w-[260px] text-xs text-neutral500">
          {copy.orderDetail.syncErrorHint ||
            "Hệ thống đang đồng bộ hoặc kết nối bị gián đoạn. Bạn hãy nhấn thử tải lại nhé!"}
        </p>
        <div className="mt-2 flex w-full max-w-xs items-center gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={() => navigate("/order")}
            className="flex-1 bg-stone-100 text-neutral700"
          >
            {copy.orderDetail.viewOrdersList}
          </Button>
          <Button
            size="small"
            loading={isFetching}
            onClick={() => refetch()}
            className="flex-1 bg-primary text-white"
          >
            {copy.orderDetail.retryButton || "Thử tải lại"}
          </Button>
        </div>
      </div>
    );
  }

  const isPickup = order.delivery_type === "PICKUP";
  const isCancelled = order.status === "CANCELLED";
  const isPaid = order.payment?.status === "PAID";

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-28">
      {/* 1. Header Order Info */}
      <div className="shadow-xs flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-neutral900">
              {copy.order.orderCodePrefix || "Đơn hàng #"}
              {order.order_code}
            </h1>
            <Badge
              variant="neutral"
              size="small"
              className="gap-1 border-stone-200 bg-stone-100 text-stone-700"
            >
              {isPickup ? (
                <StoreIcon className="h-3 w-3 shrink-0 text-stone-600" />
              ) : (
                <TruckIcon className="h-3 w-3 shrink-0 text-stone-600" />
              )}
              <span>{getDeliveryTypeLabel(order.delivery_type)}</span>
            </Badge>
          </div>
          <span className="mt-0.5 block text-xxsmall text-neutral500">
            {new Date(order.created_at).toLocaleString("vi-VN")}
          </span>
        </div>
        <Badge
          variant={getOrderStatusVariant(order.status)}
          size="medium"
          className="font-bold"
        >
          {getOrderStatusLabel(order.status, order.delivery_type)}
        </Badge>
      </div>

      {/* 2. Timeline Tiến Trình Trạng Thái */}
      <OrderTimelineStepper order={order} />

      {/* 3. Live Shipper Tracking Banner (Nếu có giao hàng) */}
      <OrderShipperCard order={order} isPaid={isPaid} />

      {/* 4. Khối Thanh Toán VietQR Tức Thì (Nếu BANK_TRANSFER) */}
      <OrderVietQrCard
        order={order}
        shopInfo={shopInfo}
        isPaid={isPaid}
        isCancelled={isCancelled}
      />

      {/* 5. Thông Tin Nhận Hàng & Danh Sách Món Ăn & Chi Tiết Thanh Toán */}
      <OrderDetailItems order={order} shopInfo={shopInfo} />

      {/* Footer Action: Hủy đơn nếu còn Chờ xác nhận (Chuẩn Touch-Target Zalo >= 48px) */}
      {order.status === "PENDING_CONFIRMATION" && (
        <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-4 pb-3 pt-3 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            disabled={isCancelling}
            className="shadow-2xs flex h-12 w-full touch-manipulation items-center justify-center rounded-xl border border-red-200 bg-red-50/90 text-sm font-semibold text-red-600 transition-all active:scale-[0.98] active:bg-red-100 disabled:opacity-50"
          >
            {isCancelling ? (
              <div className="flex items-center gap-2">
                <Spinner />
                <span>{copy.orderDetail.processing || "Đang xử lý..."}</span>
              </div>
            ) : (
              <span>{copy.orderDetail.cancelButton}</span>
            )}
          </button>
        </div>
      )}

      {/* Footer Action: Đặt lại đơn cho đơn Hoàn thành hoặc Đã hủy */}
      {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
        <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-4 pb-3 pt-3 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={handleReorder}
            className="shadow-2xs flex h-12 w-full touch-manipulation items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-all hover:bg-primaryDark active:scale-[0.98]"
          >
            {copy.orderDetail.reorderButton ||
              copy.order.reorder ||
              "Đặt lại đơn này"}
          </button>
        </div>
      )}

      {/* Confirm Modal Hủy đơn */}
      <ConfirmModal
        visible={showCancelModal}
        title={copy.orderDetail.cancelModalTitle}
        description={copy.orderDetail.cancelModalDesc}
        type="danger"
        confirmText={copy.orderDetail.cancelConfirmText}
        cancelText={copy.orderDetail.cancelKeepText}
        loading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
