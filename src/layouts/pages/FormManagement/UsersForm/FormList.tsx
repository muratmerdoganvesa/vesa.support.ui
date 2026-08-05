import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useEffect, useState, type ReactNode } from "react";
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
  isTableField?: boolean;
}

const LAYOUT_TYPES = new Set([
  "panel",
  "well",
  "columns",
  "fieldset",
  "tabs",
  "table",
  "dstable",
  "htmlelement",
  "dshtmlelement",
  "content",
  "button",
  "dsbutton",
  "hidden",
]);

const TABLE_TYPES = new Set(["dstable", "table"]);

const collectComponents = (node: unknown, acc: any[] = []): any[] => {
  if (!node) return acc;

  if (Array.isArray(node)) {
    node.forEach((item) => collectComponents(item, acc));
    return acc;
  }

  if (typeof node !== "object") return acc;

  const component = node as Record<string, any>;

  if (typeof component.type === "string" && typeof component.key === "string") {
    acc.push(component);
  }

  if (Array.isArray(component.components)) {
    collectComponents(component.components, acc);
  }

  if (Array.isArray(component.columns)) {
    component.columns.forEach((col: any) => collectComponents(col?.components ?? col, acc));
  }

  if (Array.isArray(component.rows)) {
    component.rows.forEach((row: any) => {
      if (Array.isArray(row)) {
        row.forEach((cell: any) => collectComponents(cell?.components ?? cell, acc));
      } else {
        collectComponents(row?.components ?? row, acc);
      }
    });
  }

  return acc;
};

const extractFieldsFromTable = (tableComponent: Record<string, any>): ColumnDef[] => {
  const nested: any[] = [];

  if (Array.isArray(tableComponent.rows)) {
    tableComponent.rows.forEach((row: any) => {
      if (!Array.isArray(row)) return;
      row.forEach((cell: any) => collectComponents(cell?.components ?? [], nested));
    });
  }

  if (Array.isArray(tableComponent.components)) {
    collectComponents(tableComponent.components, nested);
  }

  const seen = new Set<string>();
  return nested
    .filter((comp) => {
      if (!comp?.key || LAYOUT_TYPES.has(comp.type) || comp.input === false) return false;
      if (seen.has(comp.key)) return false;
      seen.add(comp.key);
      return true;
    })
    .map((comp) => ({
      accessor: comp.key as string,
      label: (comp.label as string) || (comp.key as string),
      isTableField: true,
    }));
};

const isInputField = (comp: Record<string, any>): boolean => {
  if (!comp?.key || typeof comp.key !== "string") return false;
  if (LAYOUT_TYPES.has(comp.type)) return false;
  if (comp.input === false) return false;
  if (comp.tableView === false && comp.input !== true) return false;
  return true;
};

const extractTableFieldColumns = (formDesign?: string | null): ColumnDef[] => {
  if (!formDesign) return [];

  try {
    const schema = JSON.parse(formDesign);
    const allComponents = collectComponents(schema);
    const tableComponents = allComponents.filter((comp) => TABLE_TYPES.has(comp.type));

    const columns: ColumnDef[] = [];
    const seen = new Set<string>();

    const pushUnique = (col: ColumnDef) => {
      if (!col.accessor || seen.has(col.accessor)) return;
      seen.add(col.accessor);
      columns.push(col);
    };

    // Form içindeki dstable/table alanlarının çocuk input'larını öncelikli ekle
    tableComponents.forEach((tableComp) => {
      extractFieldsFromTable(tableComp).forEach(pushUnique);
    });

    // Tabloda alan yoksa formdaki tüm input alanlarını kolon olarak kullan
    if (columns.length === 0) {
      allComponents.filter(isInputField).forEach((comp) => {
        pushUnique({
          accessor: comp.key as string,
          label: (comp.label as string) || (comp.key as string),
          isTableField: false,
        });
      });
    }

    return columns;
  } catch {
    return [];
  }
};

const formatCellValue = (value: unknown): ReactNode => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") return value ? "Evet" : "Hayır";

  if (typeof value === "number" || typeof value === "string") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";

    if (value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
      const keys = Array.from(
        value.reduce((set: Set<string>, item: Record<string, unknown>) => {
          Object.keys(item).forEach((key) => set.add(key));
          return set;
        }, new Set<string>())
      );

      return (
        <div className="max-w-xl overflow-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50">
                {keys.map((key) => (
                  <th
                    key={key}
                    className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((item: Record<string, unknown>, idx: number) => (
                <tr key={idx}>
                  {keys.map((key) => (
                    <td
                      key={key}
                      className="border border-gray-200 px-2 py-1 text-gray-800 whitespace-nowrap"
                    >
                      {formatPrimitive(item[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return value.map((item) => formatPrimitive(item)).join(", ");
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== null && v !== undefined && v !== ""
    );
    if (entries.length === 0) return "—";

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        {entries.map(([key, val]) => (
          <span key={key}>
            <span className="font-medium text-gray-600">{key}: </span>
            {formatPrimitive(val)}
          </span>
        ))}
      </div>
    );
  }

  return String(value);
};

const formatPrimitive = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Evet" : "Hayır";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatDate = (value: unknown): string => {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("tr-TR");
};

function FormList() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [rowData, setRowData] = useState<any[]>([]);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [itemsPerPage] = useState(10);
  const { t } = useTranslation();
  const [deletedId, setDeletedId] = useState("");
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [activeIndex] = useState(0);
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

  const buildColumns = (
    apiColumns: ColumnDef[],
    tableFieldColumns: ColumnDef[]
  ): ColumnDef[] => {
    const actionsCol: ColumnDef = {
      accessor: "actions",
      label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Islemler"),
    };
    const dateCol: ColumnDef = {
      accessor: "createdDate",
      label: t("ns1:TicketPage.TicketTablePage.TableColumnProps.Tarih"),
    };

    const middle: ColumnDef[] = [];
    const seen = new Set<string>(["actions", "createdDate"]);

    // Önce form içindeki tablo alanlarının sütunları
    tableFieldColumns.forEach((col) => {
      if (!col.accessor || seen.has(col.accessor)) return;
      seen.add(col.accessor);
      middle.push(col);
    });

    // Sonra API'den gelen "Grid Üzerinde Gösterilsin" kolonları
    apiColumns.forEach((col) => {
      if (!col.accessor || seen.has(col.accessor)) return;
      seen.add(col.accessor);
      middle.push(col);
    });

    return [actionsCol, ...middle, dateCol];
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new FormRuntimeApi(conf);

      const apiForm = new FormDataApi(conf);
      const apiFormRes = await apiForm.apiFormDataIdGet(formId);
      setFormData(apiFormRes.data);

      const tableFieldColumns = extractTableFieldColumns(apiFormRes.data?.formDesign);

      const columnsData = await api.apiFormRuntimeGetColumnListFormIdGet(formId);
      const apiColumns: ColumnDef[] = (columnsData.data ?? []).map((item) => ({
        accessor: item.key ?? "",
        label: item.columnLabel ?? item.key ?? "",
      }));

      setColumns(buildColumns(apiColumns, tableFieldColumns));

      const data = await api.apiFormRuntimeGetFormDataByIdFormIdGet(formId);

      const allRows = data.data.map((item: Record<string, any>) => {
        let parsed: Record<string, any> = {};
        try {
          parsed = item.valuesJsonData ? JSON.parse(item.valuesJsonData) : {};
        } catch {
          parsed = {};
        }
        return { ...item, ...parsed };
      });
      setRowData(allRows);
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
    setCurrentPage(selected + 1);
  };

  const totalPages = Math.max(1, Math.ceil(rowData.length / itemsPerPage));
  const paginatedRows = rowData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderCellContent = (row: any, col: ColumnDef) => {
    if (col.accessor === "actions") {
      return (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handlePreview(row.formId, row.id, "true")}
                  className="inline-flex size-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                  aria-label={t("ns1:TicketPage.TicketTablePage.Incele")}
                >
                  <Eye className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("ns1:TicketPage.TicketTablePage.Incele")}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handlePreview(row.formId, row.id, "false")}
                  className="inline-flex size-8 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                  aria-label={t("ns1:TicketPage.TicketTablePage.TalebiDuzenle")}
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
                  aria-label={t("ns1:TicketPage.TicketTablePage.TalebiSil")}
                >
                  <Trash2 className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("ns1:TicketPage.TicketTablePage.TalebiSil")}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      );
    }

    if (col.accessor === "createdDate") {
      return formatDate(row.createdDate);
    }

    return formatCellValue(row[col.accessor]);
  };

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
                          className={`px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap ${
                            col.accessor === "actions" ? "sticky left-0 z-20 bg-gray-50" : ""
                          }`}
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
                          key={row.id ?? rowIndex}
                          className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                        >
                          {columns.map((col) => (
                            <TableCell
                              key={col.accessor}
                              className={`px-4 py-2.5 text-sm text-foreground ${
                                col.accessor === "actions"
                                  ? "sticky left-0 z-10 bg-white whitespace-nowrap"
                                  : col.accessor === "createdDate"
                                    ? "whitespace-nowrap"
                                    : "align-top"
                              }`}
                            >
                              {renderCellContent(row, col)}
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
