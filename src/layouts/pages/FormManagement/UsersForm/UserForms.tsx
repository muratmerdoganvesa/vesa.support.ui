import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useNavigate, useParams } from "react-router-dom";
import getConfiguration from "confiuration";
import { FormAssignApi, FormStatus } from "api/generated/api";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";
import { Pencil, Eye, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { Button } from "components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

interface FormStatusItem {
  id: FormStatus;
  name: string;
  description: string;
}

function UserForms() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [rowData, setRowData] = useState<any[]>([]);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [statusData, setStatusData] = useState<FormStatusItem[]>([]);
  const { t } = useTranslation();

  // ── Data fetchers ────────────────────────────────────────────────────────

  const getFormStatus = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new FormAssignApi(getConfiguration());
      const status = await api.apiFormAssignFormStatusGet();
      setStatusData(status.data as any);
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu: " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new FormAssignApi(getConfiguration());
      const data = await api.apiFormAssignUserFormsGet();
      setRowData(data.data);
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu: " + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    getFormStatus();
    fetchData();
  }, []);

  // ── Navigation ───────────────────────────────────────────────────────────

  const handlePreview = (
    id: string,
    assignId: string,
    formRunId?: string,
    isVisibility?: string
  ) => {
    if (formRunId) {
      navigate("/parameters/view/" + id + "/" + formRunId + "/" + isVisibility);
    } else {
      navigate("/parameters/view/" + id, { state: { formAssignId: assignId } });
    }
  };

  // ── Client-side pagination ───────────────────────────────────────────────

  const pageCount = Math.ceil(rowData.length / itemsPerPage);
  const paginatedRows = useMemo(
    () => rowData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage),
    [rowData, currentPage, itemsPerPage]
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(0, Math.min(newPage, pageCount - 1)));
  };

  const handleItemsPerPageChange = (val: string) => {
    setItemsPerPage(Number(val));
    setCurrentPage(0);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="space-y-4">

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <ClipboardList className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">Atanan Formlar</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {rowData.length > 0 ? `${rowData.length} form listeleniyor` : "Form bulunamadı"}
            </p>
          </div>
        </div>

        {/* Table card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-20 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler")}
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("ns1:TicketPage.TicketTablePage.TableColumnProps.Durum")}
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Form Adı
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  {t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-14 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="w-8 h-8 text-slate-300" />
                      <span>Atanan form bulunamadı</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, idx) => (
                  <TableRow
                    key={row.id ?? idx}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Actions */}
                    <TableCell>
                      <TooltipProvider>
                        {row.status === "1" ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handlePreview(row.formId, row.id)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                aria-label="Formu Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Formu Düzenle</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() =>
                                  handlePreview(
                                    row.formId,
                                    row.id,
                                    row.formRunTimeId,
                                    "true"
                                  )
                                }
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                aria-label="Formu Görüntüle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Formu Görüntüle</TooltipContent>
                          </Tooltip>
                        )}
                      </TooltipProvider>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {row.statusText ?? row.status}
                      </span>
                    </TableCell>

                    {/* Form name */}
                    <TableCell className="font-medium text-slate-700 text-sm">
                      {row.formName}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                      {row.createdDate}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination footer */}
          {rowData.length > 0 && (
            <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50">

              {/* Rows per page */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Sayfa başına:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="h-7 w-16 text-xs border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-xs">
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Page info + controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {currentPage * itemsPerPage + 1}–
                  {Math.min((currentPage + 1) * itemsPerPage, rowData.length)} / {rowData.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-slate-200"
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Önceki sayfa"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 border-slate-200"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Sonraki sayfa"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

export default UserForms;
