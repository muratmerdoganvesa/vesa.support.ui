import { Loader2 } from "lucide-react";
import { cn } from "lib/utils";
import { PersonGanttWorkload } from "../types";

// ─── Avatar palette (deterministic by name) ───────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300", ring: "ring-indigo-200" },
  { bg: "bg-violet-100 dark:bg-violet-950/60", text: "text-violet-700 dark:text-violet-300", ring: "ring-violet-200" },
  { bg: "bg-sky-100 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300", ring: "ring-sky-200" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200" },
  { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", ring: "ring-amber-200" },
  { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", ring: "ring-rose-200" },
];

const avatarPalette = (name: string) =>
  AVATAR_PALETTES[(name.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface PersonAvatarProps {
  userId: string;
  name: string;
  getPhoto: (id: string) => string | null | undefined;
}

const PersonAvatar = ({ userId, name, getPhoto }: PersonAvatarProps) => {
  const photo = getPhoto(userId);
  const palette = avatarPalette(name);
  const initials = getInitials(name);

  if (photo === undefined) {
    return (
      <div
        className={cn(
          "size-14 rounded-2xl shrink-0 flex items-center justify-center ring-2 ring-white shadow-sm",
          palette.bg,
        )}
      >
        <Loader2 className={cn("size-5 animate-spin", palette.text)} />
      </div>
    );
  }

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="size-14 rounded-2xl object-cover shrink-0 ring-2 ring-white shadow-sm"
      />
    );
  }

  return (
    <div
      className={cn(
        "size-14 rounded-2xl shrink-0 flex items-center justify-center text-lg font-bold ring-2 ring-white shadow-sm",
        palette.bg,
        palette.text,
      )}
    >
      {initials || "?"}
    </div>
  );
};

// ─── Project breakdown row ────────────────────────────────────────────────────

interface ProjectBreakdownRowProps {
  name: string;
  taskCount: number;
  avgProgress: number;
}

const ProjectBreakdownRow = ({ name, taskCount, avgProgress }: ProjectBreakdownRowProps) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-muted-foreground/60 text-[10px]">▸</span>
        <span className="text-[11px] font-medium text-foreground truncate">{name}</span>
      </div>
      <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
        {taskCount} görev
      </span>
    </div>
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            avgProgress >= 80
              ? "bg-emerald-500"
              : avgProgress >= 50
                ? "bg-indigo-500"
                : "bg-amber-400",
          )}
          style={{ width: `${avgProgress}%` }}
        />
      </div>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
        {avgProgress}%
      </span>
    </div>
  </div>
);

// ─── Main card ────────────────────────────────────────────────────────────────

interface PersonnelWorkloadCardProps {
  person: PersonGanttWorkload;
  getPhoto: (id: string) => string | null | undefined;
}

const PersonnelWorkloadCard = ({ person, getPhoto }: PersonnelWorkloadCardProps) => {
  const palette = avatarPalette(person.name);

  return (
    <div
      className="w-full bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md hover:ring-1 hover:ring-indigo-100 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200 group"
      aria-label={`${person.name} – ${person.totalTasks} görev, ${person.byProject.length} proje`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <PersonAvatar userId={person.userId} name={person.name} getPhoto={getPhoto} />

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-800 dark:text-foreground text-sm leading-snug truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
              {person.name}
            </p>
            <span
              className={cn(
                "shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full",
                palette.bg,
                palette.text,
              )}
            >
              {person.totalTasks}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">
              {person.byProject.length} proje
            </span>
          </div>
        </div>
      </div>

      {/* Project breakdown */}
      <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-100 dark:border-border/60">
        {person.byProject.map((bp) => {
          const label = bp.subProjectName
            ? `${bp.projectName} – ${bp.subProjectName}`
            : bp.projectName;
          return (
            <ProjectBreakdownRow
              key={bp.projectId}
              name={label}
              taskCount={bp.taskCount}
              avgProgress={bp.avgProgress}
            />
          );
        })}
      </div>

      {/* Footer: overall completion */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border/60">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${person.avgProgress}%` }}
            />
          </div>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
            {person.avgProgress}%
          </span>
          <span>tamamlandı</span>
        </div>
      </div>
    </div>
  );
};

export default PersonnelWorkloadCard;
