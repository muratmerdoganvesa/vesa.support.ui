import { CrmModulNoteDto, CrmModulNotesApi } from "api/generated";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Save, StickyNote, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatDateTr } from "../utils";

type CrmModulNotePanelProps = {
  crmModulId?: string;
  nextAction: string;
  onNextActionChange: (value: string) => void;
};

export const CrmModulNotePanel = ({
  crmModulId,
  nextAction,
  onNextActionChange,
}: CrmModulNotePanelProps) => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [notes, setNotes] = useState("");
  const [noteItems, setNoteItems] = useState<CrmModulNoteDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!crmModulId) {
      setNoteItems([]);
      return;
    }

    try {
      setLoading(true);
      const api = new CrmModulNotesApi(getConfiguration());
      const response = await api.apiCrmModulNotesByCrmModulCrmModulIdGet(crmModulId);
      setNoteItems(response.data ?? []);
    } catch {
      dispatchAlert({ message: "Notlar yüklenirken hata oluştu.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [crmModulId, dispatchAlert]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async () => {
    if (!crmModulId) {
      dispatchAlert({ message: "Not eklemek için önce müşteri kaydını oluşturun.", type: "error" });
      return;
    }

    if (!notes.trim()) {
      dispatchAlert({ message: "Not alanı doldurulmalıdır.", type: "error" });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      const api = new CrmModulNotesApi(getConfiguration());
      await api.apiCrmModulNotesPost({
        crmModulId,
        notes: notes.trim() || null,
      });
      setNotes("");
      dispatchAlert({ message: "Not başarıyla kaydedildi.", type: "success" });
      await fetchNotes();
    } catch {
      dispatchAlert({ message: "Not kaydedilirken hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new CrmModulNotesApi(getConfiguration());
      await api.apiCrmModulNotesIdDelete(noteId);
      dispatchAlert({ message: "Not silindi.", type: "success" });
      await fetchNotes();
    } catch {
      dispatchAlert({ message: "Not silinirken hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const formatNoteDate = (value?: string | null) => {
    if (!value) return "—";
    const datePart = value.slice(0, 10);
    const formatted = formatDateTr(datePart);
    if (formatted === "—") return "—";
    try {
      const time = format(new Date(value), "HH:mm", { locale: tr });
      return `${formatted} ${time}`;
    } catch {
      return formatted;
    }
  };

  const canSaveNote = Boolean(crmModulId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <StickyNote className="size-4 text-slate-500" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Notlar & Aktivite
        </h2>
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
          {noteItems.length}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crm-note-next-action" className="text-xs font-medium text-slate-600">
              Sonraki Aksiyon
            </Label>
            <Input
              id="crm-note-next-action"
              value={nextAction}
              onChange={(e) => onNextActionChange(e.target.value)}
              placeholder="örn. Sözleşmeyi gönder..."
              className="h-10 bg-white border-slate-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="crm-note-notes" className="text-xs font-medium text-slate-600">
              Not
            </Label>
            <Textarea
              id="crm-note-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Görüşme notu..."
              rows={2}
              className="bg-white resize-none border-slate-200 min-h-[40px]"
              disabled={!canSaveNote}
            />
          </div>
        </div>

        {canSaveNote && (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSaveNote}
              className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
            >
              <Save className="size-4" />
              Notu Kaydet
            </Button>
          </div>
        )}

        {!canSaveNote ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
            <p className="text-sm text-slate-500">
              Not eklemek için önce müşteri kaydını oluşturun. Sonraki aksiyon kayıtla birlikte
              saklanır.
            </p>
          </div>
        ) : loading ? (
          <p className="text-sm text-slate-500 text-center py-6">Notlar yükleniyor...</p>
        ) : noteItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
            <p className="text-sm text-slate-500">Henüz not eklenmedi.</p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {noteItems.map((note) => (
              <article
                key={note.id}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs text-slate-400 tabular-nums">
                    {formatNoteDate(note.createdDate)}
                  </p>
                  {note.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id!)}
                      className="inline-flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                      title="Notu sil"
                      aria-label="Notu sil"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                  {note.notes?.trim() || "—"}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
