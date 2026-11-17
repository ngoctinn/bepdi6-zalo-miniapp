import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "zmp-ui";
import { cn } from "@/utils/cn";

interface AdminFooterProps {
  className?: string;
}

export default function AdminFooter({ className }: AdminFooterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const ADMIN_NAV_ITEMS = [
    {
      name: "Tổng quan",
      path: "/admin",
      exact: true,
      icon: "zi-poll",
    },
    {
      name: "Bếp",
      path: "/admin/kitchen",
      exact: false,
      icon: "zi-shop",
    },
    {
      name: "Quản lý",
      path: "/admin/manage",
      exact: false,
      icon: "zi-more-grid",
    },
    {
      name: "Cài đặt",
      path: "/admin/settings",
      exact: false,
      icon: "zi-setting",
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Thanh điều hướng quản trị"
      className={cn(
        "safe-bottom shadow-xs relative z-40 flex w-full items-center border-t border-stone-200/80 bg-white/95 backdrop-blur-md",
        className,
      )}
    >
      {/* Nút thoát về Customer mode */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex min-h-[52px] w-12 shrink-0 touch-manipulation select-none flex-col items-center justify-center border-r border-stone-200/60 py-1.5 transition-colors focus:outline-none active:scale-95"
        title="Quay lại cửa hàng"
        aria-label="Quay lại cửa hàng"
      >
        <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
          <Icon icon="zi-home" className="shrink-0 text-xl text-stone-500" />
        </div>
        <span className="mt-1 text-[11px] font-semibold tracking-tight text-stone-500">
          Khách
        </span>
      </button>

      {/* 4 Tabs Quản trị chính */}
      {ADMIN_NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.path
          : pathname.startsWith(item.path);

        return (
          <button
            type="button"
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex min-h-[52px] w-full flex-1 touch-manipulation select-none flex-col items-center justify-center py-1.5 transition-colors focus:outline-none active:scale-95"
            aria-label={item.name}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <Icon
                icon={item.icon}
                className={cn(
                  "shrink-0 text-xl transition-colors",
                  isActive ? "text-primary" : "text-stone-500",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-1 text-[11px] font-semibold tracking-tight transition-colors",
                isActive ? "font-extrabold text-primary" : "text-stone-500",
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
