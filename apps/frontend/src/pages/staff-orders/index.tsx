import { useState, useMemo, useEffect, useRef } from "react";
import { useAdminOrders } from "@/services/order/order.queries";
import { orderService } from "@/services/order/order.api";
import { Order } from "@/types/order.types";
import { useQueryClient } from "@tanstack/react-query";
import { ADMIN_ORDERS_QUERY_KEY } from "@/services/order/order.queries";
import { Tabs, Tab } from "@/components/common/tabs";
import { Spinner, Icon } from "zmp-ui";
import { StaffOrderCard } from "@/components/staff/staff-order-card";
import { CancelOrderModal } from "@/components/staff/cancel-order-modal";
import { DispatchOrderModal } from "@/components/staff/dispatch-order-modal";
import { StaffOrderDetailSheet } from "@/components/staff/staff-order-detail-sheet";
import { StaffHeaderActions } from "@/components/staff/staff-header-actions";
import { useAppToast } from "@/hooks/use-app-toast";
import { copy } from "@/constants/copy";

import { useAuth } from "@/hooks/use-auth";

type StaffTab = "PENDING" | "PREPARING" | "READY" | "ALL";

export default function StaffOrdersPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning, showToast } = useAppToast();
  const { customer, isLoading: isAuthLoading, refetchCustomer } = useAuth();

  const isAdmin = customer?.role === "ADMIN" || customer?.role === "STAFF";

  const [activeTab, setActiveTab] = useState<StaffTab>("PENDING");
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(
    null,
  );

  // Modal Cancel state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Modal Dispatch state
  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] =
    useState<Order | null>(null);

  // Detail Sheet state
  const [selectedOrderForDetail, setSelectedOrderForDetail] =
    useState<Order | null>(null);

  const prevPendingCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
    isError,
  } = useAdminOrders(undefined, {
    enabled: isAdmin,
  });

  // Khởi tạo AudioContext khi bật chuông
  const toggleSound = () => {
    if (!isSoundEnabled) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx.state === "suspended") {
          ctx.resume();
        }
        audioContextRef.current = ctx;
        setIsSoundEnabled(true);
        playBeep(ctx);
        showSuccess(copy.staff.soundOnSuccess, { duration: 2000 });
      } catch {
        showWarning(copy.staff.soundUnsupported);
      }
    } else {
      setIsSoundEnabled(false);
      showToast(copy.staff.soundOff);
    }
  };

  // Hàm phát tiếng chuông Hợp âm Sine 3 nốt (C5 - E5 - G5) tăng dần êm tai
  const playBeep = (ctx?: AudioContext | null) => {
    const actx = ctx || audioContextRef.current;
    if (!actx) return;
    try {
      if (actx.state === "suspended") {
        actx.resume();
      }
      const now = actx.currentTime;
      // Nốt 1: C5 (523Hz), Nốt 2: E5 (659Hz), Nốt 3: G5 (784Hz)
      const notes = [
        { freq: 523.25, start: now, duration: 0.25 },
        { freq: 659.25, start: now + 0.12, duration: 0.25 },
        { freq: 783.99, start: now + 0.24, duration: 0.45 },
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = actx.createOscillator();
        const gain = actx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(actx.destination);

        osc.start(start);
        osc.stop(start + duration);
      });
    } catch {
      // Bỏ qua lỗi audio
    }
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const pending = orders.filter(
      (o) => o.status === "PENDING_CONFIRMATION",
    ).length;
    const preparing = orders.filter(
      (o) => o.status === "CONFIRMED" || o.status === "PREPARING",
    ).length;
    const ready = orders.filter(
      (o) => o.status === "READY" || o.status === "DELIVERING",
    ).length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    return { pending, preparing, ready, completed, total: orders.length };
  }, [orders]);

  // Tabs cấu hình đồng bộ Design System chuẩn
  const staffTabs: Tab<StaffTab>[] = useMemo(
    () => [
      {
        value: "PENDING",
        label: copy.staff.tabs.pending,
        badge: stats.pending > 0 ? stats.pending : undefined,
      },
      {
        value: "PREPARING",
        label: copy.staff.tabs.preparing,
        badge: stats.preparing > 0 ? stats.preparing : undefined,
      },
      {
        value: "READY",
        label: copy.staff.tabs.ready,
        badge: stats.ready > 0 ? stats.ready : undefined,
      },
      {
        value: "ALL",
        label: copy.staff.tabs.all,
        badge: stats.total > 0 ? stats.total : undefined,
      },
    ],
    [stats],
  );

  // Phát hiện đơn mới vào danh sách chờ xác nhận để phát chuông
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => o.status === "PENDING_CONFIRMATION");
  }, [orders]);

  useEffect(() => {
    if (isSoundEnabled && pendingOrders.length > prevPendingCountRef.current) {
      playBeep();
    }
    prevPendingCountRef.current = pendingOrders.length;
  }, [pendingOrders.length, isSoundEnabled]);

  const [deliveryFilter, setDeliveryFilter] = useState<
    "ALL" | "DELIVERY" | "PICKUP"
  >("ALL");

  // Đơn hàng thuộc tab hiện tại (dùng để tính count badge cho filter pills)
  const currentTabOrders = useMemo(() => {
    if (activeTab === "PENDING") {
      return orders.filter((o) => o.status === "PENDING_CONFIRMATION");
    }
    if (activeTab === "PREPARING") {
      return orders.filter(
        (o) => o.status === "CONFIRMED" || o.status === "PREPARING",
      );
    }
    if (activeTab === "READY") {
      return orders.filter(
        (o) => o.status === "READY" || o.status === "DELIVERING",
      );
    }
    return orders;
  }, [orders, activeTab]);

  const deliveryCounts = useMemo(() => {
    const delivery = currentTabOrders.filter(
      (o) => o.delivery_type === "DELIVERY",
    ).length;
    const pickup = currentTabOrders.filter(
      (o) => o.delivery_type === "PICKUP",
    ).length;
    return {
      all: currentTabOrders.length,
      delivery,
      pickup,
    };
  }, [currentTabOrders]);

  // Bộ lọc theo Tabs & Delivery Type
  const filteredOrders = useMemo(() => {
    if (deliveryFilter === "ALL") {
      return currentTabOrders;
    }
    return currentTabOrders.filter((o) => o.delivery_type === deliveryFilter);
  }, [currentTabOrders, deliveryFilter]);

  // Xử lý chuyển trạng thái đơn
  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      setProcessingOrderId(orderId);
      await orderService.updateAdminOrderStatus(orderId, nextStatus);
      await queryClient.invalidateQueries({
        queryKey: [ADMIN_ORDERS_QUERY_KEY],
      });
      showSuccess(copy.staff.toasts.statusUpdateSuccess, {
        duration: 2500,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message ||
        copy.staff.toasts.statusUpdateError;
      showError(errorMsg, { duration: 3000 });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Mở modal hủy đơn
  const handleOpenCancelModal = (order: Order) => {
    setSelectedOrderForCancel(order);
    setCancelReason(copy.staff.cancel.reasons[0]);
    setCustomReason("");
    setCancelModalVisible(true);
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!selectedOrderForCancel) return;
    const finalReason =
      cancelReason === copy.staff.cancel.otherReasonKey
        ? customReason.trim() || copy.staff.cancel.staffDefault
        : cancelReason;
    try {
      setProcessingOrderId(selectedOrderForCancel.id);
      setCancelModalVisible(false);
      await orderService.cancelAdminOrder(
        selectedOrderForCancel.id,
        finalReason,
      );
      await queryClient.invalidateQueries({
        queryKey: [ADMIN_ORDERS_QUERY_KEY],
      });
      showToast(
        `${copy.staff.toasts.cancelSuccess} #${selectedOrderForCancel.order_code}`,
        "default",
        {
          duration: 2500,
        },
      );
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || copy.staff.toasts.cancelError;
      showError(errorMsg, { duration: 3000 });
    } finally {
      setProcessingOrderId(null);
      setSelectedOrderForCancel(null);
    }
  };

  // Mở modal điều phối shipper
  const handleOpenDispatchModal = (order: Order) => {
    setSelectedOrderForDispatch(order);
    setDispatchModalVisible(true);
  };

  // Xác nhận điều phối shipper
  const handleConfirmDispatch = async (payload: {
    delivery_provider: import("@/types/order.types").DeliveryProvider;
    shipper_name?: string;
    shipper_phone?: string;
    shipper_tracking_code?: string;
  }) => {
    if (!selectedOrderForDispatch) return;
    try {
      setProcessingOrderId(selectedOrderForDispatch.id);
      await orderService.dispatchAdminOrder(
        selectedOrderForDispatch.id,
        payload,
      );
      await queryClient.invalidateQueries({
        queryKey: [ADMIN_ORDERS_QUERY_KEY],
      });
      showSuccess(
        `${copy.staff.toasts.dispatchSuccess} #${selectedOrderForDispatch.order_code}!`,
        {
          duration: 2500,
        },
      );
      setDispatchModalVisible(false);
      setSelectedOrderForDispatch(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message ||
        copy.staff.toasts.dispatchError;
      showError(errorMsg, { duration: 3000 });
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <Spinner />
        <p className="mt-3 text-xs text-stone-500">
          {copy.staff.accessDenied.loading}
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Icon icon="zi-lock" className="text-3xl" />
        </div>
        <h2 className="text-base font-bold text-neutral900">
          {copy.staff.accessDenied.title}
        </h2>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-500">
          {copy.staff.accessDenied.desc}
        </p>
        {customer?.zalo_user_id && (
          <div className="mt-4 flex flex-col items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs">
            <span className="font-semibold text-neutral700">
              {copy.staff.accessDenied.zaloIdLabel}
            </span>
            <code className="select-all rounded bg-white px-2 py-1 font-mono text-xs font-bold text-amber-800 shadow-sm">
              {customer.zalo_user_id}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(customer.zalo_user_id);
                showToast(copy.staff.toasts.copiedId, "default", {
                  duration: 2000,
                });
              }}
              className="mt-1 text-xxsmall font-bold text-primary underline"
            >
              {copy.staff.accessDenied.copyId}
            </button>
          </div>
        )}
        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            onClick={async () => {
              await refetchCustomer();
              await queryClient.invalidateQueries();
              await refetch();
              showSuccess(copy.staff.toasts.refreshSuccess);
            }}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-transform active:scale-95"
          >
            {copy.staff.accessDenied.refreshButton}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-bottom relative flex flex-col bg-background pb-6 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-30 flex flex-col border-b border-stone-200/80 bg-white/95 pb-1.5 backdrop-blur-md">
        <StaffHeaderActions
          isSoundEnabled={isSoundEnabled}
          isRefetching={isRefetching}
          onToggleSound={toggleSound}
          onRefetch={() => refetch()}
        />

        {/* Tabs */}
        <div className="w-full bg-transparent px-3 py-0.5">
          <Tabs
            tabs={staffTabs}
            activeTab={activeTab}
            onChange={(val) => setActiveTab(val)}
            fullWidth={true}
          />
        </div>

        {/* Delivery Filter Pills với số lượng đơn (Count Indicators) & a11y */}
        <div
          className="flex items-center gap-1.5 px-3 pt-1"
          role="group"
          aria-label="Lọc hình thức nhận món"
        >
          <button
            type="button"
            aria-pressed={deliveryFilter === "ALL"}
            onClick={() => setDeliveryFilter("ALL")}
            className={`inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-2.5 text-xxxxsmall font-bold transition-colors active:scale-95 ${
              deliveryFilter === "ALL"
                ? "shadow-xs bg-neutral900 text-white"
                : "border border-stone-200 bg-stone-100/70 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <span>{copy.staff.filters.allTypes}</span>
            <span
              className={`py-0.2 rounded-full px-1.5 text-[9px] font-black ${
                deliveryFilter === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-black/10 text-stone-700"
              }`}
            >
              {deliveryCounts.all}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={deliveryFilter === "DELIVERY"}
            onClick={() => setDeliveryFilter("DELIVERY")}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-full px-2.5 text-xxxxsmall font-bold transition-colors active:scale-95 ${
              deliveryFilter === "DELIVERY"
                ? "shadow-xs bg-primary text-white"
                : "border border-stone-200 bg-stone-100/70 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Icon icon="zi-location-solid" className="text-xs leading-none" />
            <span>{copy.staff.filters.delivery}</span>
            <span
              className={`py-0.2 rounded-full px-1.5 text-[9px] font-black ${
                deliveryFilter === "DELIVERY"
                  ? "bg-white/20 text-white"
                  : "bg-black/10 text-stone-700"
              }`}
            >
              {deliveryCounts.delivery}
            </span>
          </button>

          <button
            type="button"
            aria-pressed={deliveryFilter === "PICKUP"}
            onClick={() => setDeliveryFilter("PICKUP")}
            className={`inline-flex h-7 items-center justify-center gap-1 rounded-full px-2.5 text-xxxxsmall font-bold transition-colors active:scale-95 ${
              deliveryFilter === "PICKUP"
                ? "shadow-xs bg-primary text-white"
                : "border border-stone-200 bg-stone-100/70 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Icon icon="zi-home" className="text-xs leading-none" />
            <span>{copy.staff.filters.pickup}</span>
            <span
              className={`py-0.2 rounded-full px-1.5 text-[9px] font-black ${
                deliveryFilter === "PICKUP"
                  ? "bg-white/20 text-white"
                  : "bg-black/10 text-stone-700"
              }`}
            >
              {deliveryCounts.pickup}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content: Order Cards */}
      <div className="flex flex-col gap-3 px-3.5 py-3">
        {isLoading && orders.length === 0 ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse flex-col rounded-2xl bg-white p-3.5 shadow-sm"
              >
                {/* 1. Skeleton Header */}
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 rounded bg-stone-200" />
                    <div className="h-4 w-16 rounded-full bg-stone-100" />
                  </div>
                  <div className="h-4 w-24 rounded-full bg-stone-100" />
                </div>
                {/* 2. Skeleton Customer Info */}
                <div className="py-2.5">
                  <div className="h-3.5 w-44 rounded bg-stone-200" />
                </div>
                {/* 3. Skeleton Items */}
                <div className="space-y-2 border-t border-stone-100/80 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-6 rounded bg-stone-200" />
                    <div className="h-4 w-36 rounded bg-stone-200" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-6 rounded bg-stone-200" />
                    <div className="h-4 w-48 rounded bg-stone-200" />
                  </div>
                </div>
                {/* 4. Skeleton Payment & Price */}
                <div className="flex items-center justify-between border-t border-stone-100/80 py-2">
                  <div className="h-3 w-28 rounded bg-stone-100" />
                  <div className="h-4 w-20 rounded bg-stone-200" />
                </div>
                {/* 5. Skeleton Actions */}
                <div className="flex gap-2 pt-1">
                  <div className="h-11 w-12 rounded-xl bg-stone-100" />
                  <div className="h-11 flex-1 rounded-xl bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="shadow-xs flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon icon="zi-list-1" className="text-2xl" />
            </div>
            <p className="text-sm font-bold text-neutral900">
              {copy.staff.emptyOrdersTitle}
            </p>
            <p className="mt-1 max-w-[260px] text-xs text-stone-500">
              {copy.staff.emptyOrdersHint}
            </p>
            <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xxxxsmall font-semibold text-stone-600">
              <span className="h-2 w-2 animate-ping rounded-full bg-olive600" />
              <span>Hệ thống tự động cập nhật liên tục</span>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <StaffOrderCard
              key={order.id}
              order={order}
              isProcessing={processingOrderId === order.id}
              onUpdateStatus={handleUpdateStatus}
              onOpenCancelModal={handleOpenCancelModal}
              onOpenDispatchModal={handleOpenDispatchModal}
              onOpenDetail={setSelectedOrderForDetail}
            />
          ))
        )}
      </div>

      {/* Chi Tiết Đơn Hàng Bottom Sheet */}
      <StaffOrderDetailSheet
        visible={!!selectedOrderForDetail}
        order={selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        onOpenCancelModal={handleOpenCancelModal}
        onOpenDispatchModal={handleOpenDispatchModal}
      />

      {/* Modal Hủy Đơn Hàng */}
      <CancelOrderModal
        visible={cancelModalVisible}
        order={selectedOrderForCancel}
        cancelReason={cancelReason}
        customReason={customReason}
        loading={processingOrderId === selectedOrderForCancel?.id}
        onClose={() => setCancelModalVisible(false)}
        onSelectReason={setCancelReason}
        onChangeCustomReason={setCustomReason}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* Modal Điều Phối Shipper / Vận Chuyển */}
      <DispatchOrderModal
        visible={dispatchModalVisible}
        order={selectedOrderForDispatch}
        loading={processingOrderId === selectedOrderForDispatch?.id}
        onClose={() => {
          setDispatchModalVisible(false);
          setSelectedOrderForDispatch(null);
        }}
        onConfirmDispatch={handleConfirmDispatch}
      />
    </div>
  );
}
