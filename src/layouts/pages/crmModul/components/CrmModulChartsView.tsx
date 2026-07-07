import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { BarChart3, Building2, Layers, Target, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import { cn } from "lib/utils";
import {
  convertCurrencyTotalsToEur,
  formatEurRounded,
  type TcmbExchangeRates,
} from "../tcmbExchangeRates";
import type { CrmChartStats } from "../utils";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

type CrmModulChartsViewProps = {
  stats: CrmChartStats;
  exchangeRates: TcmbExchangeRates | null;
  exchangeRatesLoading: boolean;
};

const CHART_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#64748b",
];

const SummaryTile = ({
  label,
  value,
  subtext,
  icon,
  theme,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  theme: "indigo" | "sky" | "emerald" | "amber";
}) => {
  const themes = {
    indigo: "border-indigo-200/70 bg-indigo-50/40 text-indigo-950",
    sky: "border-sky-200/70 bg-sky-50/40 text-sky-950",
    emerald: "border-emerald-200/70 bg-emerald-50/40 text-emerald-950",
    amber: "border-amber-200/70 bg-amber-50/40 text-amber-950",
  };

  return (
    <div className={cn("rounded-lg border px-3 py-2.5 min-w-0", themes[theme])}>
      <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className="text-xl font-bold tabular-nums leading-tight truncate">{value}</p>
      {subtext && <p className="text-[10px] mt-0.5 opacity-60 truncate">{subtext}</p>}
    </div>
  );
};

const ChartCard = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <section
    className={cn(
      "rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[280px] flex flex-col",
      className
    )}
  >
    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">{title}</h3>
    <div className="flex-1 min-h-[220px]">{children}</div>
  </section>
);

const buildChartDataset = (slices: { label: string; count: number }[]) => ({
  labels: slices.map((s) => s.label),
  datasets: [
    {
      data: slices.map((s) => s.count),
      backgroundColor: slices.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
      borderWidth: 0,
      borderRadius: 6,
    },
  ],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, maxRotation: 45, minRotation: 0 },
    },
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, font: { size: 11 } },
      grid: { color: "rgba(148,163,184,0.2)" },
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: { boxWidth: 10, font: { size: 11 } },
    },
  },
};

export const CrmModulChartsView = ({
  stats,
  exchangeRates,
  exchangeRatesLoading,
}: CrmModulChartsViewProps) => {
  const pipelineEur = useMemo(() => {
    if (!exchangeRates) return null;
    return formatEurRounded(convertCurrencyTotalsToEur(stats.pipeline, exchangeRates));
  }, [stats.pipeline, exchangeRates]);

  const wonEur = useMemo(() => {
    if (!exchangeRates) return null;
    return formatEurRounded(convertCurrencyTotalsToEur(stats.won, exchangeRates));
  }, [stats.won, exchangeRates]);

  const stageChart = useMemo(
    () => buildChartDataset(stats.stageSlices),
    [stats.stageSlices]
  );
  const leadChart = useMemo(
    () => buildChartDataset(stats.leadSourceSlices),
    [stats.leadSourceSlices]
  );
  const moduleChart = useMemo(
    () => buildChartDataset(stats.moduleSlices),
    [stats.moduleSlices]
  );

  const hasStageData = stats.stageSlices.length > 0;
  const hasLeadData = stats.leadSourceSlices.length > 0;
  const hasModuleData = stats.moduleSlices.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-slate-50/30">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="size-4 text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-800">CRM Özet Grafikleri</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryTile
          label="Müşteri"
          value={String(stats.customerCount)}
          icon={<Building2 className="size-3.5" />}
          theme="indigo"
        />
        <SummaryTile
          label="Fırsat Paketi"
          value={String(stats.opportunityPackageCount)}
          icon={<Layers className="size-3.5" />}
          theme="sky"
        />
        <SummaryTile
          label="Açık Fırsat"
          value={String(stats.openPackageCount)}
          subtext={exchangeRatesLoading ? "Kur yükleniyor..." : pipelineEur ? `Pipeline ${pipelineEur}` : undefined}
          icon={<Target className="size-3.5" />}
          theme="emerald"
        />
        <SummaryTile
          label="Kazanılan"
          value={String(stats.wonPackageCount)}
          subtext={wonEur ? `Toplam ${wonEur}` : undefined}
          icon={<Trophy className="size-3.5" />}
          theme="amber"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Pipeline Aşamaları">
          {hasStageData ? (
            <Bar data={stageChart} options={chartOptions} />
          ) : (
            <p className="text-sm text-slate-400 flex items-center justify-center h-full">
              Gösterilecek aşama verisi yok.
            </p>
          )}
        </ChartCard>

        <ChartCard title="Lead Kaynağı Dağılımı">
          {hasLeadData ? (
            <Doughnut data={leadChart} options={doughnutOptions} />
          ) : (
            <p className="text-sm text-slate-400 flex items-center justify-center h-full">
              Gösterilecek lead kaynağı yok.
            </p>
          )}
        </ChartCard>

        <ChartCard title="Modül Dağılımı" className="xl:col-span-2">
          {hasModuleData ? (
            <Bar data={moduleChart} options={chartOptions} />
          ) : (
            <p className="text-sm text-slate-400 flex items-center justify-center h-full">
              Gösterilecek modül verisi yok.
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
};
