import { useMemo, ReactNode, useRef, useEffect } from "react";

import { Line } from "react-chartjs-2";

import { cn } from "lib/utils";
import configs from "examples/Charts/LineCharts/ReportsLineChart/configs";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorVariant =
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "dark";

interface Props {
  color?: ColorVariant;
  title: string;
  description?: string | ReactNode;
  photo?: string | ReactNode;
  date: string;
  chart: {
    labels: string[];
    datasets: { label: string; data: number[] };
  };
  [key: string]: any;
}

// ─── Color → gradient map ────────────────────────────────────────────────────

const gradientMap: Record<ColorVariant, string> = {
  primary: "from-purple-400 to-purple-700 shadow-purple-400/40",
  secondary: "from-slate-400 to-slate-600 shadow-slate-400/40",
  info: "from-cyan-400 to-blue-500 shadow-cyan-400/40",
  success: "from-green-400 to-emerald-600 shadow-green-400/40",
  warning: "from-orange-400 to-amber-500 shadow-orange-400/40",
  error: "from-red-400 to-rose-600 shadow-red-400/40",
  dark: "from-gray-700 to-gray-900 shadow-gray-700/40",
};

// ─── Component ────────────────────────────────────────────────────────────────

function ReportsLineChart({
  color = "dark",
  title,
  description,
  date,
  chart,
  photo,
}: Props): JSX.Element {
  const { data, options } = configs(chart.labels || [], chart.datasets || {});
  const chartRef = useRef(null);

  useEffect(() => {
    const chartInstance = chartRef.current;
    if (chartInstance) {
      chartInstance.options.animation = {
        ...chartInstance.options.animation,
        onComplete: () => {
          console.log("Grafik çizimi tamamlandı!");
        },
      };
    }
  }, []);

  return (
    // pt-8 makes room for the -mt-8 gradient box that lifts above the card edge
    <div className="h-full pt-8">
      <div className="relative flex h-full flex-col rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">

        {/* ── Gradient chart header ──────────────────────────────────── */}
        {useMemo(
          () => (
            <div
              className={cn(
                "-mt-8 mb-2 h-48 rounded-xl bg-linear-to-tr py-2 pr-1 shadow-xl",
                gradientMap[color]
              )}
            >
              <Line data={data} ref={chartRef} options={options} />
            </div>
          ),
          [chart, color]
        )}

        {/* ── Text content ───────────────────────────────────────────── */}
        <div className="flex-1 px-1 pt-2 pb-1">
          <h6 className="text-sm font-semibold capitalize text-foreground">{title}</h6>
          <div className="mt-0.5 text-xs font-light text-muted-foreground">{description}</div>
        </div>

        {/* ── Optional employee photo ────────────────────────────────── */}
        {photo != null && (
          <img
            className="m-2.5 h-20 w-20 rounded-lg object-cover"
            alt="Employee"
            src={`data:image/png;base64,${photo}`}
          />
        )}
      </div>
    </div>
  );
}

ReportsLineChart.defaultProps = {
  color: "dark",
  description: "",
};

export default ReportsLineChart;
