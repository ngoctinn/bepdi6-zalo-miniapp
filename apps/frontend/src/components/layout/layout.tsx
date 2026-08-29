import { useEffect } from "react";
import { Outlet, useMatches, useLocation } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { cn } from "@/utils/cn";
import CartFloatButton from "../common/cart-float-button";
import { useCartStore } from "@/stores/cart.store";

export default function Layout() {
  const matches = useMatches();

  const current = matches[matches.length - 1];
  const hideFooter = (current.handle as any)?.hideFooter;
  const hideCart = (current.handle as any)?.hideCart;
  const hideHeader = (current.handle as any)?.hideHeader;
  const headerPosition = (current.handle as any)?.headerPosition;

  const { items } = useCartStore();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const location = useLocation();

  useEffect(() => {
    const cleanupGhostMasks = () => {
      document
        .querySelectorAll(".zaui-modal-wrapper, .zaui-sheet-mask")
        .forEach((el) => {
          const wrapper = el as HTMLElement;
          const hasActiveContent = wrapper.querySelector(
            '.zaui-sheet-content[style*="visibility: visible"], .zaui-modal-content',
          );
          if (!hasActiveContent && wrapper.style.display !== "none") {
            wrapper.style.pointerEvents = "none";
          } else {
            wrapper.style.pointerEvents = "auto";
          }
        });
    };
    cleanupGhostMasks();
    const interval = setInterval(cleanupGhostMasks, 1000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "relative flex h-screen w-full max-w-full flex-col overflow-x-hidden bg-background",
      )}
    >
      {!hideHeader && (
        <Header
          title={(current.handle as any)?.title}
          back={(current.handle as any)?.back}
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
          <Footer />
          {!hideCart && <CartFloatButton itemCount={totalItems} />}
        </div>
      )}
    </div>
  );
}
