import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, Loader2, Pencil, Plus, Send, Timer, Trash2 } from "lucide-react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Switch } from "components/ui/switch";
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
import { cn } from "lib/utils";
import type { TicketEffortListDto } from "../../types/ticketEffort.types";
import type { TicketEffortManagementStatusDto } from "layouts/pages/effortManagement/types";
import { TicketEffortStatus } from "layouts/pages/effortManagement/types";
import { formatDateTime } from "layouts/pages/effortManagement/shared";

interface EffortListProps {
  efforts: TicketEffortListDto[];
  loading: boolean;
  isDepartmentManager?: boolean;
  isEffortEnter?: boolean;
  canEnterEffort?: boolean;
  onEffortEnterChange?: (isEffortEnter: boolean) => Promise<void>;
  onAdd: (
    effortHours: number,
    description?: string | null,
    invoiceHours?: number | null
  ) => Promise<void>;
  onUpdate: (
    effortId: string,
    effortHours: number,
    description?: string | null,
    invoiceHours?: number | null
  ) => Promise<void>;
  onDelete: (effortId: string) => Promise<void>;
  effortSendStatus?: TicketEffortManagementStatusDto | null;
  onSendToEffortManager?: () => Promise<void>;
}

const formatHours = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(2);
};

const EffortList = ({
  efforts,
  loading,
  isDepartmentManager = false,
  isEffortEnter = false,
  canEnterEffort = false,
  onEffortEnterChange,
  onAdd,
  onUpdate,
  onDelete,
  effortSendStatus = null,
  onSendToEffortManager,
}: EffortListProps) => {
  const [hours, setHours] = useState("");
  const [invoiceHours, setInvoiceHours] = useState("");
  const [description, setDescription] = useState("");
  const [hoursError, setHoursError] = useState("");
  const [invoiceHoursError, setInvoiceHoursError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [effortEnterSaving, setEffortEnterSaving] = useState(false);
  const [sendingToManager, setSendingToManager] = useState(false);
  const hoursRef = useRef<HTMLInputElement>(null);
  const invoiceHoursRef = useRef<HTMLInputElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingEffort, setEditingEffort] = useState<TicketEffortListDto | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editInvoiceHours, setEditInvoiceHours] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editHoursError, setEditHoursError] = useState("");
  const [editInvoiceError, setEditInvoiceError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const editHoursRef = useRef<HTMLInputElement>(null);
  const editInvoiceRef = useRef<HTMLInputElement>(null);

  const totalHours = efforts.reduce((sum, effort) => sum + (Number(effort.effortHours) || 0), 0);
  const totalInvoiceHours = efforts.reduce(
    (sum, effort) => sum + (Number(effort.invoiceHours) || 0),
    0
  );

  const canEditEffort = (effort: TicketEffortListDto) => {
    if (isDepartmentManager) return true;
    return Boolean(canEnterEffort && effort.isOwn);
  };

  const canDeleteEffort = (effort: TicketEffortListDto) => {
    if (isDepartmentManager) return true;
    if (!isEffortEnter) return false;
    return Boolean(canEnterEffort && effort.isOwn);
  };

  const showEffortForm = isDepartmentManager || canEnterEffort;

  useEffect(() => {
    if (!editOpen || !editingEffort) return;
    setEditHours(String(editingEffort.effortHours ?? ""));
    setEditInvoiceHours(
      editingEffort.invoiceHours === null || editingEffort.invoiceHours === undefined
        ? ""
        : String(editingEffort.invoiceHours)
    );
    setEditDescription(editingEffort.description ?? "");
    setEditHoursError("");
    setEditInvoiceError("");
  }, [editOpen, editingEffort]);

  const isReturnedForEdit = effortSendStatus?.status === TicketEffortStatus.ReturnedToDepartment;

  const handleSendToEffortManager = async () => {
    if (!onSendToEffortManager || sendingToManager || isEffortEnter) return;
    if (effortSendStatus?.exists && !isReturnedForEdit) return;
    try {
      setSendingToManager(true);
      await onSendToEffortManager();
    } finally {
      setSendingToManager(false);
    }
  };

  const handleToggleEffortEnter = async (next: boolean) => {
    if (!onEffortEnterChange || effortEnterSaving) return;
    try {
      setEffortEnterSaving(true);
      await onEffortEnterChange(next);
    } finally {
      setEffortEnterSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!showEffortForm) return;
    const parsed = Number(hours.replace(",", "."));
    if (!hours.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setHoursError("Geçerli bir fiili saat giriniz.");
      hoursRef.current?.focus();
      return;
    }

    let parsedInvoice: number | undefined;
    if (isDepartmentManager) {
      parsedInvoice = Number(invoiceHours.replace(",", "."));
      if (!invoiceHours.trim() || Number.isNaN(parsedInvoice) || parsedInvoice < 0) {
        setInvoiceHoursError("Fatura saati 0 veya daha büyük olmalıdır.");
        invoiceHoursRef.current?.focus();
        return;
      }
    }

    try {
      setIsSaving(true);
      setHoursError("");
      setInvoiceHoursError("");
      await onAdd(parsed, description.trim() || null, parsedInvoice);
      setHours("");
      setInvoiceHours("");
      setDescription("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (effort: TicketEffortListDto) => {
    if (!canEditEffort(effort) || !effort.id) return;
    setEditingEffort(effort);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    if (isUpdating) return;
    setEditOpen(false);
    setEditingEffort(null);
    setEditHoursError("");
    setEditInvoiceError("");
  };

  const handleUpdate = async () => {
    if (!editingEffort?.id) return;

    const parsed = Number(editHours.replace(",", "."));
    if (!editHours.trim() || Number.isNaN(parsed) || parsed <= 0) {
      setEditHoursError("Geçerli bir fiili saat giriniz.");
      editHoursRef.current?.focus();
      return;
    }

    let invoiceHours: number | undefined;
    if (isDepartmentManager) {
      const parsedInvoice = Number(editInvoiceHours.replace(",", "."));
      if (!editInvoiceHours.trim() || Number.isNaN(parsedInvoice) || parsedInvoice < 0) {
        setEditInvoiceError("Fatura saati 0 veya daha büyük olmalıdır.");
        editInvoiceRef.current?.focus();
        return;
      }
      invoiceHours = parsedInvoice;
    }

    try {
      setIsUpdating(true);
      setEditHoursError("");
      setEditInvoiceError("");
      await onUpdate(editingEffort.id, parsed, editDescription.trim() || null, invoiceHours);
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

  const handleHoursKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleAdd();
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
      {isDepartmentManager && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Efor girilebilir</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {isEffortEnter
                  ? "Atanan, efor istenen kişiler ve siz efor ekleyebilirsiniz."
                  : "Efor girişi kapalı. Atanan kişiler yalnızca kayıtlarını görür. Siz efor girebilir ve fatura saatini güncelleyebilirsiniz."}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-wider",
                  isEffortEnter ? "text-emerald-600" : "text-slate-400"
                )}
              >
                {isEffortEnter ? "Aktif" : "Pasif"}
              </span>
              <Switch
                checked={isEffortEnter}
                disabled={effortEnterSaving || !onEffortEnterChange}
                onCheckedChange={(checked) => void handleToggleEffortEnter(checked)}
                aria-label="Efor girilebilir durumunu değiştir"
              />
              {effortEnterSaving && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            </div>
          </div>

          {effortSendStatus?.exists && !isReturnedForEdit ? (
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
              <p className="text-sm font-semibold text-sky-900">Efor onayına gönderildi</p>
              <p className="mt-1 text-xs text-sky-800">
                Durum: {effortSendStatus.statusText || "Gönderildi"}
                {effortSendStatus.sentByUserName ? ` · Gönderen: ${effortSendStatus.sentByUserName}` : ""}
                {effortSendStatus.sentAt ? ` · ${formatDateTime(effortSendStatus.sentAt)}` : ""}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">
                  {isReturnedForEdit ? "Düzenleme için geri gönderildi" : "Efor onayına gönder"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isReturnedForEdit
                    ? isEffortEnter
                      ? "Efor girişi yeniden açıldı. Düzeltmeleri yaptıktan sonra girişi kapatıp tekrar gönderin."
                      : "Düzeltmeler tamam. Eforu tekrar efor yöneticisine gönderebilirsiniz."
                    : isEffortEnter
                      ? "Göndermek için önce efor girişini kapatın."
                      : "Efor girişleri kapalı. Fatura saatlerini kontrol ettikten sonra efor yöneticisine gönderebilirsiniz."}
                </p>
                {isReturnedForEdit && effortSendStatus?.returnNote && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                    {effortSendStatus.effortManagerUserName ? `${effortSendStatus.effortManagerUserName}: ` : ""}
                    {effortSendStatus.returnNote}
                  </p>
                )}
              </div>
              <Button
                type="button"
                onClick={() => void handleSendToEffortManager()}
                disabled={isEffortEnter || sendingToManager || !onSendToEffortManager}
                aria-label={isReturnedForEdit ? "Eforu tekrar onayına gönder" : "Efor onayına gönder"}
                className="h-10 shrink-0 rounded-xl bg-[#3e5d8f] px-5 text-white hover:bg-[#324d7a]"
              >
                {sendingToManager ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {isReturnedForEdit ? "Tekrar gönder" : "Efor Onayına Gönder"}
              </Button>
            </div>
          )}
        </>
      )}

      {!isDepartmentManager && !canEnterEffort && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          Efor girişi kapalı. Eklediğiniz eforları görüntüleyebilirsiniz; ekleme, silme ve güncelleme yapılamaz.
        </div>
      )}

      {showEffortForm && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-4 pb-3.5 border-b border-slate-50">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#3e5d8f]/8 text-[#3e5d8f]/70">
              <Timer className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Efor Girişi</h3>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-3 items-end",
              isDepartmentManager
                ? "sm:grid-cols-[140px_140px_1fr_auto]"
                : "sm:grid-cols-[140px_1fr_auto]"
            )}
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="effort-hours"
                className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
              >
                Fiili saat <span className="text-rose-400">*</span>
              </label>
              <Input
                id="effort-hours"
                ref={hoursRef}
                type="number"
                min="0.25"
                step="0.25"
                inputMode="decimal"
                value={hours}
                onChange={(event) => {
                  setHours(event.target.value);
                  if (hoursError) setHoursError("");
                }}
                onKeyDown={handleHoursKeyDown}
                placeholder="örn. 3"
                aria-label="Fiili saat"
                className="rounded-xl border-slate-200 h-10"
              />
            </div>

            {isDepartmentManager && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="effort-invoice-hours"
                  className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
                >
                  Fatura saati <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="effort-invoice-hours"
                  ref={invoiceHoursRef}
                  type="number"
                  min="0"
                  step="0.25"
                  inputMode="decimal"
                  value={invoiceHours}
                  onChange={(event) => {
                    setInvoiceHours(event.target.value);
                    if (invoiceHoursError) setInvoiceHoursError("");
                  }}
                  onKeyDown={handleHoursKeyDown}
                  placeholder="örn. 6 veya 0"
                  aria-label="Fatura saati"
                  className="rounded-xl border-slate-200 h-10"
                />
              </div>
            )}

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
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Yapılan işin kısa açıklaması"
                aria-label="Efor açıklaması"
                rows={1}
                className="rounded-xl border-slate-200 min-h-10 resize-none py-2.5"
              />
            </div>

            <Button
              type="button"
              onClick={() => void handleAdd()}
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
          {invoiceHoursError && <p className="text-xs text-rose-500 mt-1 ml-1">{invoiceHoursError}</p>}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Efor Kayıtları
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-[#3e5d8f]/10 text-[#3e5d8f] text-[10px] font-bold px-2 py-0.5 min-w-[22px]">
          {efforts.length}
        </span>
        {efforts.length > 0 && (
          <span className="text-xs text-slate-500 font-medium ml-auto inline-flex items-center gap-1.5 flex-wrap justify-end">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {isDepartmentManager ? "Fiili" : "Toplam"}:{" "}
            <strong className="text-slate-700">{totalHours.toFixed(2)} saat</strong>
            {isDepartmentManager && (
              <>
                <span className="text-slate-300">·</span>
                Fatura: <strong className="text-slate-700">{totalInvoiceHours.toFixed(2)} saat</strong>
              </>
            )}
            {isDepartmentManager && (
              <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-[#3e5d8f]/70 bg-[#3e5d8f]/8 px-2 py-0.5 rounded-full">
                Tüm ekip
              </span>
            )}
          </span>
        )}
      </div>

      {efforts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
          <Timer className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-400">Henüz efor kaydı yok.</p>
          {showEffortForm && (
            <p className="text-xs text-slate-300">Yukarıdan fiili saat ve açıklama ekleyebilirsiniz.</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-100">
                {isDepartmentManager && (
                  <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Personel
                  </TableHead>
                )}
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[110px]">
                  {isDepartmentManager ? "Fiili Saat" : "Efor (saat)"}
                </TableHead>
                {isDepartmentManager && (
                  <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[120px]">
                    Fatura Saati
                  </TableHead>
                )}
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
                const canEdit = canEditEffort(effort);
                const canDelete = canDeleteEffort(effort);
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
                        {formatHours(effort.effortHours)}
                      </span>
                    </TableCell>
                    {isDepartmentManager && (
                      <TableCell className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">
                          {formatHours(effort.invoiceHours)}
                        </span>
                      </TableCell>
                    )}
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
                      {canEdit || canDelete ? (
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
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
                          )}
                          {canDelete && effort.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === effort.id}
                              onClick={() => void handleDelete(effort.id!)}
                              aria-label="Efor kaydını sil"
                              className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              {deletingId === effort.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
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
              {isDepartmentManager
                ? "Fiili saat ve fatura saati farklı olabilir. Fatura saati 0 girilebilir."
                : editingEffort?.userAppName
                  ? `${editingEffort.userAppName} kaydını düzenliyorsunuz.`
                  : "Fiili saat ve açıklamayı güncelleyin."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-1">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="edit-effort-hours"
                className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
              >
                Fiili saat <span className="text-rose-400">*</span>
              </label>
              <Input
                id="edit-effort-hours"
                ref={editHoursRef}
                type="number"
                min="0.25"
                step="0.25"
                inputMode="decimal"
                value={editHours}
                onChange={(event) => {
                  setEditHours(event.target.value);
                  if (editHoursError) setEditHoursError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleUpdate();
                  }
                }}
                aria-label="Güncellenecek fiili saat"
                className="rounded-xl border-slate-200 h-10"
              />
              {editHoursError && <p className="text-xs text-rose-500 ml-1">{editHoursError}</p>}
            </div>

            {isDepartmentManager && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="edit-invoice-hours"
                  className="text-[10px] font-bold tracking-widest text-slate-400 uppercase leading-none"
                >
                  Fatura saati <span className="text-rose-400">*</span>
                </label>
                <Input
                  id="edit-invoice-hours"
                  ref={editInvoiceRef}
                  type="number"
                  min="0"
                  step="0.25"
                  inputMode="decimal"
                  value={editInvoiceHours}
                  onChange={(event) => {
                    setEditInvoiceHours(event.target.value);
                    if (editInvoiceError) setEditInvoiceError("");
                  }}
                  aria-label="Fatura saati"
                  placeholder="0 olabilir"
                  className="rounded-xl border-slate-200 h-10"
                />
                {editInvoiceError && (
                  <p className="text-xs text-rose-500 ml-1">{editInvoiceError}</p>
                )}
              </div>
            )}

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
                onChange={(event) => setEditDescription(event.target.value)}
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
              onClick={() => void handleUpdate()}
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
