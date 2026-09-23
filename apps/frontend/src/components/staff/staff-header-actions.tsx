import { BackIcon, StoreIcon } from "@/components/common/vectors";
import { useNavigate } from "react-router-dom";
import { copy } from "@/constants/copy";

export function StaffHeaderActions() {
  const navigate = useNavigate();

  return (
    <div className="header-margin flex items-center justify-between px-3.5 pb-1.5 pr-28 pt-2">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={() => navigate("/")}
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
    </div>
  );
}
