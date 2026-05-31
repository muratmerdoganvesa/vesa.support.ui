import { useEffect, useState, useMemo, lazy, Suspense, type ReactNode } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Badge } from "components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { SalesDashboardStatCard } from "layouts/dashboards/sales/components/SalesDashboardStatCard";
import { HomeDashboard } from "layouts/dashboards/sales/components/HomeDashboard";
import { DashboardsApi, GetSumTicketDto, TicketApi, UserAppDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ExternalLink,
  BarChart3,
  CalendarDays,
  User,
  Building2,
  Ticket,
  FolderOpen,
  CheckCircle2,
  Home,
  LineChart,
} from "lucide-react";

const ChannelsChart = lazy(() => import("layouts/dashboards/sales/components/ChannelsChart"));

const COL_META: Record<string, { icon: ReactNode; badge?: string }> = {
  "Müşteri":        { icon: <Building2 className="size-3.5" /> },
  "Toplam Talep":   { icon: <Ticket className="size-3.5" />,       badge: "secondary" },
  "Açık Talep":     { icon: <FolderOpen className="size-3.5" />,   badge: "destructive" },
  "Çözümlü Talep":  { icon: <CheckCircle2 className="size-3.5" />, badge: "outline" },
};

const ChartSkeleton = () => (
  <div className="flex min-h-[240px] flex-1 animate-pulse items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
    <BarChart3 className="size-10 opacity-20" />
  </div>
);

function Sales(): JSX.Element {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [selectedKullanici, setSelectedKullanici] = useState<UserAppDto | null>(null);
  const [namesOfSelected, setNamesOfSelected] = useState<string>();
  const [ticketCountData, setTicketCountData] = useState<GetSumTicketDto>({
    sumCount:      0,
    openCount:     0,
    resolvedCount: 0,
  });
  const [tableData, setTableData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [formData, setFormData] = useState<any>({
    startDate:            "",
    endDate:              "",
    selectedKullaniciId:  null,
  });
  const [countOfForms, setCountOfForms] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAppName = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api  = new TicketApi(conf);
        const data = await api.apiTicketCheckPermGet();

        const splittedName = data.data.name.split(" ");
        const firstName    = splittedName[0];
        const lastName     = splittedName.length > 1 ? splittedName.slice(1).join(" ") : "";

        setFormData({ selectedKullaniciId: data.data.id, startDate: "", endDate: "" });
        setSelectedKullanici({ id: data.data.id, firstName, lastName });
        setNamesOfSelected(`${firstName} ${lastName}`.trim());

        if (data.data.id) {
          try {
            setTableData([]);
            const confInner = getConfiguration();
            const apiDash   = new DashboardsApi(confInner);

            const dataForm = await apiDash.apiDashboardsUserOpenFormCountGet(
              data.data.id,
              formatDate(startDate),
              formatDate(endDate),
            );
            setCountOfForms(dataForm ? dataForm.data : 0);

            const data1 = await apiDash.apiDashboardsGetUserCompanyTicketInfoCountGet(
              data.data.id,
              formatDate(startDate),
              formatDate(endDate),
            );

            if (data1?.data && data1.data.length > 0) {
              setTableData(
                data1.data.map((item) => ({
                  Müşteri:         item.companyName,
                  "Toplam Talep":  item.ticketCount,
                  "Açık Talep":    item.openCount,
                  "Çözümlü Talep": item.resolvedCount,
                })),
              );
            } else {
              setTableData([{ Müşteri: "Veri yok", "Toplam Talep": 0, "Açık Talep": 0, "Çözümlü Talep": 0 }]);
            }
          } catch {
            setTableData([{ Müşteri: "Hata oluştu", "Toplam Talep": 0, "Açık Talep": 0, "Çözümlü Talep": 0 }]);
          }

          const conf2  = getConfiguration();
          const api2   = new DashboardsApi(conf2);
          const data2  = await api2.apiDashboardsGetUserCompanyTicketCountGet(
            data.data.id,
            formatDate(startDate),
            formatDate(endDate),
          );
          setTicketCountData({
            sumCount:      data2.data.sumCount,
            openCount:     data2.data.openCount,
            resolvedCount: data2.data.resolvedCount,
          });
        }
      } catch (error) {
        dispatchAlert({ message: "Hata oluştu : " + error, type: "Error" });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchUserAppName();
  }, []);

  const formatDate = (date?: string): string | undefined => {
    if (!date) return undefined;
    return new Date(date).toISOString().split("T")[0];
  };

  const handleSave = async () => {
    try {
      dispatchBusy({ isBusy: true });
      if (!selectedKullanici?.id) return;

      setTableData([]);
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate   = formatDate(endDate);

      if (selectedKullanici) {
        const conf = getConfiguration();
        const api  = new DashboardsApi(conf);
        const data = await api.apiDashboardsGetUserCompanyTicketInfoCountGet(
          selectedKullanici.id,
          formattedStartDate,
          formattedEndDate,
        );
        setFormData({ selectedKullaniciId: selectedKullanici.id, startDate, endDate });

        if (data?.data && data.data.length > 0) {
          setTableData(
            data.data.map((item) => ({
              Müşteri:         item.companyName,
              "Toplam Talep":  item.ticketCount,
              "Açık Talep":    item.openCount,
              "Çözümlü Talep": item.resolvedCount,
            })),
          );
        } else {
          setTableData([{ Müşteri: "Veri yok", "Toplam Talep": 0, "Açık Talep": 0, "Çözümlü Talep": 0 }]);
        }

        if (selectedKullanici?.id) {
          const data2 = await api.apiDashboardsGetUserCompanyTicketCountGet(
            selectedKullanici.id,
            formattedStartDate,
            formattedEndDate,
          );
          setTicketCountData({
            sumCount:      data2.data.sumCount,
            openCount:     data2.data.openCount,
            resolvedCount: data2.data.resolvedCount,
          });
        }
      }
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu : " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleNavigate = () => navigate("/tickets/customer");

  const userDisplay =
    selectedKullanici?.firstName || selectedKullanici?.lastName
      ? `${selectedKullanici.firstName ?? ""} ${selectedKullanici.lastName ?? ""}`.trim()
      : "";

  const tableColumns = useMemo(
    () => (tableData.length > 0 ? Object.keys(tableData[0] as Record<string, unknown>) : []),
    [tableData],
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="w-full px-3 pb-10">

        <Tabs defaultValue="home" className="w-full">

          {/* ── Tab bar ── */}
          <div className="mb-5 flex items-center gap-4">
            <TabsList className="h-9 gap-1 rounded-xl bg-muted/60 p-1">
              <TabsTrigger value="home" className="flex items-center gap-1.5 px-3 text-sm">
                <Home className="size-3.5" />
                Ana Sayfa
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-1.5 px-3 text-sm">
                <LineChart className="size-3.5" />
                İstatistikler
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Tab 1 – Home Dashboard ── */}
          <TabsContent value="home">
            <HomeDashboard
              userId={formData.selectedKullaniciId}
              userName={namesOfSelected}
              ticketKpis={ticketCountData}
            />
          </TabsContent>

          {/* ── Tab 2 – Statistics ── */}
          <TabsContent value="statistics">

            {/* Page header */}
            <div className="mb-7 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-md">
                <BarChart3 className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Talep Çözümleme İstatistikleri
                </h1>
                <p className="text-sm text-muted-foreground">
                  Tarih aralığına göre kullanıcı taleplerini görüntüleyin.
                </p>
              </div>
            </div>

            {/* Filter card */}
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
                    <Label
                      htmlFor="sales-user-display"
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      <User className="size-3.5" />
                      Kullanıcı
                    </Label>
                    <Input
                      id="sales-user-display"
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
                      <Label
                        htmlFor="sales-start-date"
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        <CalendarDays className="size-3.5" />
                        Başlangıç
                      </Label>
                      <Input
                        id="sales-start-date"
                        type="date"
                        className="h-10"
                        value={startDate ?? ""}
                        onChange={(e) => setStartDate(e.target.value)}
                        min="2000-01-01"
                        max={endDate || "2099-12-31"}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="sales-end-date"
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        <CalendarDays className="size-3.5" />
                        Bitiş
                      </Label>
                      <Input
                        id="sales-end-date"
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
                      id="btn-goruntule"
                      type="button"
                      className="h-10 flex-1 gap-2 bg-linear-to-r from-indigo-500 to-violet-600 text-white shadow-md hover:from-indigo-600 hover:to-violet-700"
                      onClick={handleSave}
                    >
                      <Search className="size-4 shrink-0" />
                      Görüntüle
                    </Button>
                    <Button
                      id="btn-acilan-talepler"
                      type="button"
                      variant="outline"
                      className="h-10 flex-1 gap-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
                      onClick={handleNavigate}
                    >
                      <ExternalLink className="size-4 shrink-0" />
                      Açılan Talepler
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section title */}
            {namesOfSelected && (
              <div className="mb-5 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-linear-to-b from-indigo-500 to-violet-600" />
                <h2 className="mt-2 text-base font-semibold text-foreground">
                  <span className="font-normal text-muted-foreground">İstatistikler — </span>
                  {namesOfSelected}
                </h2>
              </div>
            )}

            {/* 3-col grid */}
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Col 1 – Toplam Talep */}
              <div className="flex min-h-0 flex-col gap-5">
                <SalesDashboardStatCard
                  title="Toplam Talep"
                  count={ticketCountData.sumCount ?? 0}
                  percentage={{ value: ticketCountData.sumCount ?? 0, label: "adet toplam talep" }}
                />
                <Suspense fallback={<ChartSkeleton />}>
                  <div className="min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
                    <ChannelsChart
                      id={formData.selectedKullaniciId}
                      isAllData={true}
                      startDate={formatDate(formData.startDate)}
                      endDate={formatDate(formData.endDate)}
                    />
                  </div>
                </Suspense>
              </div>

              {/* Col 2 – Açık Talep */}
              <div className="flex min-h-0 flex-col gap-5">
                <SalesDashboardStatCard
                  title="Açık Talep"
                  page="solveAllTicket"
                  isOpenCard={true}
                  count={ticketCountData.openCount ?? 0}
                  percentage={{ value: ticketCountData.openCount ?? 0, label: "adet açık olan talep" }}
                />
                <Suspense fallback={<ChartSkeleton />}>
                  <div className="min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-border/50 shadow-sm">
                    <ChannelsChart
                      id={formData.selectedKullaniciId}
                      isAllData={false}
                      isOpenTicket={true}
                      startDate={formatDate(formData.startDate)}
                      endDate={formatDate(formData.endDate)}
                    />
                  </div>
                </Suspense>
              </div>

              {/* Col 3 – Bekleyen Formlar + Tablo */}
              <div className="flex min-h-0 flex-col gap-5">
                <SalesDashboardStatCard
                  page="userFormList"
                  title="Bekleyen Formlar"
                  isOpenCard={true}
                  count={countOfForms}
                  percentage={{ value: countOfForms, label: "adet bekleyen form" }}
                />

                {/* Modern table card */}
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/50 shadow-sm">
                  <CardHeader className="border-b border-border/50 bg-muted/20 px-4 py-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <BarChart3 className="size-4 text-indigo-500" />
                      Talep Çözümleme Özetim
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
                                col === "Müşteri" ? "pl-4 text-left" : "text-center"
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                {COL_META[col]?.icon}
                                {col}
                              </span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableData.map((row, rowIndex) => (
                          <TableRow
                            key={`${String(row["Müşteri"] ?? "")}-${rowIndex}`}
                            className="border-border/30 transition-colors hover:bg-muted/30"
                          >
                            {tableColumns.map((col) => {
                              const val        = String(row[col] ?? "");
                              const meta       = COL_META[col];
                              const isCustomer = col === "Müşteri";

                              if (isCustomer) {
                                return (
                                  <TableCell key={col} className="py-2.5 pl-4 text-left">
                                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                      <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                                      {val}
                                    </span>
                                  </TableCell>
                                );
                              }

                              const numVal      = parseInt(val, 10);
                              const badgeVariant =
                                col === "Açık Talep"
                                  ? numVal > 0 ? "destructive" : "secondary"
                                  : col === "Çözümlü Talep"
                                    ? "outline"
                                    : "secondary";

                              return (
                                <TableCell key={col} className="py-2.5 text-center">
                                  {meta?.badge ? (
                                    <Badge
                                      variant={badgeVariant as any}
                                      className="tabular-nums font-semibold"
                                    >
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
                              colSpan={tableColumns.length || 4}
                              className="py-10 text-center text-sm text-muted-foreground"
                            >
                              <BarChart3 className="mx-auto mb-2 size-8 opacity-30" />
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

          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}

export default Sales;
