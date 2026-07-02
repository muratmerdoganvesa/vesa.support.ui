import { LayoutGrid, List, ListTree } from "lucide-react";
import { cn } from "lib/utils";
import { CrmModulListViewMode } from "../constants";

type CrmModulViewToggleProps = {
  value: CrmModulListViewMode;
  onChange: (mode: CrmModulListViewMode) => void;
};

const VIEW_OPTIONS: {
  value: CrmModulListViewMode;
  label: string;
  icon: typeof List;
}[] = [
  { value: "table", label: "Fırsat Görünümü", icon: List },
  { value: "tree", label: "Müşteri Fırsat Listesi", icon: ListTree },
  { value: "grid", label: "Müşteri Kartları", icon: LayoutGrid },
];

export const CrmModulViewToggle = ({ value, onChange }: CrmModulViewToggleProps) => (
  <div
    className="flex items-center overflow-hidden rounded-lg border border-slate-200 text-xs"
    role="group"
    aria-label="Görünüm modu"
  >
    {VIEW_OPTIONS.map((option, index) => {
      const Icon = option.icon;
      const isActive = value === option.value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 font-medium transition-colors",
            index > 0 && "border-l border-slate-200",
            isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
          )}
          aria-pressed={isActive}
        >
          <Icon className="size-3.5" />
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      );
    })}
  </div>
);
