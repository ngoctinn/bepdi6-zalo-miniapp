import { useNavigate } from "react-router-dom";
import { Button, Text } from "zmp-ui";
import Logo from "../common/logo";
import { BackIcon } from "../common/vectors";
import { copy, theme } from "@/constants/copy";

interface HeaderProps {
  title?: string;
  back?: boolean;
  position?: "fixed" | "sticky" | "static" | "relative";
}

export default function Header({ title, back, position }: HeaderProps) {
  const navigate = useNavigate();

  const positionClass = position || (title ? "fixed" : "sticky");

  if (title) {
    return (
      <div
        className={`${positionClass} header-margin shadow-2xs left-0 top-0 z-20 flex h-12 w-full items-center gap-2 border-b border-neutral100 bg-white px-4 py-2 pr-24`}
        style={{ color: theme.colors.text.primary }}
      >
        {back && (
          <Button
            className="flex h-8 w-8 items-center justify-center bg-transparent p-0 active:bg-transparent"
            type="neutral"
            size="small"
            onClick={() => navigate(-1)}
          >
            <BackIcon className="h-5 w-5 text-neutral800" />
          </Button>
        )}
        <div className="truncate text-base font-bold text-neutral900">
          {title}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${positionClass} header-margin left-0 top-0 z-20 flex h-12 w-full items-center gap-1.5 bg-background px-4 py-2 pr-24`}
    >
      <Logo />
      <div className="truncate text-base font-bold text-primary">
        {copy.brand.name}
      </div>
    </div>
  );
}
