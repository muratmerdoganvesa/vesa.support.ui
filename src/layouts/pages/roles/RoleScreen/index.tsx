import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import React, { useEffect, useMemo, useState } from "react";
import { MenuApi, MenuListDto, RoleMenuApi } from "api/generated";
import getConfiguration from "confiuration";
import Footer from "examples/Footer";
import { AppAlertType, useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AppWindow,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
} from "lucide-react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import { Checkbox } from "components/ui/checkbox";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { cn } from "lib/utils";

function RoleScreenDefination() {
  const [source, setSource] = useState<MenuListDto[]>([]);
  const [target, setTarget] = useState<MenuListDto[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleNameError, setRoleNameError] = useState(false);
  const [roleDescriptionError, setRoleDescriptionError] = useState(false);
  const [targetError, setTargetError] = useState(false);
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [sourceFilter, setSourceFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [sourceSelection, setSourceSelection] = useState<Set<string>>(new Set());
  const [targetSelection, setTargetSelection] = useState<Set<string>>(new Set());

  const itemKey = (item: MenuListDto) => String(item.id);

  const filteredSource = useMemo(() => {
    const q = sourceFilter.trim().toLowerCase();
    if (!q) {
      return source;
    }
    return source.filter((item) => {
      const name = String(item.name ?? "").toLowerCase();
      const code = String(item.menuCode ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [source, sourceFilter]);

  const filteredTarget = useMemo(() => {
    const q = targetFilter.trim().toLowerCase();
    if (!q) {
      return target;
    }
    return target.filter((item) => {
      const name = String(item.name ?? "").toLowerCase();
      const code = String(item.menuCode ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [target, targetFilter]);

  const fetchData = async () => {
    try {
      var conf = getConfiguration();
      var api = new MenuApi(conf);
      var response = await api.apiMenuAllListDataGet();
      var data = response.data;
      const filteredData = data.filter((item: MenuListDto) => item.parentMenuId !== null);

      if (id) {
        dispatchBusy({ isBusy: true });
        var apiRole = new RoleMenuApi(conf);
        var dataRole = await apiRole.apiRoleMenuGetByIdRoleIdGet(id);
        console.log("dataRole", dataRole.data);

        // Get the selected menus for target
        const selectedMenus = filteredData.filter((item: MenuListDto) =>
          dataRole.data.menuPermissions.some(
            (roleItem: { menuId?: string }) => roleItem.menuId === item.id
          )
        );

        setSource(filteredData.filter((item) => !selectedMenus.includes(item)));
        setTarget(selectedMenus);
        setRoleName(dataRole.data.roleName);
        setRoleDescription(dataRole.data.description);
      } else {
        setSource(filteredData);
      }
    } catch (error) {
      dispatchAlert({
        message: t("ns1:RolePage.RoleScreen.HataOlustu"),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    let hasError = false;

    if (!roleName.trim()) {
      setRoleNameError(true);
      hasError = true;
    } else {
      setRoleNameError(false);
    }

    if (!roleDescription.trim()) {
      setRoleDescriptionError(true);
      hasError = true;
    } else {
      setRoleDescriptionError(false);
    }

    if (target.length === 0) {
      setTargetError(true);
      hasError = true;
    } else {
      setTargetError(false);
    }

    if (hasError) {
      return;
    }
    // Continue with save logic
    if (id) {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new RoleMenuApi(conf);
        await api.apiRoleMenuPut({
          roleId: id,
          roleName: roleName,
          description: roleDescription,
          menuPermissions: target?.map((item: MenuListDto) => {
            return {
              menuId: item.id,
              canView: true,
              canAdd: true,
              canEdit: true,
              canDelete: true,
            };
          }),
        });
        dispatchAlert({
          message: t("ns1:RolePage.RoleScreen.RolOlusturuldu"),
          type: AppAlertType.Success,
        });
      } catch (error) {
        dispatchAlert({
          message: t("ns1:RolePage.RoleScreen.HataOlustu"),
          type: AppAlertType.Error,
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    } else {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new RoleMenuApi(conf);
        await api.apiRoleMenuPost({
          roleName: roleName,
          description: roleDescription,
          menuPermissions: target?.map((item: MenuListDto) => {
            return {
              menuId: item.id,
              canView: true,
              canAdd: true,
              canEdit: true,
              canDelete: true,
            };
          }),
        });

        dispatchAlert({
          message: t("ns1:RolePage.RoleScreen.RolOlusturuldu"),
          type: AppAlertType.Success,
        });
      } catch (error) {
        dispatchAlert({ message: `${error}`, type: AppAlertType.Error });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
    navigate("/roles");
  };

  const onChange = (event: any) => {
    setSource(event.source);
    setTarget(event.target);
  };

  const handleMoveToTarget = () => {
    const ids = new Set(sourceSelection);
    if (ids.size === 0) {
      return;
    }
    const toMove = source.filter((x) => ids.has(itemKey(x)));
    const newSource = source.filter((x) => !ids.has(itemKey(x)));
    const newTarget = [...target, ...toMove];
    onChange({ source: newSource, target: newTarget });
    setSourceSelection(new Set());
    setTargetError(false);
  };

  const handleMoveToSource = () => {
    const ids = new Set(targetSelection);
    if (ids.size === 0) {
      return;
    }
    const toMove = target.filter((x) => ids.has(itemKey(x)));
    const newTarget = target.filter((x) => !ids.has(itemKey(x)));
    const newSource = [...source, ...toMove];
    onChange({ source: newSource, target: newTarget });
    setTargetSelection(new Set());
    setTargetError(false);
  };

  const toggleSourceSelection = (item: MenuListDto, checked: boolean) => {
    const key = itemKey(item);
    setSourceSelection((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const toggleTargetSelection = (item: MenuListDto, checked: boolean) => {
    const key = itemKey(item);
    setTargetSelection((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const itemTemplate = (item: MenuListDto) => {
    return (
      <div className="flex w-full min-w-0 flex-1 items-start gap-3">
        <AppWindow className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-snug font-semibold">{item.name}</div>
          <div className="text-xs text-muted-foreground">{item.menuCode}</div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="w-full max-w-full px-4 pb-8 pt-2 md:px-6">
        <Card className="border shadow-sm ring-1 ring-border/60">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {t("ns1:RolePage.RoleScreen.RolTanimlama")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="role-name">{t("ns1:RolePage.RoleScreen.RolAdi")}</Label>
                <Input
                  id="role-name"
                  type="text"
                  value={roleName}
                  onChange={(e) => {
                    setRoleName(e.target.value);
                    setRoleNameError(false);
                  }}
                  className={cn("h-9 text-sm", roleNameError && "border-destructive")}
                  aria-invalid={roleNameError}
                  aria-describedby={roleNameError ? "role-name-error" : undefined}
                  autoComplete="off"
                />
                {roleNameError ? (
                  <p id="role-name-error" className="text-sm text-destructive" role="alert">
                    {t("ns1:RolePage.RoleScreen.RolAdiError")}
                  </p>
                ) : null}
              </div>
              <div className="md:col-span-2">
                <div className="space-y-2">
                  <Label htmlFor="role-desc">{t("ns1:RolePage.RoleScreen.RolAciklamasi")}</Label>
                  <Textarea
                    id="role-desc"
                    rows={4}
                    value={roleDescription}
                    onChange={(e) => {
                      setRoleDescription(e.target.value);
                      setRoleDescriptionError(false);
                    }}
                    className={cn("min-h-[100px] text-sm", roleDescriptionError && "border-destructive")}
                    aria-invalid={roleDescriptionError}
                    aria-describedby={roleDescriptionError ? "role-desc-error" : undefined}
                  />
                  {roleDescriptionError ? (
                    <p id="role-desc-error" className="text-sm text-destructive" role="alert">
                      {t("ns1:RolePage.RoleScreen.RolAciklamasiError")}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-3">
                {/* Source column */}
                <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card shadow-sm">
                  <div className="border-b border-border bg-muted/40 px-3 py-2">
                    <h3 className="text-sm font-semibold text-primary">
                      {t("ns1:RolePage.RoleScreen.TumUygulamalar")}
                    </h3>
                  </div>
                  <div className="border-b border-border p-2">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        type="search"
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        placeholder={t("ns1:RolePage.RoleScreen.IsimKodAra")}
                        className="h-9 w-full bg-background pl-8 text-sm"
                        aria-label={t("ns1:RolePage.RoleScreen.TumUygulamalar")}
                      />
                    </div>
                  </div>
                  <div
                    className="max-h-96 min-h-96 flex-1 divide-y divide-border overflow-y-auto p-2"
                    role="listbox"
                    aria-multiselectable
                    aria-label={t("ns1:RolePage.RoleScreen.TumUygulamalar")}
                  >
                    {filteredSource.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {source.length === 0
                          ? "Gösterilecek menü yok."
                          : "Filtreyle eşleşen kayıt bulunamadı."}
                      </p>
                    ) : (
                      filteredSource.map((item) => {
                        const key = itemKey(item);
                        const checked = sourceSelection.has(key);
                        return (
                          <label
                            key={key}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors",
                              "hover:bg-muted/60",
                              checked && "bg-muted/80"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) =>
                                toggleSourceSelection(item, c === true)
                              }
                              aria-label={String(item.name)}
                              className="mt-1"
                            />
                            {itemTemplate(item)}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Transfer controls */}
                <div className="flex flex-row items-center justify-center gap-2 lg:flex-col lg:justify-center lg:px-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleMoveToTarget}
                    disabled={sourceSelection.size === 0}
                    aria-label="Seçilenleri ata"
                  >
                    <ChevronRight className="size-5" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    onClick={handleMoveToSource}
                    disabled={targetSelection.size === 0}
                    aria-label="Seçilenleri geri al"
                  >
                    <ChevronLeft className="size-5" aria-hidden />
                  </Button>
                </div>

                {/* Target column */}
                <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card shadow-sm">
                  <div className="border-b border-border bg-muted/40 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-primary">
                        {t("ns1:RolePage.RoleScreen.AtananUygulamalar")}
                      </h3>
                      {targetError ? (
                        <span className="text-xs font-medium text-destructive">
                          {t("ns1:RolePage.RoleScreen.UygulamaAtanmaliError")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="border-b border-border p-2">
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                      <Input
                        type="search"
                        value={targetFilter}
                        onChange={(e) => setTargetFilter(e.target.value)}
                        placeholder={t("ns1:RolePage.RoleScreen.IsimKodAra")}
                        className="h-9 w-full bg-background pl-8 text-sm"
                        aria-label={t("ns1:RolePage.RoleScreen.AtananUygulamalar")}
                      />
                    </div>
                  </div>
                  <div
                    className="max-h-96 min-h-96 flex-1 divide-y divide-border overflow-y-auto p-2"
                    role="listbox"
                    aria-multiselectable
                    aria-label={t("ns1:RolePage.RoleScreen.AtananUygulamalar")}
                  >
                    {filteredTarget.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        {target.length === 0
                          ? "Henüz atanan uygulama yok. Soldan seçip sağ ok ile ekleyin."
                          : "Filtreyle eşleşen kayıt bulunamadı."}
                      </p>
                    ) : (
                      filteredTarget.map((item) => {
                        const key = itemKey(item);
                        const checked = targetSelection.has(key);
                        return (
                          <label
                            key={key}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-md p-2 transition-colors",
                              "hover:bg-muted/60",
                              checked && "bg-muted/80"
                            )}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) =>
                                toggleTargetSelection(item, c === true)
                              }
                              aria-label={String(item.name)}
                              className="mt-1"
                            />
                            {itemTemplate(item)}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col-reverse gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-end sm:gap-2">
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => navigate("/roles")}
            >
              {t("ns1:RolePage.RoleScreen.Iptal")}
            </Button>
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              onClick={() => handleSave()}
            >
              <Save className="size-4" aria-hidden />
              {t("ns1:RolePage.RoleScreen.Kaydet")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      
    </DashboardLayout>
  );
}

export default RoleScreenDefination;
