import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { StoreIcon } from "@/components/common/vectors";

interface AdminFooterProps {
  className?: string;
}

// Custom clean icons for Admin tabs using CSS variables
function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--theme-primary, #ea580c)" : "#78716C"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="9"
        rx="1"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="5"
        rx="1"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
      <rect
        x="14"
        y="12"
        width="7"
        height="9"
        rx="1"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
      <rect
        x="3"
        y="16"
        width="7"
        height="5"
        rx="1"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
    </svg>
  );
}

function KitchenIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--theme-primary, #ea580c)" : "#78716C"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M3 9L4.5 4H19.5L21 9V11C21 12.1 20.1 13 19 13C17.9 13 17 12.1 17 11C17 12.1 16.1 13 15 13C13.9 13 13 12.1 13 11C13 12.1 12.1 13 11 13C9.9 13 9 12.1 9 11C9 12.1 8.1 13 7 13C5.9 13 5 12.1 5 11V9H3Z"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
      <path d="M4 13V20C4 20.5523 4.44772 21 5 21H19C19.5523 21 20 20.5523 20 20V13" />
      <path d="M9 21V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V21" />
    </svg>
  );
}

function ManageIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--theme-primary, #ea580c)" : "#78716C"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "var(--theme-primary, #ea580c)" : "#78716C"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
        fill={active ? "var(--theme-primary-light, #ffedd5)" : "none"}
      />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BackToShopIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#78716C"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
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
      icon: DashboardIcon,
    },
    {
      name: "Bếp",
      path: "/admin/kitchen",
      exact: false,
      icon: KitchenIcon,
    },
    {
      name: "Quản lý",
      path: "/admin/manage",
      exact: false,
      icon: ManageIcon,
    },
    {
      name: "Cài đặt",
      path: "/admin/settings",
      exact: false,
      icon: SettingsIcon,
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Thanh điều hướng quản trị"
      className={cn(
        "safe-bottom bg-white/98 relative z-40 flex w-full items-center border-t-2 border-primary shadow-md backdrop-blur-md",
        className,
      )}
    >
      {/* Nút thoát về Customer mode */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex min-h-[52px] w-12 touch-manipulation select-none flex-col items-center justify-center border-r border-black/5 py-1.5 transition-all focus:outline-none active:scale-95"
        title="Quay lại cửa hàng"
        aria-label="Quay lại cửa hàng"
      >
        <div className="relative flex h-6 w-6 items-center justify-center">
          <BackToShopIcon />
        </div>
        <span className="mt-1 text-[10px] font-medium tracking-tight text-stone-500">
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
            className="flex min-h-[52px] w-full flex-1 touch-manipulation select-none flex-col items-center justify-center py-1.5 transition-all focus:outline-none active:scale-95"
            aria-label={item.name}
            aria-current={isActive ? "page" : undefined}
          >
            <div className="relative flex h-6 w-6 items-center justify-center">
              <item.icon active={isActive} />
            </div>
            <span
              className={cn(
                "mt-1 text-xxxxsmall font-bold tracking-tight transition-colors",
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
