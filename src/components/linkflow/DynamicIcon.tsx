import * as icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface DynamicIconProps extends React.ComponentProps<"svg"> {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  const formattedName = name
    .split("-")
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join("") as keyof typeof icons;

  const IconComponent = icons[formattedName] as LucideIcon | undefined;

  if (!IconComponent) {
    const Fallback = icons.Globe as LucideIcon;
    return <Fallback {...props} />;
  }

  return <IconComponent {...props} />;
}
