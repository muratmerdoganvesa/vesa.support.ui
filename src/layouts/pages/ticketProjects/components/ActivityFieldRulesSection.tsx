import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import {
  ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS,
  ACTIVITY_V2_FIELD_LABELS,
  createActivityFieldRule,
  deleteActivityFieldRule,
  fetchActivityFieldRuleByProject,
  getActivityFieldRuleApiErrorMessage,
  mergeFieldStates,
  parseRuleJson,
  updateActivityFieldRule,
  type ActivityFieldRuleDto,
  type ActivityFieldRulePayload,
} from "../api/activityFieldRulesApi";
import ActivityFieldRuleDialog from "./ActivityFieldRuleDialog";

type ActivityFieldRulesSectionProps = {
  ticketProjectId?: string;
};

const summarizeFields = (rule: ActivityFieldRuleDto) => {
  const states = mergeFieldStates(parseRuleJson(rule.ruleJson));
  const hidden = ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS.filter((key) => !states[key].visible).map(
    (key) => ACTIVITY_V2_FIELD_LABELS[key],
  );
  const required = ACTIVITY_V2_CONFIGURABLE_FIELD_KEYS.filter((key) => states[key].required).map(
    (key) => ACTIVITY_V2_FIELD_LABELS[key],
  );
  return {
    hidden: hidden.length > 0 ? hidden.join(", ") : "Yok",
    required: required.length > 0 ? required.join(", ") : "Yok",
  };
};

const ActivityFieldRulesSection = ({ ticketProjectId }: ActivityFieldRulesSectionProps) => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [rule, setRule] = useState<ActivityFieldRuleDto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleFetchRule = async () => {
    if (!ticketProjectId) return;
    try {
      dispatchBusy({ isBusy: true });
      const data = await fetchActivityFieldRuleByProject(ticketProjectId);
      setRule(data);
    } catch (error) {
      dispatchAlert({
        message: getActivityFieldRuleApiErrorMessage(
          error,
          "Aktivite alan kuralı getirilirken hata oluştu.",
        ),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    if (!ticketProjectId) {
      setRule(null);
      return;
    }
    void handleFetchRule();
  }, [ticketProjectId]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setModalOpen(true);
  };

  const handleOpenEdit = () => {
    setIsEditing(true);
    setModalOpen(true);
  };

  const handleSubmit = async (payload: ActivityFieldRulePayload) => {
    if (!ticketProjectId) return;
    try {
      dispatchBusy({ isBusy: true });
      if (isEditing && rule?.id) {
        await updateActivityFieldRule(rule.id, payload);
        dispatchAlert({ message: "Alan kuralı güncellendi.", type: "Success" });
      } else {
        await createActivityFieldRule(payload);
        dispatchAlert({ message: "Alan kuralı kaydedildi.", type: "Success" });
      }
      await handleFetchRule();
    } catch (error) {
      dispatchAlert({
        message: getActivityFieldRuleApiErrorMessage(
          error,
          isEditing ? "Alan kuralı güncellenirken hata oluştu." : "Alan kuralı eklenirken hata oluştu.",
        ),
        type: "Error",
      });
      throw new Error("save-failed");
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleConfirmDelete = async () => {
    if (!rule?.id) return;
    try {
      dispatchBusy({ isBusy: true });
      await deleteActivityFieldRule(rule.id);
      dispatchAlert({ message: "Alan kuralı silindi.", type: "Success" });
      setDeleteOpen(false);
      setRule(null);
    } catch (error) {
      dispatchAlert({
        message: getActivityFieldRuleApiErrorMessage(error, "Alan kuralı silinirken hata oluştu."),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const summary = useMemo(() => (rule ? summarizeFields(rule) : null), [rule]);

  if (!ticketProjectId) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-sm font-medium leading-none">Aktivite Alan Kuralları</span>
          <span className="text-xs text-muted-foreground">
            Aktivite formunda hangi alanların görüneceğini ve zorunlu olacağını bu proje için tanımlayın.
          </span>
        </div>
        {!rule && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenCreate}
            aria-label="Alan kuralı ekle"
          >
            <Plus className="size-4" />
            Ekle
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-input">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kural</TableHead>
              <TableHead>Gizli alanlar</TableHead>
              <TableHead>Zorunlu alanlar</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-20 text-right">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!rule ? (
              <TableRow>
                <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">
                  Bu proje için henüz alan kuralı yok.
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell className="max-w-48 whitespace-normal font-medium">
                  {rule.name?.trim() || "İsimsiz kural"}
                  {rule.description?.trim() ? (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {rule.description}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="max-w-48 whitespace-normal text-muted-foreground">
                  {summary?.hidden}
                </TableCell>
                <TableCell className="max-w-48 whitespace-normal text-muted-foreground">
                  {summary?.required}
                </TableCell>
                <TableCell>
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Alan kuralını düzenle"
                      onClick={handleOpenEdit}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Alan kuralını sil"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ActivityFieldRuleDialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setIsEditing(false);
        }}
        ticketProjectId={ticketProjectId}
        editingItem={isEditing ? rule : null}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteOpen} onOpenChange={(open) => !open && setDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alan kuralı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu projenin aktivite alan kuralı kalıcı olarak silinecek.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">İptal</AlertDialogCancel>
            <AlertDialogAction type="button" onClick={() => void handleConfirmDelete()}>
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityFieldRulesSection;
