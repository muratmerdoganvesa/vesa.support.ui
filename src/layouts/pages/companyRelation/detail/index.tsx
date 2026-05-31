import {
  WorkCompanyApi,
  WorkCompanyDto,
  WorkCompanyTicketMatrisApi,
  WorkCompanyTicketMatrisInsertDto,
  WorkCompanyTicketMatrisUpdateDto,
} from "api/generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import { ScrollArea } from "components/ui/scroll-area";
import getConfiguration from "confiuration";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { cn } from "lib/utils";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const companyKey = (c: WorkCompanyDto) => c.id ?? "";

type FeedbackState =
  | { open: false }
  | {
      open: true;
      title: string;
      message: string;
    };

type CompanyComboboxProps = {
  options: WorkCompanyDto[];
  value: WorkCompanyDto | null;
  onChange: (value: WorkCompanyDto | null) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
};

const CompanyCombobox = ({
  options,
  value,
  onChange,
  disabled,
  error,
  placeholder = "Şirket Seçiniz",
}: CompanyComboboxProps) => {
  const [open, setOpen] = useState(false);

  const getLabel = (o: WorkCompanyDto) => o.name ?? "";

  return (
    <Popover open={disabled ? false : open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id="company-relation-company"
          role="combobox"
          aria-expanded={open}
          aria-invalid={error}
          aria-controls="company-relation-company-listbox"
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-background px-3 py-2 text-left text-sm shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            error ? "border-destructive" : "border-input hover:bg-accent/40",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value ? getLabel(value) : placeholder}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id="company-relation-company-listbox"
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Şirket ara..." />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const id = option.id ?? "";
                const label = getLabel(option);
                const selected = value?.id === option.id;
                return (
                  <CommandItem
                    key={id}
                    value={`${label}-${id}`}
                    onSelect={() => {
                      onChange(option);
                      setOpen(false);
                    }}
                    data-checked={selected}
                  >
                    {label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

type CompanyTransferListsProps = {
  source: WorkCompanyDto[];
  target: WorkCompanyDto[];
  onListsChange: (next: { source: WorkCompanyDto[]; target: WorkCompanyDto[] }) => void;
  targetError?: boolean;
};

const CompanyTransferLists = ({
  source,
  target,
  onListsChange,
  targetError,
}: CompanyTransferListsProps) => {
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());

  const filterByName = useCallback((items: WorkCompanyDto[], q: string) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => (item.name ?? "").toLowerCase().includes(needle));
  }, []);

  const filteredSource = useMemo(
    () => filterByName(source, sourceFilter),
    [filterByName, source, sourceFilter],
  );
  const filteredTarget = useMemo(
    () => filterByName(target, targetFilter),
    [filterByName, target, targetFilter],
  );

  const handleToggleSourceSelect = useCallback((item: WorkCompanyDto) => {
    const key = companyKey(item);
    if (!key) return;
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleToggleTargetSelect = useCallback((item: WorkCompanyDto) => {
    const key = companyKey(item);
    if (!key) return;
    setSelectedTargetIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const mapKeyToItems = (items: WorkCompanyDto[], keys: Set<string>) =>
    items.filter((i) => keys.has(companyKey(i)));

  const handleMoveSelectedToTarget = useCallback(() => {
    const moving = mapKeyToItems(source, selectedSourceIds);
    if (moving.length === 0) return;
    const moveIds = new Set(moving.map((m) => companyKey(m)));
    onListsChange({
      source: source.filter((s) => !moveIds.has(companyKey(s))),
      target: [...target, ...moving],
    });
    setSelectedSourceIds(new Set());
  }, [onListsChange, selectedSourceIds, source, target]);

  const handleMoveAllToTarget = useCallback(() => {
    if (source.length === 0) return;
    onListsChange({
      source: [],
      target: [...target, ...source],
    });
    setSelectedSourceIds(new Set());
  }, [onListsChange, source, target]);

  const handleMoveSelectedToSource = useCallback(() => {
    const moving = mapKeyToItems(target, selectedTargetIds);
    if (moving.length === 0) return;
    const moveIds = new Set(moving.map((m) => companyKey(m)));
    onListsChange({
      source: [...source, ...moving],
      target: target.filter((t) => !moveIds.has(companyKey(t))),
    });
    setSelectedTargetIds(new Set());
  }, [onListsChange, selectedTargetIds, source, target]);

  const handleMoveAllToSource = useCallback(() => {
    if (target.length === 0) return;
    onListsChange({
      source: [...source, ...target],
      target: [],
    });
    setSelectedTargetIds(new Set());
  }, [onListsChange, source, target]);

  const listPanelClass =
    "flex min-h-0 flex-1 flex-col gap-2 rounded-xl border border-border/80 bg-card shadow-sm";

  return (
    <div
      className="flex flex-col gap-4 xl:flex-row xl:items-stretch xl:gap-3"
      role="group"
      aria-label="Şirket transfer listesi"
    >
      <div className={listPanelClass}>
        <div className="border-b border-border/60 bg-muted/35 px-3 py-2">
          <span className="text-sm font-semibold text-primary">Tüm Şirketler</span>
        </div>
        <div className="flex flex-col gap-2 px-3 pt-1 pb-2">
          <Input
            type="search"
            placeholder="Şirket Ara"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Kaynak listede ara"
            className="h-9"
          />
          <ScrollArea className="h-96 rounded-lg border border-border/60">
            <ul className="divide-y divide-border/60 p-1" role="listbox" aria-multiselectable>
              {filteredSource.map((item) => {
                const key = companyKey(item);
                const selected = key ? selectedSourceIds.has(key) : false;
                return (
                  <li key={key || item.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleToggleSourceSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Building2 className="size-5 shrink-0 text-primary" aria-hidden />
                      <span className="truncate font-medium">{item.name}</span>
                    </button>
                  </li>
                );
              })}
              {filteredSource.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Kayıt yok
                </li>
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-row items-center justify-center gap-2 xl:w-14 xl:flex-col xl:justify-center xl:py-8">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0"
          aria-label="Seçilenleri sağa taşı"
          disabled={selectedSourceIds.size === 0}
          onClick={handleMoveSelectedToTarget}
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0"
          aria-label="Tümünü sağa taşı"
          disabled={source.length === 0}
          onClick={handleMoveAllToTarget}
        >
          <ChevronsRight className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0"
          aria-label="Seçilenleri sola taşı"
          disabled={selectedTargetIds.size === 0}
          onClick={handleMoveSelectedToSource}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="shrink-0"
          aria-label="Tümünü sola taşı"
          disabled={target.length === 0}
          onClick={handleMoveAllToSource}
        >
          <ChevronsLeft className="size-4" />
        </Button>
      </div>

      <div className={listPanelClass}>
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-muted/35 px-3 py-2">
          <span className="text-sm font-semibold text-primary">Atanan Şirketler</span>
          {targetError && (
            <span className="text-sm text-destructive" role="alert">
              Şirket Atanmali Error
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2 px-3 pt-1 pb-2">
          <Input
            type="search"
            placeholder="Şirket Ara"
            value={targetFilter}
            onChange={(e) => setTargetFilter(e.target.value)}
            aria-label="Hedef listede ara"
            className="h-9"
          />
          <ScrollArea className="h-96 rounded-lg border border-border/60">
            <ul className="divide-y divide-border/60 p-1" role="listbox" aria-multiselectable>
              {filteredTarget.map((item) => {
                const key = companyKey(item);
                const selected = key ? selectedTargetIds.has(key) : false;
                return (
                  <li key={key || item.name}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => handleToggleTargetSelect(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected && "bg-accent text-accent-foreground",
                      )}
                    >
                      <Building2 className="size-5 shrink-0 text-primary" aria-hidden />
                      <span className="truncate font-medium">{item.name}</span>
                    </button>
                  </li>
                );
              })}
              {filteredTarget.length === 0 && (
                <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Kayıt yok
                </li>
              )}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

function CompanyRelationDetail() {
  const [source, setSource] = useState<WorkCompanyDto[]>([]);
  const [target, setTarget] = useState<WorkCompanyDto[]>([]);
  const [companyName, setCompanyName] = useState<WorkCompanyDto | null>(null);
  const [companyNameOptions, setCompanyNameOptions] = useState<WorkCompanyDto[]>([]);
  const [companyNameError, setCompanyNameError] = useState(false);
  const [targetError, setTargetError] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ open: false });
  const navigateAfterFeedbackCloseRef = useRef(false);
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const { id } = useParams();

  const dismissFeedback = useCallback(() => {
    const goList = navigateAfterFeedbackCloseRef.current;
    navigateAfterFeedbackCloseRef.current = false;
    setFeedback({ open: false });
    if (goList) {
      navigate("/companyRelation");
    }
  }, [navigate]);

  const openFeedback = useCallback(
    (
      message: string,
      variant: "success" | "error",
      options?: { navigateAfterClose?: boolean; title?: string },
    ) => {
      navigateAfterFeedbackCloseRef.current = !!options?.navigateAfterClose;
      setFeedback({
        open: true,
        title:
          options?.title ??
          (variant === "success" ? "İşlem başarılı" : "Hata"),
        message,
      });
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const workApi = new WorkCompanyApi(conf);
        const data = (await workApi.apiWorkCompanyGet()).data;
        if (cancelled) return;

        setCompanyNameOptions(data);

        if (id) {
          const matrisApi = new WorkCompanyTicketMatrisApi(conf);
          const rel = await matrisApi.apiWorkCompanyTicketMatrisIdGet(id);
          if (cancelled) return;

          setCompanyName(rel.data.fromCompany ?? null);
          const to = rel.data.toCompanies ?? [];
          const targetIds = new Set(to.map((c) => companyKey(c)));
          setTarget(to);
          setSource(data.filter((c) => !targetIds.has(companyKey(c))));
        } else {
          setSource(data);
          setTarget([]);
        }
      } catch {
        if (!cancelled) {
          openFeedback("Hata Oluştu", "error");
        }
      } finally {
        if (!cancelled) {
          dispatchBusy({ isBusy: false });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [dispatchBusy, id, openFeedback]);

  const handleListsChange = (next: { source: WorkCompanyDto[]; target: WorkCompanyDto[] }) => {
    setSource(next.source);
    setTarget(next.target);
    setTargetError(false);
  };

  const handleSave = async () => {
    let hasError = false;
    if (!companyName) {
      setCompanyNameError(true);
      hasError = true;
    }
    if (hasError) return;

    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyTicketMatrisApi(conf);

      const dto: WorkCompanyTicketMatrisInsertDto = {
        fromCompanyId: companyName.id,
        toCompaniesIds: target.map((item: WorkCompanyDto) => item.id),
      };

      await api.apiWorkCompanyTicketMatrisPost(dto);
      openFeedback("Şirket ilişkisi eklendi.", "success", { navigateAfterClose: true });
    } catch {
      openFeedback("Hata Oluştu", "error");
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUpdate = async () => {
    let hasError = false;
    if (!companyName) {
      setCompanyNameError(true);
      hasError = true;
    }
    if (hasError) return;

    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyTicketMatrisApi(conf);

      const dto: WorkCompanyTicketMatrisUpdateDto = {
        fromCompanyId: companyName.id,
        toCompaniesIds: target.map((item: WorkCompanyDto) => item.id),
      };

      await api.apiWorkCompanyTicketMatrisPut(dto);
      openFeedback("Şirket ilişkisi düzenlendi.", "success", { navigateAfterClose: true });
    } catch {
      openFeedback("Hata Oluştu", "error");
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Card className="mx-4 mb-4 mt-2">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-xl font-semibold tracking-tight">
            Şirket İlişkisi Tanımlama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-6">
          <div className="grid max-w-xl gap-2">
            <Label htmlFor="company-relation-company">Şirket</Label>
            <CompanyCombobox
              options={companyNameOptions}
              value={companyName}
              onChange={(next) => {
                setCompanyName(next);
                setCompanyNameError(false);
              }}
              disabled={!!id}
              error={companyNameError}
              placeholder="Şirket Seçiniz"
            />
            {companyNameError && (
              <p className="text-sm text-destructive" role="alert">
                Şirket Seçiniz
              </p>
            )}
          </div>

          <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-border/40">
            <CompanyTransferLists
              source={source}
              target={target}
              onListsChange={handleListsChange}
              targetError={targetError}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => navigate("/companyRelation")}
            >
              İptal
            </Button>
            <Button type="button" onClick={id ? handleUpdate : handleSave}>
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>
      

      <AlertDialog
        open={feedback.open}
        onOpenChange={(open) => {
          if (!open) {
            dismissFeedback();
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="sm:text-left">
            <AlertDialogTitle>
              {feedback.open ? feedback.title : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {feedback.open ? feedback.message : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-row sm:justify-end">
            <AlertDialogAction type="button">Tamam</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export default CompanyRelationDetail;
