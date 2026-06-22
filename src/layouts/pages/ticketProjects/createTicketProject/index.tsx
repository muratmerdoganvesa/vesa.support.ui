import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, ChevronDown, X } from "lucide-react";

import {
  UserApi,
  UserAppDto,
  WorkCompanyApi,
  WorkCompanyDto,
  TicketProjectsApi,
  TicketProjectsListDto,
  ProjectCategoriesListDto,
  ProjectCategoriesApi,
  ListModuleDto,
  ModuleApi,
  ProjectTypes,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { projectTypeOptions } from "layouts/pages/ticketProjects/projectTypeHelpers";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";

// ─── Shared trigger style ─────────────────────────────────────────────────────

const searchTriggerCls =
  "flex h-8 w-full items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

// ─── Component ────────────────────────────────────────────────────────────────

function CreateTicketProject() {
  const [companies, setCompanies] = useState<WorkCompanyDto[]>([]);
  const [projects, setProjects] = useState<TicketProjectsListDto[]>([]);
  const [categories, setCategories] = useState<ProjectCategoriesListDto[]>([]);
  const [modules, setModules] = useState<ListModuleDto[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserAppDto[]>([]);
  const [selectionUserIds, setSelectionUserIds] = useState<string[]>([]);
  const [selectedKullanici, setSelectedKullanici] = useState<UserAppDto | undefined>();
  const [selectionKullaniciId, setSelectionKullaniciId] = useState<string | undefined>();
  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const [copyFromAnotherProject, setCopyFromAnotherProject] = useState(false);

  // Popover open states
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState("");
  const [employeesOpen, setEmployeesOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [projectData, setProjectData] = useState<TicketProjectsListDto>({
    name: "",
    description: null,
    isActive: true,
    workCompany: null,
    workCompanyId: null,
    manager: null,
    managerId: null,
    userIds: null,
    projectCategory: null,
    projectCategoryId: null,
    risks: null,
    reportsUrl: null,
    subProjectName: null,
    copiedProjectId: null,
    isUserCopied: null,
    module: null,
    moduleId: null,
    costStatus: null,
    projectPeriod: null,
    projectSupportPeriod: null,
    projectType: null,
  });

  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  // Keep current selections visible even when searchByName is empty
  const managerOptions = useMemo(() => {
    if (!selectedKullanici) return searchByName;
    return [selectedKullanici, ...searchByName.filter((u) => u.id !== selectedKullanici.id)];
  }, [selectedKullanici, searchByName]);

  const employeeOptions = useMemo(
    () => [
      ...selectedUsers,
      ...searchByName.filter((u) => !selectedUsers.some((s) => s.id === u.id)),
    ],
    [selectedUsers, searchByName]
  );

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const handleSearchByName = async (value: string) => {
    if (value === "") { setSearchByName([]); return; }
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new UserApi(conf);
      const data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
      setSearchByName(data.data);
    } catch (error) {
      console.log("error", error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchProjectData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsIdGet(id);
      setProjectData(data.data as any);
      setSelectedKullanici(data.data.manager);
      setSelectionKullaniciId(data.data.managerId);
      setSelectedUsers(data.data.users);
      setSelectionUserIds(data.data.users.map((user: any) => user.id));
    } catch {
      dispatchAlert({ message: "Proje bilgileri getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchCompanyData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WorkCompanyApi(conf);
      const data = await api.apiWorkCompanyGetAssingListGet();
      setCompanies(data.data as any);
    } catch {
      dispatchAlert({ message: "Veriler getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchCategoryData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new ProjectCategoriesApi(conf);
      const data = await api.apiProjectCategoriesGet();
      setCategories(data.data as any);
    } catch {
      dispatchAlert({ message: "Kategori verileri getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchModuleData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new ModuleApi(conf);
      const data = await api.apiModuleGetActiveModulesGet();
      setModules(data.data as any);
    } catch {
      dispatchAlert({ message: "Modül verileri getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchProjectsData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsGetActiveProjectsOnlyNameGet();
      setProjects(data.data as any);
    } catch {
      dispatchAlert({ message: "Projeler getirilirken hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchModuleData();
    fetchCompanyData();
    fetchCategoryData();
    fetchProjectsData();
  }, []);

  useEffect(() => {
    if (id && companies.length > 0) fetchProjectData();
  }, [id, companies]);

  // ─── Submit handlers ────────────────────────────────────────────────────────

  const handleCreateProject = async () => {
    if (projectData.name === "" || projectData.workCompany === null) {
      dispatchAlert({ message: "Proje adı ve müşteri alanları zorunludur.", type: "Error" });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      await api.apiTicketProjectsPost({
        ...projectData,
        manager: selectedKullanici,
        managerId: selectionKullaniciId,
        userIds: selectionUserIds,
      });
      dispatchAlert({ message: "Proje eklendi", type: "Success" });
      navigate("/ticketProjects");
    } catch (error) {
      dispatchAlert({ message: error?.toString(), type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUpdateProject = async () => {
    if (projectData.name === "" || projectData.workCompany === null) {
      dispatchAlert({ message: "Proje adı ve müşteri alanları zorunludur.", type: "Error" });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      await api.apiTicketProjectsPut({
        ...projectData,
        managerId: selectionKullaniciId,
        userIds: selectionUserIds,
        id,
      } as any);
      dispatchAlert({ message: "Proje güncellendi", type: "Success" });
      navigate("/ticketProjects");
    } catch (error) {
      dispatchAlert({ message: error?.toString(), type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const handleRemoveEmployee = (userId: string) => {
    const newUsers = selectedUsers.filter((u) => u.id !== userId);
    setSelectedUsers(newUsers);
    setSelectionUserIds(newUsers.map((u) => u.id));
  };

  const handleToggleEmployee = (user: UserAppDto) => {
    const isSelected = selectionUserIds.includes(user.id);
    if (isSelected) {
      handleRemoveEmployee(user.id);
    } else {
      setSelectedUsers((prev) => [...prev, user]);
      setSelectionUserIds((prev) => [...prev, user.id]);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-3 rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="p-6">

          {/* ── Header ──────────────────────────────────────────────── */}
          <h4 className="mb-6 text-2xl font-bold text-foreground">
            {id ? "Proje Düzenle" : "Proje Oluştur"}
          </h4>

          {/* ── Two-column form grid ─────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">

            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Proje Tanımı */}
              <div className="space-y-1.5">
                <Label htmlFor="project-name">Proje Tanımı</Label>
                <Input
                  id="project-name"
                  type="text"
                  placeholder="Proje tanımı giriniz"
                  value={projectData?.name || ""}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                />
              </div>

              {/* Müşteri */}
              <div className="space-y-1.5">
                <Label>Müşteri</Label>
                <Select
                  value={projectData.workCompanyId ?? ""}
                  onValueChange={(value) => {
                    const company = companies.find((c) => c.id === value) ?? null;
                    setProjectData({ ...projectData, workCompanyId: value || null, workCompany: company });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Müşteri seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select
                  value={projectData.projectCategoryId ?? ""}
                  onValueChange={(value) => {
                    const cat = categories.find((c) => c.id === value) ?? null;
                    setProjectData({ ...projectData, projectCategoryId: value || null, projectCategory: cat });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kategori seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proje Sorumlusu — single user search (Popover + Command) */}
              <div className="space-y-1.5">
                <Label>Proje Sorumlusu</Label>
                <Popover
                  open={managerOpen}
                  onOpenChange={(open) => {
                    setManagerOpen(open);
                    if (!open) { setManagerSearch(""); setSearchByName([]); }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button type="button" aria-expanded={managerOpen} className={searchTriggerCls}>
                      {selectedKullanici ? (
                        <span className="flex items-center gap-2 truncate">
                          <img
                            className="size-6 shrink-0 rounded-full object-cover"
                            src={`data:image/png;base64,${selectedKullanici.photo}`}
                            alt={selectedKullanici.firstName}
                          />
                          <span className="truncate">
                            {selectedKullanici.firstName} {selectedKullanici.lastName}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("ns1:DepartmentPage.DepartmentDetail.IsimAratin")}
                        </span>
                      )}
                      <span className="flex shrink-0 items-center gap-0.5">
                        {selectedKullanici && (
                          <span
                            role="button"
                            tabIndex={0}
                            aria-label="Temizle"
                            className="rounded p-0.5 hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKullanici(undefined);
                              setSelectionKullaniciId(undefined);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                setSelectedKullanici(undefined);
                                setSelectionKullaniciId(undefined);
                              }
                            }}
                          >
                            <X className="size-3 text-muted-foreground" />
                          </span>
                        )}
                        <ChevronDown className="size-4 text-muted-foreground" />
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={t("ns1:DepartmentPage.DepartmentDetail.IsimAratin")}
                        value={managerSearch}
                        onValueChange={(v) => { setManagerSearch(v); handleSearchByName(v); }}
                      />
                      <CommandList>
                        <CommandEmpty>Kullanıcı bulunamadı</CommandEmpty>
                        <CommandGroup>
                          {managerOptions.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              data-checked={selectionKullaniciId === user.id}
                              onSelect={() => {
                                setSelectedKullanici(user);
                                setSelectionKullaniciId(user.id);
                                setManagerOpen(false);
                                setManagerSearch("");
                                setSearchByName([]);
                              }}
                            >
                              <img
                                className="size-8 shrink-0 rounded-full object-cover"
                                src={`data:image/png;base64,${user.photo}`}
                                alt={user.firstName}
                              />
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Proje Çalışanları — multi user search (Popover + Command) */}
              <div className="space-y-1.5">
                <Label>Proje Çalışanları</Label>
                <Popover
                  open={employeesOpen}
                  onOpenChange={(open) => {
                    setEmployeesOpen(open);
                    if (!open) { setEmployeeSearch(""); setSearchByName([]); }
                  }}
                >
                  <PopoverTrigger asChild>
                    {/* Chips trigger */}
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={employeesOpen}
                      aria-label="Proje çalışanları seç"
                      className="flex min-h-8 w-full flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors hover:bg-muted/50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer"
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setEmployeesOpen(true); }}
                    >
                      {selectedUsers.length === 0 ? (
                        <span className="text-muted-foreground">
                          {t("ns1:DepartmentPage.DepartmentDetail.IsimAratin")}
                        </span>
                      ) : (
                        selectedUsers.map((user) => (
                          <span
                            key={user.id}
                            className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium"
                          >
                            {user.firstName} {user.lastName}
                            <button
                              type="button"
                              aria-label={`${user.firstName} ${user.lastName} kaldır`}
                              className="rounded hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleRemoveEmployee(user.id); }}
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        ))
                      )}
                      <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={t("ns1:DepartmentPage.DepartmentDetail.IsimAratin")}
                        value={employeeSearch}
                        onValueChange={(v) => { setEmployeeSearch(v); handleSearchByName(v); }}
                      />
                      <CommandList>
                        <CommandEmpty>Kullanıcı bulunamadı</CommandEmpty>
                        <CommandGroup>
                          {employeeOptions.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.id}
                              data-checked={selectionUserIds.includes(user.id)}
                              onSelect={() => handleToggleEmployee(user)}
                            >
                              <img
                                className="size-8 shrink-0 rounded-full object-cover"
                                src={`data:image/png;base64,${user.photo}`}
                                alt={user.firstName}
                              />
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Modül */}
              <div className="space-y-1.5">
                <Label>Modül</Label>
                <Select
                  value={projectData.moduleId ?? ""}
                  onValueChange={(value) => {
                    const mod = modules.find((m) => m.id === value) ?? null;
                    setProjectData({ ...projectData, moduleId: value || null, module: mod });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Modül seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Masraf Durumu */}
              <div className="space-y-1.5">
                <Label htmlFor="cost-status">Masraf Durumu</Label>
                <Input
                  id="cost-status"
                  type="text"
                  placeholder="Masraf durumu giriniz"
                  value={projectData?.costStatus || ""}
                  onChange={(e) => setProjectData({ ...projectData, costStatus: e.target.value })}
                />
              </div>
            </div>

            {/* ── RIGHT COLUMN ────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Proje Alt Tanımı */}
              <div className="space-y-1.5">
                <Label htmlFor="sub-project">Proje Alt Tanımı</Label>
                <Input
                  id="sub-project"
                  type="text"
                  placeholder="Proje alt tanımı giriniz"
                  value={projectData?.subProjectName || ""}
                  onChange={(e) => setProjectData({ ...projectData, subProjectName: e.target.value })}
                />
              </div>

              {/* Açıklama */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Açıklama</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Açıklama giriniz"
                  value={projectData?.description || ""}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                />
              </div>

              {/* Riskler */}
              <div className="space-y-1.5">
                <Label htmlFor="risks">Riskler</Label>
                <Input
                  id="risks"
                  type="text"
                  placeholder="Riskleri giriniz"
                  value={projectData?.risks || ""}
                  onChange={(e) => setProjectData({ ...projectData, risks: e.target.value })}
                />
              </div>

              {/* Kaynak Ve Raporlar */}
              <div className="space-y-1.5">
                <Label htmlFor="reports-url">Kaynak Ve Raporlar</Label>
                <Input
                  id="reports-url"
                  type="text"
                  placeholder="URL giriniz"
                  value={projectData?.reportsUrl || ""}
                  onChange={(e) => setProjectData({ ...projectData, reportsUrl: e.target.value })}
                />
              </div>

              {/* Durum */}
              <div className="space-y-1.5">
                <Label>Aktif/Pasif</Label>
                <Select
                  value={projectData?.isActive ? "Aktif" : "Pasif"}
                  onValueChange={(value) => setProjectData({ ...projectData, isActive: value === "Aktif" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Pasif">Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Proje Tipi */}
              <div className="space-y-1.5">
                <Label>Proje Durumu</Label>
                <Select
                  value={projectData.projectType != null ? String(projectData.projectType) : ""}
                  onValueChange={(value) =>
                    setProjectData({
                      ...projectData,
                      projectType: value === "" ? null : (Number(value) as ProjectTypes),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Proje Durumu Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Proje Süresi */}
              <div className="space-y-1.5">
                <Label htmlFor="project-period">Proje Süresi</Label>
                <Input
                  id="project-period"
                  type="text"
                  placeholder="Proje süresini giriniz"
                  value={projectData?.projectPeriod || ""}
                  onChange={(e) => setProjectData({ ...projectData, projectPeriod: e.target.value })}
                />
              </div>

              {/* Proje Destek Süresi */}
              <div className="space-y-1.5">
                <Label htmlFor="support-period">Proje Destek Süresi</Label>
                <Input
                  id="support-period"
                  type="text"
                  placeholder="Destek süresini giriniz"
                  value={projectData?.projectSupportPeriod || ""}
                  onChange={(e) => setProjectData({ ...projectData, projectSupportPeriod: e.target.value })}
                />
              </div>

              {/* Copy from another project (only for new projects) */}
              {!id && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="copy-project"
                      checked={copyFromAnotherProject}
                      onCheckedChange={(checked) => setCopyFromAnotherProject(checked === true)}
                    />
                    <Label htmlFor="copy-project" className="cursor-pointer font-normal">
                      Proje görevlerini başka bir projeden kopyalamak istiyorum
                    </Label>
                  </div>

                  {copyFromAnotherProject && (
                    <div className="space-y-4 pl-6">
                      <div className="space-y-1.5">
                        <Label>Kaynak Proje</Label>
                        <Select
                          value={projectData.copiedProjectId ?? ""}
                          onValueChange={(value) =>
                            setProjectData({ ...projectData, copiedProjectId: value || null })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Görevlerini kopyalamak istediğiniz projeyi seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name} - {p.subProjectName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="copy-users"
                          checked={projectData.isUserCopied ?? false}
                          onCheckedChange={(checked) =>
                            setProjectData({ ...projectData, isUserCopied: checked === true })
                          }
                        />
                        <Label htmlFor="copy-users" className="cursor-pointer font-normal">
                          Görev çalışanlarını da kopyala.
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Action buttons ───────────────────────────────────────── */}
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-border pt-6">
            <Button variant="outline" onClick={() => navigate("/ticketProjects")}>
              İptal
            </Button>
            <Button
              className="bg-linear-to-tr from-cyan-400 to-blue-500 text-white shadow-md hover:opacity-90"
              onClick={id ? handleUpdateProject : handleCreateProject}
            >
              {id ? "Güncelle" : "Kaydet"}
            </Button>
            {id && projectData.isActive && (
              <Button
                variant="secondary"
                disabled={!projectData.isActive || !projectData.managerId}
                onClick={() =>
                  navigate("/projectmanagement", {
                    state: {
                      projectId: projectData.id,
                      workCompany: projectData.workCompany,
                      showTest: true,
                    },
                  })
                }
              >
                Proje Yönetimine Git
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default CreateTicketProject;
