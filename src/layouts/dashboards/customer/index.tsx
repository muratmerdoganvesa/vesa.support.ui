import { useEffect, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Badge } from "components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import ChannelsChart from "layouts/dashboards/customer/components/ChannelsChart";
import TotalChart from "layouts/dashboards/customer/components/TotalChart";
import { DashboardsApi, GetSumTicketDto, TicketApi, UserAppDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BarChart2,
  CalendarDays,
  User,
  Users,
  Ticket,
  FolderOpen,
  CheckCircle2,
  FlaskConical,
  TicketCheck,
  TrendingUp,
  Minus,
} from "lucide-react";

// ── Inline stat card (for custom layouts) ──────────────────────────────────
interface StatCardProps {
  title: string;
  count: string | number;
  sub: string;
  gradient: string;
  icon: JSX.Element;
}

function StatCard({ title, count, sub, gradient, icon }: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl`}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 size-24 rounded-full bg-black/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/75">{title}</p>
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/20">
          {icon}
        </div>
      </div>
      <p className="relative mt-3 text-5xl font-extrabold tabular-nums leading-none tracking-tight text-white drop-shadow">
        {count}
      </p>
      <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm ring-1 ring-white/20">
        <Minus className="size-3.5" />
        {sub}
      </div>
    </div>
  );
}

// ── Column meta for table ───────────────────────────────────────────────────
const colMeta: Record<string, { icon: JSX.Element; badge?: "destructive" | "secondary" | "outline" }> = {
  Temsilci:        { icon: <Users className="size-3.5" /> },
  "Toplam Talep":  { icon: <Ticket className="size-3.5" />,       badge: "secondary" },
  "Açık Talep":    { icon: <FolderOpen className="size-3.5" />,   badge: "destructive" },
  "Birim Testi":   { icon: <FlaskConical className="size-3.5" />, badge: "secondary" },
  "Müşteri Testi": { icon: <CheckCircle2 className="size-3.5" />, badge: "outline" },
};

// ───────────────────────────────────────────────────────────────────────────
function CustomerSales(): JSX.Element {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();

  const [selectedKullanici, setSelectedKullanici] = useState<UserAppDto | null>(null);
  const [namesOfSelected, setNamesOfSelected] = useState<string>();
  const [openTicketCount, setOpenTicketCount] = useState<string>("0");
  const [closeTicketCount, setCloseTicketCount] = useState<string>("0");
  const [ticketCountData, setTicketCountData] = useState<GetSumTicketDto>({ sumCount: 0, openCount: 0, resolvedCount: 0 });
  const [tableData, setTableData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [formData, setFormData] = useState<any>({ startDate: "", endDate: "", selectedKullaniciId: null });

  const formatDate = (date?: string): string | undefined => {
    if (!date) return undefined;
    return new Date(date).toISOString().split("T")[0];
  };

  const loadDashboard = async (userId: string, sd?: string, ed?: string) => {
    const conf = getConfiguration();
    const api = new DashboardsApi(conf);

    // team info table
    const data1 = await api.apiDashboardsCustomerAssignTeamInfoGet(userId, sd, ed);
    if (data1?.data && data1.data.length > 0) {
      setTableData(data1.data.map((item) => ({
        Temsilci: item.name,
        "Toplam Talep": item.totalCount,
        "Açık Talep": item.openCount,
        "Birim Testi": item.unitTest,
        "Müşteri Testi": item.customerTest,
      })));
    } else {
      setTableData([{ Temsilci: "Veri yok", "Toplam Talep": 0, "Açık Talep": 0, "Birim Testi": 0, "Müşteri Testi": 0 }]);
    }

    // open/close counts
    const openCloseData = await api.apiDashboardsGetCustomerOpenCloseeGet(userId, sd, ed);
    const openItem  = openCloseData.data.find((i) => i.name === "Açık");
    const closeItem = openCloseData.data.find((i) => i.name === "Kapalı");
    setOpenTicketCount(String(openItem?.count ?? 0));
    setCloseTicketCount(String(closeItem?.count ?? 0));

    // ticket count totals
    const data2 = await api.apiDashboardsGetTicketAsyncGet(userId, sd, ed);
    const acikTalep = data2.data.sumCount - data2.data.closedCount - data2.data.draftCount - data2.data.canceledCount;
    setTicketCountData({ sumCount: data2.data.sumCount, openCount: acikTalep, resolvedCount: data2.data.resolvedCount });
  };

  useEffect(() => {
    const init = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new TicketApi(conf);
        const data = await api.apiTicketCheckPermGet();

        const parts = data.data.name.split(" ");
        const firstName = parts[0];
        const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
        const userId = data.data.id;

        setSelectedKullanici({ id: userId, firstName, lastName });
        setNamesOfSelected(`${firstName} ${lastName}`.trim());
        setFormData({ selectedKullaniciId: userId, startDate: "", endDate: "" });

        if (userId) await loadDashboard(userId);
      } catch (error) {
        dispatchAlert({ message: "Hata oluştu : " + error, type: "Error" });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    init();
  }, []);

  const handleSave = async () => {
    if (!selectedKullanici?.id) return;
    try {
      dispatchBusy({ isBusy: true });
      const sd = formatDate(startDate);
      const ed = formatDate(endDate);
      setFormData({ selectedKullaniciId: selectedKullanici.id, startDate, endDate });
      setTableData([]);
      await loadDashboard(selectedKullanici.id, sd, ed);
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu : " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const userDisplay =
    selectedKullanici?.firstName || selectedKullanici?.lastName
      ? `${selectedKullanici.firstName ?? ""} ${selectedKullanici.lastName ?? ""}`.trim()
      : "";

  const tableColumns = tableData.length > 0 ? Object.keys(tableData[0] as Record<string, unknown>) : [];

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="w-full px-3 pb-10">

        {/* ── Page header ── */}
        <div className="mb-7 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md">
            <BarChart2 className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Talep Açma İstatistikleri
            </h1>
            <p className="text-sm text-muted-foreground">
              Müşteriye ait talep durumlarını tarih aralığına göre görüntüleyin.
            </p>
          </div>
        </div>

        {/* ── Filter card ── */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-5 py-3">
            <CalendarDays className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Filtreler</span>
            <span className="ml-1 text-xs text-muted-foreground">— kullanıcı ve tarih aralığı seçin</span>
          </div>

          <div className="p-5">
            <div className="grid gap-5 lg:grid-cols-12 lg:items-end">

              {/* User (readonly) */}
              <div className="space-y-1.5 lg:col-span-4">
                <Label htmlFor="cust-user" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="size-3.5" />
                  Kullanıcı
                </Label>
                <Input
                  id="cust-user"
                  readOnly
                  disabled
                  value={userDisplay}
                  placeholder="Kullanıcı bilgisi yükleniyor…"
                  className="h-10 cursor-not-allowed bg-muted/50 font-medium"
                />
              </div>

              {/* Date range */}
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
                <div className="space-y-1.5">
                  <Label htmlFor="cust-start-date" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Başlangıç
                  </Label>
                  <Input
                    id="cust-start-date"
                    type="date"
                    className="h-10"
                    value={startDate ?? ""}
                    onChange={(e) => setStartDate(e.target.value)}
                    min="2000-01-01"
                    max={endDate || "2099-12-31"}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cust-end-date" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Bitiş
                  </Label>
                  <Input
                    id="cust-end-date"
                    type="date"
                    className="h-10"
                    value={endDate ?? ""}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || "2000-01-01"}
                    max="2099-12-31"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 lg:col-span-3">
                <Button
                  id="btn-cust-goruntule"
                  type="button"
                  className="h-10 flex-1 gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700"
                  onClick={handleSave}
                >
                  <Search className="size-4 shrink-0" />
                  Görüntüle
                </Button>
                <Button
                  id="btn-cust-istatistik"
                  type="button"
                  variant="outline"
                  className="h-10 flex-1 gap-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950"
                  onClick={() => navigate("/tickets/statistic")}
                >
                  <TrendingUp className="size-4 shrink-0" />
                  Çözümleme İst.
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section title ── */}
        {namesOfSelected && (
          <div className="mb-5 flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
            <h2 className="mt-2 text-base font-semibold text-foreground">
              <span className="font-normal text-muted-foreground">İstatistikler — </span>
              {namesOfSelected}
            </h2>
          </div>
        )}

        {/* ── 3-col grid ── */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Col 1 – Toplam Talep + ChannelsChart */}
          <div className="flex min-h-0 flex-col gap-5">
            <StatCard
              title="Toplam Talep"
              count={ticketCountData.sumCount ?? 0}
              sub={`${ticketCountData.sumCount ?? 0} adet toplam talep`}
              gradient="from-amber-500 via-orange-500 to-orange-600"
              icon={<TicketCheck className="size-6 text-white" />}
            />
            <div className="min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
              <ChannelsChart
                id={formData.selectedKullaniciId}
                startDate={formatDate(formData.startDate)}
                endDate={formatDate(formData.endDate)}
              />
            </div>
          </div>

          {/* Col 2 – Açık/Kapalı + TotalChart */}
          <div className="flex min-h-0 flex-col gap-5">
            <StatCard
              title="Açık / Kapalı Talep"
              count={`${openTicketCount} / ${closeTicketCount}`}
              sub={`${openTicketCount} açık — ${closeTicketCount} kapalı`}
              gradient="from-rose-500 via-red-500 to-red-600"
              icon={<FolderOpen className="size-6 text-white" />}
            />
            <div className="min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
              <TotalChart
                id={formData.selectedKullaniciId}
                isAllData={true}
                startDate={formatDate(formData.startDate)}
                endDate={formatDate(formData.endDate)}
              />
            </div>
          </div>

          {/* Col 3 – Temsilci tablosu */}
          <div className="flex min-h-0 flex-col gap-5">
            <StatCard
              title="Çözümlü Talep"
              count={ticketCountData.resolvedCount ?? 0}
              sub={`${ticketCountData.resolvedCount ?? 0} adet çözümlendi`}
              gradient="from-violet-500 via-purple-500 to-purple-600"
              icon={<CheckCircle2 className="size-6 text-white" />}
            />

            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 shadow-sm">
              <CardHeader className="border-b border-border/50 bg-muted/20 px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="size-4 text-emerald-500" />
                  Taleplerimin Durumları
                </CardTitle>
              </CardHeader>

              <CardContent className="min-h-0 flex-1 p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 bg-muted/10 hover:bg-transparent">
                      {tableColumns.map((col) => (
                        <TableHead
                          key={col}
                          className={`py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground ${
                            col === "Temsilci" ? "pl-4 text-left" : "text-center"
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {colMeta[col]?.icon}
                            {col}
                          </span>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        className="border-border/30 transition-colors hover:bg-muted/30"
                      >
                        {tableColumns.map((col) => {
                          const val = String(row[col] ?? "");
                          const isName = col === "Temsilci";

                          if (isName) {
                            return (
                              <TableCell key={col} className="py-2.5 pl-4 text-left">
                                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                  <Users className="size-3.5 shrink-0 text-muted-foreground" />
                                  {val}
                                </span>
                              </TableCell>
                            );
                          }

                          const numVal = parseInt(val, 10);
                          const badgeVariant =
                            col === "Açık Talep" && numVal > 0 ? "destructive" :
                            col === "Müşteri Testi" ? "outline" : "secondary";

                          return (
                            <TableCell key={col} className="py-2.5 text-center">
                              {colMeta[col]?.badge ? (
                                <Badge variant={badgeVariant} className="tabular-nums font-semibold">
                                  {val}
                                </Badge>
                              ) : (
                                <span className="tabular-nums font-medium">{val}</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}

                    {tableData.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={tableColumns.length || 5}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          <Users className="mx-auto mb-2 size-8 opacity-30" />
                          Görüntülenecek veri bulunamadı.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

export default CustomerSales;
