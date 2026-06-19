import { Loader2 } from "lucide-react";

import { cn } from "lib/utils";

import type { UserProjectStatsDto } from "../types";

const PALETTES = [
  { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300" },
  { bg: "bg-violet-100 dark:bg-violet-950/60", text: "text-violet-700 dark:text-violet-300" },
  { bg: "bg-sky-100 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300" },
  { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300" },
  { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300" },
] as const;

const palette = (name: string) => PALETTES[(name.charCodeAt(0) ?? 0) % PALETTES.length];

const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

type PersonAvatarProps = {
  userId: string;
  name: string;
  getPhoto: (id: string) => string | null | undefined;
};

const PersonAvatar = ({ userId, name, getPhoto }: PersonAvatarProps) => {
  const photo = getPhoto(userId);
  const p = palette(name);
  const ini = initials(name);

  if (photo === undefined) {
    return (
      <div
        className={cn(
          "flex size-12 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-2 ring-white",
          p.bg,
        )}
      >
        <Loader2 className={cn("size-4 animate-spin", p.text)} />
      </div>
    );
  }

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="size-12 shrink-0 rounded-2xl object-cover shadow-sm ring-2 ring-white"
      />
    );
  }

  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm ring-2 ring-white",
        p.bg,
        p.text,
      )}
    >
      {ini || "?"}
    </div>
  );
};

type UserProjectStatsCardProps = {
  user: UserProjectStatsDto;
  getPhoto: (id: string) => string | null | undefined;
};

export const UserProjectStatsCard = ({ user, getPhoto }: UserProjectStatsCardProps) => {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const p = palette(fullName);

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-border dark:bg-card",
        "transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:ring-1 hover:ring-indigo-100 dark:hover:border-indigo-800",
        "focus-within:ring-2 focus-within:ring-indigo-300",
      )}
      aria-label={`${fullName} – ${user.projectCount} proje`}
    >
      <div className="flex items-start gap-3">
        <PersonAvatar userId={user.userId} name={fullName} getPhoto={getPhoto} />

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-indigo-700 dark:text-foreground dark:group-hover:text-indigo-400">
              {fullName}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                p.bg,
                p.text,
              )}
            >
              {user.projectCount}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {user.departmentText || "—"}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">
            {user.projectCount} Proje
          </p>
        </div>
      </div>

      {user.projectNames.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {user.projectNames.map((projectName) => (
            <span
              key={projectName}
              className="rounded-lg border border-border/60 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
            >
              {projectName}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Proje bulunamadı.</p>
      )}
    </article>
  );
};
