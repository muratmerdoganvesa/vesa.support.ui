import { ListModuleDto } from "api/generated";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "lib/utils";

type ModuleMultiSelectProps = {
  options: ListModuleDto[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const ModuleMultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "Modül seçin...",
  disabled = false,
}: ModuleMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const optionMap = useMemo(
    () => new Map(options.filter((o) => o.id).map((o) => [o.id as string, o])),
    [options]
  );

  const selectedModules = useMemo(
    () =>
      value
        .map((id) => optionMap.get(id))
        .filter((module): module is ListModuleDto => Boolean(module)),
    [value, optionMap]
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => (option.name ?? "").toLowerCase().includes(query));
  }, [options, search]);

  const handleToggle = (moduleId: string) => {
    if (value.includes(moduleId)) {
      onChange(value.filter((id) => id !== moduleId));
      return;
    }
    onChange([...value, moduleId]);
  };

  const handleRemove = (moduleId: string) => {
    onChange(value.filter((id) => id !== moduleId));
  };

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "w-full min-h-10 flex flex-wrap items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-md bg-white text-left text-sm",
          "focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="SuccessFactors modülü seçin"
      >
        {selectedModules.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : (
          selectedModules.map((module) => (
            <span
              key={module.id}
              className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-md"
            >
              {module.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (module.id) handleRemove(module.id);
                }}
                className="hover:text-indigo-900"
                aria-label={`${module.name} modülünü kaldır`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={cn(
            "size-4 text-slate-400 ml-auto shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden"
          role="listbox"
          aria-multiselectable
        >
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Modül ara..."
                className="w-full h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
                aria-label="Modül ara"
              />
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">Sonuç bulunamadı.</li>
            ) : (
              filteredOptions.map((option) => {
                const optionId = option.id ?? "";
                const isSelected = value.includes(optionId);
                return (
                  <li key={optionId}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleToggle(optionId)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors",
                        isSelected && "bg-indigo-50/60"
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 rounded border flex items-center justify-center shrink-0",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </span>
                      <span className="truncate">{option.name}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
