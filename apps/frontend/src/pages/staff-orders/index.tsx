import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminOrders } from "@/services/order/order.queries";
import { orderService } from "@/services/order/order.api";
import { Order } from "@/types/order.types";
import { useQueryClient } from "@tanstack/react-query";
import { ADMIN_ORDERS_QUERY_KEY } from "@/services/order/order.queries";
import { Spinner, Text, Icon, Modal, Input, useSnackbar } from "zmp-ui";

type StaffTab = "PENDING" | "PREPARING" | "READY" | "ALL";

export default function StaffOrdersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();

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

  const { data: orders = [], isLoading, refetch } = useAdminOrders();

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
        openSnackbar({
          text: "Đã bật chuông báo đơn mới",
          type: "success",
          duration: 2000,
        });
      } catch {
        openSnackbar({
          text: "Thiết bị không hỗ trợ Web Audio",
          type: "warning",
        });
      }
    } else {
      setIsSoundEnabled(false);
      openSnackbar({ text: "Đã tắt chuông báo", type: "default" });
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

  // Xử lý chuyển trạng thái đơn
  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      setProcessingOrderId(orderId);
      await orderService.updateAdminOrderStatus(orderId, nextStatus);
      await queryClient.invalidateQueries({
        queryKey: [ADMIN_ORDERS_QUERY_KEY],
      });
      openSnackbar({
        text: "Đã cập nhật trạng thái đơn hàng thành công",
        type: "success",
        duration: 2500,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || "Không thể cập nhật đơn";
      openSnackbar({ text: errorMsg, type: "error", duration: 3000 });
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
      openSnackbar({
        text: `Đã hủy đơn #${selectedOrderForCancel.order_code}`,
        type: "default",
        duration: 2500,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { message?: string })?.message || "Không thể hủy đơn hàng";
      openSnackbar({ text: errorMsg, type: "error", duration: 3000 });
    } finally {
      setProcessingOrderId(null);
      setSelectedOrderForCancel(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return {
          label: "Chờ xác nhận",
          className: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          className: "bg-blue-100 text-blue-900 border-blue-300",
        };
      case "PREPARING":
        return {
          label: "Bếp đang làm",
          className: "bg-sky-100 text-sky-900 border-sky-300",
        };
      case "READY":
        return {
          label: "Sẵn sàng giao",
          className: "bg-teal-100 text-teal-900 border-teal-300",
        };
      case "DELIVERING":
        return {
          label: "Đang giao",
          className: "bg-indigo-100 text-indigo-900 border-indigo-300",
        };
      case "COMPLETED":
        return {
          label: "Hoàn tất",
          className: "bg-emerald-100 text-emerald-900 border-emerald-300",
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          className: "bg-rose-100 text-rose-900 border-rose-300",
        };
      default:
        return {
          label: status,
          className: "bg-stone-100 text-stone-800 border-stone-300",
        };
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-stone-100 pb-12 font-sans">
      {/* Sticky Header Topbar */}
      <div className="sticky top-0 z-30 flex flex-col border-b border-black/5 bg-white/95 backdrop-blur-md">
        {/* Row 1: Title & Controls */}
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 active:bg-stone-200"
              aria-label="Quay lại"
            >
              <Icon
                icon="zi-chevron-left"
                className="text-xl text-neutral900"
              />
            </button>
            <div>
              <h1 className="text-base font-extrabold text-neutral900">
                Bếp Dì 6 - Bảng Đơn Hàng
              </h1>
              <p className="text-xs text-stone-500">
                Tổng cộng: {stats.total} đơn hôm nay
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Sound */}
            <button
              onClick={toggleSound}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all ${
                isSoundEnabled
                  ? "bg-amber-100 text-amber-900 ring-1 ring-amber-400"
                  : "bg-stone-100 text-stone-600"
              }`}
            >
              <Icon
                icon={isSoundEnabled ? "zi-notif-ring" : "zi-notif"}
                className="text-base"
              />
              <span>{isSoundEnabled ? "Chuông: Bật" : "Bật chuông"}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-100 active:bg-stone-200"
              aria-label="Làm mới"
            >
              <Icon icon="zi-retry" className="text-lg text-stone-700" />
            </button>
          </div>
        </div>

        {/* Row 2: Status Tabs */}
        <div className="flex w-full border-t border-black/5 bg-white px-2 py-1.5">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`relative flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === "PENDING"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>Chờ nhận</span>
            {stats.pending > 0 && (
              <span
                className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                  activeTab === "PENDING"
                    ? "bg-white text-amber-700"
                    : "bg-amber-500 text-white"
                }`}
              >
                {stats.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("PREPARING")}
            className={`relative flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === "PREPARING"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>Đang nấu</span>
            {stats.preparing > 0 && (
              <span
                className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                  activeTab === "PREPARING"
                    ? "bg-white text-sky-800"
                    : "bg-sky-600 text-white"
                }`}
              >
                {stats.preparing}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("READY")}
            className={`relative flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === "READY"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>Đang giao</span>
            {stats.ready > 0 && (
              <span
                className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                  activeTab === "READY"
                    ? "bg-white text-teal-800"
                    : "bg-teal-600 text-white"
                }`}
              >
                {stats.ready}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ALL")}
            className={`flex flex-1 items-center justify-center rounded-lg py-2 text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-stone-800 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            <span>Tất cả ({stats.total})</span>
          </button>
        </div>
      </div>

      {/* Main Content: Order Cards */}
      <div className="flex flex-col gap-3 p-3">
        {isLoading && orders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Spinner visible logo={false} />
            <Text size="xSmall" className="text-stone-500">
              Đang tải danh sách đơn hàng...
            </Text>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-400">
              <Icon icon="zi-list-1" className="text-2xl" />
            </div>
            <p className="text-sm font-bold text-neutral900">
              Không có đơn hàng nào
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Các đơn hàng mới sẽ tự động hiển thị tại đây khi khách đặt món.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            const isDelivery = order.delivery_type === "DELIVERY";
            const isVietQRPaid =
              order.payment?.status === "PAID" ||
              order.payment_status === "PAID";
            const isProcessing = processingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition-all"
              >
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/80 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-neutral900">
                      #{order.order_code}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-stone-600">
                    <Icon
                      icon={isDelivery ? "zi-location" : "zi-home"}
                      className="text-sm text-primary"
                    />
                    <span>{isDelivery ? "Giao tận nơi" : "Tại quán"}</span>
                  </div>
                </div>

                {/* Body Card: Customer & Delivery Info */}
                <div className="border-b border-stone-100 px-3.5 py-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-neutral900">
                        {order.recipient_name}
                      </p>
                      <p className="font-mono text-xs text-stone-500">
                        {order.phone}
                      </p>
                    </div>

                    {order.phone && (
                      <a
                        href={`tel:${order.phone}`}
                        className="flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 active:bg-emerald-100"
                      >
                        <Icon icon="zi-call" className="text-sm" />
                        <span>Gọi</span>
                      </a>
                    )}
                  </div>

                  {isDelivery && order.delivery_address && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-stone-50 p-2 text-xs text-stone-700">
                      <Icon
                        icon="zi-location-solid"
                        className="mt-0.5 shrink-0 text-sm text-stone-400"
                      />
                      <span className="leading-snug">
                        {order.delivery_address}
                      </span>
                    </div>
                  )}

                  {order.note && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-900">
                      <span className="font-bold">Lưu ý giao: </span>
                      {order.note}
                    </div>
                  )}
                </div>

                {/* Items List (Kitchen focus) */}
                <div className="px-3.5 py-2.5">
                  <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-stone-400">
                    Chi tiết món cần nấu ({order.items?.length || 0} món)
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {order.items?.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex flex-col border-b border-dashed border-stone-100 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-800 text-[11px] font-black text-white">
                              {item.quantity}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-neutral900">
                                {item.product_name}
                              </p>
                              {item.options && item.options.length > 0 && (
                                <p className="text-xs font-medium text-stone-600">
                                  +{" "}
                                  {item.options
                                    .map((o) => o.option_name)
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-stone-700">
                            {Number(item.subtotal || 0).toLocaleString("vi-VN")}
                            đ
                          </span>
                        </div>

                        {item.note && (
                          <div className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                            <span className="font-bold">Ghi chú món: </span>
                            {item.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Card: Payment & Touch Actions */}
                <div className="border-t border-stone-100 bg-stone-50/50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-stone-500">
                        {order.payment_method === "VIETQR"
                          ? "Chuyển khoản VietQR"
                          : "Tiền mặt khi nhận (COD)"}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-neutral900">
                          {Number(order.total_amount || 0).toLocaleString(
                            "vi-VN",
                          )}
                          đ
                        </span>
                        {isVietQRPaid ? (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            ĐÃ TT
                          </span>
                        ) : (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                            CHƯA TT
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] text-stone-400">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )
                        : ""}
                    </span>
                  </div>

                  {/* 1-Touch Action Buttons (Height >= 48px) */}
                  <div className="flex gap-2">
                    {order.status === "PENDING_CONFIRMATION" && (
                      <>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleOpenCancelModal(order)}
                          className="flex h-12 w-24 items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 active:bg-rose-100 disabled:opacity-50"
                        >
                          <Icon icon="zi-close-circle" className="text-base" />
                          <span>Hủy</span>
                        </button>

                        <button
                          disabled={isProcessing}
                          onClick={() =>
                            handleUpdateStatus(order.id, "PREPARING")
                          }
                          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 text-sm font-bold text-white shadow-sm active:bg-amber-600 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Spinner visible logo={false} />
                          ) : (
                            <>
                              <Icon
                                icon="zi-check-circle"
                                className="text-lg"
                              />
                              <span>Xác Nhận & Nấu Món</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {(order.status === "CONFIRMED" ||
                      order.status === "PREPARING") && (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleUpdateStatus(order.id, "READY")}
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 text-sm font-bold text-white shadow-sm active:bg-sky-700 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Spinner visible logo={false} />
                        ) : (
                          <>
                            <Icon icon="zi-check-circle" className="text-lg" />
                            <span>Đã Nấu Xong (Sẵn Sàng Giao)</span>
                          </>
                        )}
                      </button>
                    )}

                    {order.status === "READY" && (
                      <button
                        disabled={isProcessing}
                        onClick={() =>
                          handleUpdateStatus(order.id, "DELIVERING")
                        }
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 text-sm font-bold text-white shadow-sm active:bg-teal-700 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Spinner visible logo={false} />
                        ) : (
                          <>
                            <Icon icon="zi-location" className="text-lg" />
                            <span>Bàn Giao Shipper</span>
                          </>
                        )}
                      </button>
                    )}

                    {order.status === "DELIVERING" && (
                      <button
                        disabled={isProcessing}
                        onClick={() =>
                          handleUpdateStatus(order.id, "COMPLETED")
                        }
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm active:bg-emerald-700 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Spinner visible logo={false} />
                        ) : (
                          <>
                            <Icon icon="zi-check-circle" className="text-lg" />
                            <span>Hoàn Tất Đơn Hàng</span>
                          </>
                        )}
                      </button>
                    )}

                    {(order.status === "COMPLETED" ||
                      order.status === "CANCELLED") && (
                      <div className="flex h-10 flex-1 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold text-stone-500">
                        Đơn hàng đã kết thúc
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Hủy Đơn Hàng */}
      <Modal
        visible={cancelModalVisible}
        title="Xác nhận hủy đơn hàng"
        onClose={() => setCancelModalVisible(false)}
        verticalActions
      >
        <div className="flex flex-col gap-3 py-2">
          <p className="text-xs text-stone-600">
            Vui lòng chọn lý do hủy đơn #{selectedOrderForCancel?.order_code}:
          </p>

          <div className="flex flex-col gap-2">
            {[
              "Quán quá tải món",
              "Đã hết nguyên liệu",
              "Khách hàng gọi điện hủy",
              "Không liên lạc được khách",
              "Khác",
            ].map((reason) => (
              <button
                key={reason}
                onClick={() => setCancelReason(reason)}
                className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-all ${
                  cancelReason === reason
                    ? "border-amber-500 bg-amber-50 text-amber-900"
                    : "border-stone-200 bg-white text-stone-700"
                }`}
              >
                <span>{reason}</span>
                {cancelReason === reason && (
                  <Icon
                    icon="zi-check-circle-solid"
                    className="text-base text-amber-500"
                  />
                )}
              </button>
            ))}
          </div>

          {cancelReason === "Khác" && (
            <Input
              type="text"
              placeholder="Nhập lý do chi tiết..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-1 text-xs"
            />
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setCancelModalVisible(false)}
              className="flex h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 active:bg-stone-50"
            >
              Quay lại
            </button>
            <button
              onClick={handleConfirmCancel}
              className="flex h-11 flex-1 items-center justify-center rounded-xl bg-rose-600 text-xs font-bold text-white shadow-sm active:bg-rose-700"
            >
              Xác nhận hủy
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
