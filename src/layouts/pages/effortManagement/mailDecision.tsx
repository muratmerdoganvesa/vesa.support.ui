import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "components/ui/button";
import { Textarea } from "components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  decideCustomerApprovalByMail,
  fetchMailDecisionPreview,
  readEffortApiError,
} from "./api";
import { formatManDays } from "./shared";
import type { MailDecisionPreviewDto } from "./types";

type DecisionAction = "approve" | "reject";

const MailDecisionPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const actionParam = (searchParams.get("action") ?? "approve").toLowerCase();
  const initialAction: DecisionAction = actionParam === "reject" ? "reject" : "approve";

  const [preview, setPreview] = useState<MailDecisionPreviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [action, setAction] = useState<DecisionAction>(initialAction);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setError("Karar bağlantısı eksik veya geçersiz.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await fetchMailDecisionPreview(token);
        if (cancelled) return;
        setPreview(data);
        if (!data.canDecide && data.message) {
          setError(data.message);
        }
      } catch (loadError) {
        if (cancelled) return;
        setError(readEffortApiError(loadError));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const canSubmit = useMemo(() => {
    if (!preview?.canDecide || submitting || !token) return false;
    if (action === "reject" && note.trim() === "") return false;
    return true;
  }, [preview?.canDecide, submitting, token, action, note]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await decideCustomerApprovalByMail(token, action === "approve", note);
      setDoneMessage(
        action === "approve"
          ? "Efor kaydı onaylandı. Teşekkürler."
          : "Efor kaydı reddedildi ve departmana iletildi."
      );
      setPreview((prev) =>
        prev
          ? {
              ...prev,
              canDecide: false,
              statusText: action === "approve" ? "Müşteri onayladı" : "Departmana iade",
            }
          : prev
      );
    } catch (submitError) {
      setError(readEffortApiError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/60">
        <div className="border-b border-slate-100 bg-white px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3e5d8f]">
            Vesacons Destek
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">Efor Onay Talebi</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mail bağlantısından onay veya red işlemini tamamlayın. Red için not zorunludur.
          </p>
        </div>

        <div className="px-6 py-6">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Kayıt yükleniyor...
            </div>
          )}

          {!loading && doneMessage && (
            <div
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
              role="status"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">İşlem tamamlandı</p>
                <p className="mt-1">{doneMessage}</p>
              </div>
            </div>
          )}

          {!loading && !doneMessage && error && !preview?.canDecide && (
            <div
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800"
              role="alert"
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-semibold">İşlem yapılamıyor</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && preview && (
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Ticket No
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    #{preview.ticketNumber}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Toplam adam gün
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {formatManDays(preview.totalInvoiceHours)}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Başlık
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {preview.title?.trim() || "—"}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Müşteri
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {preview.customerName?.trim() || "—"}
                  </dd>
                </div>
              </dl>

              <div>
                <h2 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Efor bilgileri
                </h2>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="text-xs text-slate-500">Yapılacak iş</TableHead>
                        <TableHead className="w-32 text-right text-xs text-slate-500">
                          Adam gün
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(preview.items?.length ?? 0) === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-sm text-slate-400">
                            Efor kaydı bulunamadı.
                          </TableCell>
                        </TableRow>
                      ) : (
                        preview.items!.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm text-slate-700">
                              {item.description?.trim() || "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-slate-800">
                              {formatManDays(item.invoiceHours)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {preview.canDecide && !doneMessage && (
                <section
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                  aria-labelledby="mail-decision-heading"
                >
                  <h2 id="mail-decision-heading" className="text-sm font-semibold text-slate-800">
                    Kararınız
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Onayda not isteğe bağlıdır. Reddetmek için neden yazmanız gerekir.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Karar seçimi">
                    <Button
                      type="button"
                      onClick={() => setAction("approve")}
                      aria-pressed={action === "approve"}
                      aria-label="Onay seç"
                      className={
                        action === "approve"
                          ? "h-10 rounded-xl bg-emerald-600 px-5 text-white hover:bg-emerald-700"
                          : "h-10 rounded-xl border border-emerald-200 bg-white px-5 text-emerald-700 hover:bg-emerald-50"
                      }
                    >
                      Onayla
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setAction("reject")}
                      aria-pressed={action === "reject"}
                      aria-label="Red seç"
                      className={
                        action === "reject"
                          ? "h-10 rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
                          : "h-10 rounded-xl border border-rose-200 bg-white px-5 text-rose-700 hover:bg-rose-50"
                      }
                    >
                      Reddet
                    </Button>
                  </div>

                  <label
                    htmlFor="mail-decision-note"
                    className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    {action === "reject" ? "Red nedeni (zorunlu)" : "Not (isteğe bağlı)"}
                  </label>
                  <Textarea
                    id="mail-decision-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={
                      action === "reject"
                        ? "Red nedeninizi yazın"
                        : "İsterseniz kısa bir not ekleyin"
                    }
                    aria-label={action === "reject" ? "Red nedeni" : "Onay notu"}
                    rows={4}
                    className="mt-1.5 rounded-xl border-slate-200"
                  />

                  {error && preview.canDecide && (
                    <p className="mt-3 text-sm text-rose-600" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="mt-4">
                    <Button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={!canSubmit}
                      aria-label={action === "approve" ? "Onayı gönder" : "Reddi gönder"}
                      className={
                        action === "approve"
                          ? "h-11 rounded-xl bg-emerald-600 px-6 text-white hover:bg-emerald-700 disabled:opacity-50"
                          : "h-11 rounded-xl bg-rose-600 px-6 text-white hover:bg-rose-700 disabled:opacity-50"
                      }
                    >
                      {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                      {action === "approve" ? "Onayı gönder" : "Reddi gönder"}
                    </Button>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailDecisionPage;
