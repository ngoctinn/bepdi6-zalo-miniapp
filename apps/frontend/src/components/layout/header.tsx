import { useNavigate } from "react-router-dom";
import { BackIcon } from "../common/vectors";
import { copy } from "@/constants/copy";

interface HeaderProps {
  title?: string;
  back?: boolean;
  position?: "fixed" | "sticky" | "static" | "relative";
}

export default function Header({ title, back, position }: HeaderProps) {
  const navigate = useNavigate();

  const positionClass = position || (title ? "sticky" : "sticky");

  return (
    <div
      className={`${positionClass} top-0 z-30 flex flex-col border-b border-black/5 bg-white/95 pb-2 backdrop-blur-md`}
    >
      <div className="header-margin flex h-10 items-center gap-2 px-3.5 pr-20 pt-2">
        {back && (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-neutral-800 transition-all active:scale-95"
            onClick={() => navigate(-1)}
          >
            <BackIcon className="h-5 w-5" />
          </button>
        )}
        <h1 className="truncate text-base font-extrabold tracking-tight text-neutral-900">
          {title || copy.brand.name}
        </h1>
      </div>
    </div>
  );
}
