import { ListModuleDto } from "api/generated";
import { Button } from "components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { cn } from "lib/utils";
import { ListOrdered, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getCurrencySymbol,
  getCurrencyTypeLabel,
  getTypeCodeLabel,
} from "../constants";
import { calculateEstimatedValueString, type CrmSubItemFormValues } from "../formMappers";
import { formatDateTr, resolveModuleNamesFromIds, toIsoDateString } from "../utils";

type CrmSubItemListProps = {
  items: CrmSubItemFormValues[];
  modules: ListModuleDto[];
  onAdd: () => void;
  onEdit: (clientKey: string) => void;
  onDelete: (clientKey: string) => void;
};

const DetailBlock = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
      {value.trim() || "—"}
    </p>
  </div>
);

type ModuleRowProps = {
  item: CrmSubItemFormValues;
  index: number;
  modules: ListModuleDto[];
  onEdit: (clientKey: string) => void;
  onDelete: (clientKey: string) => void;
};

const ModuleRow = ({ item, index, modules, onEdit, onDelete }: ModuleRowProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const estimated = calculateEstimatedValueString(item.unitPrice, item.personCount);
  const symbol = getCurrencySymbol(item.currencyType);
  const expectedCloseLabel = formatDateTr(toIsoDateString(item.expectedCloseDate));
  const lastContactLabel = formatDateTr(toIsoDateString(item.lastContactDate));
  const hasHoverDetails = Boolean(item.nextAction.trim() || item.notes.trim());

  const openDetails = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    setPosition({ x: rect.left + rect.width / 2, y: rect.bottom });
    setShowDetails(true);
  };

  const handleRowMouseEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (!hasHoverDetails) return;
    openDetails(e.currentTarget);
  };

  const handleRowMouseLeave = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const related = e.relatedTarget as Node | null;
    if (popoverRef.current?.contains(related)) return;
    setShowDetails(false);
  };

  const handlePopoverMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(related)) return;
    setShowDetails(false);
  };

  return (
    <>
      <TableRow
        className={cn("hover:bg-indigo-50/20", hasHoverDetails && "cursor-help")}
        onMouseEnter={handleRowMouseEnter}
        onMouseLeave={handleRowMouseLeave}
      >
        <TableCell className="text-sm text-slate-700 max-w-[280px]">
          <span
            className="line-clamp-2"
            title={resolveModuleNamesFromIds(item.solutionModuleIds, modules)}
          >
            {resolveModuleNamesFromIds(item.solutionModuleIds, modules)}
          </span>
        </TableCell>
        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
          {getTypeCodeLabel(item.typeCode)}
        </TableCell>
        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
          {getCurrencyTypeLabel(item.currencyType)}
        </TableCell>
        <TableCell className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {item.unitPrice ? `${symbol} ${item.unitPrice}` : "—"}
        </TableCell>
        <TableCell className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {item.personCount || "—"}
        </TableCell>
        <TableCell className="text-sm text-slate-700 font-medium tabular-nums whitespace-nowrap">
          {estimated ? `${symbol} ${estimated}` : "—"}
        </TableCell>
        <TableCell className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {expectedCloseLabel}
        </TableCell>
        <TableCell className="text-sm text-slate-600 tabular-nums whitespace-nowrap">
          {lastContactLabel}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onEdit(item.clientKey)}
              className="inline-flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title={`Modül ${index + 1} düzenle`}
              aria-label={`Modül ${index + 1} düzenle`}
            >
              <Pencil className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item.clientKey)}
              className="inline-flex items-center justify-center size-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title={`Modül ${index + 1} sil`}
              aria-label={`Modül ${index + 1} sil`}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </TableCell>
      </TableRow>

      {showDetails &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            className="fixed z-[1200] w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg space-y-3 pointer-events-auto"
            style={{
              left: position.x,
              top: position.y + 6,
              transform: "translateX(-50%)",
            }}
            onMouseLeave={handlePopoverMouseLeave}
          >
            <DetailBlock label="Sonraki Aksiyon" value={item.nextAction} />
            <DetailBlock label="Notlar" value={item.notes} />
          </div>,
          document.body
        )}
    </>
  );
};

export const CrmSubItemList = ({
  items,
  modules,
  onAdd,
  onEdit,
  onDelete,
}: CrmSubItemListProps) => (
  <section className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 space-y-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <ListOrdered className="size-4 text-slate-500" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Modüller
        </h3>
        <span className="text-xs text-slate-400">({items.length})</span>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={onAdd}
        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        <Plus className="size-4" />
        Modül Ekle
      </Button>
    </div>

    {items.length === 0 ? (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white py-10 text-center">
        <p className="text-sm text-slate-500">Henüz modül eklenmedi.</p>
        <p className="text-xs text-slate-400 mt-1">
          SuccessFactors modülü, fiyat ve diğer detaylar için modül ekleyin.
        </p>
      </div>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
              <TableHead className="text-xs font-semibold text-slate-600 min-w-[220px]">
                SF Modülü
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Tip</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Para Birimi</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Birim Fiyat</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Kişi</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600">Tahmini Değer</TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 min-w-[130px]">
                Beklenen Kapanış
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 min-w-[130px]">
                Son Temas Tarihi
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-600 text-right w-[100px]">
                İşlemler
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <ModuleRow
                key={item.clientKey}
                item={item}
                index={index}
                modules={modules}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </section>
);
