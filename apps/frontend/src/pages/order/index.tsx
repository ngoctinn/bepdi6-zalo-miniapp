import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "@/components/common/tabs";
import { OrderItemCard } from "@/components/common/order-item-card";
import { useOrders } from "@/services/order/order.queries";
import { Spinner, Text } from "zmp-ui";
import { Order, OrderListResponse } from "@/types/order.types";
import { copy } from "@/constants/copy";

type OrderTab = "all" | "processing" | "completed" | "cancelled";

export default function OrderPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  const tabs: Tab<OrderTab>[] = [
    { value: "all", label: copy.common.all },
    { value: "processing", label: copy.order.status.preparing },
    { value: "completed", label: copy.order.status.completed },
    { value: "cancelled", label: copy.order.status.cancelled },
  ];

  const { data: orderData, isLoading } = useOrders();

  const orders: Order[] = useMemo(() => {
    if (!orderData) return [];
    if (Array.isArray(orderData)) return orderData;
    return (orderData as OrderListResponse).orders || [];
  }, [orderData]);

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

      <div className="flex-1 px-3.5 py-3 pb-24">
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
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" />
                <line x1="9" y1="12" x2="15" y2="12" />
                <line x1="9" y1="16" x2="13" y2="16" />
              </svg>
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
              className="shadow-xs mt-1 flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-95"
            >
              <span>{copy.order.exploreMenu}</span>
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
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
