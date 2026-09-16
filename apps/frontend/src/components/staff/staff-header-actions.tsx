import { BackIcon, StoreIcon } from "@/components/common/vectors";
import { Icon } from "zmp-ui";
import { useNavigate } from "react-router-dom";
import { copy } from "@/constants/copy";

interface StaffHeaderActionsProps {
  isSoundEnabled: boolean;
  isRefetching: boolean;
  onToggleSound: () => void;
  onRefetch: () => void;
}

export function StaffHeaderActions({
  isSoundEnabled,
  isRefetching,
  onToggleSound,
  onRefetch,
}: StaffHeaderActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="header-margin flex items-center justify-between px-3.5 pb-2.5 pr-20 pt-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-neutral-800 transition-all active:scale-95"
          aria-label={copy.staff.backToMenu}
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-1.5">
          <StoreIcon className="h-4 w-4 shrink-0 text-primary" />
          <h1 className="truncate text-base font-extrabold tracking-tight text-neutral900">
            {copy.staff.title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Toggle Sound */}
        <button
          onClick={onToggleSound}
          className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-bold transition-all active:scale-95 ${
            isSoundEnabled
              ? "border border-primary/30 bg-olive100 text-olive900"
              : "border border-stone-200 bg-stone-100/80 text-stone-600"
          }`}
          title={
            isSoundEnabled
              ? copy.staff.soundBtnTitleOn
              : copy.staff.soundBtnTitleOff
          }
        >
          <Icon
            icon={isSoundEnabled ? "zi-notif-ring" : "zi-notif"}
            className="flex shrink-0 items-center justify-center text-sm leading-none"
          />
          <span className="leading-none">
            {isSoundEnabled ? copy.staff.soundBtnOn : copy.staff.soundBtnOff}
          </span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefetch}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100/80 text-stone-700 transition-all active:scale-95"
          aria-label={copy.staff.refreshLabel}
        >
          <Icon
            icon="zi-retry"
            className={`flex items-center justify-center text-sm leading-none ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
