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
    <div className="header-margin flex items-center justify-between px-3.5 pb-2 pr-24 pt-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/5 text-neutral-800 transition-all active:scale-95"
          aria-label={copy.staff.backToMenu}
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-1.5">
          <StoreIcon className="h-4 w-4 shrink-0 text-primary" />
          <h1 className="truncate text-sm font-extrabold tracking-tight text-neutral-900">
            {copy.staff.title}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {/* Toggle Sound */}
        <button
          onClick={onToggleSound}
          className={`flex h-7 items-center gap-1 rounded-full px-2.5 text-xxxxsmall font-bold transition-all active:scale-95 ${
            isSoundEnabled
              ? "border border-primary bg-primary/15 text-primaryDark"
              : "border border-black/10 bg-black/[0.04] text-stone-600"
          }`}
          title={
            isSoundEnabled
              ? copy.staff.soundBtnTitleOn
              : copy.staff.soundBtnTitleOff
          }
        >
          <Icon
            icon={isSoundEnabled ? "zi-notif-ring" : "zi-notif"}
            className="text-xs"
          />
          <span>
            {isSoundEnabled ? copy.staff.soundBtnOn : copy.staff.soundBtnOff}
          </span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefetch}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-black/[0.04] text-stone-700 transition-all active:scale-95"
          aria-label={copy.staff.refreshLabel}
        >
          <Icon
            icon="zi-retry"
            className={`text-xs ${isRefetching ? "animate-spin" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}
