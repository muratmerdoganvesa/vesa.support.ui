import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import { useEffect, useState } from "react";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useNavigate } from "react-router-dom";
import CustomMessageBox from "../Components/CustomMessageBox";
import getConfiguration from "confiuration";
import { PositionListDto, PositionsApi } from "api/generated";
import { useAlert } from "../hooks/useAlert";
import { useBusy } from "../hooks/useBusy";
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
import { Plus, Pencil, Trash2 } from "lucide-react";

const columns: { key: keyof PositionListDto | "actions"; label: string }[] = [
  { key: "customerName", label: "Şirket" },
  { key: "name", label: "Pozisyon Adı" },
  { key: "description", label: "Açıklama" },
  { key: "actions", label: "İşlemler" },
];

function PositionPage() {
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dataTableData, setDataTableData] = useState<PositionListDto[]>([]);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();

  const handleCloseQuestionBox = async (action: string) => {
    if (action === "Evet") {
      try {
        const conf = getConfiguration();
        const api = new PositionsApi(conf);
        await api.apiPositionsDelete(selectedId);
        dispatchAlert({
          message: "Pozisyon başarıyla silindi",
          type: "Success",
        });
      } catch (error) {
        dispatchAlert({
          message: "Pozisyon silinemedi",
          type: "Error",
        });
      } finally {
        fetchDataList();
        setIsQuestionMessageBoxOpen(false);
      }
    } else if (action === "İptal") {
      setIsQuestionMessageBoxOpen(false);
    }
  };

  const handleOpenQuestionBox = (id: string) => {
    setSelectedId(id);
    setIsQuestionMessageBoxOpen(true);
  };

  const fetchDataList = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new PositionsApi(conf);
      const response = await api.apiPositionsGet();
      setDataTableData(response.data);
    } catch (error) {
      dispatchAlert({
        message: "Pozisyonlar alınamadı",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchDataList();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-[-15px] rounded-xl bg-white shadow-md overflow-hidden">
        {/* Page Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-xl font-semibold text-[#344767]">Pozisyon Yönetimi</h1>
            <p className="text-sm text-[#7b809a] mt-0.5">
              Pozisyonları görüntüleyin, oluşturun ve dahası
            </p>
          </div>
          <Button
            onClick={() => navigate(`/position/detail`)}
            className="h-9 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium gap-1.5 shrink-0"
            aria-label="Yeni pozisyon oluştur"
          >
            <Plus className="size-4" />
            Yeni Pozisyon
          </Button>
        </div>

        {/* Table */}
        <div className="p-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[565px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50">
                  <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                    {columns.map((col) => (
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
                  {dataTableData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="py-16 text-center text-sm text-muted-foreground"
                      >
                        Gösterilecek pozisyon bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataTableData.map((row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                      >
                        {columns.map((col) => (
                          <TableCell
                            key={col.key}
                            className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap"
                          >
                            {col.key === "actions" ? (
                              <TooltipProvider>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          navigate(`/position/detail/${(row as any).id}`)
                                        }
                                        className="inline-flex size-8 items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors"
                                        aria-label="Düzenle"
                                      >
                                        <Pencil className="size-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Düzenle</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenQuestionBox((row as any).id)}
                                        className="inline-flex size-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 transition-colors"
                                        aria-label="Sil"
                                      >
                                        <Trash2 className="size-4" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Sil</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            ) : (
                              ((row as any)[col.key] ?? "—")
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
      </div>

      <CustomMessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
        titleText="Pozisyon Silme"
        contentText="Bu pozisyonu silmek istediğinize emin misiniz?"
        warningText={{
          text: "Bu işlem geri alınamaz.",
          color: "red",
        }}
        type="warning"
      />
    </DashboardLayout>
  );
}

export default PositionPage;
