import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert, AppAlertType as MessageBoxType } from "layouts/pages/hooks/useAlert";

import getConfiguration from "confiuration";
import { useNavigate, useParams } from "react-router-dom";
import {
  WorkCompanyApi,
  WorkCompanyDto,
  WorkCompanySystemInfoApi,
  WorkCompanySystemInfoListDto,
} from "api/generated";
import { useTranslation } from "react-i18next";
import { Building2, ChevronDown, Factory } from "lucide-react";

function WorkCompanySystemCE() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [companySystemData, setCompanySystemData] = useState<WorkCompanySystemInfoListDto>({
    id: "",
    name: "",
    workCompany: {
      id: "",
      name: "",
    },
    workCompanyId: "",
  });

  const [workCompanyList, setWorkCompanyList] = useState<WorkCompanyDto[]>([]);
  const { id } = useParams();

  const fetchWorkCompanyList = useCallback(
    async (options?: { showBusy?: boolean }) => {
      const showBusy = options?.showBusy ?? true;
      try {
        if (showBusy) dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new WorkCompanyApi(conf);
        const response = await api.apiWorkCompanyGet();
        const list = response.data;
        setWorkCompanyList(Array.isArray(list) ? list : []);
      } catch (error) {
        dispatchAlert({
          message: t("ns1:CompanySystemPage.SystemDetail.SirketListesiHata"),
          type: "Error",
        });
      } finally {
        if (showBusy) dispatchBusy({ isBusy: false });
      }
    },
    [dispatchAlert, dispatchBusy, t],
  );

  const fetchWorkCompanySystemInfo = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WorkCompanySystemInfoApi(conf);
      const response = await api.apiWorkCompanySystemInfoBySystemIdIdGet(id);
      setCompanySystemData({
        id: response.data.id,
        workCompanyId: response.data.workCompanyId,
        name: response.data.name,
        workCompany: {
          id: response.data.workCompany.id,
          name: response.data.workCompany.name,
        },
      });
    } catch (error) {
      dispatchAlert({
        message: t("ns1:CompanySystemPage.SystemDetail.SirketSistemBilgisiHata"),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    void fetchWorkCompanyList({ showBusy: true });
  }, [fetchWorkCompanyList]);

  useEffect(() => {
    if (!id) return;

    const loadSystemInfo = async () => {
      await fetchWorkCompanySystemInfo();
    };

    loadSystemInfo();
  }, [id]);

  const handleSave = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanySystemInfoApi(conf);
      if (companySystemData.workCompany.id == null || companySystemData.workCompany.id == "") {
        dispatchAlert({
          message: t("ns1:CompanySystemPage.SystemDetail.SirketSecilmedi"),
          type: "Warning",
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (companySystemData.name == null || companySystemData.name == "") {
        dispatchAlert({
          message: t("ns1:CompanySystemPage.SystemDetail.SistemAdiGirilmedi"),
          type: "Warning",
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (id) {
        await api.apiWorkCompanySystemInfoPut({
          id: companySystemData.id,
          name: companySystemData.name,
          workCompanyId: companySystemData.workCompany.id,
        });
      } else {
        await api.apiWorkCompanySystemInfoPost({
          name: companySystemData.name,
          workCompanyId: companySystemData.workCompany.id,
        });
      }
      dispatchAlert({
        message: t("ns1:CompanySystemPage.SystemDetail.SistemKaydedildi"),
        type: "Success",
      });
      navigate("/workCompanySystem");
    } catch (error) {
      dispatchAlert({
        message: t("ns1:CompanySystemPage.SystemDetail.SistemKaydedilirkenHata"),
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const selectedWorkCompany =
    workCompanyList.find((c) => c.id === companySystemData.workCompany?.id) ?? null;
  const companyTriggerLabel =
    selectedWorkCompany?.name ??
    companySystemData.workCompany?.name ??
    t("ns1:CompanySystemPage.SystemDetail.SirketAdi");

  const companySearchTrimmed = companySearch.trim().toLocaleLowerCase("tr-TR");
  const filteredWorkCompanies =
    companySearchTrimmed === ""
      ? workCompanyList
      : workCompanyList.filter((wc) =>
          (wc.name ?? "").toLocaleLowerCase("tr-TR").includes(companySearchTrimmed),
        );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main className="w-full  px-3 pb-10">
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Factory className="size-5 text-muted-foreground" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-xl font-semibold tracking-tight">
                  {t("ns1:CompanySystemPage.SystemDetail.SistemTanimlama")}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="system-name">{t("ns1:CompanySystemPage.SystemDetail.SistemAdi")}</Label>
                <Input
                  id="system-name"
                  className="h-11"
                  autoComplete="off"
                  value={companySystemData.name ?? ""}
                  onChange={(e) =>
                    setCompanySystemData({ ...companySystemData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2" id="workCompanyIdBox">
                <Label htmlFor="work-company-trigger">{t("ns1:CompanySystemPage.SystemDetail.SirketAdi")}</Label>
                <Popover
                  open={companyOpen}
                  onOpenChange={(open) => {
                    setCompanyOpen(open);
                    if (!open) {
                      setCompanySearch("");
                    }
                    if (open) {
                      void fetchWorkCompanyList({ showBusy: false });
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      id="work-company-trigger"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={companyOpen}
                      className="h-11 w-full justify-between font-normal"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span
                          className={
                            companySystemData.workCompany?.id
                              ? "truncate text-left"
                              : "truncate text-left text-muted-foreground"
                          }
                        >
                          {companySystemData.workCompany?.id
                            ? companyTriggerLabel
                            : "—"}
                        </span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="z-1200 flex w-[min(520px,calc(100vw-2rem))] flex-col gap-0 p-0 sm:min-w-80"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder={t("ns1:CompanySystemPage.SystemDetail.SirketAdi")}
                        value={companySearch}
                        onValueChange={setCompanySearch}
                      />
                      <CommandList>
                        <CommandEmpty>Sonuç yok.</CommandEmpty>
                        <CommandGroup>
                          {filteredWorkCompanies.map((wc) => (
                            <CommandItem
                              key={String(wc.id)}
                              value={wc.id != null ? String(wc.id) : ""}
                              onSelect={() => {
                                setCompanySystemData({
                                  ...companySystemData,
                                  workCompany: {
                                    id: wc.id ?? "",
                                    name: wc.name ?? "",
                                  },
                                  workCompanyId: wc.id ?? "",
                                });
                                setCompanyOpen(false);
                              }}
                            >
                              {wc.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-2 border-t border-border/50 bg-muted/20 py-6">
            <Button type="button" variant="outline" onClick={() => navigate("/workCompanySystem")}>
              {t("ns1:CompanySystemPage.SystemDetail.Iptal")}
            </Button>
            <Button type="button" onClick={handleSave}>
              {t("ns1:CompanySystemPage.SystemDetail.Kaydet")}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </DashboardLayout>
  );
}

export default WorkCompanySystemCE;
