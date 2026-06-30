import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { cn } from "lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CrmAiFirsatAnalizi, CrmAiRaporData } from "../aiRaporTypes";

type CrmAiRaporModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rapor: CrmAiRaporData | null;
};

const getScoreStyles = (score?: number | null) => {
  if (score == null) {
    return {
      badge: "bg-slate-100 text-slate-600 border-slate-200",
      bar: "bg-slate-300",
    };
  }
  if (score >= 8) {
    return {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      bar: "bg-emerald-500",
    };
  }
  if (score >= 5) {
    return {
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      bar: "bg-amber-500",
    };
  }
  return {
    badge: "bg-red-50 text-red-700 border-red-200",
    bar: "bg-red-500",
  };
};

const ListSection = ({
  title,
  items,
  icon,
  variant = "default",
}: {
  title: string;
  items?: string[] | null;
  icon: React.ReactNode;
  variant?: "default" | "risk" | "cross";
}) => {
  if (!items?.length) return null;

  const titleClass =
    variant === "risk"
      ? "text-red-700"
      : variant === "cross"
        ? "text-sky-700"
        : "text-teal-800";

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center gap-2 text-xs font-semibold uppercase tracking-wide", titleClass)}>
        {icon}
        <span>{title}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed"
          >
            <span className="mt-2 size-1.5 rounded-full bg-slate-300 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FirsatCard = ({ analiz, index }: { analiz: CrmAiFirsatAnalizi; index: number }) => {
  const scoreStyles = getScoreStyles(analiz.firsat_skoru);
  const score = analiz.firsat_skoru ?? 0;
  const scorePercent = Math.min(Math.max(score, 0), 10) * 10;

  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-start gap-3 min-w-0">
          <div className="size-9 rounded-lg bg-teal-800 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white tabular-nums">
              {analiz.oncelik_sirasi ?? index + 1}
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              {analiz.firsat?.trim() || "Fırsat"}
            </h3>
            {analiz.son_not_tarihi && (
              <p className="text-xs text-slate-500 mt-1 tabular-nums">
                Son not: {analiz.son_not_tarihi}
              </p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={cn("shrink-0 font-semibold tabular-nums", scoreStyles.badge)}>
          Skor {score}/10
        </Badge>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>Fırsat skoru</span>
            <span className="font-medium tabular-nums">{score}/10</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", scoreStyles.bar)}
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {analiz.ozet?.trim() && (
          <p className="text-sm text-slate-700 leading-relaxed">{analiz.ozet}</p>
        )}

        {analiz.gerekce?.trim() && (
          <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
              Gerekçe
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">{analiz.gerekce}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analiz.onerilen_cozum?.trim() && (
            <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700 mb-1">
                Önerilen Çözüm
              </p>
              <p className="text-sm font-medium text-teal-900">{analiz.onerilen_cozum}</p>
            </div>
          )}
          {analiz.rakip_durumu?.trim() && (
            <div className="rounded-lg border border-orange-100 bg-orange-50/50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-700 mb-1">
                Rakip Durumu
              </p>
              <p className="text-sm text-orange-900 leading-relaxed">{analiz.rakip_durumu}</p>
            </div>
          )}
        </div>

        {analiz.sonraki_adim?.trim() && (
          <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/40 px-4 py-3">
            <ArrowRight className="size-4 text-violet-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-700 mb-1">
                Sonraki Adım
              </p>
              <p className="text-sm text-violet-900 leading-relaxed">{analiz.sonraki_adim}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          <ListSection
            title="Satış Aksiyonları"
            items={analiz.satis_aksiyonlari}
            icon={<TrendingUp className="size-3.5" />}
          />
          <ListSection
            title="Çapraz Satış"
            items={analiz.capraz_satis}
            icon={<Users className="size-3.5" />}
            variant="cross"
          />
          <ListSection
            title="Riskler"
            items={analiz.riskler}
            icon={<AlertTriangle className="size-3.5" />}
            variant="risk"
          />
        </div>
      </div>
    </article>
  );
};

export const CrmAiRaporModal = ({ open, onOpenChange, rapor }: CrmAiRaporModalProps) => {
  const musteri = rapor?.musteri?.trim() || "Müşteri";
  const analizler = [...(rapor?.firsat_analizleri ?? [])].sort(
    (a, b) => (a.oncelik_sirasi ?? 999) - (b.oncelik_sirasi ?? 999)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3 pr-8">
            <div className="size-11 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                AI Fırsat Raporu
              </DialogTitle>
              <p className="text-sm text-slate-500 mt-1 truncate">{musteri}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {rapor?.genel_ozet?.trim() && (
            <section className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white px-5 py-4">
              <div className="flex items-center gap-2 text-teal-800 mb-2">
                <Lightbulb className="size-4" />
                <h2 className="text-xs font-semibold uppercase tracking-wide">Genel Özet</h2>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{rapor.genel_ozet}</p>
            </section>
          )}

          {analizler.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-slate-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Fırsat Analizleri
                </h2>
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                  {analizler.length}
                </span>
              </div>
              {analizler.map((analiz, index) => (
                <FirsatCard key={`${analiz.firsat}-${index}`} analiz={analiz} index={index} />
              ))}
            </section>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <p className="text-sm text-slate-500">Fırsat analizi bulunamadı.</p>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-300"
          >
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
