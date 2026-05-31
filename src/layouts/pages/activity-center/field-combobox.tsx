import { useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { cn } from "lib/utils";

export type ComboOption = { value: string; label: string };

export type IdLabelOption = { id: string; label: string };

export const toComboOptions = (items: IdLabelOption[]): ComboOption[] =>
  items.map((item) => ({ value: item.id, label: item.label }));

type ActivityFieldComboboxProps = {
  options: ComboOption[];
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  disabled?: boolean;
  ariaLabel: string;
  contentClassName?: string;
  /** Dış sarmalayıcı (ör. diyalog grid’inde tam genişlik). */
  className?: string;
};

export const ActivityFieldCombobox = ({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  ariaLabel,
  contentClassName,
  className,
}: ActivityFieldComboboxProps) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? null;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) setOpen((prev) => !prev);
    }
  };

  return (
    <div className={cn("w-full min-w-0", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            aria-controls={open ? `${ariaLabel}-listbox` : undefined}
            disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex h-9 w-full min-w-0 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "hover:border-slate-300 transition-colors",
            )}
          >
            <span
              className={cn(
                "min-w-0 truncate text-left",
                !selected && "text-muted-foreground",
              )}
            >
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={`${ariaLabel}-listbox`}
          role="listbox"
          align="start"
          sideOffset={4}
          style={{ width: "var(--radix-popover-trigger-width)" }}
          className={cn(
            "z-[1600] !w-[var(--radix-popover-trigger-width)] !max-w-none min-w-0 p-0",
            contentClassName,
          )}
        >
          <Command className="w-full max-w-none">
            <CommandInput placeholder="Ara..." className="h-9" />
            <CommandList className="max-h-[min(50vh,320px)] w-full">
              <CommandEmpty>Kayıt bulunamadı.</CommandEmpty>
              <CommandGroup className="w-full">
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    keywords={[opt.label, opt.value]}
                    className="w-full min-w-0"
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === opt.value ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-left">{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
