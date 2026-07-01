import { Button } from "components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "lib/utils";

type CrmModulListPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  allCount: number;
  onPageChange: (page: number) => void;
};

export const CrmModulListPagination = ({
  currentPage,
  totalPages,
  totalCount,
  allCount,
  onPageChange,
}: CrmModulListPaginationProps) => (
  <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
    <p className="text-xs text-slate-500">
      Toplam <span className="font-semibold text-slate-700">{totalCount}</span> kayıt
      {totalCount !== allCount && (
        <span className="text-slate-400"> ({allCount} içinden)</span>
      )}
    </p>

    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="size-8"
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
            acc.push(p);
            return acc;
          }, [])
          .map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="size-8 flex items-center justify-center text-xs text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item as number)}
                className={cn(
                  "size-8 rounded-md text-xs font-medium transition-colors",
                  currentPage === item
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                )}
                aria-current={currentPage === item ? "page" : undefined}
              >
                {item}
              </button>
            )
          )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="size-8"
        aria-label="Sonraki sayfa"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  </div>
);
