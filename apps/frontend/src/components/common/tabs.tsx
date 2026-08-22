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
        "horizontal-scroll w-full min-w-0 select-none items-center gap-2 scroll-smooth bg-transparent py-1",
        fullWidth ? "flex justify-between" : "flex",
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
              "flex shrink-0 items-center justify-center rounded-full px-4 py-1.5 text-xs transition-all active:scale-95",
              "select-none whitespace-nowrap",
              fullWidth ? "flex-1" : "w-auto",
              isActive
                ? "shadow-xs border border-green600 bg-emerald-500/15 font-bold text-green800"
                : "border border-black/5 bg-black/[0.03] font-medium text-stone-600 hover:bg-emerald-500/10 hover:text-green800",
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
                  "ml-1.5 rounded-full px-1.5 text-[10px] font-bold",
                  isActive
                    ? "bg-primary text-white"
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
