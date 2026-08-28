import { ReactNode, useRef, useEffect } from "react";
import { cn } from "@/utils/cn";

export interface Tab<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  activeTab: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: TabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto scroll active tab into view horizontally without touching window/page scroll
  useEffect(() => {
    if (!activeTab || !containerRef.current) return;
    const activeButton = containerRef.current.querySelector(
      `[data-tab-value="${activeTab}"]`,
    ) as HTMLElement;

    if (activeButton && containerRef.current) {
      const container = containerRef.current;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const containerWidth = container.offsetWidth;
      const targetScrollLeft =
        buttonLeft - containerWidth / 2 + buttonWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "horizontal-scroll flex w-full min-w-0 select-none items-center gap-2 scroll-smooth bg-transparent py-1 pr-2",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            data-tab-value={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex min-h-[36px] shrink-0 items-center justify-center rounded-xl border px-4 py-2 text-xs font-semibold transition-colors duration-150 active:scale-[0.98]",
              "outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
              "select-none whitespace-nowrap",
              isActive
                ? "border-primary/30 bg-olive50/80 text-olive900"
                : "border-black/[0.06] bg-stone-50/70 text-neutral700 hover:border-black/10 hover:bg-stone-50 hover:text-olive900",
            )}
            type="button"
          >
            {tab.icon && (
              <span className="mr-1.5 flex-shrink-0">{tab.icon}</span>
            )}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "ml-1.5 rounded-md px-1.5 py-0.5 text-xxxxsmall font-bold",
                  isActive
                    ? "bg-olive100 text-olive900"
                    : "bg-black/[0.07] text-neutral600",
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
