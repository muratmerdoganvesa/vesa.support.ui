import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Save, LayoutList, Hash, Link2, AlignLeft,
  Layers, Eye, ShieldCheck, X, ChevronDown,
} from "lucide-react";

import getConfiguration from "confiuration";
import { IdentityRole, MenuApi, MenuListDto, RoleMenuApi } from "api/generated";
import { useBusy } from "../hooks/useBusy";
import { useAlert } from "../hooks/useAlert";
import { useTranslation } from "react-i18next";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import { Badge } from "components/ui/badge";
import { Textarea } from "components/ui/textarea";
import { Separator } from "components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "components/ui/select";
import { cn } from "lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  parentCode: string;
  code: string;
  name: string;
  description: string;
  href: string;
  order: number;
  isActive: boolean;
  icon: string;
  showMenu: boolean;
}

const EMPTY_FORM: FormData = {
  parentCode: "", code: "", name: "", description: "",
  href: "", order: 0, isActive: false, icon: "", showMenu: false,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FieldGroup({
  icon: Icon, label, required, children, hint,
}: {
  icon?: React.ElementType;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" />}
        {label}
        {required && <span className="text-rose-400 text-[10px] normal-case font-normal tracking-normal">zorunlu</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 leading-snug">{hint}</p>}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-100">
      <div className="px-6 py-4 border-b border-slate-50 rounded-t-2xl">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// Role tag chip
function RoleChip({ name, onRemove }: { name: string; onRemove: () => void }) {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 bg-indigo-50 border-indigo-100 text-indigo-700 text-xs py-1 pl-2.5 pr-1.5 font-medium"
    >
      {name}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-sm text-indigo-400 hover:text-indigo-700 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Searchable combobox for parent menu (native but styled)
// ---------------------------------------------------------------------------

function ParentMenuSelect({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: MenuListDto[];
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selected = options.find(o => o.id === value);
  const filtered = options.filter(o =>
    !search || o.name?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "h-9 w-full flex items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none",
          "hover:border-indigo-300 focus-visible:border-indigo-400 focus-visible:ring-3 focus-visible:ring-indigo-100",
          open && "border-indigo-400 ring-3 ring-indigo-100"
        )}
      >
        <span className={selected ? "text-slate-800" : "text-slate-400"}>
          {selected?.name || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-100 bg-white shadow-lg shadow-slate-100 overflow-hidden">
          <div className="p-2 border-b border-slate-50">
            <Input
              autoFocus
              className="h-7 text-xs"
              placeholder="Ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 transition-colors"
              onClick={() => { onChange(""); setOpen(false); setSearch(""); }}
            >
              — Üst menü yok
            </button>
            {filtered.map(o => (
              <button
                key={o.id}
                type="button"
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm transition-colors",
                  o.id === value
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                )}
                onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
              >
                {o.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center py-4 text-xs text-slate-400">Sonuç bulunamadı</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const MenuDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const menuItemId = new URLSearchParams(location.search).get("id");

  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const { t } = useTranslation();

  const isEdit = !!id;

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [parentMenu, setParentMenu] = useState<MenuListDto[]>([]);
  const [roles, setRoles] = useState<IdentityRole[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<IdentityRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Data fetching ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchParentMenu = async () => {
      try {
        const api = new MenuApi(getConfiguration());
        const { data } = await api.apiMenuRootMenusListGet();
        setParentMenu(data as MenuListDto[]);
      } catch {
        dispatchAlert({ message: "Üst menü listesi yüklenirken hata oluştu", type: "Error" });
      }
    };
    fetchParentMenu();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const api = new MenuApi(getConfiguration());
        const { data } = await api.apiMenuIdGet(id);
        setFormData({
          parentCode: data.parentMenuId || "",
          code: data.menuCode || "",
          name: data.name || "",
          description: data.description || "",
          href: data.href || "",
          order: data.order || 0,
          isActive: data.isActive ?? false,
          icon: data.icon || "",
          showMenu: data.showMenu ?? false,
        });
      } catch {
        dispatchAlert({ message: "Menü yüklenirken hata oluştu", type: "Error" });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchDetail();
  }, [id]);

  // Rol listesi — showMenu true olduğunda otomatik yüklenir (edit modunda da dahil)
  useEffect(() => {
    if (!formData.showMenu || rolesLoaded) return;
    let cancelled = false;
    const fetchRoles = async () => {
      try {
        const api = new RoleMenuApi(getConfiguration());
        const { data } = await api.apiRoleMenuAllOnlyHeadGet();
        if (!cancelled) {
          setRoles(data as any);
          setRolesLoaded(true);
        }
      } catch {
        dispatchAlert({ message: "Roller yüklenirken hata oluştu", type: "Error" });
      }
    };
    fetchRoles();
    return () => { cancelled = true; };
  }, [formData.showMenu, rolesLoaded]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (formData.icon && formData.parentCode) {
      dispatchAlert({ message: t("ns1:MenuPage.MenuDetail.AltMenuIkonHata"), type: "Error" });
      return false;
    }
    if (!formData.code || !formData.name || !formData.description) {
      dispatchAlert({ message: t("ns1:MenuPage.MenuDetail.TumAlanlariDoldurun"), type: "Error" });
      return false;
    }
    if (formData.order == null) {
      dispatchAlert({ message: t("ns1:MenuPage.MenuDetail.SiraNoSayisal"), type: "Error" });
      return false;
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setSaving(true);
      const api = new MenuApi(getConfiguration());
      const payload = {
        menuCode: formData.code,
        name: formData.name,
        parentMenuId: formData.parentCode || null,
        href: formData.href,
        description: formData.description,
        order: formData.order,
        isActive: formData.isActive,
        icon: formData.icon,
        showMenu: formData.showMenu,
      };
      if (isEdit) {
        await api.apiMenuPut({ id, ...payload });
        dispatchAlert({ message: t("ns1:MenuPage.MenuDetail.MenuGuncellendi"), type: "Success" });
      } else {
        await api.apiMenuPost(payload);
        dispatchAlert({ message: t("ns1:MenuPage.MenuDetail.MenuEklendi"), type: "Success" });
      }
      navigate("/menus");
    } catch {
      dispatchAlert({ message: "Kaydetme sırasında hata oluştu", type: "Error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (field: keyof FormData, value: FormData[keyof FormData]) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <form onSubmit={handleSubmit} className="min-h-[calc(100vh-160px)] pb-6">

        {/* ── Page Header ── */}
        <div className="px-1 pt-6 pb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl shrink-0"
              onClick={() => navigate("/menus")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                  {isEdit
                    ? t("ns1:MenuPage.MenuDetail.MenuDetayi")
                    : t("ns1:MenuPage.MenuDetail.MenuEkle")}
                </h1>
                {isEdit && (
                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px] font-semibold uppercase tracking-wide">
                    Düzenleniyor
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isEdit
                  ? "Menü bilgilerini güncelleyin ve kaydedin"
                  : "Yeni bir menü öğesi tanımlayın"}
              </p>
            </div>
          </div>

          {/* Top action bar — desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 text-sm"
              onClick={() => navigate("/menus")}
            >
              {t("ns1:MenuPage.MenuDetail.Iptal")}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200/60 text-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px"
            >
              <Save className="h-4 w-4" />
              {saving ? "Kaydediliyor…" : t("ns1:MenuPage.MenuDetail.Kaydet")}
            </Button>
          </div>
        </div>

        {/* ── Form Body ── */}
        <div className="px-1 grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left col — main fields */}
          <div className="xl:col-span-2 space-y-6">
            <SectionCard title="Temel Bilgiler">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <FieldGroup icon={LayoutList} label={t("ns1:MenuPage.MenuDetail.MenuAdi")} required>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="Örn: Kullanıcı Yönetimi"
                    className="h-9 focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                  />
                </FieldGroup>

                <FieldGroup icon={Hash} label={t("ns1:MenuPage.MenuDetail.MenuKodu")} required hint="Maks. 5 karakter">
                  <Input
                    name="code"
                    value={formData.code}
                    onChange={e => set("code", e.target.value.slice(0, 5).toUpperCase())}
                    placeholder="MNKOD"
                    className="h-9 font-mono focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                    maxLength={5}
                  />
                </FieldGroup>

                <FieldGroup icon={Link2} label={t("ns1:MenuPage.MenuDetail.HedefAdres")}>
                  <Input
                    name="href"
                    value={formData.href}
                    onChange={e => set("href", e.target.value)}
                    placeholder="/kullanici-yonetimi"
                    className="h-9 font-mono text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                  />
                </FieldGroup>

                <FieldGroup label={t("ns1:MenuPage.MenuDetail.SiraNo")}>
                  <Input
                    name="order"
                    type="number"
                    value={formData.order}
                    onChange={e => set("order", e.target.value === "" ? 0 : parseInt(e.target.value))}
                    min={0}
                    className="h-9 focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                  />
                </FieldGroup>

                <FieldGroup label={t("ns1:MenuPage.MenuDetail.MenuIkonu")} hint="Material Icon veya Lucide icon adı">
                  <Input
                    name="icon"
                    value={formData.icon}
                    onChange={e => set("icon", e.target.value)}
                    placeholder="settings"
                    className="h-9 font-mono text-sm focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                  />
                </FieldGroup>

                <FieldGroup label={t("ns1:MenuPage.MenuDetail.Durum")}>
                  <Select
                    value={formData.isActive ? "active" : "passive"}
                    onValueChange={v => set("isActive", v === "active")}
                  >
                    <SelectTrigger className="w-full h-9 focus-visible:border-indigo-400 focus-visible:ring-indigo-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                          {t("ns1:MenuPage.MenuDetail.Aktif")}
                        </span>
                      </SelectItem>
                      <SelectItem value="passive">
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 inline-block" />
                          {t("ns1:MenuPage.MenuDetail.Pasif")}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>

              </div>
            </SectionCard>

            <SectionCard title="Açıklama">
              <FieldGroup icon={AlignLeft} label={t("ns1:MenuPage.MenuDetail.Aciklama")} required>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={e => set("description", e.target.value)}
                  placeholder="Bu menü öğesinin ne işe yaradığını açıklayın…"
                  rows={5}
                  className="resize-none focus-visible:border-indigo-400 focus-visible:ring-indigo-100 text-sm"
                />
              </FieldGroup>
            </SectionCard>
          </div>

          {/* Right col — settings */}
          <div className="space-y-6">
            <SectionCard title="Hiyerarşi">
              <FieldGroup icon={Layers} label={t("ns1:MenuPage.MenuDetail.UstEkranKodu")} hint="Boş bırakılırsa kök menü olur">
                <ParentMenuSelect
                  options={parentMenu.filter(o => o.id !== id)}
                  value={formData.parentCode}
                  onChange={v => set("parentCode", v)}
                  placeholder={t("ns1:MenuPage.MenuDetail.SecimYapiniz")}
                />
              </FieldGroup>
            </SectionCard>

            <SectionCard title="Görünürlük">
              <div className="space-y-5">

                {/* Show in menu toggle */}
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                    formData.showMenu
                      ? "border-indigo-200 bg-indigo-50/50"
                      : "border-slate-100 bg-slate-50/40"
                  )}
                >
                  <Checkbox
                    id="showMenu"
                    checked={formData.showMenu}
                    onCheckedChange={(checked) => {
                      set("showMenu", !!checked);
                    }}
                    className="mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                  <div className="flex flex-col gap-1 select-none pointer-events-none">
                    <span className="text-sm font-medium text-slate-700 leading-none">
                      <Eye className="inline h-3.5 w-3.5 mr-1.5 text-indigo-500 -mt-px" />
                      {t("ns1:MenuPage.MenuDetail.MenudeGoster")}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Bu menüyü navigasyonda göster
                    </p>
                  </div>
                </div>

                {/* Roles (conditional) */}
                {formData.showMenu && (
                  <div className="space-y-3">
                    <FieldGroup icon={ShieldCheck} label={t("ns1:MenuPage.MenuDetail.RolGoruntulemeYetkisi")}>
                      <Select
                        onValueChange={val => {
                          const role = roles.find(r => r.id === val);
                          if (role && !selectedRoles.find(r => r.id === val)) {
                            setSelectedRoles(prev => [...prev, role]);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full h-9 focus-visible:border-indigo-400 focus-visible:ring-indigo-100">
                          <SelectValue placeholder={t("ns1:MenuPage.MenuDetail.RolSeciniz")} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem
                              key={role.id}
                              value={role.id}
                              disabled={!!selectedRoles.find(r => r.id === role.id)}
                            >
                              {role.name}
                            </SelectItem>
                          ))}
                          {roles.length === 0 && (
                            <div className="py-3 text-center text-xs text-slate-400">Yükleniyor…</div>
                          )}
                        </SelectContent>
                      </Select>
                    </FieldGroup>

                    {selectedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRoles.map(role => (
                          <RoleChip
                            key={role.id}
                            name={role.name}
                            onRemove={() => setSelectedRoles(prev => prev.filter(r => r.id !== role.id))}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ── Mobile action bar ── */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-t border-slate-100 px-4 py-3 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl border-slate-200 text-slate-600"
            onClick={() => navigate("/menus")}
          >
            {t("ns1:MenuPage.MenuDetail.Iptal")}
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor…" : t("ns1:MenuPage.MenuDetail.Kaydet")}
          </Button>
        </div>

      </form>

      
    </DashboardLayout>
  );
};

export default MenuDetail;
