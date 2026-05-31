import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { FormColumnDto, FormDataApi, FormDataListDto, FormRuntimeApi } from "api/generated";
import getConfiguration from "confiuration";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { FileDown, Plus } from "lucide-react";

interface Props {
  title?: string;
}

function UserStartForm({ title = "" }: Props): JSX.Element {
  const [gridData, setGridData] = useState<any[]>([]);
  const [rowId, setRowId] = useState("");
  const [queryId, setqueryId] = useState("");
  const [deleteBoxOpen, setdeleteBoxOpen] = useState(false);
  const [formData, setFormData] = useState<FormDataListDto>();
  const [columnList, setColumnList] = useState<FormColumnDto[]>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const page = queryParams.get("id");
  const { id } = useParams();
  const [data, setData] = useState(null);

  const [dataTableData, setDataTableData] = useState<{
    columns: { Header: string; accessor: string; width?: number }[];
    rows: any[];
  }>({
    columns: [],
    rows: [],
  });

  useEffect(() => {
    if (columnList && columnList.length > 0) {
      setDataTableData({
        columns: [
          { Header: "İşlemler", accessor: "actions", width: 100 },
          ...columnList.map((col) => ({
            Header: col.columnLabel ?? "",
            accessor: col.key ?? "",
          })),
        ],
        rows: dataTableData.rows,
      });
    }
  }, [columnList]);

  useEffect(() => {}, []);

  useEffect(() => {
    setqueryId(page ?? "");
    getFormInformation();
  }, [page]);

  const headtableInstanceRef = useRef(null);

  const showForm = (row: any) => {
    console.log(row);
    if (row.original != undefined) {
      navigate("/FormList/PreviewForm?id=" + page);
    }
  };

  const getFormInformation = async () => {
    const configuration = getConfiguration();
    const formApi = new FormDataApi(configuration);
    const result = await formApi.apiFormDataIdGet(id);
    setFormData(result.data);
    getData(result.data.id);
    getColumnList(result.data.id);
  };

  const getColumnList = async (id: any) => {
    const configuration = getConfiguration();
    const formRuntimeApi = new FormRuntimeApi(configuration);
    const result = await formRuntimeApi.apiFormRuntimeGetColumnListFormIdGet(id);
    setColumnList(result.data);
  };

  const handleOpenDialog = (row?: any) => {
    if (row?.original != undefined) {
      navigate(
        "/UserStartForm/UserStartFormDetail?id=" + row.original.id + "&" + "formid=" + formData?.id
      );
    } else {
      navigate("/ParameterEdit/?formid=" + formData?.id);
    }
  };

  function DeleteById(row: any) {}

  async function deleteDialog(id: any) {
    alert("test");
    if (id != null) {
      const configuration = getConfiguration();
      const formRuntimeApi = new FormRuntimeApi(configuration);
      await formRuntimeApi.apiFormRuntimeIdDelete(id);
      getData(formData?.id);
    }
  }

  async function getData(id: string) {
    const configuration = getConfiguration();
    const formRuntimeApi = new FormRuntimeApi(configuration);
    const res = await formRuntimeApi.apiFormRuntimeGetListFormIdGet(id);
    setGridData(Array.isArray(res.data) ? res.data : [res.data]);
  }

  const dataColumns = dataTableData.columns;

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="pt-6 pb-3 px-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={() => handleOpenDialog()}
            className="h-9 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium gap-1.5"
            aria-label="Yeni kayıt ekle"
          >
            <Plus className="size-4" />
            Yeni Kayıt
          </Button>

          <Button
            variant="outline"
            className="h-9 gap-1.5 text-sm"
            aria-label="CSV olarak dışa aktar"
          >
            <FileDown className="size-4" />
            Export CSV
          </Button>
        </div>

        {/* Form Title */}
        {formData?.formName && (
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-[#344767]">{formData.formName}</h2>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-gray-50">
                <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                  {dataColumns.map((col) => (
                    <TableHead
                      key={col.accessor}
                      className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap"
                    >
                      {col.Header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {gridData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={Math.max(dataColumns.length, 1)}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      Gösterilecek veri bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  gridData.map((row: any, rowIndex: number) => (
                    <TableRow
                      key={rowIndex}
                      className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                    >
                      {dataColumns.map((col) => (
                        <TableCell
                          key={col.accessor}
                          className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                        >
                          {col.accessor === "actions" ? (
                            <button
                              onClick={() =>
                                navigate(`/users/detail/?id=${row.userName}`)
                              }
                              className="inline-flex items-center rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 transition-colors"
                              aria-label={`Düzenle: ${row.userName}`}
                            >
                              Edit
                            </button>
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
        </div>
      </div>
    </DashboardLayout>
  );
}

export default UserStartForm;
