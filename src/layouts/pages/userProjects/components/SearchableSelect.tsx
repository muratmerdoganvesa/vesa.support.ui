import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { cn } from "lib/utils";

export interface SearchableSelectProps<T> {
  options: T[];
  value: T | null | undefined;
  getLabel: (option: T) => string;
  getId: (option: T) => string;
  onChange: (value: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableSelect = <T,>({
  options,
  value,
  getLabel,
  getId,
  onChange,
  placeholder = "Seçiniz…",
  searchPlaceholder = "Ara…",
  disabled = false,
  className,
}: SearchableSelectProps<T>) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open && !disabled} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-xl border-border/60 bg-background px-3 font-normal text-sm transition-all duration-200 ease-out",
            "hover:bg-slate-50 dark:hover:bg-slate-800/50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value ? getLabel(value) : placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground italic"
                >
                  Seçimi temizle
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={getId(option)}
                  value={getLabel(option)}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value && getId(value) === getId(option) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {getLabel(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
