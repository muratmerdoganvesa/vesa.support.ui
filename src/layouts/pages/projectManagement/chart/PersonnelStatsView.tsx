import { useMemo } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock, ListTodo, Loader2, Users } from "lucide-react";
import { cn } from "lib/utils";
import { useUserPhotos } from "layouts/pages/kanban/hooks/useUserPhotos";
import { useCompanyGanttWorkload } from "../projectDashboard/hooks/useCompanyGanttWorkload";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartPersonStat = {
  userId: string;
  name: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  avgProgress: number;
  isBlocked?: boolean;
};

type UnassignedTask = {
  Id: string;
  TaskName: string;
  Progress: number;
};

type PersonnelData = {
  persons: ChartPersonStat[];
  unassignedTasks: UnassignedTask[];
};

// ─── Stats builder (pure function — runs inside useMemo) ─────────────────────

export const buildChartPersonStats = (
  tasks: any[],
  blockedUserIds?: ReadonlyMap<string, boolean>,
): PersonnelData => {
  type PersonAccum = ChartPersonStat & { progressSum: number };
  const personMap = new Map<string, PersonAccum>();
  const unassignedTasks: UnassignedTask[] = [];

  for (const task of tasks) {
    const users: any[] = task.resources ?? [];

    if (users.length === 0) {
      unassignedTasks.push({ Id: task.Id, TaskName: task.TaskName, Progress: task.Progress ?? 0 });
      continue;
    }

    for (const user of users) {
      const userId = String(user.id ?? user.Id ?? "").trim();
      if (!userId) continue;

      const name = user.fullName
        ? String(user.fullName).trim()
        : `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.userName || userId;

      if (!personMap.has(userId)) {
        personMap.set(userId, {
          userId,
          name,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          notStartedTasks: 0,
          avgProgress: 0,
          progressSum: 0,
          isBlocked: blockedUserIds?.get(userId) ?? false,
        });
      }

      const p = personMap.get(userId)!;
      const prog = task.Progress ?? 0;
      p.totalTasks += 1;
      p.progressSum += prog;
      if (prog >= 100) p.completedTasks += 1;
      else if (prog > 0) p.inProgressTasks += 1;
      else p.notStartedTasks += 1;
    }
  }

  const persons: ChartPersonStat[] = Array.from(personMap.values())
    .map(({ progressSum, ...p }) => ({
      ...p,
      avgProgress: p.totalTasks > 0 ? Math.round(progressSum / p.totalTasks) : 0,
    }))
    .sort((a, b) => b.totalTasks - a.totalTasks || a.name.localeCompare(b.name));

  return { persons, unassignedTasks };
};

// ─── Avatar palette ───────────────────────────────────────────────────────────

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

// ─── Progress ring (SVG) ──────────────────────────────────────────────────────

const ProgressRing = ({ pct, size = 44, stroke = 4 }: { pct: number; size?: number; stroke?: number }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const cx = size / 2;

  const color =
    pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-indigo-500" : "text-amber-400";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      className="shrink-0 motion-reduce:transition-none"
    >
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-slate-200 dark:text-slate-700"
      />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cx})`}
        className={cn("transition-all duration-700 motion-reduce:transition-none", color)}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size < 48 ? 10 : 12}
        fontWeight={700}
        className="fill-current text-foreground"
      >
        {pct}%
      </text>
    </svg>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

const PersonAvatar = ({
  userId,
  name,
  getPhoto,
}: {
  userId: string;
  name: string;
  getPhoto: (id: string) => string | null | undefined;
}) => {
  const photo = getPhoto(userId);
  const p = palette(name);
  const ini = initials(name);

  if (photo === undefined) {
    return (
      <div className={cn("size-12 rounded-2xl shrink-0 flex items-center justify-center ring-2 ring-white shadow-sm", p.bg)}>
        <Loader2 className={cn("size-4 animate-spin", p.text)} />
      </div>
    );
  }
  if (photo) {
    return <img src={photo} alt={name} className="size-12 rounded-2xl object-cover shrink-0 ring-2 ring-white shadow-sm" />;
  }
  return (
    <div className={cn("size-12 rounded-2xl shrink-0 flex items-center justify-center text-sm font-bold ring-2 ring-white shadow-sm", p.bg, p.text)}>
      {ini || "?"}
    </div>
  );
};

// ─── Status bar ───────────────────────────────────────────────────────────────

const StatusBar = ({ done, inProg, notStarted, total }: { done: number; inProg: number; notStarted: number; total: number }) => {
  if (total === 0) return null;
  const pDone = (done / total) * 100;
  const pInProg = (inProg / total) * 100;
  const pNot = (notStarted / total) * 100;

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 gap-px">
      {pDone > 0 && (
        <div
          className="h-full rounded-l-full bg-emerald-500 transition-all duration-700 motion-reduce:transition-none"
          style={{ width: `${pDone}%` }}
          title={`Tamamlanan: ${done}`}
        />
      )}
      {pInProg > 0 && (
        <div
          className="h-full bg-indigo-500 transition-all duration-700 motion-reduce:transition-none"
          style={{ width: `${pInProg}%` }}
          title={`Devam Eden: ${inProg}`}
        />
      )}
      {pNot > 0 && (
        <div
          className="h-full rounded-r-full bg-slate-300 dark:bg-slate-600 transition-all duration-700 motion-reduce:transition-none"
          style={{ width: `${pNot}%` }}
          title={`Başlanmamış: ${notStarted}`}
        />
      )}
    </div>
  );
};

// ─── Person card ──────────────────────────────────────────────────────────────

const PersonCard = ({
  person,
  getPhoto,
}: {
  person: ChartPersonStat;
  getPhoto: (id: string) => string | null | undefined;
}) => {
  const isBlocked = person.isBlocked === true;
  const stats = [
    { icon: <CheckCircle2 className="size-3.5 text-emerald-600" />, label: "Tamamlanan", value: person.completedTasks, color: "text-emerald-700 dark:text-emerald-400" },
    { icon: <Clock className="size-3.5 text-indigo-500" />, label: "Devam Eden", value: person.inProgressTasks, color: "text-indigo-700 dark:text-indigo-300" },
    { icon: <ListTodo className="size-3.5 text-slate-400" />, label: "Başlanmamış", value: person.notStartedTasks, color: "text-slate-600 dark:text-slate-400" },
  ];

  return (
    <article
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-border bg-white dark:bg-card p-4 shadow-sm",
        "transition-all duration-200 focus-within:ring-2 focus-within:ring-indigo-300",
        isBlocked
          ? "opacity-75"
          : "hover:shadow-md hover:ring-1 hover:ring-indigo-100 hover:border-indigo-200 dark:hover:border-indigo-800",
      )}
      aria-label={`${person.name} – ${person.totalTasks} görev, %${person.avgProgress} tamamlandı`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <PersonAvatar userId={person.userId} name={person.name} getPhoto={getPhoto} />

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug text-slate-800 dark:text-foreground truncate group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
              {person.name}
            </p>
            <span
              className={cn(
                "shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full",
                palette(person.name).bg,
                palette(person.name).text,
              )}
            >
              {person.totalTasks}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isBlocked ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Devam etmiyor
              </span>
            ) : (
              `${person.totalTasks} görev atanmış`
            )}
          </p>
        </div>
      </div>

      {/* Progress ring + stats */}
      <div className="flex items-center gap-4">
        <ProgressRing pct={person.avgProgress} />
        <div className="grid grid-cols-3 flex-1 gap-1">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center rounded-lg py-1.5 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-0.5 mb-0.5">{s.icon}</div>
              <span className={cn("text-base font-bold tabular-nums leading-none", s.color)}>{s.value}</span>
              <span className="text-[9px] text-slate-400 font-medium text-center leading-tight mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segmented progress bar */}
      <StatusBar done={person.completedTasks} inProg={person.inProgressTasks} notStarted={person.notStartedTasks} total={person.totalTasks} />
    </article>
  );
};

// ─── Unassigned card ──────────────────────────────────────────────────────────

const UnassignedCard = ({ tasks }: { tasks: UnassignedTask[] }) => {
  const count = tasks.length;
  if (count === 0) return null;

  return (
    <section
      aria-label={`Atanmamış görevler: ${count}`}
      className={cn(
        "rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-5",
        "shadow-sm shadow-amber-100 dark:shadow-amber-900/20",
        "transition-all duration-200 hover:shadow-md hover:shadow-amber-100 dark:hover:shadow-amber-900/30",
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-200 dark:ring-amber-700">
          <AlertTriangle className="size-6 text-amber-600 dark:text-amber-400" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm leading-tight">
            Atanmamış Görevler
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Bu görevler henüz bir kişiye atanmamış.
          </p>
        </div>
        <span className="shrink-0 text-2xl font-black tabular-nums text-amber-700 dark:text-amber-300">
          {count}
        </span>
      </div>

      {/* Task list (max 6 shown) */}
      <div className="flex flex-col gap-1.5">
        {tasks.slice(0, 6).map((t) => (
          <div
            key={t.Id}
            className="flex items-center justify-between gap-2 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 px-3 py-1.5"
          >
            <span className="text-xs text-amber-800 dark:text-amber-300 truncate">{t.TaskName}</span>
            <span className="shrink-0 text-[10px] font-medium text-amber-600 dark:text-amber-400 tabular-nums">
              {t.Progress}%
            </span>
          </div>
        ))}
        {count > 6 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-500 text-center font-medium pt-1">
            +{count - 6} görev daha
          </p>
        )}
      </div>
    </section>
  );
};

// ─── Summary KPI ──────────────────────────────────────────────────────────────

const KpiTile = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number | string; accent: string }) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", accent)}>{icon}</div>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums text-foreground leading-tight">{value}</p>
    </div>
  </div>
);

// ─── Legend ───────────────────────────────────────────────────────────────────

const Legend = () => (
  <div className="flex items-center flex-wrap gap-4 text-[11px] text-slate-500 dark:text-muted-foreground">
    {[
      { color: "bg-emerald-500", label: "Tamamlanan" },
      { color: "bg-indigo-500", label: "Devam Eden" },
      { color: "bg-slate-300 dark:bg-slate-600", label: "Başlanmamış" },
    ].map((item) => (
      <div key={item.label} className="flex items-center gap-1.5">
        <div className={cn("size-2.5 rounded-full shrink-0", item.color)} aria-hidden />
        <span className="font-medium">{item.label}</span>
      </div>
    ))}
  </div>
);

// ─── Main view ────────────────────────────────────────────────────────────────

interface PersonnelStatsViewProps {
  tasks: any[];
  workCompanyId?: string | null;
}

const PersonnelStatsView = ({ tasks, workCompanyId }: PersonnelStatsViewProps) => {
  const { getPhoto } = useUserPhotos();
  const { workload } = useCompanyGanttWorkload(workCompanyId ?? undefined);

  const blockedUserIds = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const person of workload.personnel) {
      if (person.isBlocked) {
        map.set(person.userId, true);
      }
    }
    return map;
  }, [workload.personnel]);

  const { persons, unassignedTasks } = useMemo(
    () => buildChartPersonStats(tasks, blockedUserIds),
    [tasks, blockedUserIds],
  );

  const totalAssigned = persons.reduce((s, p) => s + p.totalTasks, 0);
  const totalCompleted = persons.reduce((s, p) => s + p.completedTasks, 0);
  const avgCompletion =
    persons.length > 0 ? Math.round(persons.reduce((s, p) => s + p.avgProgress, 0) / persons.length) : 0;

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Users className="size-7 text-slate-300" aria-hidden />
        </div>
        <p className="font-semibold text-slate-500">Henüz görev yüklenmedi</p>
        <p className="text-sm text-slate-400 max-w-xs">
          Görev verileri yüklendikten sonra kişi istatistikleri burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-0 py-2 overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile
          icon={<Users className="size-4 text-indigo-600" />}
          label="Atanan Kişi"
          value={persons.length}
          accent="bg-indigo-50 dark:bg-indigo-950/40"
        />
        <KpiTile
          icon={<ListTodo className="size-4 text-sky-600" />}
          label="Atanmış Görev"
          value={totalAssigned}
          accent="bg-sky-50 dark:bg-sky-950/40"
        />
        <KpiTile
          icon={<BarChart3 className="size-4 text-emerald-600" />}
          label="Ort. Tamamlanma"
          value={`${avgCompletion}%`}
          accent="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <KpiTile
          icon={<AlertTriangle className="size-4 text-amber-500" />}
          label="Atanmamış"
          value={unassignedTasks.length}
          accent="bg-amber-50 dark:bg-amber-950/40"
        />
      </div>

      {/* Legend */}
      <Legend />

      {/* Main grid: personnel cards + unassigned */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Person cards */}
        {persons.map((person) => (
          <PersonCard key={person.userId} person={person} getPhoto={getPhoto} />
        ))}

        {/* Unassigned card — spans full width on large screens to stand out */}
        {unassignedTasks.length > 0 && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3">
            <UnassignedCard tasks={unassignedTasks} />
          </div>
        )}
      </div>

      {/* Empty personnel state */}
      {persons.length === 0 && unassignedTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Users className="size-10 text-muted-foreground/30" strokeWidth={1.25} aria-hidden />
          <p className="text-sm text-muted-foreground">Atanmış görev bulunamadı.</p>
        </div>
      )}
    </div>
  );
};

export default PersonnelStatsView;
