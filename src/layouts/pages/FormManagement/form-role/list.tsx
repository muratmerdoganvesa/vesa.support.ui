import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Plus, Trash2 } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import CustomMessageBox from "layouts/pages/Components/CustomMessageBox";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";

import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";

function FormRoleList() {
  const navigate = useNavigate();
  const [isQuestionMessageBoxOpen, setIsQuestionMessageBoxOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dataTableData, setDataTableData] = useState<any[]>([]);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const handleCloseQuestionBox = async (action: string) => {
    if (action === "Sil") {
      setIsQuestionMessageBoxOpen(false);
    }
  };

  const handleOpenQuestionBox = (id: string) => {
    setIsQuestionMessageBoxOpen(true);
    setSelectedId(id);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="flex flex-col gap-6 px-1 py-2">
        {/* Page header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Form Rolü Yönetimi
            </h1>
            <p className="text-sm text-muted-foreground">
              Sisteme tanımlı form rollerini görüntüleyin ve yönetin.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="mt-3 w-fit gap-1.5 rounded-xl transition-all duration-200 ease-out sm:mt-0"
            onClick={() => navigate("/form-role/detail")}
          >
            <Plus className="size-4" aria-hidden />
            Yeni Form Rolü
          </Button>
        </div>

        {/* Table card */}
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Form Rolü Adı
                  </TableHead>
                  <TableHead className="w-24 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataTableData.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={2}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  dataTableData.map((row: any) => (
                    <TableRow
                      key={row.id}
                      className="border-border/40 transition-colors duration-150"
                    >
                      <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                        {row.formRoleName}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-slate-100 hover:text-foreground dark:hover:bg-slate-800"
                            aria-label="Düzenle"
                            onClick={() => navigate(`/form-role/detail/${row.id}`)}
                          >
                            <Pencil className="size-3.5" aria-hidden />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                            aria-label="Sil"
                            onClick={() => handleOpenQuestionBox(row.id)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <CustomMessageBox
        isQuestionmessageBoxOpen={isQuestionMessageBoxOpen}
        handleCloseQuestionBox={handleCloseQuestionBox}
        titleText="Form Rolü Silme"
        contentText="Bu form rolünü silmek istediğinize emin misiniz?"
        warningText={{
          text: "Bu işlem geri alınamaz.",
          color: "red",
        }}
        type="warning"
      />
    </DashboardLayout>
  );
}

export default FormRoleList;
