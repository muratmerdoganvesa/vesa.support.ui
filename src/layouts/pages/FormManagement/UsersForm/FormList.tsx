import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useEffect, useState } from "react";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useNavigate, useParams } from "react-router-dom";
import getConfiguration from "confiuration";
import { FormDataApi, FormRuntimeApi } from "api/generated/api";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";
import MessageBox from "layouts/pages/Components/MessageBox";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { Plus, Eye, Trash2, Pencil, ChevronLeft, ChevronRight } from "lucide-react";

interface ColumnDef {
  accessor: string;
  label: string;
}

function FormList() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [rowData, setRowData] = useState<any[]>([]);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [pageCount, setPageCount] = useState(0);
  const [itemOffset, setItemOffset] = useState(0);
  const [totalListCount, settotalListCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [msgOpen, setmsgOpen] = useState(false);
  const { t } = useTranslation();
  const [deletedId, setDeletedId] = useState("");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { accessor: "actions", label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler") },
    { accessor: "createdDate", label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih") },
  ]);

  const handleOpenQuestionBox = (id: string) => {
    setDeletedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const handleCloseQuestionBox = (action: string) => {
    setIsQuestionMessageBoxOpen(false);
    if (action === "Yes") {
      handleDelete(deletedId);
    }
    if (action === "No") {
      alert("silinme işlemi iptal edildi");
    }
  };

  const handlePreview = (id: string, formRunId: string, isVisibility?: string) => {
    navigate("/parameters/view/" + id + "/" + formRunId + "/" + isVisibility);
  };

  const handleDelete = async (id: string) => {
    const conf = getConfiguration();
    const api = new FormRuntimeApi(conf);
    await api.apiFormRuntimeIdDelete(id);
    fetchData();
    navigate("/formList/" + formId);
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new FormRuntimeApi(conf);

      const columnsData = await api.apiFormRuntimeGetColumnListFormIdGet(formId);
      console.log("columnsData>>", columnsData);

      if (columnsData.data.length > 0) {
        const dynamicColumns: ColumnDef[] = columnsData.data.map((item) => ({
          accessor: item.key ?? "",
          label: item.columnLabel ?? "",
        }));

        setColumns((prev) => {
          const existingAccessors = new Set(prev.map((col) => col.accessor));
          const filtered = dynamicColumns.filter((col) => !existingAccessors.has(col.accessor));
          return [...prev, ...filtered];
        });
      }

      const data = await api.apiFormRuntimeGetFormDataByIdFormIdGet(formId);
      console.log("data res>>", data);

      const allRows = data.data.map((item: Record<string, any>) => {
        const parsed = JSON.parse(item.valuesJsonData);
        return { ...item, ...parsed };
      });
      setRowData(allRows);

      const apiForm = new FormDataApi(conf);
      const apiFormRes = await apiForm.apiFormDataIdGet(formId);
      console.log("formData>>", apiFormRes);
      setFormData(apiFormRes.data);
    } catch (error) {
      dispatchAlert({
        message: "Hata oluştu" + error,
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageClick = (selected: number) => {
    const newOffset = (selected * itemsPerPage) % totalListCount;
    setItemOffset(newOffset);
    setCurrentPage(selected + 1);
  };

  const totalPages = Math.max(1, Math.ceil(rowData.length / itemsPerPage));
  const paginatedRows = rowData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-[-25px] rounded-xl bg-white shadow-md overflow-hidden">
        {/* Page Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-semibold text-[#344767]">
              {formData?.formName ?? ""}
            </h1>
            {formData?.formDescription && (
              <p className="text-sm text-[#7b809a] mt-0.5">{formData.formDescription}</p>
            )}
          </div>
          <Button
            onClick={() => navigate(`/parameters/view/${formId}`)}
            className="h-9 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium gap-1.5 shrink-0"
            aria-label="Yeni form oluştur"
          >
            <Plus className="size-4" />
            {t("ns1:FormMngPage.YeniForm")}
          </Button>
        </div>

        {/* Table */}
        {activeIndex === 0 && (
          <div className="p-4">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-gray-50">
                    <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                      {columns.map((col) => (
                        <TableHead
                          key={col.accessor}
                          className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap"
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="py-16 text-center text-sm text-muted-foreground"
                        >
                          Gösterilecek veri bulunamadı.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRows.map((row: any, rowIndex: number) => (
                        <TableRow
                          key={rowIndex}
                          className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                        >
                          {columns.map((col) => (
                            <TableCell
                              key={col.accessor}
                              className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                            >
                              {col.accessor === "actions" ? (
                                <TooltipProvider>
                                  <div className="flex items-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePreview(row.formId, row.id, "true")
                                          }
                                          className="inline-flex size-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                                          aria-label={t("ns1:TicketPage.TicketTablePage.Incele")}
                                        >
                                          <Eye className="size-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t("ns1:TicketPage.TicketTablePage.Incele")}
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePreview(row.formId, row.id, "false")
                                          }
                                          className="inline-flex size-8 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                                          aria-label={t(
                                            "ns1:TicketPage.TicketTablePage.TalebiDuzenle"
                                          )}
                                        >
                                          <Pencil className="size-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t("ns1:TicketPage.TicketTablePage.TalebiDuzenle")}
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => handleOpenQuestionBox(row.id)}
                                          className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                          aria-label={t(
                                            "ns1:TicketPage.TicketTablePage.TalebiSil"
                                          )}
                                        >
                                          <Trash2 className="size-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t("ns1:TicketPage.TicketTablePage.TalebiSil")}
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </TooltipProvider>
                              ) : (
                                (row[col.accessor] ?? "—")
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Sayfa {currentPage} / {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="size-8"
                    onClick={() => {
                      const next = Math.max(0, currentPage - 2);
                      handlePageClick(next);
                    }}
                    disabled={currentPage === 1}
                    aria-label="Önceki sayfa"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        (p >= currentPage - 1 && p <= currentPage + 1)
                    )
                    .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "ellipsis" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-sm text-muted-foreground"
                        >
                          …
                        </span>
                      ) : (
                        <Button
                          key={item}
                          variant={currentPage === item ? "default" : "outline"}
                          size="icon-sm"
                          className="size-8 text-xs"
                          onClick={() => handlePageClick((item as number) - 1)}
                          aria-label={`Sayfa ${item}`}
                          aria-current={currentPage === item ? "page" : undefined}
                        >
                          {item}
                        </Button>
                      )
                    )}

                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="size-8"
                    onClick={() => handlePageClick(currentPage)}
                    disabled={currentPage === totalPages}
                    aria-label="Sonraki sayfa"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
      />
    </DashboardLayout>
  );
}

export default FormList;
