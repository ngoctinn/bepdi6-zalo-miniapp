import { useLocation, useNavigate } from "react-router-dom";
import { HomeIcon, CartNavIcon, OrderIcon } from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";
import { useCartStore } from "@/stores/cart.store";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const NAV_ITEMS = [
    {
      name: copy.nav.home || "Thực đơn",
      path: "/",
      icon: HomeIcon,
      badge: 0,
    },
    {
      name: copy.nav.cart || "Giỏ hàng",
      path: "/checkout",
      icon: CartNavIcon,
      badge: totalItems,
    },
    {
      name: copy.nav.order || "Đơn hàng",
      path: "/order",
      icon: OrderIcon,
      badge: 0,
    },
  ];

  const activeKey =
    NAV_ITEMS.find((item) =>
      item.path === "/" ? pathname === "/" : pathname.startsWith(item.path),
    )?.path ?? "/";

  return (
    <div className="flex justify-between border-divider01 border-t bg-white px-8 pb-5 pt-4">
      {NAV_ITEMS.map((item) => (
        <div
          className="relative flex cursor-pointer flex-col items-center gap-1"
          key={item.path}
          onClick={() => navigate(item.path)}
        >
          <div className="relative">
            <item.icon active={activeKey === item.path} />
            {item.badge > 0 && (
              <span className="shadow-xs absolute -right-2.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-extrabold text-white">
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </div>
          <div
            className={cn(
              "text-xxxxsmall font-medium",
              activeKey === item.path ? "!text-primary" : "!text-stone-400",
            )}
          >
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );
}
