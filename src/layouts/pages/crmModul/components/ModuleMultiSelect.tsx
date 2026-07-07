import { ListModuleDto } from "api/generated";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { cn } from "lib/utils";

type ModuleMultiSelectProps = {
  options: ListModuleDto[];
  value: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** true ise yalnızca tek modül seçilebilir; backend uyumu için value yine string[] */
  single?: boolean;
};

const PANEL_MIN_WIDTH = 280;
const PANEL_MAX_HEIGHT = 320;
const PANEL_GAP = 6;

export const ModuleMultiSelect = ({
  options,
  value,
  onChange,
  placeholder = "Modül seçin...",
  disabled = false,
  single = false,
}: ModuleMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.max(rect.width, PANEL_MIN_WIDTH);
    const left = Math.min(rect.left, window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP;
    const spaceAbove = rect.top - PANEL_GAP;
    const shouldOpenUpward = spaceBelow < 220 && spaceAbove > spaceBelow;

    setPanelStyle({
      position: "fixed",
      left: Math.max(8, left),
      width,
      zIndex: 1400,
      ...(shouldOpenUpward
        ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
        : { top: rect.bottom + PANEL_GAP }),
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updatePanelPosition();
    const frame = requestAnimationFrame(() => searchRef.current?.focus());

    const handleReposition = () => updatePanelPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
      setSearch("");
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const optionMap = useMemo(
    () => new Map(options.filter((o) => o.id).map((o) => [o.id as string, o])),
    [options]
  );

  const selectedModules = useMemo(() => {
    const ids = single ? value.slice(0, 1) : value;
    return ids
      .map((id) => optionMap.get(id))
      .filter((module): module is ListModuleDto => Boolean(module));
  }, [value, optionMap, single]);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => (option.name ?? "").toLowerCase().includes(query));
  }, [options, search]);

  const handleToggle = (moduleId: string) => {
    if (single) {
      if (value[0] === moduleId) {
        onChange([]);
        return;
      }
      onChange([moduleId]);
      setOpen(false);
      setSearch("");
      return;
    }

    if (value.includes(moduleId)) {
      onChange(value.filter((id) => id !== moduleId));
      return;
    }
    onChange([...value, moduleId]);
  };

  const handleRemove = (moduleId: string) => {
    onChange(value.filter((id) => id !== moduleId));
  };

  const listMaxHeight = Math.min(PANEL_MAX_HEIGHT - 52, window.innerHeight * 0.42);

  const dropdownPanel =
    open &&
    createPortal(
      <div
        ref={panelRef}
        style={panelStyle}
        className="rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
        role="listbox"
        aria-multiselectable={!single}
      >
        <div className="p-2 border-b border-slate-100 bg-slate-50/80">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Modül ara..."
              className="w-full h-9 pl-8 pr-3 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400"
              aria-label="Modül ara"
            />
          </div>
        </div>

        <ul
          className="overflow-y-auto py-1 overscroll-contain"
          style={{ maxHeight: Math.max(listMaxHeight, 120) }}
        >
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-3 text-sm text-slate-400 text-center">Sonuç bulunamadı.</li>
          ) : (
            filteredOptions.map((option) => {
              const optionId = option.id ?? "";
              const isSelected = single ? value[0] === optionId : value.includes(optionId);
              return (
                <li key={optionId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleToggle(optionId)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-indigo-50/50 transition-colors",
                      isSelected && "bg-indigo-50/80"
                    )}
                  >
                    <span
                      className={cn(
                        "size-4 flex items-center justify-center shrink-0",
                        single ? "rounded-full border-2" : "rounded border",
                        isSelected
                          ? single
                            ? "border-indigo-600"
                            : "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isSelected &&
                        (single ? (
                          <span className="size-2 rounded-full bg-indigo-600" />
                        ) : (
                          <Check className="size-3" />
                        ))}
                    </span>
                    <span className="truncate">{option.name}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>,
      document.body
    );

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "w-full min-h-10 flex flex-wrap items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-md bg-white text-left text-sm",
          "focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all",
          open && "ring-2 ring-indigo-100 border-indigo-400",
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Çözüm modülü seçin"
      >
        {selectedModules.length === 0 ? (
          <span className="text-muted-foreground">{placeholder}</span>
        ) : single ? (
          <span className="text-slate-800 truncate">{selectedModules[0]?.name}</span>
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
        {single && selectedModules.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
            className="ml-1 text-slate-400 hover:text-slate-600 shrink-0"
            aria-label="Modül seçimini temizle"
          >
            <X className="size-3.5" />
          </button>
        )}
        <ChevronDown
          className={cn(
            "size-4 text-slate-400 ml-auto shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {dropdownPanel}
    </div>
  );
};
