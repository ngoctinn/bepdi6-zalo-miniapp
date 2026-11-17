import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "@/components/common/tabs";
import { OrderItemCard } from "@/components/common/order-item-card";
import { useOrders } from "@/services/order/order.queries";
import { Icon, Spinner, Text } from "zmp-ui";
import { Order, OrderListResponse } from "@/types/order.types";
import { copy } from "@/constants/copy";
import { ChevronRightIcon } from "@/components/common/vectors";

type OrderTab = "all" | "processing" | "completed" | "cancelled";

export default function OrderPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  const { data: orderData, isLoading } = useOrders();

  const orders: Order[] = useMemo(() => {
    if (!orderData) return [];
    if (Array.isArray(orderData)) return orderData;
    return (orderData as OrderListResponse).orders || [];
  }, [orderData]);

  const counts = useMemo(() => {
    const processing = orders.filter(
      (o) => o.status !== "COMPLETED" && o.status !== "CANCELLED",
    ).length;
    const completed = orders.filter((o) => o.status === "COMPLETED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
    return {
      all: orders.length,
      processing,
      completed,
      cancelled,
    };
  }, [orders]);

  const tabs: Tab<OrderTab>[] = useMemo(
    () => [
      {
        value: "all",
        label: copy.order.tabs?.all || copy.common.all,
        badge: counts.all > 0 ? counts.all : undefined,
      },
      {
        value: "processing",
        label: copy.order.tabs?.processing || "Đang xử lý",
        badge: counts.processing > 0 ? counts.processing : undefined,
      },
      {
        value: "completed",
        label: copy.order.tabs?.completed || copy.order.status.completed,
        badge: counts.completed > 0 ? counts.completed : undefined,
      },
      {
        value: "cancelled",
        label: copy.order.tabs?.cancelled || copy.order.status.cancelled,
        badge: counts.cancelled > 0 ? counts.cancelled : undefined,
      },
    ],
    [counts],
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeTab === "all") return true;
      if (activeTab === "processing") {
        return order.status !== "COMPLETED" && order.status !== "CANCELLED";
      }
      if (activeTab === "completed") {
        return order.status === "COMPLETED";
      }
      if (activeTab === "cancelled") {
        return order.status === "CANCELLED";
      }
      return true;
    });
  }, [orders, activeTab]);

  return (
    <div className="relative flex flex-col bg-transparent">
      {/* Sticky Header: Tên trang + Tabs dùng nền sạch sẽ đồng bộ */}
      <div className="sticky top-0 z-30 flex flex-col border-b border-black/5 bg-white/95 pb-2 backdrop-blur-md">
        <div className="header-margin px-3.5 pb-1 pr-20 pt-3">
          <h1 className="text-base font-extrabold tracking-tight text-neutral-900">
            {copy.order.title}
          </h1>
        </div>
        <div className="w-full bg-transparent px-3.5 py-1">
          <Tabs<OrderTab>
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            fullWidth
          />
        </div>
      </div>

      <div className="flex-1 px-3.5 py-3 pb-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner />
            <Text size="xSmall" className="mt-2 text-neutral400">
              {copy.order.loading}
            </Text>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3.5 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/[0.03] text-stone-400">
              <Icon icon="zi-list-1" className="shrink-0 text-3xl" />
            </div>
            <div className="text-sm font-bold text-neutral-800">
              {copy.order.empty}
            </div>
            <p className="max-w-xs text-xs text-neutral-400">
              {copy.order.emptyHint}
            </p>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="shadow-xs mt-1 flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white transition-transform active:scale-95"
            >
              <span>{copy.order.exploreMenu}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
        ) : (
          <div className="w-full space-y-3">
            {filteredOrders.map((order) => (
              <OrderItemCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
