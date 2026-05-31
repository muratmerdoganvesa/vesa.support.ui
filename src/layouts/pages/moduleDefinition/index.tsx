import { InsertModuleDto, ListModuleDto, ModuleApi, UpdateModuleDto } from "api/generated";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Boxes, Pencil, Plus, Search, PackageX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function ModuleDefinition() {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [moduleData, setModuleData] = useState<ListModuleDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const emptyInsertDto: InsertModuleDto = { name: "", isActive: true };
  const [insertFormData, setInsertFormData] = useState<InsertModuleDto>(emptyInsertDto);
  const [updateFormData, setUpdateFormData] = useState<UpdateModuleDto | null>(null);

  const currentFormData = isEditMode ? updateFormData : insertFormData;

  const filteredData = useMemo(
    () =>
      moduleData.filter((m) =>
        (m.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [moduleData, searchQuery]
  );

  const fetchModules = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ModuleApi(getConfiguration());
      const data = await api.apiModuleGet();
      setModuleData(data.data as any);
    } catch {
      dispatchAlert({ message: "Modüller getirilirken hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setInsertFormData(emptyInsertDto);
    setUpdateFormData(null);
    setOpenDialog(true);
  };

  const handleOpenEdit = (row: ListModuleDto) => {
    setIsEditMode(true);
    setUpdateFormData({ id: row.id, name: row.name, isActive: row.isActive });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleNameChange = (value: string) => {
    if (isEditMode && updateFormData) {
      setUpdateFormData({ ...updateFormData, name: value });
    } else {
      setInsertFormData({ ...insertFormData, name: value });
    }
  };

  const handleActiveChange = (checked: boolean) => {
    if (isEditMode && updateFormData) {
      setUpdateFormData({ ...updateFormData, isActive: checked });
    } else {
      setInsertFormData({ ...insertFormData, isActive: checked });
    }
  };

  const handleSave = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new ModuleApi(getConfiguration());

      if (isEditMode && updateFormData) {
        await api.apiModulePut(updateFormData);
        dispatchAlert({ message: "Modül başarıyla güncellendi.", type: "success" });
      } else {
        await api.apiModulePost(insertFormData);
        dispatchAlert({ message: "Modül başarıyla oluşturuldu.", type: "success" });
      }

      setOpenDialog(false);
      fetchModules();
    } catch {
      dispatchAlert({ message: "İşlem sırasında hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="flex flex-col gap-4">
        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/8 shadow-sm">
          {/* Gradient arka plan deseni */}
          <div className="absolute inset-0 bg-linear-to-br from-violet-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
          <div className="absolute right-0 top-0 h-full w-64 bg-linear-to-l from-violet-500/5 to-transparent pointer-events-none" />

          <div className="relative flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* İkon */}
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25">
                <Boxes className="size-6 text-white" />
              </div>

              {/* Başlık */}
              <div className="flex flex-col gap-0.5">
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Modül Yönetimi
                </h1>
                <p className="text-sm text-muted-foreground">
                  Modülleri görüntüleyin, oluşturun ve yönetin
                </p>
              </div>
            </div>

            {/* Aksiyon */}
            <Button
              onClick={handleOpenCreate}
              className="gap-1.5 bg-linear-to-r from-violet-500 to-indigo-600 shadow-md shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:brightness-110"
            >
              <Plus className="size-4" />
              Yeni Modül
            </Button>
          </div>

          {/* Alt çizgi aksan */}
          <div className="h-px w-full bg-linear-to-r from-violet-500/50 via-indigo-500/30 to-transparent" />
        </div>

        {/* ── Tablo Kartı ── */}
        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/8 shadow-sm">
          {/* Arama + sayaç */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Modül ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-56 pl-8 text-sm"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredData.length} kayıt
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 pl-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  #
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Modül Adı
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Durum
                </TableHead>
                <TableHead className="w-24 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-4">
                  İşlem
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4}>
                    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
                      <PackageX className="size-10 opacity-30" />
                      <p className="text-sm">
                        {searchQuery ? "Aramanıza uygun modül bulunamadı." : "Henüz modül eklenmemiş."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((module, index) => (
                  <TableRow
                    key={module.id ?? index}
                    className="group transition-colors"
                  >
                    <TableCell className="pl-4 text-sm text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {module.name}
                    </TableCell>
                    <TableCell>
                      {module.isActive ? (
                        <Badge
                          className="border-0 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                        >
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Pasif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenEdit(module)}
                        aria-label={`${module.name} düzenle`}
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={openDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600">
                <Boxes className="size-4 text-white" />
              </div>
              <div>
                <DialogTitle>
                  {isEditMode ? "Modülü Düzenle" : "Yeni Modül Ekle"}
                </DialogTitle>
                <DialogDescription>
                  {isEditMode
                    ? "Modül bilgilerini güncelleyin."
                    : "Sisteme yeni bir modül tanımlayın."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="module-name">Modül Adı</Label>
              <Input
                id="module-name"
                placeholder="Modül adı girin..."
                value={currentFormData?.name ?? ""}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="module-active" className="cursor-pointer text-sm font-medium">
                  Modül Durumu
                </Label>
                <span className={`text-xs font-medium ${currentFormData?.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {currentFormData?.isActive ? "Aktif — kullanımda" : "Pasif — devre dışı"}
                </span>
              </div>
              <Switch
                id="module-active"
                checked={currentFormData?.isActive ?? true}
                onCheckedChange={handleActiveChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              İptal
            </Button>
            <Button
              onClick={handleSave}
              disabled={!currentFormData?.name?.trim()}
              className="bg-linear-to-r from-violet-500 to-indigo-600"
            >
              {isEditMode ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default ModuleDefinition;
