import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "components/ui/dialog";
import PieChart from "examples/Charts/PieChart";
import channelChartData, {
  fetchChartData,
} from "layouts/dashboards/sales/components/ChannelsChart/data";
import { useBusy } from "layouts/pages/hooks/useBusy";

// ── colour palette (mirrors MDBadgeDot / configs colours) ──────────────────
const COLOR_MAP: Record<string, string> = {
  info:      "#1A73E8",
  primary:   "#7B1FA2",
  dark:      "#344767",
  secondary: "#8392AB",
  error:     "#F44335",
  warning:   "#FB8C00",
  success:   "#4CAF50",
  light:     "#ced4da",
  grey:      "#9e9e9e",
};

interface ChannelsChartProps {
  id?: string;
  isAllData?: boolean;
  isOpenTicket?: boolean;
  startDate?: string;
  endDate?: string;
}

function ChannelsChart({ id, isAllData, isOpenTicket, startDate, endDate }: ChannelsChartProps): JSX.Element {
  const [chartData, setChartData] = useState(channelChartData);
  const [detailOpen, setDetailOpen] = useState(false);
  const dispatchBusy = useBusy();

  useEffect(() => {
    dispatchBusy({ isBusy: true });
    fetchChartData(id, isAllData, isOpenTicket, startDate, endDate)
      .then(setChartData)
      .finally(() => dispatchBusy({ isBusy: false }));
  }, [id, isAllData, isOpenTicket, startDate, endDate]);

  const chartTitle = `Müşteri bazlı ${isAllData ? "Toplam" : "Açık"} Talep Sayısı`;

  const isEmpty = (chartData.datasets as any).isEmpty === true;

  return (
    <>
      {/* ── Main card ── */}
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 shadow-sm">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-3">
          <CardTitle className="text-sm font-semibold text-foreground">{chartTitle}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setDetailOpen(true)}
            title="Detaylı bilgi"
          >
            <Info className="size-4" />
          </Button>
        </CardHeader>

        {/* Chart + legend */}
        <CardContent className="flex flex-1 flex-col gap-4 p-4">
          <div className="grid grid-cols-12 items-center gap-3">
            {/* Pie */}
            <div className="col-span-7 flex items-center justify-center">
              <div className="w-full" style={{ height: "12.5rem" }}>
                <PieChart chart={chartData} height="12.5rem" />
              </div>
            </div>

            {/* Legend */}
            <div className="col-span-5 flex flex-col gap-1.5 overflow-hidden">
              {chartData.labels.length === 0 ? (
                <p className="text-xs text-muted-foreground">Veri bulunamadı.</p>
              ) : (
                chartData.labels.map((label, index) => {
                  const colorKey = chartData.datasets.backgroundColors[index] ?? "dark";
                  const hex = COLOR_MAP[colorKey] ?? COLOR_MAP.dark;
                  const count = chartData.datasets.data[index] ?? 0;
                  return (
                    <div key={index} className="flex items-center gap-2 min-w-0">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      <span
                        className="truncate text-xs font-medium text-foreground"
                        title={`${label} (${count})`}
                      >
                        {label}
                      </span>
                      <span className="ml-auto shrink-0 tabular-nums text-[11px] text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer description + detail button */}
          <div className="mt-auto flex flex-col gap-2 border-t border-border/30 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Müşteri bazlı <strong className="font-semibold text-foreground">{isAllData ? "toplam" : "açık"} talep</strong> sayısını grafiksel olarak görebilirsiniz.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
              onClick={() => setDetailOpen(true)}
            >
              <Info className="size-3.5" />
              Detaylı Bilgi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Detail dialog ── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-indigo-500" />
              {chartTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-2">
            {chartData.labels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Gösterilecek veri bulunamadı.</p>
            ) : isEmpty ? (
              <p className="text-sm text-muted-foreground">Veri Yok</p>
            ) : (
              chartData.labels.map((label, index) => {
                const colorKey = chartData.datasets.backgroundColors[index] ?? "dark";
                const hex = COLOR_MAP[colorKey] ?? COLOR_MAP.dark;
                const count = chartData.datasets.data[index] ?? 0;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
                    <span className="tabular-nums text-sm font-bold text-foreground">{count}</span>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={() => setDetailOpen(false)}>
              <X className="mr-1.5 size-3.5" />
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ChannelsChart;
