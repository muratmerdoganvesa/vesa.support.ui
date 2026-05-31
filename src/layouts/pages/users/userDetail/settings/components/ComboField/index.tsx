import { useState } from "react";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
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
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "lib/utils";

/**
 * Shadcn Popover + Command combobox — reliable value display & positioning.
 * Uses the classic shadcn recipe: https://ui.shadcn.com/docs/components/combobox
 */
interface ComboFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  searchPlaceholder?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function ComboField({
  id,
  label,
  placeholder = "Seçin…",
  searchPlaceholder = "Ara…",
  options,
  value,
  onChange,
}: ComboFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={(current) => {
                      onChange(current === value ? "" : current);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 size-4", value === opt ? "opacity-100" : "opacity-0")} />
                    {opt}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ComboField;
