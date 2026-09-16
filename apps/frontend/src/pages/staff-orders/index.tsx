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
import { StaffHeaderActions } from "@/components/staff/staff-header-actions";
import { useAppToast } from "@/hooks/use-app-toast";
import { copy } from "@/constants/copy";

import { useAuth } from "@/hooks/use-auth";

type StaffTab = "PENDING" | "PREPARING" | "READY" | "ALL";

export default function StaffOrdersPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning, showToast } = useAppToast();
  const {
    customer,
    isLoading: isAuthLoading,
    refetchCustomer,
    login,
  } = useAuth();

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

  // Bộ lọc theo Tabs & Delivery Type
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (activeTab === "PENDING") {
      result = result.filter((o) => o.status === "PENDING_CONFIRMATION");
    } else if (activeTab === "PREPARING") {
      result = result.filter(
        (o) => o.status === "CONFIRMED" || o.status === "PREPARING",
      );
    } else if (activeTab === "READY") {
      result = result.filter(
        (o) => o.status === "READY" || o.status === "DELIVERING",
      );
    }

    if (deliveryFilter !== "ALL") {
      result = result.filter((o) => o.delivery_type === deliveryFilter);
    }

    return result;
  }, [orders, activeTab, deliveryFilter]);

  // Xử lý chuyển trạng thái đơn
  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      setProcessingOrderId(orderId);
      await orderService.updateAdminOrderStatus(orderId, nextStatus);
      await queryClient.invalidateQueries({
        queryKey: [ADMIN_ORDERS_QUERY_KEY],
      });
      showSuccess("Đã cập nhật trạng thái đơn hàng thành công", {
        duration: 2500,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || "Không thể cập nhật đơn";
      showError(errorMsg, { duration: 3000 });
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Mở modal hủy đơn
  const handleOpenCancelModal = (order: Order) => {
    setSelectedOrderForCancel(order);
    setCancelReason("Quán quá tải món");
    setCustomReason("");
    setCancelModalVisible(true);
  };

  // Xác nhận hủy đơn
  const handleConfirmCancel = async () => {
    if (!selectedOrderForCancel) return;
    const finalReason =
      cancelReason === "Khác"
        ? customReason.trim() || "Nhân viên hủy đơn"
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
      showToast(`Đã hủy đơn #${selectedOrderForCancel.order_code}`, "default", {
        duration: 2500,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || "Không thể hủy đơn hàng";
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
      showSuccess(`Đã điều phối đơn #${selectedOrderForDispatch.order_code}!`, {
        duration: 2500,
      });
      setDispatchModalVisible(false);
      setSelectedOrderForDispatch(null);
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message ||
        "Không thể điều phối đơn hàng";
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
          Đang kiểm tra quyền truy cập...
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
          Yêu cầu quyền Quản trị / Bếp
        </h2>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-stone-500">
          Tài khoản của bạn chưa được cấp quyền Quản trị viên. Hãy thêm ID Zalo
          của bạn vào danh sách quản trị viên trên hệ thống.
        </p>
        {customer?.zalo_user_id && (
          <div className="mt-4 flex flex-col items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs">
            <span className="font-semibold text-neutral700">
              Zalo User ID của bạn:
            </span>
            <code className="select-all rounded bg-white px-2 py-1 font-mono text-xs font-bold text-amber-800 shadow-sm">
              {customer.zalo_user_id}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(customer.zalo_user_id);
                showToast("Đã sao chép Zalo User ID!", "default", {
                  duration: 2000,
                });
              }}
              className="text-2xs mt-1 font-bold text-primary underline"
            >
              Sao chép ID
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
              showSuccess("Đã làm mới dữ liệu!");
            }}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-all active:scale-95"
          >
            Làm mới quyền
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col bg-background pb-24 font-sans">
      {/* Sticky Header Topbar chuẩn Zalo Mini App - Gọn gàng thanh lịch */}
      <div className="sticky top-0 z-30 flex flex-col border-b border-black/5 bg-white/95 pb-2 backdrop-blur-md">
        <StaffHeaderActions
          isSoundEnabled={isSoundEnabled}
          isRefetching={isRefetching}
          onToggleSound={toggleSound}
          onRefetch={() => refetch()}
        />

        {/* Row 2: Standard Tabs (Dùng chung component Tabs của Design System) */}
        <div className="w-full bg-transparent px-3.5 py-0.5">
          <Tabs
            tabs={staffTabs}
            activeTab={activeTab}
            onChange={(val) => setActiveTab(val)}
            fullWidth={true}
          />
        </div>

        {/* Row 3: Quick Filter Type (Tất cả / Giao tận nơi / Tại quán) */}
        <div className="flex items-center gap-1.5 px-3.5 pt-1.5">
          <button
            type="button"
            onClick={() => setDeliveryFilter("ALL")}
            className={`inline-flex h-6 items-center justify-center rounded-full px-2.5 text-xxxxsmall font-bold transition-all ${
              deliveryFilter === "ALL"
                ? "bg-neutral900 text-white"
                : "border border-stone-200 bg-stone-100/70 text-stone-600 hover:bg-stone-100"
            }`}
          >
            Tất cả hình thức
          </button>
          <button
            type="button"
            onClick={() => setDeliveryFilter("DELIVERY")}
            className={`inline-flex h-6 items-center justify-center gap-1 rounded-full px-2.5 text-xxxxsmall font-bold transition-all ${
              deliveryFilter === "DELIVERY"
                ? "bg-primary text-white"
                : "border border-stone-200 bg-stone-100/70 text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Icon icon="zi-location-solid" className="text-xs leading-none" />
            <span className="leading-none">Giao tận nơi</span>
          </button>
          <button
            type="button"
            onClick={() => setDeliveryFilter("PICKUP")}
            className={`inline-flex h-6 items-center justify-center gap-1 rounded-full px-2.5 text-xxxxsmall font-bold transition-all ${
              deliveryFilter === "PICKUP"
                ? "bg-primary text-white"
                : "border border-stone-200 bg-stone-100/70 text-stone-600 hover:bg-stone-100"
            }`}
          >
            <Icon icon="zi-home" className="text-xs leading-none" />
            <span className="leading-none">Tại quán</span>
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
                className="shadow-xs flex animate-pulse flex-col rounded-2xl border border-black/5 bg-white p-3.5"
              >
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="h-4 w-24 rounded bg-stone-200" />
                  <div className="h-4 w-16 rounded bg-stone-200" />
                </div>
                <div className="space-y-2 py-3">
                  <div className="h-4 w-32 rounded bg-stone-200" />
                  <div className="h-3 w-48 rounded bg-stone-100" />
                </div>
                <div className="flex gap-2 pt-2">
                  <div className="h-10 flex-1 rounded-xl bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="shadow-xs flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon icon="zi-list-1" className="text-2xl" />
            </div>
            <p className="text-sm font-bold text-neutral900">
              {copy.staff.emptyOrdersTitle}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {copy.staff.emptyOrdersHint}
            </p>
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
            />
          ))
        )}
      </div>

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
