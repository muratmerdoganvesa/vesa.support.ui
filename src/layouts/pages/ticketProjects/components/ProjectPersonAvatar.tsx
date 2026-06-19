import { Loader2 } from "lucide-react";
import { cn } from "lib/utils";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "components/ui/tooltip";

const PALETTES = [
  { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300" },
  { bg: "bg-violet-100 dark:bg-violet-950/60", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-sky-100 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300" },
] as const;

const palette = (name: string) => PALETTES[(name.charCodeAt(0) ?? 0) % PALETTES.length];

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const normalizePhoto = (raw?: string | null): string | null => {
  if (!raw) return null;
  if (raw.startsWith("data:image")) return raw;
  return `data:image/png;base64,${raw}`;
};

type ProjectPersonAvatarProps = {
  fullName: string;
  profilePhoto?: string | null;
  size?: "sm" | "default" | "lg";
  showTooltip?: boolean;
  className?: string;
};

export const ProjectPersonAvatar = ({
  fullName,
  profilePhoto,
  size = "default",
  showTooltip = true,
  className,
}: ProjectPersonAvatarProps) => {
  const photo = normalizePhoto(profilePhoto);
  const p = palette(fullName);
  const ini = initials(fullName);

  const avatar = (
    <Avatar size={size} className={cn("ring-2 ring-background shadow-sm", className)}>
      {photo ? (
        <AvatarImage src={photo} alt={fullName} />
      ) : (
        <AvatarFallback className={cn(p.bg, p.text, "text-xs font-bold")}>
          {ini || "?"}
        </AvatarFallback>
      )}
    </Avatar>
  );

  if (!showTooltip) return avatar;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="relative z-10 inline-flex shrink-0 cursor-default rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={0}
          aria-label={fullName}
        >
          {avatar}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {fullName}
      </TooltipContent>
    </Tooltip>
  );
};

export const ProjectPersonAvatarLoading = ({
  size = "default",
  className,
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
}) => (
  <Avatar size={size} className={cn("ring-2 ring-background", className)}>
    <AvatarFallback className="bg-muted">
      <Loader2 className="size-3 animate-spin text-muted-foreground" />
    </AvatarFallback>
  </Avatar>
);
