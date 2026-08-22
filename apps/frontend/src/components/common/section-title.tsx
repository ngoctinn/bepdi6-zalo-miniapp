import { Text } from "zmp-ui";

interface SectionTitleProps {
  title: string;
  image?: string;
  hideIcon?: boolean;
}

export default function SectionTitle({
  title,
  image,
  hideIcon = false,
}: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-1 rounded-full bg-primary" />
      <Text.Title size="small" className="text-base font-bold text-stone-900">
        {title}
      </Text.Title>
    </div>
  );
}
