import React, { useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import AdminFooter from "./admin-footer";
import CartFloatBar from "@/components/common/cart-float-bar";
import { DevAdminHelper } from "@/components/common/dev-admin-helper";
import { cn } from "@/utils/cn";
import { useAdminStore } from "@/stores/admin.store";

interface RouteHandle {
  title?: string;
  back?: boolean;
  hideFooter?: boolean;
  hideHeader?: boolean;
  hideCart?: boolean;
  headerPosition?: "fixed" | "sticky" | "static";
}

export default function Layout() {
  const matches = useMatches();
  const location = useLocation();
  const pathname = location.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const setIsAdminMode = useAdminStore((s) => s.setIsAdminMode);

  useEffect(() => {
    setIsAdminMode(isAdminRoute);
  }, [isAdminRoute, setIsAdminMode]);

  const current = matches[matches.length - 1];
  const handle = current?.handle as RouteHandle | undefined;
  const hideFooter = handle?.hideFooter;
  const hideHeader = handle?.hideHeader;
  const hideCart = handle?.hideCart || isAdminRoute;
  const headerPosition = handle?.headerPosition;

  return (
    <div
      data-theme={isAdminRoute ? "admin" : "customer"}
      className={cn(
        "relative flex h-dvh min-h-dvh w-full max-w-full flex-col overflow-x-hidden bg-background",
        isAdminRoute && "admin-theme",
      )}
    >
      {!hideHeader && (
        <Header
          title={handle?.title}
          back={handle?.back}
          position={headerPosition}
        />
      )}
      <div
        id="main-scroll-container"
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
      >
        <Outlet />
      </div>
      {!hideFooter && (
        <div className="relative shrink-0">
          {!hideCart && <CartFloatBar />}
          {isAdminRoute ? <AdminFooter /> : <Footer />}
        </div>
      )}
      <DevAdminHelper />
    </div>
  );
}
