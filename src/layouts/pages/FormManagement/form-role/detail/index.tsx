import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, FolderOpen, Search } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { FormDataApi } from "api/generated";
import getConfiguration from "confiuration";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Card, CardContent } from "components/ui/card";
import { ScrollArea } from "components/ui/scroll-area";
import { Separator } from "components/ui/separator";
import { cn } from "lib/utils";

function FormRoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const [formRoleName, setFormRoleName] = useState("");
  const [formRoleNameError, setFormRoleNameError] = useState(false);
  const [formRoleDescription, setFormRoleDescription] = useState("");
  const [formRoleDescriptionError, setFormRoleDescriptionError] = useState(false);
  const [source, setSource] = useState<any[]>([]);
  const [target, setTarget] = useState<any[]>([]);
  const [targetError, setTargetError] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");

  const handleSubmit = () => {
    let hasError = false;

    if (!formRoleName.trim()) {
      setFormRoleNameError(true);
      hasError = true;
    } else {
      setFormRoleNameError(false);
    }

    if (!formRoleDescription.trim()) {
      setFormRoleDescriptionError(true);
      hasError = true;
    } else {
      setFormRoleDescriptionError(false);
    }

    if (target.length === 0) {
      setTargetError(true);
      hasError = true;
    } else {
      setTargetError(false);
    }

    if (hasError) return;
    console.log("target", target);
  };

  const moveToTarget = (item: any) => {
    setSource((prev) => prev.filter((s: any) => s.id !== item.id));
    setTarget((prev) => [...prev, item]);
    setTargetError(false);
  };

  const moveToSource = (item: any) => {
    setTarget((prev) => prev.filter((t: any) => t.id !== item.id));
    setSource((prev) => [...prev, item]);
  };

  const fetchData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new FormDataApi(conf);
      const data = await api.apiFormDataGet();
      setSource(data.data);
    } catch {
      dispatchAlert({ message: "Hata oluştu", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSource = useMemo(
    () =>
      source.filter(
        (item: any) =>
          item.formName?.toLowerCase().includes(sourceFilter.toLowerCase()) ||
          item.formDescription?.toLowerCase().includes(sourceFilter.toLowerCase()),
      ),
    [source, sourceFilter],
  );

  const filteredTarget = useMemo(
    () =>
      target.filter(
        (item: any) =>
          item.formName?.toLowerCase().includes(targetFilter.toLowerCase()) ||
          item.formDescription?.toLowerCase().includes(targetFilter.toLowerCase()),
      ),
    [target, targetFilter],
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="flex flex-col gap-6 py-2">
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          {/* Card header */}
          <div className="border-b border-border/60 bg-linear-to-b from-muted/50 to-background px-6 py-4">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {id ? "Form Rolü Güncelle" : "Form Rolü Oluştur"}
            </h1>
          </div>

          <CardContent className="p-6">
            {/* Section: Bilgiler */}
            <div className="mb-8 flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Form Rolü Bilgileri
                </h2>
                <p className="text-xs text-muted-foreground">
                  Rol adı ve açıklamasını giriniz.
                </p>
              </div>
              <Separator className="bg-border/50" />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Form Rolü Adı */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="formRoleName"
                    className="text-sm font-medium tracking-tight"
                  >
                    Form Rolü Adı
                  </Label>
                  <Input
                    id="formRoleName"
                    type="text"
                    value={formRoleName}
                    placeholder="Rol adını giriniz"
                    onChange={(e) => {
                      setFormRoleName(e.target.value);
                      setFormRoleNameError(false);
                    }}
                    className={cn(
                      "rounded-xl transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/50",
                      formRoleNameError && "border-destructive focus-visible:ring-destructive/40",
                    )}
                  />
                  {formRoleNameError && (
                    <p className="text-xs text-destructive" role="alert">
                      Form Rolü Adı boş olamaz
                    </p>
                  )}
                </div>

                {/* Form Rolü Açıklaması */}
                <div className="flex flex-col gap-1.5">
                  <Label
                    htmlFor="formRoleDescription"
                    className="text-sm font-medium tracking-tight"
                  >
                    Form Rolü Açıklaması
                  </Label>
                  <textarea
                    id="formRoleDescription"
                    rows={4}
                    value={formRoleDescription}
                    placeholder="Açıklama giriniz"
                    onChange={(e) => {
                      setFormRoleDescription(e.target.value);
                      setFormRoleDescriptionError(false);
                    }}
                    className={cn(
                      "w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground transition-all duration-200 ease-out",
                      "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/60",
                      formRoleDescriptionError &&
                        "border-destructive focus-visible:ring-destructive/40",
                    )}
                  />
                  {formRoleDescriptionError && (
                    <p className="text-xs text-destructive" role="alert">
                      Form Rolü Açıklaması boş olamaz
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Form Atama (Transfer List) */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Form Atama
                  </h2>
                  {targetError && (
                    <span className="text-xs text-destructive" role="alert">
                      — En az bir form atanmalıdır
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Soldaki listeden sağa taşıyarak form atayabilirsiniz.
                </p>
              </div>
              <Separator className="bg-border/50" />

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_1fr]">
                {/* Source list */}
                <TransferPanel
                  title="Tüm Formlar"
                  items={filteredSource}
                  filter={sourceFilter}
                  onFilterChange={setSourceFilter}
                  onItemClick={moveToTarget}
                  actionIcon={<ArrowRight className="size-3.5" />}
                  actionLabel="Ata"
                  emptyText="Form bulunamadı"
                />

                {/* Middle divider */}
                <div className="hidden items-center justify-center lg:flex">
                  <Separator orientation="vertical" className="h-full bg-border/50" />
                </div>

                {/* Target list */}
                <TransferPanel
                  title="Atanan Formlar"
                  items={filteredTarget}
                  filter={targetFilter}
                  onFilterChange={setTargetFilter}
                  onItemClick={moveToSource}
                  actionIcon={<ArrowLeft className="size-3.5" />}
                  actionLabel="Geri al"
                  emptyText="Henüz form atanmadı"
                  hasError={targetError}
                />
              </div>
            </div>
          </CardContent>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border/50 bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl transition-all duration-200 ease-out"
              onClick={() => navigate("/form-role")}
            >
              İptal
            </Button>
            <Button
              type="button"
              className="rounded-xl transition-all duration-200 ease-out"
              onClick={handleSubmit}
            >
              Kaydet
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/* ─── Transfer Panel ────────────────────────────────────────────────────── */

interface TransferPanelProps {
  title: string;
  items: any[];
  filter: string;
  onFilterChange: (v: string) => void;
  onItemClick: (item: any) => void;
  actionIcon: React.ReactNode;
  actionLabel: string;
  emptyText: string;
  hasError?: boolean;
}

const TransferPanel = ({
  title,
  items,
  filter,
  onFilterChange,
  onItemClick,
  actionIcon,
  actionLabel,
  emptyText,
  hasError = false,
}: TransferPanelProps) => (
  <div
    className={cn(
      "flex h-[420px] flex-col overflow-hidden rounded-xl border bg-card transition-all duration-200",
      hasError ? "border-destructive/60 ring-1 ring-destructive/30" : "border-border/60",
    )}
  >
    {/* Panel header */}
    <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-2.5">
      <span className="text-sm font-semibold tracking-tight text-primary">{title}</span>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        {items.length}
      </span>
    </div>

    {/* Search */}
    <div className="relative border-b border-border/50 px-3 py-2">
      <Search className="pointer-events-none absolute left-5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
      <Input
        type="text"
        value={filter}
        placeholder="İsim veya açıklama ara…"
        onChange={(e) => onFilterChange(e.target.value)}
        className="h-8 rounded-lg pl-7 text-xs focus-visible:ring-1 focus-visible:ring-primary/40"
      />
    </div>

    {/* Item list */}
    <ScrollArea className="min-h-0 flex-1">
      {items.length === 0 ? (
        <div className="flex h-full items-center justify-center py-10">
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-px p-2">
          {items.map((item: any) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                  "transition-all duration-150 ease-out",
                  "hover:bg-primary/6 hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
                aria-label={`${actionLabel}: ${item.formName}`}
              >
                <FolderOpen className="mt-0.5 size-4 shrink-0 text-primary/60 transition-colors group-hover:text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                    {item.formName}
                  </p>
                  {item.formDescription && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.formDescription}
                    </p>
                  )}
                </div>
                <span className="ml-1 mt-0.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                  {actionIcon}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ScrollArea>
  </div>
);

export default FormRoleDetail;
