import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Tab } from "@/components/common/tabs";
import { OrderItemCard } from "@/components/common/order-item-card";
import CartImg from "@/static/cart.png";
import { useOrders } from "@/services/order/order.queries";
import { Button, Spinner, Text } from "zmp-ui";
import { Order, OrderListResponse } from "@/types/order.types";

type OrderTab = "all" | "processing" | "completed" | "cancelled";

export default function OrderPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OrderTab>("all");

  const tabs: Tab<OrderTab>[] = [
    { value: "all", label: "Tất cả" },
    { value: "processing", label: "Đang xử lý" },
    { value: "completed", label: "Hoàn tất" },
    { value: "cancelled", label: "Đã hủy" },
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
    <div className="relative flex h-full flex-col bg-transparent">
      {/* Sticky Header: Tên trang + Tabs dùng chung gradient vàng đồng bộ với Trang chủ */}
      <div className="sticky top-0 z-30 flex flex-col bg-yellow-gradient pb-2">
        <div className="header-margin px-3.5 pb-1 pt-3">
          <h1 className="text-[17px] font-extrabold tracking-tight text-green800">
            Đơn Hàng Của Tôi
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

      <div className="no-scrollbar flex-1 overflow-y-auto px-3.5 py-3 pb-24">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner />
            <Text size="xSmall" className="mt-2 text-neutral400">
              Đang tải danh sách đơn hàng...
            </Text>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
            <img
              src={CartImg}
              draggable={false}
              alt="Chưa có đơn hàng"
              className="h-16 w-16 opacity-60"
            />
            <div className="text-sm font-semibold text-neutral700">
              Không có đơn hàng nào
            </div>
            <p className="max-w-xs text-xs text-neutral400">
              Bạn chưa có đơn hàng nào trong mục này. Hãy đặt món ngay nhé!
            </p>
            <Button
              onClick={() => navigate("/")}
              className="rounded-xl bg-primary px-6 py-2 text-xs font-semibold text-white"
            >
              Xem thực đơn
            </Button>
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
