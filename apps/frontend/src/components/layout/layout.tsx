import { Outlet, useMatches } from "react-router-dom";
import Header from "./header";
import Footer from "./footer";
import { cn } from "@/utils/cn";

export default function Layout() {
  const matches = useMatches();

  const current = matches[matches.length - 1];
  const hideFooter = (current.handle as any)?.hideFooter;
  const hideHeader = (current.handle as any)?.hideHeader;
  const headerPosition = (current.handle as any)?.headerPosition;

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
        </div>
      )}
    </div>
  );
}
