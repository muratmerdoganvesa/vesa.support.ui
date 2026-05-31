import { useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "lib/utils";
import { Input } from "components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";

export const getUserDisplayName = (user: unknown): string => {
  if (!user || typeof user !== "object") return "";
  const u = user as Record<string, unknown>;
  if (typeof u.userAppName === "string" && u.userAppName) return u.userAppName;
  const fn = typeof u.firstName === "string" ? u.firstName : "";
  const ln = typeof u.lastName === "string" ? u.lastName : "";
  return `${fn} ${ln}`.trim();
};

export interface UserSearchComboboxProps {
  value: any;
  onChange: (user: any | null) => void;
  onSearch: (q: string) => void;
  results: any[];
  placeholder: string;
  disabled?: boolean;
  /** Satır içi kullanım için tetikleyici sınıfları */
  triggerClassName?: string;
  /** false ise seçimi temizleme (X) gösterilmez — PATCH ile assigneeId null göndermemek için */
  allowClear?: boolean;
}

const UserSearchCombobox = ({
  value,
  onChange,
  onSearch,
  results,
  placeholder,
  disabled,
  triggerClassName,
  allowClear = true,
}: UserSearchComboboxProps) => {
  const [open, setOpen] = useState(false);
  const displayName = getUserDisplayName(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-xs",
            "focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-150 hover:border-slate-300 hover:bg-slate-50/50",
            triggerClassName
          )}
        >
          <span className={cn("truncate", !displayName && "text-slate-400")}>
            {displayName || placeholder}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {value && allowClear && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && onChange(null)}
                aria-label="Temizle"
                className="rounded p-0.5 hover:bg-slate-100"
              >
                <X className="h-3 w-3 text-slate-400" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        style={{ width: "var(--radix-popover-trigger-width)" }}
        className="p-0"
        align="start"
      >
        <div className="p-2 pb-1">
          <Input
            autoFocus
            placeholder="İsim ile ara..."
            onChange={(e) => onSearch(e.target.value)}
            className="h-8 rounded-lg border-slate-200 text-sm"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {results.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              Aramak için yazın...
            </p>
          ) : (
            results.map((user: Record<string, unknown>) => {
              const id = String(user.id ?? "");
              const firstName = typeof user.firstName === "string" ? user.firstName : "";
              const lastName = typeof user.lastName === "string" ? user.lastName : "";
              const email = typeof user.email === "string" ? user.email : "";
              const photo = user.photo;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onChange(user);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-50 transition-colors"
                >
                  {photo ? (
                    <img
                      src={`data:image/png;base64,${String(photo)}`}
                      alt={firstName}
                      className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                      {(firstName[0] ?? "") + (lastName[0] ?? "")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {firstName} {lastName}
                    </div>
                    <div className="text-xs text-slate-400 truncate">{email}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserSearchCombobox;
