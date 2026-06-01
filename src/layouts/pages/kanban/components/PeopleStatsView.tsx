import { AlertTriangle, Users, CheckCircle2, ListTodo, BarChart3, Loader2 } from "lucide-react";
import { cn } from "lib/utils";
import { PersonKanbanStats, KANBAN_STATUSES } from "../utils/buildPersonStats";
import { useUserPhotos } from "../hooks/useUserPhotos";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bar: string; textColor: string; bg: string }
> = {
  Backlog: {
    label: "Backlog",
    color: "bg-slate-400",
    bar: "bg-slate-400",
    textColor: "text-slate-600",
    bg: "bg-slate-50",
  },
  Realization: {
    label: "Realization",
    color: "bg-blue-500",
    bar: "bg-blue-500",
    textColor: "text-blue-600",
    bg: "bg-blue-50",
  },
  UAT: {
    label: "UAT",
    color: "bg-violet-500",
    bar: "bg-violet-500",
    textColor: "text-violet-600",
    bg: "bg-violet-50",
  },
  Preparation: {
    label: "Prep",
    color: "bg-amber-400",
    bar: "bg-amber-400",
    textColor: "text-amber-600",
    bg: "bg-amber-50",
  },
  Done: {
    label: "Done",
    color: "bg-emerald-500",
    bar: "bg-emerald-500",
    textColor: "text-emerald-600",
    bg: "bg-emerald-50",
  },
};

const AVATAR_PALETTES = [
  { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-200" },
  { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
  { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-200" },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" },
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" },
  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-200" },
];

const avatarPalette = (name: string) =>
  AVATAR_PALETTES[(name.charCodeAt(0) ?? 0) % AVATAR_PALETTES.length];

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

// ─── PersonAvatar ─────────────────────────────────────────────────────────────

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
          "w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center ring-2 ring-white shadow-sm",
          palette.bg
        )}
      >
        <Loader2 className={cn("w-5 h-5 animate-spin", palette.text)} />
      </div>
    );
  }

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-2 ring-white shadow-sm"
      />
    );
  }

  return (
    <div
      className={cn(
        "w-16 h-16 rounded-2xl shrink-0 flex items-center justify-center text-xl font-bold ring-2 ring-white shadow-sm",
        palette.bg,
        palette.text
      )}
    >
      {initials || "?"}
    </div>
  );
};

// ─── SummaryKpi ──────────────────────────────────────────────────────────────

const SummaryKpi = ({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) => (
  <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3 min-w-0">
    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", accent)}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">
        {label}
      </p>
      <p className="text-xl font-bold text-slate-800 leading-tight tabular-nums">
        {value}
        {sub && <span className="text-sm font-semibold text-slate-400 ml-0.5">{sub}</span>}
      </p>
    </div>
  </div>
);

// ─── PersonCard ───────────────────────────────────────────────────────────────

interface PersonCardProps {
  person: PersonKanbanStats;
  getPhoto: (id: string) => string | null | undefined;
  onPersonClick: (userId: string) => void;
}

const PersonCard = ({ person, getPhoto, onPersonClick }: PersonCardProps) => {
  const palette = avatarPalette(person.name);

  return (
    <button
      type="button"
      onClick={() => onPersonClick(person.userId)}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md hover:ring-1 hover:ring-indigo-100 hover:border-indigo-200 transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      tabIndex={0}
      aria-label={`${person.name} – ${person.total} görev`}
    >
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <PersonAvatar userId={person.userId} name={person.name} getPhoto={getPhoto} />

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-800 text-sm leading-snug truncate group-hover:text-indigo-700 transition-colors">
              {person.name}
            </p>
            <span
              className={cn(
                "shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full",
                palette.bg,
                palette.text
              )}
            >
              {person.total}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">
              {person.activeCount} aktif
            </span>
            {person.criticalCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-600">
                <AlertTriangle className="w-2.5 h-2.5" />
                {person.criticalCount} kritik
              </span>
            )}
            {person.donePercent === 100 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Tamamlandı
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Segmented progress bar ── */}
      <div className="flex h-2 w-full rounded-full overflow-hidden gap-px bg-slate-100">
        {KANBAN_STATUSES.map((status) => {
          const count = person.byStatus[status] ?? 0;
          if (count === 0) return null;
          const pct = (count / person.total) * 100;
          return (
            <div
              key={status}
              className={cn(
                "h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full",
                STATUS_CONFIG[status].bar
              )}
              style={{ width: `${pct}%` }}
              title={`${STATUS_CONFIG[status].label}: ${count}`}
            />
          );
        })}
      </div>

      {/* ── Status counters ── */}
      <div className="grid grid-cols-5 gap-1">
        {KANBAN_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const count = person.byStatus[status] ?? 0;
          return (
            <div
              key={status}
              className={cn(
                "flex flex-col items-center rounded-lg py-1.5 gap-0.5 transition-opacity",
                count === 0 ? "opacity-30" : ""
              )}
            >
              <span className={cn("text-base font-bold tabular-nums leading-none", cfg.textColor)}>
                {count}
              </span>
              <span className="text-[9px] text-slate-400 font-medium text-center leading-none">
                {cfg.label}
              </span>
              <div className={cn("w-4 h-[2px] rounded-full mt-0.5", count > 0 ? cfg.bar : "bg-slate-200")} />
            </div>
          );
        })}
      </div>

      {/* ── Completion rate ── */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          <div className="w-full max-w-[80px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700"
              style={{ width: `${person.donePercent}%` }}
            />
          </div>
          <span className="text-emerald-600 font-bold tabular-nums">{person.donePercent}%</span>
          <span>tamamlandı</span>
        </div>
        <span className="text-[10px] text-slate-300 font-medium group-hover:text-indigo-400 transition-colors">
          Filtreyle gör →
        </span>
      </div>
    </button>
  );
};

// ─── PeopleStatsView ─────────────────────────────────────────────────────────

interface PeopleStatsViewProps {
  stats: PersonKanbanStats[];
  onPersonClick: (userId: string) => void;
}

const PeopleStatsView = ({ stats, onPersonClick }: PeopleStatsViewProps) => {
  const { getPhoto } = useUserPhotos();

  const totalTasks = stats.reduce((s, p) => s + p.total, 0);
  const totalCritical = stats.reduce((s, p) => s + p.criticalCount, 0);
  const avgDone =
    stats.length > 0
      ? Math.round(stats.reduce((s, p) => s + p.donePercent, 0) / stats.length)
      : 0;

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-2">
          <Users className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-slate-500 font-semibold">Görevli kişi bulunamadı</p>
        <p className="text-slate-400 text-sm max-w-xs">
          Mevcut filtrelere uygun atanan kişi yok. Filtrelerinizi genişletmeyi deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryKpi
          icon={<Users className="w-4 h-4 text-indigo-600" />}
          label="Kişi Sayısı"
          value={stats.length}
          accent="bg-indigo-50"
        />
        <SummaryKpi
          icon={<ListTodo className="w-4 h-4 text-sky-600" />}
          label="Toplam Görev"
          value={totalTasks}
          accent="bg-sky-50"
        />
        <SummaryKpi
          icon={<BarChart3 className="w-4 h-4 text-emerald-600" />}
          label="Ort. Tamamlanma"
          value={avgDone}
          sub="%"
          accent="bg-emerald-50"
        />
        <SummaryKpi
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          label="Kritik Görev"
          value={totalCritical}
          accent="bg-red-50"
        />
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {KANBAN_STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", STATUS_CONFIG[s].bar)} />
            <span className="text-[11px] text-slate-500 font-medium">{s}</span>
          </div>
        ))}
      </div>

      {/* ── Person grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((person) => (
          <PersonCard
            key={person.userId}
            person={person}
            getPhoto={getPhoto}
            onPersonClick={onPersonClick}
          />
        ))}
      </div>
    </div>
  );
};

export default PeopleStatsView;
