import { ReactNode } from "react";
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
  fullWidth = false,
  className = "",
}: TabsProps<T>) {
  return (
    <div
      className={cn(
        "w-full min-w-0 select-none items-center gap-2 scroll-smooth py-1",
        fullWidth
          ? "flex justify-between rounded-xl border border-black/[0.06] bg-black/[0.03] p-1"
          : "horizontal-scroll flex bg-transparent",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex shrink-0 items-center justify-center px-4 py-1.5 text-xs outline-none transition-colors duration-150 focus:outline-none active:scale-95",
              "select-none whitespace-nowrap",
              fullWidth ? "flex-1 rounded-lg" : "w-auto rounded-full",
              isActive
                ? fullWidth
                  ? // Segment active: lifted white card — no hover needed (already selected)
                    "border border-black/[0.06] bg-white font-semibold text-primaryDark shadow-sm"
                  : // Chip active: solid primary tint — matches category-list.tsx token
                    "border border-primary/20 bg-primary/10 font-semibold text-primaryDark"
                : fullWidth
                  ? // Segment inactive: subtle hover bg để có touch feedback nhất quán với chip
                    "border border-transparent font-medium text-stone-500 hover:bg-black/[0.04] hover:text-primaryDark"
                  : // Chip inactive: subtle bg + hover tint (unchanged)
                    "border border-transparent bg-black/[0.04] font-medium text-stone-500 hover:bg-primary/5 hover:text-primaryDark",
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
                  "ml-1.5 rounded-full px-1.5 text-xxxxsmall font-bold",
                  isActive
                    ? fullWidth
                      ? // Segment active badge: tint trên nền trắng — đủ tương phản
                        "bg-primary/20 text-primaryDark"
                      : // Chip active badge: đậm hơn để nổi trên nền bg-primary/10
                        "bg-primaryDark/20 text-primaryDark"
                    : "bg-black/10 text-stone-600",
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
