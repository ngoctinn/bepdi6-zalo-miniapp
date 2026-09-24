import { BackIcon, StoreIcon } from "@/components/common/vectors";
import { useLocation, useNavigate } from "react-router-dom";
import { copy } from "@/constants/copy";
import { Icon } from "zmp-ui";

interface StaffHeaderActionsProps {
  isSoundEnabled?: boolean;
  isRefetching?: boolean;
  onToggleSound?: () => void;
  onRefetch?: () => void;
}

export function StaffHeaderActions({
  isSoundEnabled = false,
  isRefetching = false,
  onToggleSound,
  onRefetch,
}: StaffHeaderActionsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isInAdminMode = location.pathname.startsWith("/admin");

  const handleBack = () => {
    if (isInAdminMode) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="header-margin flex items-center justify-between px-3.5 pb-2 pr-24 pt-2">
      {/* 1. Left: Nút Back + Title */}
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={handleBack}
          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-neutral800 transition-transform active:scale-95"
          aria-label={copy.staff.backToMenu}
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <div className="flex min-w-0 items-center gap-1.5">
          <StoreIcon className="h-4 w-4 shrink-0 text-primary" />
          <h1 className="truncate text-base font-bold tracking-tight text-neutral900">
            {copy.staff.title}
          </h1>
        </div>
      </div>

      {/* 2. Right (An toàn trước capsule Zalo): Cụm công cụ Chuông & Refresh */}
      {(onToggleSound || onRefetch) && (
        <div className="flex shrink-0 items-center gap-1.5">
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all active:scale-95 ${
                isSoundEnabled
                  ? "shadow-xs border-primary/40 bg-primaryLight font-bold text-primary"
                  : "border-stone-200 bg-stone-100/90 text-stone-500 hover:text-stone-700"
              }`}
              title={
                isSoundEnabled
                  ? copy.staff.soundBtnTitleOn
                  : copy.staff.soundBtnTitleOff
              }
              aria-label={
                isSoundEnabled
                  ? copy.staff.soundBtnTitleOn
                  : copy.staff.soundBtnTitleOff
              }
            >
              <Icon
                icon={isSoundEnabled ? "zi-notif-ring" : "zi-notif"}
                className="inline-flex shrink-0 items-center justify-center text-sm leading-none"
              />
              {isSoundEnabled && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white" />
              )}
            </button>
          )}

          {onRefetch && (
            <button
              type="button"
              onClick={onRefetch}
              className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-100/90 text-stone-700 transition-all hover:bg-stone-200 active:scale-95"
              aria-label={copy.staff.refreshLabel}
            >
              <Icon
                icon="zi-retry"
                className={`inline-flex shrink-0 items-center justify-center text-sm leading-none ${
                  isRefetching ? "animate-spin" : ""
                }`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
