import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { ListModuleDto, UserAppDto } from "api/generated";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
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
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import {
  createTicketSubProject,
  deleteTicketSubProject,
  fetchTicketSubProjectsByProject,
  updateTicketSubProject,
  type TicketSubProjectDto,
} from "../api/ticketSubProjectsApi";
import TicketSubProjectDialog, {
  type TicketSubProjectFormValues,
} from "./TicketSubProjectDialog";

type TicketSubProjectsSectionProps = {
  ticketProjectId: string;
  modules: ListModuleDto[];
  projectUsers: UserAppDto[];
};

const TicketSubProjectsSection = ({
  ticketProjectId,
  modules,
  projectUsers,
}: TicketSubProjectsSectionProps) => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [items, setItems] = useState<TicketSubProjectDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TicketSubProjectDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketSubProjectDto | null>(null);

  const handleFetchItems = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const data = await fetchTicketSubProjectsByProject(ticketProjectId);
      setItems(data);
    } catch {
      dispatchAlert({ message: "Alt projeler getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    if (!ticketProjectId) return;
    handleFetchItems();
  }, [ticketProjectId]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: TicketSubProjectDto) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleSubmit = async (values: TicketSubProjectFormValues) => {
    const payload = {
      ticketProjectId,
      name: values.name,
      userIds: values.userIds,
      moduleIds: values.moduleIds,
      effortDuration: values.effortDuration,
    };

    try {
      dispatchBusy({ isBusy: true });
      if (editingItem?.id) {
        await updateTicketSubProject(editingItem.id, payload);
        dispatchAlert({ message: "Alt proje güncellendi.", type: "Success" });
      } else {
        await createTicketSubProject(payload);
        dispatchAlert({ message: "Alt proje eklendi.", type: "Success" });
      }
      await handleFetchItems();
    } catch {
      dispatchAlert({
        message: editingItem ? "Alt proje güncellenirken hata oluştu." : "Alt proje eklenirken hata oluştu.",
        type: "Error",
      });
      throw new Error("save-failed");
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const totalEffort = useMemo(
    () =>
      items.reduce((sum, item) => sum + (Number(item.effortDuration) || 0), 0),
    [items]
  );

  const formatEffort = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(Number(value))) return "-";
    return `${Number(value).toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    })} saat`;
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      dispatchBusy({ isBusy: true });
      await deleteTicketSubProject(deleteTarget.id);
      dispatchAlert({ message: "Alt proje silindi.", type: "Success" });
      setDeleteTarget(null);
      await handleFetchItems();
    } catch {
      dispatchAlert({ message: "Alt proje silinirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium leading-none">Alt Projeler</span>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            Toplam efor: {formatEffort(totalEffort)}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenCreate}
          aria-label="Alt proje ekle"
        >
          <Plus className="size-4" />
          Ekle
        </Button>
      </div>

      <div className="rounded-lg border border-input">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Çalışanlar</TableHead>
              <TableHead>Modüller</TableHead>
              <TableHead className="text-right">Efor</TableHead>
              <TableHead className="w-20 text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                  Henüz alt proje yok.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const employeeNames = (item.users ?? [])
                  .map((user) => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim())
                  .filter(Boolean)
                  .join(", ");
                const moduleNames = (item.modules ?? [])
                  .map((mod) => mod.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-40 whitespace-normal font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell className="max-w-48 whitespace-normal text-muted-foreground">
                      {employeeNames || "-"}
                    </TableCell>
                    <TableCell className="max-w-40 whitespace-normal text-muted-foreground">
                      {moduleNames || "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatEffort(item.effortDuration)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${item.name} düzenle`}
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`${item.name} sil`}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {items.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="font-medium">
                  Toplam
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {formatEffort(totalEffort)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      <TicketSubProjectDialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingItem(null);
        }}
        editingItem={editingItem}
        modules={modules}
        projectUsers={projectUsers}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alt proje silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}" alt projesi kalıcı olarak silinecek.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">İptal</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={handleConfirmDelete}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TicketSubProjectsSection;
