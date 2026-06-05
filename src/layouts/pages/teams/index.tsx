import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useBusy } from "layouts/pages/hooks/useBusy";
import GlobalCell from "layouts/pages/talepYonetimi/allTickets/tableData/globalCell";
import { AppAlertType, useAlert } from "layouts/pages/hooks/useAlert";
import { TicketTeamApi } from "api/generated";
import { useTranslation } from "react-i18next";
import { LayoutList, Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Input } from "components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import { cn } from "lib/utils";

type TeamRow = {
  id: string;
  name?: string;
  department?: { departmentText?: string };
  workCompany?: { name?: string };
  manager?: { firstName?: string; lastName?: string };
};

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-[90px] flex-col gap-0.5 rounded-xl border px-4 py-3",
        accent ? "border-indigo-200 bg-indigo-50/60" : "border-slate-100 bg-white/60"
      )}
    >
      <span
        className={cn(
          "text-xl font-bold tracking-tight",
          accent ? "text-indigo-600" : "text-slate-800"
        )}
      >
        {value}
      </span>
      <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</span>
    </div>
  );
}

function EmptyTeamsState({ query }: { query: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={5} className="py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <LayoutList className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            {query ? `"${query}" için sonuç bulunamadı` : "Henüz takım tanımlanmamış"}
          </p>
          {!query ? (
            <p className="text-xs text-slate-400">Yeni takım ekleyerek başlayabilirsiniz</p>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function Departmens() {
  const [departmanData, setDepartmanData] = useState<TeamRow[]>([]);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const { t } = useTranslation();
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketTeamApi(conf);
      var data = await api.apiTicketTeamWithoutTeamGet(false);
      console.log("data", data.data);
      setDepartmanData(data.data as any);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:TeamPage.TeamList.EkipListesiHata"),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketTeamApi(conf);
      await api.apiTicketTeamIdDelete(id);
      dispatchAlert({
        message: t("ns1:TeamPage.TeamList.TakimSilindi"),
        type: AppAlertType.Success,
      });
      fetchData();
    } catch (error) {
      dispatchAlert({
        message: t("ns1:TeamPage.TeamList.HataOlustu"),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleOpenQuestionBox = (id: string) => {
    setSelectedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes") {
      handleDelete(selectedId);
    }
  };

  const filteredRows = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    if (!q) {
      return departmanData;
    }
    return departmanData.filter((row) => {
      const managerName = row.manager
        ? `${row.manager.firstName ?? ""} ${row.manager.lastName ?? ""}`.trim()
        : "";
      const haystack = [
        row.name ?? "",
        row.department?.departmentText ?? "",
        row.workCompany?.name ?? "",
        managerName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [departmanData, tableSearchQuery]);

  const tableHeadClass =
    "px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase";
  const tableCellClass = "px-4 py-3 align-middle text-sm";

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-[calc(100vh-160px)] space-y-6 px-1 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="shadow-indigo-200 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                <UsersRound className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                {t("ns1:TeamPage.TeamList.TeamTitle")}
              </h1>
            </div>
            <p className="pl-11.5 text-sm text-slate-500">
              {t("ns1:TeamPage.TeamList.TeamSubTitle")}
            </p>
          </div>

          <Button
            type="button"
            className="hover:shadow-indigo-200/60 shrink-0 gap-2 bg-indigo-600 shadow-sm shadow-indigo-200/60 transition-all duration-200 hover:-translate-y-px hover:bg-indigo-700 hover:shadow-md"
            onClick={() => navigate(`/teams/createTeam`)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("ns1:TeamPage.TeamList.YeniTakim")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard label="Toplam" value={departmanData.length} />
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            className="h-9 border-slate-200 bg-white pr-3 pl-9 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
            placeholder="Takım, departman veya şirket ara…"
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            aria-label="Tablo sonuçlarını filtrele"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100">
          <div className="max-h-[min(565px,70vh)] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                  <TableHead className={tableHeadClass} scope="col">
                    {t("ns1:TeamPage.TeamList.TakimAdi")}
                  </TableHead>
                  <TableHead className={tableHeadClass} scope="col">
                    {t("ns1:TeamPage.TeamList.Departman")}
                  </TableHead>
                  <TableHead className={tableHeadClass} scope="col">
                    {t("ns1:TeamPage.TeamList.Sirket")}
                  </TableHead>
                  <TableHead className={tableHeadClass} scope="col">
                    {t("ns1:TeamPage.TeamList.Yonetici")}
                  </TableHead>
                  <TableHead className={cn(tableHeadClass, "w-[72px] text-right")} scope="col">
                    {t("ns1:TeamPage.TeamList.Islemler")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <EmptyTeamsState query={tableSearchQuery.trim()} />
                ) : (
                  filteredRows.map((rowOriginal) => {
                    const deptText = rowOriginal.department?.departmentText ?? "";
                    const companyName = rowOriginal.workCompany?.name ?? "";
                    const managerLabel = rowOriginal.manager
                      ? `${rowOriginal.manager.firstName ?? ""} ${rowOriginal.manager.lastName ?? ""}`.trim()
                      : "";

                    return (
                      <TableRow
                        key={String(rowOriginal.id)}
                        className="group border-slate-50 transition-colors duration-150 hover:bg-indigo-50/30"
                      >
                        <TableCell className={cn(tableCellClass, "font-medium text-slate-800")}>
                          <GlobalCell value={rowOriginal.name} />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-slate-700")}>
                          <GlobalCell value={deptText} />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-slate-700")}>
                          <GlobalCell value={companyName} />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-slate-600")}>
                          <GlobalCell value={managerLabel} />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-right")}>
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => navigate(`/teams/createTeam/${rowOriginal.id}`)}
                              aria-label="Düzenle"
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                              onClick={() => handleOpenQuestionBox(rowOriginal.id)}
                              aria-label="Takımı sil"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {filteredRows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 px-4 py-3">
              <span className="text-xs text-slate-400">
                {filteredRows.length} / {departmanData.length} takım
                {tableSearchQuery.trim() ? (
                  <span className="text-indigo-400">
                    {" "}
                    · &quot;{tableSearchQuery.trim()}&quot;
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <AlertDialog open={isQuestionMessageBoxOpen} onOpenChange={setIsQuestionMessageBoxOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Takımı sil</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              type="button"
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="rounded-xl bg-rose-500 text-white hover:bg-rose-600"
              onClick={() => handleCloseQuestionBox("Yes")}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </DashboardLayout>
  );
}

export default Departmens;
