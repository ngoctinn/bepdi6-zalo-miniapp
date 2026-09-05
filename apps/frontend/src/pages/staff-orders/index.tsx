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
import { StaffHeaderActions } from "@/components/staff/staff-header-actions";
import { useAppToast } from "@/hooks/use-app-toast";
import { copy } from "@/constants/copy";

type StaffTab = "PENDING" | "PREPARING" | "READY" | "ALL";

export default function StaffOrdersPage() {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showWarning, showToast } = useAppToast();

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

  const prevPendingCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
  } = useAdminOrders();

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

  // Hàm phát tiếng Ting Ting chuẩn Web Audio API
  const playBeep = (ctx?: AudioContext | null) => {
    const actx = ctx || audioContextRef.current;
    if (!actx) return;
    try {
      if (actx.state === "suspended") {
        actx.resume();
      }
      const osc = actx.createOscillator();
      const gain = actx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, actx.currentTime); // Note A5
      osc.frequency.exponentialRampToValueAtTime(1760, actx.currentTime + 0.15); // Note A6

      gain.gain.setValueAtTime(0.3, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(actx.destination);

      osc.start();
      osc.stop(actx.currentTime + 0.4);
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

  // Bộ lọc theo Tabs
  const filteredOrders = useMemo(() => {
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
        onClose={() => setCancelModalVisible(false)}
        onSelectReason={setCancelReason}
        onChangeCustomReason={setCustomReason}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
