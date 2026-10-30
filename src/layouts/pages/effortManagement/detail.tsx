import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
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
  claimEffortManagement,
  fetchEffortManagementDetail,
  fetchEffortManagementEfforts,
  readEffortApiError,
  returnEffortManagement,
} from "./api";
import { EffortStatusBadge, formatDateTime, formatHours } from "./shared";
import { TicketEffortStatus } from "./types";
import type { TicketEffortManagementDetailDto, TicketEffortManagementEffortsDto } from "./types";

const InfoItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    <span className="text-sm font-medium text-slate-800">{value || "—"}</span>
  </div>
);

const EffortManagementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TicketEffortManagementDetailDto | null>(null);
  const [efforts, setEfforts] = useState<TicketEffortManagementEffortsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [returnNote, setReturnNote] = useState("");
  const [returning, setReturning] = useState(false);
  const [error, setError] = useState("");

  const load = async (recordId: string) => {
    const [detailData, effortData] = await Promise.all([
      fetchEffortManagementDetail(recordId),
      fetchEffortManagementEfforts(recordId),
    ]);
    setDetail(detailData);
    setEfforts(effortData);
  };

  useEffect(() => {
    if (!id) return;
    const run = async () => {
      try {
        setLoading(true);
        setError("");
        await load(id);
      } catch (loadError) {
        setDetail(null);
        setEfforts(null);
        setError(readEffortApiError(loadError));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [id]);

  const handleClaim = async () => {
    if (!id || claiming) return;
    try {
      setClaiming(true);
      setError("");
      await claimEffortManagement(id);
      await load(id);
    } catch (claimError) {
      setError(readEffortApiError(claimError));
    } finally {
      setClaiming(false);
    }
  };

  const handleReturn = async () => {
    if (!id || returning) return;
    const note = returnNote.trim();
    if (!note) {
      setError("Geri gönderme notu zorunludur.");
      return;
    }
    try {
      setReturning(true);
      setError("");
      await returnEffortManagement(id, note);
      setReturnNote("");
      await load(id);
    } catch (returnError) {
      setError(readEffortApiError(returnError));
    } finally {
      setReturning(false);
    }
  };

  const handleBack = () => {
    navigate("/effortManagement");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <main className="flex min-h-[calc(100vh-6rem)] flex-col gap-5 px-4 py-6 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
              aria-label="Efor listesine dön"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Efor listesi
            </button>
            <h1 className="text-xl font-bold leading-tight text-slate-800">
              {detail?.ticketNumber ? `#${detail.ticketNumber}` : "Efor detayı"}
              {detail?.title ? ` · ${detail.title}` : ""}
            </h1>
          </div>
          {detail?.canClaim && (
            <Button
              type="button"
              onClick={() => void handleClaim()}
              disabled={claiming}
              aria-label="İncelemeyi üstlen"
              className="h-10 rounded-xl bg-[#3e5d8f] px-5 text-white hover:bg-[#324d7a]"
            >
              {claiming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              İncelemeyi üstlen
            </Button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Detay yükleniyor...
          </div>
        ) : detail && (
          <>
            {detail.canReturn && (
              <section className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm shadow-slate-200/50">
                <h2 className="text-sm font-semibold text-slate-800">Eforu geri gönder</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Tüm eforu kabul etmek zorunda değilsiniz. Notu yazın; efor girişi yeniden açılır ve departman yöneticisi düzeltip tekrar gönderir.
                </p>
                <label htmlFor="return-note" className="mt-4 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Geri gönderme notu
                </label>
                <Textarea
                  id="return-note"
                  value={returnNote}
                  onChange={(event) => setReturnNote(event.target.value)}
                  placeholder="Neden geri gönderildiğini ve neyin düzeltilmesi gerektiğini yazın"
                  aria-label="Geri gönderme notu"
                  rows={3}
                  className="mt-1.5 rounded-xl border-slate-200"
                />
                <Button
                  type="button"
                  onClick={() => void handleReturn()}
                  disabled={returning || returnNote.trim() === ""}
                  aria-label="Eforu düzenleme için geri gönder"
                  className="mt-3 h-10 rounded-xl bg-rose-600 px-5 text-white hover:bg-rose-700"
                >
                  {returning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Geri gönder
                </Button>
              </section>
            )}

            {detail.status === TicketEffortStatus.ReturnedToDepartment && (
              <section className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4">
                <p className="text-sm font-semibold text-rose-900">Düzenleme için geri gönderildi</p>
                <p className="mt-1 text-xs text-rose-800">
                  {detail.effortManagerUserName || "Efor yöneticisi"}
                  {detail.returnedAt ? ` · ${formatDateTime(detail.returnedAt)}` : ""}
                </p>
                {detail.returnNote && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-rose-950">{detail.returnNote}</p>
                )}
              </section>
            )}

            <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 md:grid-cols-2 xl:grid-cols-4">
              <InfoItem label="Müşteri" value={detail.customerName} />
              <InfoItem label="Şirket" value={detail.workCompanyName} />
              <InfoItem label="Departman" value={detail.departmentName} />
              <InfoItem label="Departman yöneticisi" value={detail.departmentManagerName || detail.sentByUserName} />
              <InfoItem label="Talep durumu" value={detail.ticketStatusText} />
              <InfoItem label="Öncelik" value={detail.priorityText} />
              <InfoItem label="Tip" value={detail.typeText} />
              <InfoItem label="Talep sahibi" value={detail.ticketOwnerName || detail.ticketCreatedBy} />
              <InfoItem label="Oluşturma" value={formatDateTime(detail.ticketCreatedDate)} />
              <InfoItem label="Gönderen" value={detail.sentByUserName} />
              <InfoItem label="Gönderim tarihi" value={formatDateTime(detail.sentAt)} />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Efor durumu</span>
                <EffortStatusBadge status={detail.status} label={detail.statusText} />
              </div>
              {detail.effortManagerUserName && (
                <InfoItem
                  label="İnceleyen"
                  value={`${detail.effortManagerUserName}${detail.effortManagerAssignedAt ? ` · ${formatDateTime(detail.effortManagerAssignedAt)}` : ""}`}
                />
              )}
              {detail.claimedByCurrentUser && (
                <InfoItem label="Üstlenme" value="Bu kayıt incelemenizde." />
              )}
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-800">Talep yorumları</h2>
                <span className="inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#3e5d8f]/10 px-2 py-0.5 text-[10px] font-bold text-[#3e5d8f]">
                  {detail.comments?.length ?? 0}
                </span>
              </div>
              {(detail.comments ?? []).length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">Bu talebe ait yorum yok.</p>
              ) : (
                <div className="mt-4 flex max-h-[32rem] flex-col gap-3 overflow-auto pr-1">
                  {(detail.comments ?? []).map((comment) => (
                    <article key={comment.id} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">
                          {comment.createdByName || comment.createdBy || "—"}
                        </p>
                        <time className="text-xs text-slate-400" dateTime={comment.createdDate}>
                          {formatDateTime(comment.createdDate)}
                        </time>
                      </div>
                      {comment.body ? (
                        <div
                          className="mt-2 text-sm text-slate-700 [&_p]:mb-2"
                          dangerouslySetInnerHTML={{ __html: comment.body }}
                        />
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">Yorum metni yok.</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-slate-800">Efor kayıtları</h2>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    Toplam fiili saat{" "}
                    <strong className="text-slate-800">{formatHours(efforts?.totalEffortHours)}</strong>
                  </span>
                  <span>
                    Toplam fatura saati{" "}
                    <strong className="text-slate-800">{formatHours(efforts?.totalInvoiceHours)}</strong>
                  </span>
                </div>
              </div>
              {(efforts?.items ?? []).length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">Bu talebe bağlı efor kaydı yok.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Personel</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Fiili saat</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Fatura saati</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Açıklama</TableHead>
                      <TableHead className="text-[11px] uppercase tracking-wider text-slate-400">Tarih</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(efforts?.items ?? []).map((effort) => (
                      <TableRow key={effort.id} className="border-slate-100">
                        <TableCell>
                          <p className="text-sm font-medium text-slate-800">{effort.userAppName || "—"}</p>
                          {effort.userTitle && <p className="text-xs text-slate-400">{effort.userTitle}</p>}
                        </TableCell>
                        <TableCell className="text-sm text-slate-700">{formatHours(effort.effortHours)}</TableCell>
                        <TableCell className="text-sm text-slate-700">{formatHours(effort.invoiceHours)}</TableCell>
                        <TableCell className="max-w-[320px] text-sm text-slate-600">{effort.description || "—"}</TableCell>
                        <TableCell className="text-sm text-slate-600">{formatDateTime(effort.createdDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
};

export default EffortManagementDetailPage;
