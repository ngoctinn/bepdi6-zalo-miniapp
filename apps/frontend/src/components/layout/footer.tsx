import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  CartNavIcon,
  OrderIcon,
  StoreIcon,
} from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";
import { useCartStore } from "@/stores/cart.store";
import { useAuth } from "@/hooks/use-auth";

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { items } = useCartStore();
  const { customer: userProfile } = useAuth();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // In local dev/mock or when user has STAFF/ADMIN role, show Staff KDS tab
  const isDev = import.meta.env.DEV;
  const isStaffOrAdmin =
    isDev || userProfile?.role === "ADMIN" || userProfile?.role === "STAFF";

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
    ...(isStaffOrAdmin
      ? [
          {
            name: "Bếp",
            path: "/staff/orders",
            icon: ({ active }: { active: boolean }) => (
              <StoreIcon
                className={cn(
                  "h-5 w-5 transition-colors",
                  active
                    ? "stroke-[2] text-primary"
                    : "stroke-[1.5] text-stone-500",
                )}
              />
            ),
            badge: 0,
          },
        ]
      : []),
  ];

  const activeKey =
    NAV_ITEMS.find((item) =>
      item.path === "/" ? pathname === "/" : pathname.startsWith(item.path),
    )?.path ?? "/";

  return (
    <nav
      role="navigation"
      aria-label="Thanh điều hướng chính"
      className="safe-bottom bg-white/98 relative z-40 flex w-full items-center border-t border-black/5 backdrop-blur-md"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = activeKey === item.path;
        return (
          <button
            type="button"
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex min-h-[52px] w-full flex-1 touch-manipulation select-none flex-col items-center justify-center py-1.5 transition-all focus:outline-none active:scale-95"
            aria-label={item.name}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <item.icon active={isActive} />
              {item.badge > 0 && (
                <span className="shadow-xs absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xxxxsmall font-extrabold leading-none text-white ring-2 ring-white">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "mt-1 text-xxxxsmall font-bold tracking-tight transition-colors",
                isActive ? "text-primary" : "text-stone-500",
              )}
            >
              {item.name}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
