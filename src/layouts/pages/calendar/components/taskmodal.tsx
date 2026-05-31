import React, { useEffect, useState, ChangeEvent, useMemo, useRef } from "react";
import { TaskEvent } from "../index";
import {
  UserCalendarInsertDto,
  UserCalendarListDto,
  UserApp,
  WorkCompanyDto,
  UserApi,
  WorkLocation,
  UserCalendarApi,
} from "api/generated/api";
import { clientData, getWorkLocationData, IWorkLocation } from "../controller";
import { useAlert } from "layouts/pages/hooks/useAlert";
import getConfiguration from "confiuration";
import { fetchUserData } from "layouts/pages/queryBuild/controller/custom/apiCalls";
import { X, ClipboardPaste, Search, Check, ChevronDown } from "lucide-react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { cn } from "lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: { start: string; end: string };
  selectedUsers: UserApp;
  onAddTask: (task: UserCalendarInsertDto) => void;
}

// ─── Shared SearchableSelect ──────────────────────────────────────────────────

interface SelectOption {
  id?: any;
  [key: string]: any;
}

interface SearchableSelectProps<T extends SelectOption> {
  options: T[];
  value: T | null | undefined;
  onChange: (val: T | null) => void;
  getLabel: (item: T) => string;
  renderOption?: (item: T) => React.ReactNode;
  placeholder?: string;
  label: string;
}

function SearchableSelect<T extends SelectOption>({
  options,
  value,
  onChange,
  getLabel,
  renderOption,
  placeholder = "Seçiniz...",
  label,
}: SearchableSelectProps<T>) {
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

  const filtered = useMemo(
    () => options.filter((o) => getLabel(o).toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  return (
    <div ref={ref} className="relative w-full">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full h-9 flex items-center justify-between gap-2 px-3 border border-slate-200 rounded-lg bg-white text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all hover:border-slate-300"
      >
        <span className={value ? "text-slate-700" : "text-slate-400 text-xs"}>
          {value ? getLabel(value) : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ara..."
                className="w-full h-8 pl-8 pr-3 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-xs text-center text-slate-400">Sonuç bulunamadı</li>
            ) : (
              filtered.map((opt, idx) => (
                <li key={opt.id ?? idx}>
                  <button
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
                      value?.id === opt.id ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {renderOption ? renderOption(opt) : (
                      <>
                        {value?.id === opt.id && <Check className="w-3 h-3 shrink-0" />}
                        {getLabel(opt)}
                      </>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white";

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
    {children}
  </label>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function TaskModal({
  open,
  onClose,
  selectedDate,
  selectedUsers,
  onAddTask,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);
  const [clientFetchData, setClientFetchData] = useState<WorkCompanyDto[]>([]);
  const [client, setClient] = useState<WorkCompanyDto>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [density, setDensity] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [userAppFetchData, setUserAppFetchData] = useState<UserApp[]>([]);
  const [userApp, setUserApp] = useState<UserApp | null>(null);
  const [workLocationData, setWorkLocationData] = useState<IWorkLocation[]>([]);
  const [workLocation, setWorkLocation] = useState<IWorkLocation>(null);
  const dispatchAlert = useAlert();

  const percentageOptions = [
    { id: 1, description: "%25", color: "#10B981" },
    { id: 2, description: "%50", color: "#f4e218" },
    { id: 3, description: "%75", color: "#f69c09" },
    { id: 4, description: "%100", color: "#EF4444" },
  ];

  const customColors = {
    primary: "#4F46E5",
    background: { paper: "#FFFFFF", light: "#F8FAFC" },
    text: { primary: "#1E293B", secondary: "#64748B" },
    border: "#E2E8F0",
  };

  const colorOptions = [
    { value: "primary", label: "Primary" },
    { value: "secondary", label: "Secondary" },
    { value: "info", label: "Info" },
    { value: "success", label: "Success" },
    { value: "warning", label: "Warning" },
    { value: "error", label: "Error" },
  ];

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchClientData = async () => {
      const data = await clientData();
      setClientFetchData(data);
    };
    fetchClientData();

    const fetchHasPerm = async () => {
      let conf = getConfiguration();
      let api1 = new UserCalendarApi(conf);
      const permData = await api1.apiUserCalendarCheckOtherDeptpermGet();
      if (permData.data.perm == false) {
        fetchUsersData();
      } else {
        fetchUserAppData();
      }
    };
    fetchHasPerm();

    const fetchUserAppData = async () => {
      let conf = getConfiguration();
      let api = new UserApi(conf);
      let data = await api.apiUserVesaUsersWithoutPhotoGet();
      setUserAppFetchData(data.data);
    };

    const fetchUsersData = async () => {
      let conf = getConfiguration();
      let api = new UserCalendarApi(conf);
      let data = await api.apiUserCalendarGetUsersByDepartmentAndLevelGet();
      setUserAppFetchData(data.data);
    };

    const fetchWorkLocationData = async () => {
      getWorkLocationData().then((data) => setWorkLocationData(data));
    };
    fetchWorkLocationData();
  }, []);

  useEffect(() => {
    if (selectedDate && open) {
      setStart(selectedDate.start);
      setEnd(selectedDate.end);
    }
  }, [selectedDate, open]);

  useEffect(() => {
    if (open) {
      if (selectedUsers) {
        setUserApp(selectedUsers);
      }
    }
  }, [open, selectedUsers]);

  // ── Paste from clipboard ───────────────────────────────────────────────────

  interface CopiedData {
    title: any;
    description: any;
    user: any;
    customer: any;
    workLocation: any;
    startDate: any;
    endDate: any;
    density: any;
    isAvailable: any;
  }

  const [storedData, setStoredData] = useState<CopiedData | null>(null);

  useEffect(() => {
    const checkLocalStorage = () => {
      try {
        const storedItem = localStorage.getItem("CopiedData");
        if (storedItem) {
          const parsedData: CopiedData = JSON.parse(storedItem);
          setStoredData(parsedData);
          console.log("storedData", storedData);
        } else {
          setStoredData(null);
        }
      } catch (error) {
        setStoredData(null);
      }
    };
    checkLocalStorage();
  }, []);

  const handlePaste = () => {
    const storedItem = localStorage.getItem("CopiedData");
    const parsedData: CopiedData = JSON.parse(storedItem);

    setTitle(parsedData.title);
    setDensity(parsedData.density);
    setDescription(parsedData.description);

    const foundUserApp = userAppFetchData.find(
      (u) => u.id.toString() === parsedData.user.toString()
    );
    const foundClient = clientFetchData.find(
      (c) => c.id.toString() === parsedData.customer.toString()
    );
    const foundWorkLocation = workLocationData.find(
      (l) => l.id.toString() === parsedData.workLocation.toString()
    );

    setUserApp(foundUserApp || null);
    setClient(foundClient ? { ...foundClient } : null);
    setWorkLocation(foundWorkLocation ? { ...foundWorkLocation } : null);

    try {
      console.log("Veriler başarıyla yerleştirildi");
    } catch (error) {
      alert("Veriler yerleştirilirken bir hata oluştu.");
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = () => {
    onClose();
    setTitle("");
    setStart("");
    setEnd("");
    setDensity(0);
    setDescription("");
    setClient(null);
    setUserApp(null);
    setWorkLocation(null);
    setIsAvailable(false);
  };

  const handleSubmit = (): void => {
    console.log("tıklandı");
    if (isAvailable == false) {
      if (!client) {
        dispatchAlert({ message: "Müşteri seçiniz", type: "Error" });
        return;
      }
    }
    if (userApp == null) {
      dispatchAlert({ message: "Personel seçiniz", type: "Error" });
      return;
    }
    if (!start) {
      dispatchAlert({ message: "Başlangıç tarihi giriniz", type: "Error" });
      return;
    }
    if (!end) {
      dispatchAlert({ message: "Bitiş tarihi giriniz", type: "Error" });
      return;
    }
    if (start > end) {
      dispatchAlert({
        message: "Başlangıç tarihi bitiş tarihinden büyük olamaz",
        type: "Error",
      });
      return;
    }

    if (start && end) {
      const newTask: UserCalendarInsertDto = {
        name: title,
        startDate: start,
        endDate: end,
        percentage: density.toString(),
        customerRefId: client?.id,
        userAppId: userApp.id,
        description,
        isAvailable: isAvailable,
      };
      if (workLocation?.id) {
        newTask.workLocation = workLocation.id as WorkLocation;
      }
      onAddTask(newTask);
      console.log("newTaskkk", newTask);
      handleClose();
    }
  };

  const selectedPercentage = percentageOptions.find((o) => o.id === density) || null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-slate-800">
              Yeni Görev Ekle
            </DialogTitle>
            <div className="flex items-center gap-1.5">
              {storedData && (
                <button
                  type="button"
                  onClick={handlePaste}
                  title="Yapıştır"
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                  aria-label="Yapıştır"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <form role="form" className="px-6 py-4 space-y-4">

          {/* Müsaitlik toggle */}
          <div className="flex items-center justify-end gap-3">
            <span className="text-sm text-slate-600 select-none">Bugün müsaitim!</span>
            <div
              role="switch"
              aria-checked={isAvailable}
              tabIndex={0}
              onClick={() => setIsAvailable((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") setIsAvailable((v) => !v);
              }}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors cursor-pointer",
                isAvailable ? "bg-indigo-600" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                  isAvailable ? "translate-x-4" : "translate-x-0"
                )}
              />
            </div>
          </div>

          {/* Görev Başlığı */}
          <div>
            <FieldLabel>Görev Başlığı</FieldLabel>
            <input
              type="text"
              placeholder="Görev Başlığı Giriniz"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Personel */}
          <SearchableSelect
            options={userAppFetchData}
            value={userApp}
            onChange={(v) => setUserApp(v)}
            getLabel={(o) => `${o.firstName ?? ""} ${o.lastName ?? ""}`}
            label="Personel"
            placeholder="Personel Seçiniz"
          />

          {/* Müşteri */}
          <SearchableSelect
            options={clientFetchData}
            value={client}
            onChange={(v) => setClient(v)}
            getLabel={(o) => o.name ?? ""}
            label="Müşteri"
            placeholder="Müşteri Seçiniz"
          />

          {/* Çalışma Yerleri */}
          <SearchableSelect
            options={workLocationData}
            value={workLocation}
            onChange={(v) => setWorkLocation(v)}
            getLabel={(o) => o.description ?? ""}
            label="Çalışma Yerleri"
            placeholder="Çalışma Yerleri Seçiniz"
          />

          {/* Tarihler */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Başlangıç Tarihi</FieldLabel>
              <input
                type="date"
                value={start}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Bitiş Tarihi</FieldLabel>
              <input
                type="date"
                value={end}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <FieldLabel>Açıklama</FieldLabel>
            <textarea
              placeholder="Açıklama Giriniz"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all bg-white resize-none"
            />
          </div>

          {/* Yoğunluk */}
          <SearchableSelect
            options={percentageOptions}
            value={selectedPercentage}
            onChange={(v) => setDensity(v ? v.id : null)}
            getLabel={(o) => o.description ?? ""}
            label="Yoğunluk"
            placeholder="Yoğunluk Seçiniz"
            renderOption={(opt) => (
              <div className="flex items-center gap-2 w-full">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: opt.color }}
                />
                <span
                  className={cn(
                    "flex-1",
                    selectedPercentage?.id === opt.id ? "font-semibold" : ""
                  )}
                >
                  {opt.description}
                </span>
                {selectedPercentage?.id === opt.id && (
                  <Check className="w-3 h-3 text-indigo-600 shrink-0" />
                )}
              </div>
            )}
          />

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
            >
              Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
