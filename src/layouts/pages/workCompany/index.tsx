import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import React, { useEffect, useMemo, useState } from "react";
import Footer from "examples/Footer";
import { useNavigate } from "react-router-dom";
import { useBusy } from "../hooks/useBusy";
import { AppAlertType, useAlert } from "../hooks/useAlert";
import getConfiguration from "confiuration";
import { ApproveWorkDesign, WorkCompanyApi, WorkCompanyDto } from "api/generated/api";
import GlobalCell from "../talepYonetimi/allTickets/tableData/globalCell";
import { useTranslation } from "react-i18next";
import { Building2, LayoutList, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

interface approveWorkDesign {
  id: ApproveWorkDesign;
  name: string;
  description: string;
}

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
      <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </span>
    </div>
  );
}

function EmptyStateCompany({ query }: { query: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={5} className="py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <LayoutList className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            {query ? `"${query}" için sonuç bulunamadı` : "Henüz şirket tanımlanmamış"}
          </p>
          {!query ? (
            <p className="text-xs text-slate-400">Yeni şirket ekleyerek başlayabilirsiniz</p>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function WorkCompany() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [dataTableData, setDataTableData] = useState<WorkCompanyDto[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState<boolean>(false);
  const { t } = useTranslation();

  const [approveDesign, setApproveDesign] = useState<approveWorkDesign[]>([]);
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyApi(conf);
      var response = await api.apiWorkCompanyGetAllGet();
      setDataTableData(response.data);
      console.log("table>>", response.data);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:CompanyPage.CompanyList.SirketYuklenirkenHata"),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();

    getAprDesigns();
  }, []);

  const getAprDesigns = async () => {
    var conf = getConfiguration();
    var api = new WorkCompanyApi(conf);
    var aprDesigndata = await api.apiWorkCompanyGetApproveWorkDesignGet();
    setApproveDesign(aprDesigndata.data as any);
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
    if (action === "No") {
      alert("silinme işlemi iptal edildi");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyApi(conf);
      await api.apiWorkCompanyIdDelete(id);
      fetchData();

      dispatchAlert({
        message: t("ns1:CompanyPage.CompanyList.SirketSilindi"),
        type: AppAlertType.Success,
      });
    } catch (error) {
      dispatchAlert({
        message: t("ns1:CompanyPage.CompanyList.SirketSilinirkenHata") + error,
        type: AppAlertType.Error,
      });
      dispatchAlert({
        message: t("ns1:CompanyPage.CompanyList.SistemSilinizHata"),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const filteredCompanyRows = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    if (!q) {
      return dataTableData;
    }
    return dataTableData.filter((row) => (row.name ?? "").toLowerCase().includes(q));
  }, [dataTableData, tableSearchQuery]);

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
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                {t("ns1:CompanyPage.CompanyList.CompanyTitle")}
              </h1>
            </div>
            <p className="pl-11.5 text-sm text-slate-500">
              {t("ns1:CompanyPage.CompanyList.CompanySubTitle")}
            </p>
          </div>

          <Button
            type="button"
            className="hover:shadow-indigo-200/60 shrink-0 gap-2 bg-indigo-600 shadow-sm shadow-indigo-200/60 transition-all duration-200 hover:-translate-y-px hover:bg-indigo-700 hover:shadow-md"
            onClick={() => navigate(`/workCompany/detail`)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("ns1:CompanyPage.CompanyList.YeniSirket")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <StatCard label="Toplam" value={dataTableData.length} />
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            className="h-9 border-slate-200 bg-white pr-3 pl-9 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
            placeholder="Şirket adı ara…"
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
                    {t("ns1:CompanyPage.CompanyList.SirketAdi")}
                  </TableHead>
                  <TableHead className={tableHeadClass} scope="col">
                    {t("ns1:CompanyPage.CompanyList.OnaySecenegi")}
                  </TableHead>
                  <TableHead className={tableHeadClass} scope="col">
                    {t("ns1:CompanyPage.CompanyList.OnayAkisi")}
                  </TableHead>
                  <TableHead className={tableHeadClass} scope="col">
                    MSP
                  </TableHead>
                  <TableHead className={cn(tableHeadClass, "w-[72px] text-right")} scope="col">
                    {t("ns1:CompanyPage.CompanyList.Islemler")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanyRows.length === 0 ? (
                  <EmptyStateCompany query={tableSearchQuery.trim()} />
                ) : (
                  filteredCompanyRows.map((rowOriginal) => {
                    const aprDesign = approveDesign.find(
                      (e) => e.id == rowOriginal.approveWorkDesign
                    ).description;
                    const approveFlowName = rowOriginal.workFlowDefination
                      ? rowOriginal.workFlowDefination.workflowName
                      : "";

                    return (
                      <TableRow
                        key={rowOriginal.id}
                        className="group border-slate-50 transition-colors duration-150 hover:bg-indigo-50/30"
                      >
                        <TableCell className={cn(tableCellClass, "font-medium text-slate-800")}>
                          <GlobalCell
                            value={rowOriginal.name}
                            columnName="name"
                            testRow={rowOriginal as any}
                          />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-slate-700")}>
                          <GlobalCell
                            value={aprDesign}
                            columnName="approveWorkDesign"
                            testRow={rowOriginal as any}
                          />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-slate-600")}>
                          <GlobalCell
                            value={approveFlowName}
                            columnName="workFlowDefination"
                            testRow={rowOriginal as any}
                          />
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-slate-700")}>
                          <span
                            className={cn(
                              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                              rowOriginal.isMsp === true
                                ? "bg-emerald-50 text-emerald-700"
                                : rowOriginal.isMsp === false
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-slate-50 text-slate-400"
                            )}
                          >
                            {rowOriginal.isMsp === true
                              ? "Evet"
                              : rowOriginal.isMsp === false
                                ? "Hayır"
                                : "—"}
                          </span>
                        </TableCell>
                        <TableCell className={cn(tableCellClass, "text-right")}>
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                              onClick={() => navigate(`/workCompany/detail/${rowOriginal.id}`)}
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
                              aria-label="Şirketi sil"
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

          {filteredCompanyRows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 px-4 py-3">
              <span className="text-xs text-slate-400">
                {filteredCompanyRows.length} / {dataTableData.length} şirket
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
            <AlertDialogTitle className="text-slate-800">Kayıt silinecek</AlertDialogTitle>
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

export default WorkCompany;
