import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, Loader2, Pencil, Plus, Timer, Trash2 } from "lucide-react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Textarea } from "components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import type { TicketEffortListDto } from "../../types/ticketEffort.types";

interface EffortListProps {
  efforts: TicketEffortListDto[];
  loading: boolean;
  isDepartmentManager?: boolean;
  onAdd: (effortHours: number, description?: string | null) => Promise<void>;
  onUpdate: (
    effortId: string,
    effortHours: number,
    description?: string | null
  ) => Promise<void>;
  onDelete: (effortId: string) => Promise<void>;
}

const EffortList = ({
  efforts,
  loading,
  isDepartmentManager = false,
  onAdd,
  onUpdate,
  onDelete,
}: EffortListProps) => {
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [hoursError, setHoursError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hoursRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingEffort, setEditingEffort] = useState<TicketEffortListDto | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editHoursError, setEditHoursError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const editHoursRef = useRef<HTMLInputElement>(null);

  const totalHours = efforts.reduce((sum, e) => sum + (Number(e.effortHours) || 0), 0);

  const canManageEffort = (effort: TicketEffortListDto) =>
    Boolean(effort.isOwn) || isDepartmentManager;

  useEffect(() => {
    if (!editOpen || !editingEffort) return;
    setEditHours(String(editingEffort.effortHours ?? ""));
    setEditDescription(editingEffort.description ?? "");
    setEditHoursError("");
  }, [editOpen, editingEffort]);

  const handleAdd = async () => {
    const parsed = Number(hours.replace(",", "."));
    if (!hours.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setHoursError("Geçerli bir efor saati giriniz.");
      hoursRef.current?.focus();
      return;
    }

    try {
      setIsSaving(true);
      setHoursError("");
      await onAdd(parsed, description.trim() || null);
      setHours("");
      setDescription("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (effort: TicketEffortListDto) => {
    if (!canManageEffort(effort) || !effort.id) return;
    setEditingEffort(effort);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (isUpdating) return;
    setEditOpen(false);
    setEditingEffort(null);
    setEditHoursError("");
  };

  const handleUpdate = async () => {
    if (!editingEffort?.id) return;

    const parsed = Number(editHours.replace(",", "."));
    if (!editHours.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setEditHoursError("Geçerli bir efor saati giriniz.");
      editHoursRef.current?.focus();
      return;
    }

    try {
      setIsUpdating(true);
      setEditHoursError("");
      await onUpdate(editingEffort.id, parsed, editDescription.trim() || null);
      setEditOpen(false);
      setEditingEffort(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (effortId: string) => {
    try {
      setDeletingId(effortId);
      await onDelete(effortId);
    } finally {
      setDeletingId(null);
    }
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Efor kayıtları yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Form */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-slate-50">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#3e5d8f]/8 text-[#3e5d8f]/70">
            <Timer className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Efor Girişi</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="effort-hours"
              className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
            >
              Efor (saat) <span className="text-rose-400">*</span>
            </label>
            <Input
              id="effort-hours"
              ref={hoursRef}
              type="number"
              min="0.25"
              step="0.25"
              inputMode="decimal"
              value={hours}
              onChange={(e) => {
                setHours(e.target.value);
                if (hoursError) setHoursError("");
              }}
              onKeyDown={handleHoursKeyDown}
              placeholder="örn. 1.5"
              aria-label="Efor saati"
              className="rounded-xl border-slate-200 h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="effort-description"
              className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
            >
              Açıklama
            </label>
            <Textarea
              id="effort-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Yapılan işin kısa açıklaması"
              aria-label="Efor açıklaması"
              rows={1}
              className="rounded-xl border-slate-200 min-h-10 resize-none py-2.5"
            />
          </div>

          <Button
            type="button"
            onClick={handleAdd}
            disabled={isSaving}
            aria-label="Efor ekle"
            className="h-10 rounded-xl bg-[#3e5d8f] hover:bg-[#324d7a] text-white px-5 shadow-sm shadow-[#3e5d8f]/20"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Ekle
          </Button>
        </div>

        {hoursError && <p className="text-xs text-rose-500 mt-2 ml-1">{hoursError}</p>}
      </div>

      {/* Header / total */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Efor Kayıtları
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#3e5d8f]/10 text-[#3e5d8f] text-[10px] font-bold px-2 py-0.5 min-w-[22px]">
          {efforts.length}
        </span>
        {efforts.length > 0 && (
          <span className="text-xs text-slate-500 font-medium ml-auto inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Toplam: <strong className="text-slate-700">{totalHours.toFixed(2)} saat</strong>
            {isDepartmentManager && (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[#3e5d8f]/70 bg-[#3e5d8f]/8 px-2 py-0.5 rounded-full">
                Tüm ekip
              </span>
            )}
          </span>
        )}
      </div>

      {/* Table */}
      {efforts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <Timer className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-400">Henüz efor kaydı yok.</p>
          <p className="text-xs text-slate-300">Yukarıdan efor saati ve açıklama ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          <Table className="min-w-[640px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-100">
                {isDepartmentManager && (
                  <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Personel
                  </TableHead>
                )}
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[110px]">
                  Efor (saat)
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Açıklama
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[160px]">
                  Tarih
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right w-[100px]">
                  İşlem
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {efforts.map((effort) => {
                const canManage = canManageEffort(effort);
                const created = effort.createdDate
                  ? format(new Date(effort.createdDate), "dd MMM yyyy HH:mm", { locale: tr })
                  : "—";

                return (
                  <TableRow key={effort.id} className="border-slate-100 hover:bg-slate-50/60">
                    {isDepartmentManager && (
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-slate-800 truncate">
                            {effort.userAppName || "—"}
                          </span>
                          {effort.isOwn && (
                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              Sizin
                            </span>
                          )}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-800 tabular-nums">
                        {Number(effort.effortHours).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 max-w-[320px]">
                      {effort.description ? (
                        <p className="text-sm text-slate-600 line-clamp-2 whitespace-pre-wrap break-words">
                          {effort.description}
                        </p>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Açıklama yok</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {created}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {canManage && effort.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(effort)}
                            aria-label="Efor kaydını güncelle"
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-[#3e5d8f] hover:bg-[#3e5d8f]/8"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === effort.id}
                            onClick={() => handleDelete(effort.id!)}
                            aria-label="Efor kaydını sil"
                            className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            {deletingId === effort.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Update dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseEdit();
          else setEditOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby="effort-edit-desc">
          <DialogHeader>
            <DialogTitle>Efor Güncelle</DialogTitle>
            <DialogDescription id="effort-edit-desc">
              {editingEffort?.userAppName
                ? `${editingEffort.userAppName} kaydını düzenliyorsunuz.`
                : "Efor saati ve açıklamayı güncelleyin."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-effort-hours"
                className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
              >
                Efor (saat) <span className="text-rose-400">*</span>
              </label>
              <Input
                id="edit-effort-hours"
                ref={editHoursRef}
                type="number"
                min="0.25"
                step="0.25"
                inputMode="decimal"
                value={editHours}
                onChange={(e) => {
                  setEditHours(e.target.value);
                  if (editHoursError) setEditHoursError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUpdate();
                  }
                }}
                aria-label="Güncellenecek efor saati"
                className="rounded-xl border-slate-200 h-10"
              />
              {editHoursError && (
                <p className="text-xs text-rose-500 ml-1">{editHoursError}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-effort-description"
                className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
              >
                Açıklama
              </label>
              <Textarea
                id="edit-effort-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Yapılan işin kısa açıklaması"
                aria-label="Güncellenecek efor açıklaması"
                rows={4}
                className="rounded-xl border-slate-200 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseEdit}
              disabled={isUpdating}
              className="rounded-xl"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={isUpdating}
              className="rounded-xl bg-[#3e5d8f] hover:bg-[#324d7a] text-white"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Kaydediliyor
                </>
              ) : (
                "Kaydet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EffortList;
