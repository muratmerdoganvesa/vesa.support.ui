import { CrmModulNoteDto, CrmModulNotesApi } from "api/generated";
import { Button } from "components/ui/button";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import getConfiguration from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { Clock, History, Send, Trash2, User } from "lucide-react";
import { cn } from "lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCompanyInitials } from "../utils";

type CrmModulNotePanelProps = {
  crmModulId?: string;
  className?: string;
};

const formatAuthorName = (createdBy?: string | null): string => {
  const value = createdBy?.trim();
  if (!value || value === "nulldata") return "Bilinmeyen kullanıcı";

  if (value.includes("@")) {
    const local = value.split("@")[0] ?? value;
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  }

  return value;
};

const formatTimelineDate = (value?: string | null): { full: string; relative: string } => {
  if (!value) return { full: "—", relative: "" };
  const date = parseISO(value);
  if (!isValid(date)) return { full: "—", relative: "" };

  return {
    full: format(date, "dd MMM yyyy, HH:mm", { locale: tr }),
    relative: formatDistanceToNow(date, { addSuffix: true, locale: tr }),
  };
};

export const CrmModulNotePanel = ({ crmModulId, className }: CrmModulNotePanelProps) => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [notes, setNotes] = useState("");
  const [noteItems, setNoteItems] = useState<CrmModulNoteDto[]>([]);
  const [loading, setLoading] = useState(false);

  const sortedNotes = useMemo(
    () =>
      [...noteItems].sort(
        (a, b) => new Date(b.createdDate ?? 0).getTime() - new Date(a.createdDate ?? 0).getTime()
      ),
    [noteItems]
  );

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

  const canSaveNote = Boolean(crmModulId);

  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
        <History className="size-5 text-slate-700 shrink-0" />
        <h2 className="text-base font-bold text-slate-900 flex-1">Aktivite Geçmişi</h2>
        <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-lg bg-slate-900 text-xs font-bold text-white tabular-nums">
          {noteItems.length}
        </span>
      </div>

      <div className="px-5 py-4 border-b border-slate-100 bg-white space-y-3">
        <Label htmlFor="crm-note-notes" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Yeni Not
        </Label>
        <Textarea
          id="crm-note-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Görüşme notu, aksiyon veya hatırlatma..."
          rows={4}
          className="bg-white border-slate-200 text-base min-h-[112px] w-full resize-y leading-relaxed"
          disabled={!canSaveNote}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSaveNote();
            }
          }}
        />
        <div className="flex justify-end">
          {canSaveNote ? (
            <Button
              type="button"
              onClick={handleSaveNote}
              disabled={!notes.trim()}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white h-11 px-6 text-sm font-semibold shadow-sm"
            >
              <Send className="size-4" />
              Notu Kaydet
            </Button>
          ) : (
            <p className="text-sm text-amber-700">Not eklemek için önce kaydı oluşturun</p>
          )}
        </div>
      </div>

      <div className="px-5 py-5">
        {!canSaveNote ? null : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-7 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
          </div>
        ) : sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="size-6 text-slate-300 mb-2" />
            <p className="text-base text-slate-500">Henüz aktivite yok</p>
            <p className="text-sm text-slate-400 mt-1">İlk notunuz burada görünecek</p>
          </div>
        ) : (
          <ol className="relative">
            <div
              className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-slate-200"
              aria-hidden
            />

            {sortedNotes.map((note, index) => {
              const authorName = formatAuthorName(note.createdBy);
              const authorInitials = getCompanyInitials(authorName);
              const { full, relative } = formatTimelineDate(note.createdDate);
              const isFirst = index === 0;

              return (
                <li key={note.id} className="relative pl-12 pb-8 last:pb-0">
                  <span
                    className={cn(
                      "absolute left-0 top-1 flex size-9 items-center justify-center rounded-full border-2 bg-white text-[11px] font-bold shadow-sm",
                      isFirst
                        ? "border-slate-900 text-slate-900"
                        : "border-slate-200 text-slate-500"
                    )}
                  >
                    {authorInitials}
                  </span>

                  <article
                    className={cn(
                      "rounded-xl border p-4 transition-colors group",
                      isFirst
                        ? "border-slate-200 bg-white shadow-sm"
                        : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <User className="size-4 text-slate-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-900">{authorName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Clock className="size-3.5 text-slate-400 shrink-0" />
                          <time
                            dateTime={note.createdDate}
                            className="text-xs text-slate-600 tabular-nums"
                            title={full}
                          >
                            {full}
                          </time>
                          {relative && (
                            <span className="text-xs text-slate-400">· {relative}</span>
                          )}
                        </div>
                      </div>
                      {note.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id!)}
                          className="inline-flex items-center justify-center size-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                          title="Notu sil"
                          aria-label="Notu sil"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>

                    <p className="text-base text-slate-800 whitespace-pre-wrap break-words leading-relaxed">
                      {note.notes?.trim() || "—"}
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};
