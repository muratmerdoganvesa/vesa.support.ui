import {
  CurrencyType,
  ListModuleDto,
  TypeCodes,
} from "api/generated";
import { Button } from "components/ui/button";
import { Calendar } from "components/ui/calendar";
import { Input } from "components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { cn } from "lib/utils";
import {
  CURRENCY_TYPE_OPTIONS,
  getCurrencySymbol,
  TYPE_CODE_OPTIONS,
} from "../constants";
import {
  calculateEstimatedDiscountedValueString,
  calculateEstimatedValueString,
  formatEstimatedValueDisplay,
  type CrmKalemFormValues,
} from "../formMappers";
import { ModuleMultiSelect } from "./ModuleMultiSelect";

type CrmKalemGridProps = {
  kalems: CrmKalemFormValues[];
  modules: ListModuleDto[];
  onChange: (kalem: CrmKalemFormValues) => void;
  onDelete: (clientKey: string) => void;
  onAdd: () => void;
  className?: string;
};

const cellInputClass =
  "h-8 px-2 text-xs bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-300";

const cellSelectClass = "h-8 text-xs bg-white border-slate-200 w-full min-w-0";

const DateCell = ({
  value,
  onChange,
  placeholder = "—",
}: {
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder?: string;
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="outline"
        className={cn(
          "h-8 w-full min-w-[88px] justify-start gap-1 px-2 font-normal text-xs border-slate-200",
          !value && "text-slate-400"
        )}
      >
        <CalendarDays className="size-3 shrink-0 opacity-50" />
        <span className="truncate tabular-nums">
          {value ? format(value, "dd.MM.yy", { locale: tr }) : placeholder}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0 z-[1300]" align="start">
      <Calendar mode="single" selected={value} onSelect={onChange} locale={tr} />
    </PopoverContent>
  </Popover>
);

const KalemGridRow = ({
  kalem,
  index,
  modules,
  onChange,
  onDelete,
  canDelete,
}: {
  kalem: CrmKalemFormValues;
  index: number;
  modules: ListModuleDto[];
  onChange: (kalem: CrmKalemFormValues) => void;
  onDelete: () => void;
  canDelete: boolean;
}) => {
  const symbol = getCurrencySymbol(kalem.currencyType);
  const total = calculateEstimatedDiscountedValueString(
    kalem.unitPrice,
    kalem.personCount,
    kalem.discount
  );

  const handlePricing = (unitPrice: string, personCount: string, discount?: string) => {
    const nextDiscount = discount ?? kalem.discount;
    onChange({
      ...kalem,
      unitPrice,
      personCount,
      discount: nextDiscount,
      estimatedValue: calculateEstimatedValueString(unitPrice, personCount),
      estimatedDiscountedValue: calculateEstimatedDiscountedValueString(
        unitPrice,
        personCount,
        nextDiscount
      ),
    });
  };

  return (
    <TableRow className="hover:bg-slate-50/80 border-slate-100">
      <TableCell className="px-2 py-1.5 w-8 text-center text-[11px] font-bold text-slate-400 tabular-nums">
        {index + 1}
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[200px]">
        <ModuleMultiSelect
          options={modules}
          value={kalem.solutionModuleIds}
          onChange={(ids) => onChange({ ...kalem, solutionModuleIds: ids })}
          placeholder="Modül seç..."
        />
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[100px]">
        <Select
          value={String(kalem.typeCode)}
          onValueChange={(v) => onChange({ ...kalem, typeCode: Number(v) as TypeCodes })}
        >
          <SelectTrigger className={cellSelectClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[1300]">
            {TYPE_CODE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[88px]">
        <Select
          value={String(kalem.currencyType)}
          onValueChange={(v) =>
            onChange({ ...kalem, currencyType: Number(v) as CurrencyType })
          }
        >
          <SelectTrigger className={cellSelectClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="z-[1300]">
            {CURRENCY_TYPE_OPTIONS.filter((o) => o.value !== 0).map((opt) => (
              <SelectItem key={opt.value} value={String(opt.value)}>
                {getCurrencySymbol(opt.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[80px]">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={kalem.unitPrice}
          onChange={(e) => handlePricing(e.target.value, kalem.personCount)}
          placeholder="0"
          className={cellInputClass}
        />
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[64px]">
        <Input
          type="number"
          min="0"
          step="1"
          value={kalem.personCount}
          onChange={(e) => handlePricing(kalem.unitPrice, e.target.value)}
          placeholder="0"
          className={cellInputClass}
        />
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[56px]">
        <Input
          type="number"
          min="0"
          max="100"
          step="1"
          value={kalem.discount}
          onChange={(e) => handlePricing(kalem.unitPrice, kalem.personCount, e.target.value)}
          placeholder="0"
          className={cellInputClass}
        />
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[88px]">
        <span className="text-xs font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
          {total ? formatEstimatedValueDisplay(total, symbol) : "—"}
        </span>
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[96px]">
        <DateCell
          value={kalem.expectedCloseDate}
          onChange={(date) => onChange({ ...kalem, expectedCloseDate: date })}
        />
      </TableCell>

      <TableCell className="px-2 py-1.5 min-w-[96px]">
        <DateCell
          value={kalem.lastContactDate}
          onChange={(date) => onChange({ ...kalem, lastContactDate: date })}
        />
      </TableCell>

      <TableCell className="px-2 py-1.5 w-10">
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex size-7 items-center justify-center rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors mx-auto"
            aria-label={`Kalem ${index + 1} sil`}
            title="Sil"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </TableCell>
    </TableRow>
  );
};

export const CrmKalemGrid = ({
  kalems,
  modules,
  onChange,
  onDelete,
  onAdd,
  className,
}: CrmKalemGridProps) => (
  <div className={cn("rounded-xl border border-slate-200 bg-white overflow-hidden", className)}>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200">
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 w-8 text-center">
              #
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[160px]">
              Modül
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[100px]">
              Tip
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[88px]">
              PB
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[80px]">
              Birim Fiyat
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[64px] text-center">
              Kişi
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[56px] text-center">
              İnd.%
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[88px]">
              Toplam
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[96px]">
              Kapanış
            </TableHead>
            <TableHead className="px-2 h-9 text-[10px] font-bold uppercase tracking-wide text-slate-500 min-w-[96px]">
              Son Temas
            </TableHead>
            <TableHead className="px-2 h-9 w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {kalems.map((kalem, index) => (
            <KalemGridRow
              key={kalem.clientKey}
              kalem={kalem}
              index={index}
              modules={modules}
              onChange={onChange}
              onDelete={() => onDelete(kalem.clientKey)}
              canDelete={kalems.length > 1}
            />
          ))}
        </TableBody>
      </Table>
    </div>

    <div className="flex items-center justify-end px-2 py-1 border-t border-slate-100 bg-slate-50/40">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onAdd}
        className="gap-1 h-7 text-[10px] font-semibold border-slate-200 px-2"
      >
        <Plus className="size-3" />
        Satır Ekle
      </Button>
    </div>
  </div>
);
