import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import getConfiguration from "confiuration";
import { RoleMenuApi } from "api/generated";
import GlobalCell from "../talepYonetimi/allTickets/tableData/globalCell";
import { AppAlertType, useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
import { useTranslation } from "react-i18next";
import { LayoutList, Pencil, Plus, Search, Shield, Trash2 } from "lucide-react";
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

type RoleRow = {
  id: string;
  name?: string;
  [key: string]: unknown;
};

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-[90px] flex-col gap-0.5 rounded-xl border px-4 py-3",
        accent
          ? "border-indigo-200 bg-indigo-50/60"
          : "border-slate-100 bg-white/60"
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

function EmptyStateRole({ query }: { query: string }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={2} className="py-20 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <LayoutList className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            {query
              ? `"${query}" için sonuç bulunamadı`
              : "Henüz rol tanımlanmamış"}
          </p>
          {!query ? (
            <p className="text-xs text-slate-400">Yeni rol ekleyerek başlayabilirsiniz</p>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}

function RolesList() {
  const navigate = useNavigate();
  const [data, setData] = useState<RoleRow[]>([]);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const { t } = useTranslation();
  const [tableSearchQuery, setTableSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      var conf = getConfiguration();
      var api = new RoleMenuApi(conf);
      var response = await api.apiRoleMenuAllOnlyHeadGet();
      console.log(response.data);
      setData(response.data as any);
    } catch (error) {
      dispatchAlert({
        message: t("ns1:RolePage.RoleList.HataOlustu"),
        type: AppAlertType.Error,
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new RoleMenuApi(conf);
      await api.apiRoleMenuRoleIdDelete(id);
      dispatchAlert({
        message: t("ns1:RolePage.RoleList.RolSilindi"),
        type: AppAlertType.Success,
      });
      fetchData();
    } catch (error) {
      dispatchAlert({
        message: t("ns1:RolePage.RoleList.HataOlustu") + ": " + error,
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const columns: {
    accessor: string;
    header: string;
    renderCell: (row: RoleRow) => React.ReactNode;
  }[] = [
    {
      accessor: "name",
      header: t("ns1:RolePage.RoleList.RolAdi"),
      renderCell: (row) => (
        <span className="text-sm font-medium text-slate-800">
          <GlobalCell value={row.name} />
        </span>
      ),
    },
    {
      accessor: "actions",
      header: t("ns1:RolePage.RoleList.Islemler"),
      renderCell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
            onClick={() => navigate(`/roles/detail/${row.id}`)}
            aria-label="Düzenle"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
            onClick={() => handleOpenQuestionBox(row.id)}
            aria-label="Rolü sil"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const filteredRows = useMemo(() => {
    const q = tableSearchQuery.trim().toLowerCase();
    if (!q) {
      return data;
    }
    return data.filter((row) => (row.name ?? "").toLowerCase().includes(q));
  }, [data, tableSearchQuery]);

  const tableHeadClass =
    "px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase";
  const tableCellClass = "px-4 py-3 align-middle";

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-[calc(100vh-160px)] space-y-6 px-1 py-6">
        {/* ── Header (MenuList ile aynı yapı) ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="shadow-indigo-200 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">
                {t("ns1:RolePage.RoleList.RoleTitle")}
              </h1>
            </div>
            <p className="pl-11.5 text-sm text-slate-500">
              {t("ns1:RolePage.RoleList.RoleSubTitle")}
            </p>
          </div>

          <Button
            type="button"
            className="hover:shadow-indigo-200/60 shrink-0 gap-2 bg-indigo-600 shadow-sm shadow-indigo-200/60 transition-all duration-200 hover:-translate-y-px hover:bg-indigo-700 hover:shadow-md"
            onClick={() => navigate(`/roles/detail`)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t("ns1:RolePage.RoleList.YeniRol")}
          </Button>
        </div>

        {/* ── Stats (MenuList’taki kart stili) ── */}
        <div className="flex flex-wrap gap-3">
          <StatCard label="Toplam" value={data.length} />
        </div>

        {/* ── Arama ── */}
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            className="h-9 border-slate-200 bg-white pr-3 pl-9 text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
            placeholder="Rol adı ara…"
            value={tableSearchQuery}
            onChange={(e) => setTableSearchQuery(e.target.value)}
            aria-label="Tablo sonuçlarını filtrele"
          />
        </div>

        {/* ── Tablo kartı ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100">
          <div className="max-h-[min(565px,70vh)] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 bg-slate-50/70 hover:bg-slate-50/70">
                  {columns.map((col) => (
                    <TableHead
                      key={col.accessor}
                      className={cn(
                        tableHeadClass,
                        col.accessor === "actions" && "w-[72px] text-right"
                      )}
                      scope="col"
                    >
                      {col.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.length === 0 ? (
                  <EmptyStateRole query={tableSearchQuery.trim()} />
                ) : (
                  filteredRows.map((row) => (
                    <TableRow
                      key={String(row.id)}
                      className="group border-slate-50 transition-colors duration-150 hover:bg-indigo-50/30"
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={col.accessor}
                          className={cn(
                            tableCellClass,
                            col.accessor === "name" && "text-sm",
                            col.accessor === "actions" && "text-right"
                          )}
                        >
                          {col.accessor === "actions" ? (
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                              {col.renderCell(row)}
                            </div>
                          ) : (
                            col.renderCell(row)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredRows.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 px-4 py-3">
              <span className="text-xs text-slate-400">
                {filteredRows.length} / {data.length} rol
                {tableSearchQuery.trim() ? (
                  <span className="text-indigo-400"> · &quot;{tableSearchQuery.trim()}&quot;</span>
                ) : null}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <AlertDialog open={isQuestionMessageBoxOpen} onOpenChange={setIsQuestionMessageBoxOpen}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800">Rolü sil</AlertDialogTitle>
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

      
    </DashboardLayout>
  );
}

export default RolesList;
