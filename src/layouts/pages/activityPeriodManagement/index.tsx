import { useCallback, useEffect, useMemo, useState } from "react";
import { endOfMonth } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, Pencil, Plus, Save, X } from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { MessageBoxType } from "@ui5/webcomponents-react";
import { Button } from "components/ui/button";
import { Badge } from "components/ui/badge";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  ActivityPeriodSettingsApi,
  ActivityPeriodSettingsListDto,
  UserApi,
  UserAppDtoOnlyNameId,
} from "api/generated/api";
import getConfiguration from "confiuration";
import { cn } from "lib/utils";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";

type OpenAudienceScope = "everyone" | "selectedUsers";

type PeriodRecord = {
  id: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  userAppIds: string[];
  openForDisplay: string;
  createdAt: string;
  updatedAt: string;
};

type PeriodFormState = {
  id?: string;
  startDate: string;
  endDate: string;
  isOpen: boolean;
  openAudience: OpenAudienceScope;
  userAppIds: string[];
};

type UserOption = { id: string; label: string };

const PAGE_SIZE_OPTIONS = [10, 15, 30] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const defaultFormState: PeriodFormState = {
  startDate: "",
  endDate: "",
  isOpen: true,
  openAudience: "everyone",
  userAppIds: [],
};

const toInputDate = (value?: string | null): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const formatDateDisplay = (value?: string | null): string => {
  if (!value) return "—";
  const inputDate = toInputDate(value);
  if (!inputDate) return value;
  const [y, m, day] = inputDate.split("-").map(Number);
  if (!y || !m || !day) return value;
  return `${String(day).padStart(2, "0")}.${String(m).padStart(2, "0")}.${y}`;
};

const parseYmdToLocalDate = (yyyyMmDd: string): Date | null => {
  if (!yyyyMmDd || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
  const [y, m, day] = yyyyMmDd.split("-").map(Number);
  return new Date(y, m - 1, day);
};

const formatLocalDateToYmd = (d: Date): string => {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
};

const getLastDayOfSameMonthIso = (startYmd: string): string => {
  const parsed = parseYmdToLocalDate(startYmd);
  if (!parsed) return "";
  return formatLocalDateToYmd(endOfMonth(parsed));
};

const buildUserLabel = (u: UserAppDtoOnlyNameId): string => {
  const parts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (parts) return parts;
  const un = u.userName?.trim();
  if (un) return un;
  return u.id ?? "—";
};

const mapDtoToRow = (
  item: ActivityPeriodSettingsListDto,
  userNameById: Map<string, string>
): PeriodRecord => {
  const ids = (item.userAppIds ?? []).filter((x): x is string => Boolean(x));
  const isEveryone = ids.length === 0;
  const openForLabel = isEveryone
    ? item.openFor?.trim() || "Herkese açık"
    : item.openFor?.trim() ||
      ids.map((id) => userNameById.get(id) ?? id).join(", ").trim() ||
      "—";
  return {
    id: item.id ?? "",
    startDate: toInputDate(item.startDate),
    endDate: toInputDate(item.endDate),
    isOpen: item.isPeriodOpen ?? false,
    userAppIds: ids,
    openForDisplay: openForLabel,
    createdAt: formatDateDisplay(item.createdDate),
    updatedAt: item.updatedDate ? formatDateDisplay(item.updatedDate) : "—",
  };
};

type UserMultiComboboxProps = {
  id: string;
  options: UserOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

const UserMultiCombobox = ({
  id,
  options,
  value,
  onChange,
  disabled,
}: UserMultiComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const handleToggleUser = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((x) => x !== userId));
      return;
    }
    onChange([...value, userId]);
  };

  const selectedLabels = useMemo(
    () => value.map((uid) => options.find((o) => o.id === uid)?.label ?? uid),
    [value, options]
  );

  const summary =
    value.length === 0 ? "Kullanıcı seçin" : selectedLabels.join(", ");

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background text-left",
            disabled && "cursor-not-allowed opacity-50"
          )}
          aria-label={
            value.length === 0
              ? "Dönemin açık olacağı kullanıcıları seçin"
              : `Seçili kullanıcılar: ${selectedLabels.join(", ")}`
          }
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <span
            className={cn(
              "min-w-0 flex-1 whitespace-normal break-words text-left leading-snug",
              value.length === 0 && "text-muted-foreground"
            )}
            title={value.length > 0 ? summary : undefined}
          >
            {summary}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[1600] w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <div className="border-b border-slate-200 p-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kullanıcı ara..."
            className="h-9"
            aria-label="Kullanıcı ara"
          />
        </div>
        <div
          className="max-h-60 overflow-y-auto p-2"
          role="listbox"
          aria-label="Kullanıcı listesi"
          aria-multiselectable="true"
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Sonuç yok</p>
          ) : (
            filtered.map((opt) => {
              const checked = value.includes(opt.id);
              return (
                <label
                  key={opt.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-100"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => handleToggleUser(opt.id)}
                    aria-label={opt.label}
                  />
                  <span>{opt.label}</span>
                </label>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

function ActivityPeriodManagement() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const [listItems, setListItems] = useState<ActivityPeriodSettingsListDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [totalCount, setTotalCount] = useState(0);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [formState, setFormState] = useState<PeriodFormState>(defaultFormState);

  const userNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of userOptions) m.set(u.id, u.label);
    return m;
  }, [userOptions]);

  const rows = useMemo(
    () => listItems.map((item) => mapDtoToRow(item, userNameById)),
    [listItems, userNameById]
  );

  const totalPages = useMemo(() => {
    if (totalCount <= 0) return 0;
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  const fetchUsers = useCallback(async () => {
    dispatchBusy({ isBusy: true });
    try {
      const api = new UserApi(getConfiguration());
      const res = await api.apiUserGetAllUsersNameIdOnlyGet();
      const next = (res.data ?? [])
        .filter((u): u is UserAppDtoOnlyNameId & { id: string } => Boolean(u.id))
        .map((u) => ({ id: u.id, label: buildUserLabel(u) }));
      setUserOptions(next);
    } catch {
      dispatchAlert({
        message: "Kullanıcı listesi yüklenirken hata oluştu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  const fetchPeriods = useCallback(async () => {
    dispatchBusy({ isBusy: true });
    try {
      const api = new ActivityPeriodSettingsApi(getConfiguration());
      const res = await api.apiActivityPeriodSettingsGet(page, pageSize);
      const data = res.data;
      const items = data?.items ?? [];
      const tc = data?.totalCount ?? 0;
      setListItems(items);
      setTotalCount(tc);
      const tp = tc <= 0 ? 0 : Math.ceil(tc / pageSize);
      if (tc === 0 && page !== 1) {
        setPage(1);
      } else if (tp > 0 && page > tp) {
        setPage(tp);
      }
    } catch {
      dispatchAlert({
        message: "Dönem listesi yüklenirken hata oluştu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy, page, pageSize]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    void fetchPeriods();
  }, [fetchPeriods]);

  const handlePageSizeChange = (value: string) => {
    const next = Number(value) as PageSizeOption;
    if (!PAGE_SIZE_OPTIONS.includes(next)) return;
    setPageSize(next);
    setPage(1);
  };

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setPage((p) => (totalPages > 0 ? Math.min(totalPages, p + 1) : p));
  };

  const fromRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const toRecord = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  const handleOpenCreate = () => {
    setFormState(defaultFormState);
    setOpenDialog(true);
  };

  const handleOpenEdit = (row: PeriodRecord) => {
    const hasSelectedUsers = row.userAppIds.length > 0;
    setFormState({
      id: row.id,
      startDate: row.startDate,
      endDate: row.endDate,
      isOpen: row.isOpen,
      openAudience: hasSelectedUsers ? "selectedUsers" : "everyone",
      userAppIds: hasSelectedUsers ? [...row.userAppIds] : [],
    });
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formState.startDate || !formState.endDate) {
      dispatchAlert({
        message: "Başlangıç ve bitiş tarihi zorunludur.",
        type: MessageBoxType.Warning,
      });
      return;
    }
    if (
      formState.isOpen &&
      formState.openAudience === "selectedUsers" &&
      formState.userAppIds.length === 0
    ) {
      dispatchAlert({
        message: "Bazı kişilere açık seçildiğinde en az bir kullanıcı seçmelisiniz.",
        type: MessageBoxType.Warning,
      });
      return;
    }

    const userAppIdsPayload = !formState.isOpen
      ? null
      : formState.openAudience === "everyone"
        ? null
        : formState.userAppIds;

    dispatchBusy({ isBusy: true });
    try {
      const api = new ActivityPeriodSettingsApi(getConfiguration());
      if (formState.id) {
        await api.apiActivityPeriodSettingsPut({
          id: formState.id,
          startDate: formState.startDate,
          endDate: formState.endDate,
          isPeriodOpen: formState.isOpen,
          userAppIds: userAppIdsPayload,
        });
        dispatchAlert({
          message: "Dönem güncellendi.",
          type: MessageBoxType.Success,
        });
      } else {
        await api.apiActivityPeriodSettingsPost({
          startDate: formState.startDate,
          endDate: formState.endDate,
          isPeriodOpen: formState.isOpen,
          userAppIds: userAppIdsPayload,
        });
        dispatchAlert({
          message: "Dönem kaydedildi.",
          type: MessageBoxType.Success,
        });
      }
      setOpenDialog(false);
      setFormState(defaultFormState);
      await fetchPeriods();
    } catch {
      dispatchAlert({
        message: "Kayıt sırasında hata oluştu.",
        type: MessageBoxType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <main className="px-4 md:px-6 py-6 flex flex-col gap-5 min-h-[calc(100vh-10rem)]">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Aktivite Dönem Yönetimi</h2>
              <p className="text-sm text-slate-500">
                Dönem tanımları ekleyin ve mevcut dönemleri düzenleyin.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="h-8 gap-2 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium shadow-sm shadow-[#3e5d8f]/25 transition-all duration-200 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni Dönem
            </Button>
          </div>

          <div className="max-h-[520px] overflow-y-auto overflow-x-auto">
            <Table className="min-w-[1100px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Düzenle
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Dönem Başlangıç Tarihi
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Dönem Bitiş Tarihi
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Dönem Açık mı?
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Dönemin Açık Olduğu Kişiler
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Oluşturulma Tarihi
                  </TableHead>
                  <TableHead className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/60">
                    Güncellenme Tarihi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-slate-50 hover:bg-slate-100/90"
                    >
                      <TableCell className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-slate-200 text-slate-600 hover:bg-slate-50"
                          onClick={() => handleOpenEdit(row)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Düzenle
                        </Button>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-700">
                        {formatDateDisplay(row.startDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-700">
                        {formatDateDisplay(row.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-700">
                        <Badge
                          variant="outline"
                          className={
                            row.isOpen
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700"
                          }
                        >
                          {row.isOpen ? "Evet" : "Hayır"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-700 max-w-[320px]">
                        <span className="line-clamp-2" title={row.openForDisplay}>
                          {row.openForDisplay}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-700">
                        {row.createdAt}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-slate-700">
                        {row.updatedAt}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="shrink-0">Sayfadaki kayıt sayısı</span>
              <Select
                value={String(pageSize)}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger
                  className="h-8 w-[4.5rem] border-slate-200"
                  aria-label="Sayfa başına kayıt sayısı"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-slate-600 sm:text-center">
              {totalCount === 0 ? (
                "Kayıt yok"
              ) : (
                <>
                  
                  <span>{totalCount} kayıt</span>
                </>
              )}
            </p>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200"
                disabled={page <= 1 || totalCount === 0}
                onClick={handlePrevPage}
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
              <span className="min-w-[7rem] text-center text-sm tabular-nums text-slate-600">
                Sayfa {totalPages === 0 ? 0 : page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 border-slate-200"
                disabled={totalPages === 0 || page >= totalPages}
                onClick={handleNextPage}
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-2xl rounded-2xl border border-slate-300/60 p-6">
          <DialogHeader>
            <DialogTitle className="font-semibold">
              {formState.id ? "Dönem Düzenle" : "Yeni Dönem Ekle"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="period-start">Dönem Başlangıç Tarihi</Label>
              <Input
                id="period-start"
                type="date"
                value={formState.startDate}
                onChange={(event) => {
                  const nextStart = event.target.value;
                  setFormState((prev) => {
                    if (!nextStart) {
                      return { ...prev, startDate: "", endDate: "" };
                    }
                    return {
                      ...prev,
                      startDate: nextStart,
                      endDate: getLastDayOfSameMonthIso(nextStart),
                    };
                  });
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period-end">Dönem Bitiş Tarihi</Label>
              <Input
                id="period-end"
                type="date"
                value={formState.endDate}
                min={formState.startDate || undefined}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, endDate: event.target.value }))
                }
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label className="text-base">Dönem Açık mı</Label>
              <RadioGroup
                value={formState.isOpen ? "yes" : "no"}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    isOpen: value === "yes",
                  }))
                }
                className="gap-3"
                aria-label="Dönemin açık olup olmadığını seçin"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yes" id="period-open-yes" />
                  <Label
                    htmlFor="period-open-yes"
                    className="cursor-pointer font-normal text-sm text-slate-700"
                  >
                    Evet
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="no" id="period-open-no" />
                  <Label
                    htmlFor="period-open-no"
                    className="cursor-pointer font-normal text-sm text-slate-700"
                  >
                    Hayır
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {formState.isOpen ? (
              <div className="space-y-3 md:col-span-2">
                <Label className="text-base">Dönem Kimlere Açık</Label>
                <RadioGroup
                  value={formState.openAudience}
                  onValueChange={(value) => {
                    const next = value as OpenAudienceScope;
                    setFormState((prev) => ({
                      ...prev,
                      openAudience: next,
                      userAppIds: next === "everyone" ? [] : prev.userAppIds,
                    }));
                  }}
                  className="gap-3"
                  aria-label="Dönemin kimlere açık olacağını seçin"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="everyone" id="open-audience-everyone" />
                    <Label
                      htmlFor="open-audience-everyone"
                      className="cursor-pointer font-normal text-sm text-slate-700"
                    >
                      Dönemi herkese aç
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value="selectedUsers"
                      id="open-audience-selected"
                    />
                    <Label
                      htmlFor="open-audience-selected"
                      className="cursor-pointer font-normal text-sm text-slate-700"
                    >
                      Dönemi bazı kişilere aç
                    </Label>
                  </div>
                </RadioGroup>

                {formState.openAudience === "selectedUsers" ? (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="period-users-combo">Kullanıcılar</Label>
                    <UserMultiCombobox
                      id="period-users-combo"
                      options={userOptions}
                      value={formState.userAppIds}
                      onChange={(next) =>
                        setFormState((prev) => ({ ...prev, userAppIds: next }))
                      }
                      disabled={userOptions.length === 0}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-4 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 bg-slate-50 sm:justify-end">
            <Button
              variant="outline"
              className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => setOpenDialog(false)}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              Vazgeç
            </Button>
            <Button
              className="gap-2 bg-[#3e5d8f] text-white hover:bg-[#324d7a]"
              onClick={() => void handleSave()}
            >
              <Save className="h-4 w-4 shrink-0" aria-hidden />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default ActivityPeriodManagement;
