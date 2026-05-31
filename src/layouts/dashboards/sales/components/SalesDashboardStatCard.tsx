import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  TicketCheck,
  FolderOpen,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import getConfiguration from "confiuration";
import { FormAssignApi } from "api/generated";

export interface SalesDashboardStatCardProps {
  title: string;
  count: string | number;
  percentage?: {
    value: string | number;
    label: string;
  };
  isOpenCard?: boolean;
  page?: string;
}

interface CardTheme {
  gradient: string;
  iconBg: string;
  icon: JSX.Element;
  accent: string;
}

const getCardTheme = (title: string): CardTheme => {
  switch (title) {
    case "Toplam Talep":
      return {
        gradient: "from-amber-500 via-orange-500 to-orange-600",
        iconBg: "bg-white/20",
        icon: <TicketCheck className="size-6 text-white" />,
        accent: "bg-white/10",
      };
    case "Açık Talep":
      return {
        gradient: "from-rose-500 via-red-500 to-red-600",
        iconBg: "bg-white/20",
        icon: <FolderOpen className="size-6 text-white" />,
        accent: "bg-white/10",
      };
    case "Bekleyen Formlar":
      return {
        gradient: "from-violet-500 via-purple-500 to-purple-600",
        iconBg: "bg-white/20",
        icon: <ClipboardList className="size-6 text-white" />,
        accent: "bg-white/10",
      };
    default:
      return {
        gradient: "from-slate-500 via-slate-600 to-slate-700",
        iconBg: "bg-white/20",
        icon: <TicketCheck className="size-6 text-white" />,
        accent: "bg-white/10",
      };
  }
};

const getTrendIcon = (value: string | number) => {
  const num = parseFloat(String(value));
  if (num > 0) return <TrendingUp className="size-3.5" />;
  if (num < 0) return <TrendingDown className="size-3.5" />;
  return <Minus className="size-3.5" />;
};

export function SalesDashboardStatCard({
  title,
  count,
  percentage = { value: 0, label: "" },
  isOpenCard = false,
  page = "",
}: SalesDashboardStatCardProps): JSX.Element {
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const { t } = useTranslation();
  const [openWaitingFormDialog, setOpenWaitingFormDialog] = useState(false);
  const [rowData, setRowData] = useState<any[]>([]);

  const handlePreview = useCallback(
    (id: string, assignId: string) => {
      navigate("/parameters/view/" + id, {
        state: { formAssignId: assignId },
      });
    },
    [navigate],
  );

  const tableColumns = useMemo(
    () => [
      {
        key: "actions" as const,
        label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler"),
      },
      {
        key: "statusText" as const,
        label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Durum"),
      },
      { key: "formName" as const, label: "Form Adı" },
      {
        key: "createdDate" as const,
        label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih"),
      },
    ],
    [t],
  );

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new FormAssignApi(conf);
      const data = await api.apiFormAssignUserFormsGet(["1"]);
      setRowData(data.data);
    } catch (error) {
      dispatchAlert({
        message: "Hata oluştu" + String(error),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleDetails = async () => {
    if (page === "userFormList") {
      await fetchData();
      setOpenWaitingFormDialog(true);
      return;
    }
    if (page === "solveAllTicket") {
      navigate(`/${page}`, { state: { onlyAllTicket: true } });
    }
  };

  const theme = getCardTheme(title);
  const trendNum = parseFloat(String(percentage.value));
  const trendColor =
    trendNum > 0
      ? "text-emerald-300"
      : trendNum < 0
        ? "text-rose-300"
        : "text-white/60";

  return (
    <>
      {/* ── Card ── */}
      <div
        className={`
          relative overflow-hidden rounded-2xl bg-linear-to-br ${theme.gradient}
          p-5 shadow-lg ring-1 ring-white/10
          transition-[transform,box-shadow] duration-300 hover:shadow-xl hover:scale-[1.01]
          will-change-transform
        `}
      >
        {/* Decorative blobs — will-change-[filter] ile GPU katmanına alındı */}
        <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/10 blur-2xl will-change-[filter]" />
        <div className="pointer-events-none absolute -bottom-8 -left-4 size-24 rounded-full bg-black/10 blur-2xl will-change-[filter]" />

        {/* Top row: icon + title */}
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/75">
              {title}
            </p>
          </div>
          <div
            className={`
              flex size-11 shrink-0 items-center justify-center rounded-xl
              ${theme.iconBg} backdrop-blur-sm ring-1 ring-white/20
            `}
          >
            {theme.icon}
          </div>
        </div>

        {/* Count */}
        <div className="relative mt-3">
          <p className="text-5xl font-extrabold tabular-nums leading-none tracking-tight text-white drop-shadow">
            {count}
          </p>
        </div>

        {/* Trend + Details */}
        <div className="relative mt-4 flex items-center justify-between gap-2">
          {/* Trend badge */}
          <div
            className={`
              inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1
              ${theme.accent} backdrop-blur-sm
              text-xs font-semibold ${trendColor}
            `}
          >
            {getTrendIcon(percentage.value)}
            <span>{percentage.value}</span>
            {percentage.label && (
              <span className="font-normal text-white/60">{percentage.label}</span>
            )}
          </div>

          {/* Details button */}
          {isOpenCard && (
            <button
              type="button"
              onClick={() => void handleDetails()}
              className={`
                group flex items-center gap-1.5 rounded-lg px-3 py-1.5
                bg-white/15 hover:bg-white/25 backdrop-blur-sm
                text-xs font-semibold text-white
                ring-1 ring-white/20 hover:ring-white/40
                transition-all duration-200
              `}
            >
              Detaylar
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Waiting Forms Dialog ── */}
      <Dialog open={openWaitingFormDialog} onOpenChange={setOpenWaitingFormDialog}>
        <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col gap-0 overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-violet-500" />
              Bekleyen Formlar
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto border-t border-border/60">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-gray-50">
                <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                  {tableColumns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableColumns.length}
                      className="py-14 text-center text-sm text-muted-foreground"
                    >
                      Gösterilecek veri bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  rowData.map((row: any, rowIndex: number) => (
                    <TableRow
                      key={rowIndex}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      {tableColumns.map((col) => (
                        <TableCell
                          key={col.key}
                          className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                        >
                          {col.key === "actions" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 hover:text-emerald-700"
                              onClick={() => handlePreview(row.formId, row.id)}
                            >
                              Düzenle
                            </Button>
                          ) : (
                            (row[col.key] ?? "—")
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpenWaitingFormDialog(false)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
