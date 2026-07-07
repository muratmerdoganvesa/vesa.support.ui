import { ArrowLeft, Save } from "lucide-react";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

type CrmDetailActionBarProps = {
  canSave: boolean;
  companyNameMissing?: boolean;
  opportunityCount?: number;
  isAutoSaving?: boolean;
  onBack: () => void;
  onSave: () => void;
  className?: string;
};

export const CrmDetailActionBar = ({
  canSave,
  companyNameMissing = false,
  opportunityCount = 0,
  isAutoSaving = false,
  onBack,
  onSave,
  className,
}: CrmDetailActionBarProps) => (
  <div
    className={cn(
      "sticky bottom-0 z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3",
      "border-t border-slate-200/80 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.08)]",
      className
    )}
  >
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="min-w-0">
        {companyNameMissing ? (
          <p className="text-sm text-amber-700 font-medium">
            Kaydetmek için yukarıda <span className="font-semibold">Müşteri Adı</span> alanını doldurun.
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            {isAutoSaving
              ? "Değişiklikler kaydediliyor..."
              : opportunityCount > 0
                ? `${opportunityCount} fırsat paketi kayda hazır`
                : "Fırsat eklemeden de müşteri kaydını kaydedebilirsiniz"}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="gap-1.5 border-slate-200 h-10 px-4"
        >
          <ArrowLeft className="size-4" />
          Geri
        </Button>
        <Button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-11 px-8 text-sm font-bold shadow-lg shadow-indigo-200 min-w-[160px]"
        >
          <Save className="size-4" />
          Kaydet
        </Button>
      </div>
    </div>
  </div>
);
