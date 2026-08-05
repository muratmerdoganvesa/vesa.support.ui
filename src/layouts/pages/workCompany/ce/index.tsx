import React, { useEffect, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { AppAlertType, useAlert } from "layouts/pages/hooks/useAlert";
import {
  ApproveWorkDesign,
  UserApi,
  UserAppDto,
  WorkCompanyApi,
  WorkCompanyUpdateDto,
  WorkFlowDefinationApi,
  WorkFlowDefinationListDto,
} from "api/generated/api";
import getConfiguration from "confiuration";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Save } from "lucide-react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { cn } from "lib/utils";

interface approveWorkDesign {
  id: ApproveWorkDesign;
  name: string;
  description: string;
}

const NONE_VALUE = "__none__";

function WorkCompanyCE() {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [companyData, setCompanyData] = useState<WorkCompanyUpdateDto>({
    id: "",
    name: "",
    approveWorkDesign: null,
    userAppId: "",
    workFlowDefinationId: null,
    isActive: null,
    isMsp: null,
  });
  const [status, setStatus] = useState(null);
  const [mspStatus, setMspStatus] = useState(null);
  const { id } = useParams();

  const [searchByName, setSearchByName] = useState<UserAppDto[]>([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectionPerson, setSelectionPerson] = useState(null);

  const [approveDesign, setApproveDesign] = useState<approveWorkDesign[]>([]);
  const [selectedAprDesign, setSelectedAprDesign] = useState<approveWorkDesign>(null);

  const [workFlows, setWorkFlows] = useState<WorkFlowDefinationListDto[]>([]);
  const [selectedworkFlow, setSelectedWorkFlow] = useState<WorkFlowDefinationListDto>(null);

  const statusOptions = [
    { label: "Aktif", value: true },
    { label: "Pasif", value: false },
  ];

  const mspOptions = [
    { label: "Evet", value: true },
    { label: "Hayır", value: false },
  ];

  useEffect(() => {
    const fetchData = async () => {
      var conf = getConfiguration();
      var api = new WorkCompanyApi(conf);
      const response = await api.apiWorkCompanyIdGet(id);
      setCompanyData(response.data);

      console.log(response.data);

      if (response.data.userApp) {
        setSelectedPerson({
          userAppId: response.data.userAppId,
          userAppName: `${response.data.userApp.firstName} ${response.data.userApp.lastName}`,
        });
      }
      if (response.data.workFlowDefination) {
        setSelectedWorkFlow(response.data.workFlowDefination);
      }
      if (response.data.isActive !== null && response.data.isActive !== undefined) {
        console.log("eşleşti");
        const matchedStatus = statusOptions.find((opt) => opt.value === response.data.isActive);
        setStatus(matchedStatus);
      } else {
        console.log("null");
        // null gelirse setStatus çağrılmaz, ya da:
        setStatus(null); // Eğer combobox'ı boş göstermek istiyorsan
      }

      if (response.data.isMsp !== null && response.data.isMsp !== undefined) {
        const matchedMsp = mspOptions.find((opt) => opt.value === response.data.isMsp);
        setMspStatus(matchedMsp);
      } else {
        setMspStatus(null);
      }
    };

    if (id) {
      fetchData();
    }

    getAprDesigns();

    getWorkFlows();
  }, [id]);

  useEffect(() => {
    if (approveDesign.length > 0 && companyData) {
      setSelectedAprDesign({
        id: companyData.approveWorkDesign,
        name: approveDesign.find((e) => e.id == companyData.approveWorkDesign)?.name || "",
        description:
          approveDesign.find((e) => e.id == companyData.approveWorkDesign)?.description || "",
      });
    }
  }, [approveDesign, companyData]);

  const getAprDesigns = async () => {
    var conf = getConfiguration();
    var api = new WorkCompanyApi(conf);
    var aprDesigndata = await api.apiWorkCompanyGetApproveWorkDesignGet();
    setApproveDesign(aprDesigndata.data as any);
  };

  const handleSave = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyApi(conf);

      if (!companyData.name || companyData.name.trim() == "") {
        dispatchAlert({
          message: t("ns1:CompanyPage.CompanyDetail.SirketAdiBos"),
          type: AppAlertType.Warning,
        });
        return;
      }
      if (companyData.approveWorkDesign == null) {
        dispatchAlert({
          message: t("ns1:CompanyPage.CompanyDetail.OnaySecenegiBos"),
          type: AppAlertType.Warning,
        });
        return;
      }

      // if (companyData.workFlowDefinationId == null || companyData.workFlowDefinationId == "") {
      //   dispatchAlert({ message: "Onay Akışı Alanı Boş Bırakılamaz..!", type: AppAlertType.Warning });
      //   return;
      // }

      // if (id != null && (!companyData.userAppId || companyData.userAppId == "")) {
      //   dispatchAlert({ message: "Onaycı Alanı Boş Bırakılamaz..!", type: AppAlertType.Warning });
      //   return;
      // }
      const sanitizedWorkFlowId =
        companyData.workFlowDefinationId == "" ? null : companyData.workFlowDefinationId;
      console.log("sercan", sanitizedWorkFlowId);
      if (id) {
        await api.apiWorkCompanyPut({
          ...companyData,
          workFlowDefinationId: sanitizedWorkFlowId,
        });
      } else {
        await api.apiWorkCompanyPost({
          name: companyData.name,
          approveWorkDesign: companyData.approveWorkDesign,
          userAppId: null,
          workFlowDefinationId: sanitizedWorkFlowId,
          isActive: companyData.isActive,
          isMsp: companyData.isMsp,
        });
      }

      dispatchAlert({
        message: t("ns1:CompanyPage.CompanyDetail.SirketBasarili"),
        type: AppAlertType.Success,
      });
      navigate("/workCompany");
    } catch (error) {
      dispatchAlert({
        message: t("ns1:CompanyPage.CompanyDetail.SirketHata"),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const parseUserName = (name: string) => {
    if (!name) return { firstName: "", lastName: "" };
    const nameParts = name.split(" ");
    return {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" "),
    };
  };

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      dispatchBusy({ isBusy: true });

      var conf = getConfiguration();
      var api = new UserApi(conf);
      var data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
      var pureData = data.data;
      setSearchByName(pureData);

      dispatchBusy({ isBusy: false });
    }
  };

  const getWorkFlows = async () => {
    var conf = getConfiguration();
    var api = new WorkFlowDefinationApi(conf);
    var res = await api.apiWorkFlowDefinationGet();
    setWorkFlows(res.data);
  };

  const handleApproveDesignChange = (value: string) => {
    if (value === NONE_VALUE) {
      setSelectedAprDesign(null);
      setCompanyData({
        ...companyData,
        approveWorkDesign: null,
      });
      return;
    }
    const opt = approveDesign.find((e) => String(e.id) === value);
    if (!opt) {
      return;
    }
    setSelectedAprDesign(opt);
    setCompanyData({
      ...companyData,
      approveWorkDesign: opt.id,
    });
  };

  const handleWorkflowChange = (value: string) => {
    if (value === NONE_VALUE) {
      setSelectedWorkFlow(null);
      setCompanyData({
        ...companyData,
        workFlowDefinationId: null,
      });
      return;
    }
    const opt = workFlows.find((w) => String(w.id) === value);
    if (!opt) {
      return;
    }
    setSelectedWorkFlow(opt);
    setCompanyData({
      ...companyData,
      workFlowDefinationId: opt.id,
    });
  };

  const handleStatusChange = (value: string) => {
    if (value === NONE_VALUE) {
      setStatus(null);
      setCompanyData({
        ...companyData,
        isActive: null,
      });
      return;
    }
    const opt = statusOptions.find((o) => String(o.value) === value);
    if (!opt) {
      return;
    }
    setStatus(opt);
    setCompanyData({
      ...companyData,
      isActive: opt.value,
    });
  };

  const handleMspChange = (value: string) => {
    if (value === NONE_VALUE) {
      setMspStatus(null);
      setCompanyData({
        ...companyData,
        isMsp: null,
      });
      return;
    }
    const opt = mspOptions.find((o) => String(o.value) === value);
    if (!opt) {
      return;
    }
    setMspStatus(opt);
    setCompanyData({
      ...companyData,
      isMsp: opt.value,
    });
  };

  const approveSelectValue =
    selectedAprDesign != null && selectedAprDesign.id != null && String(selectedAprDesign.id) !== ""
      ? String(selectedAprDesign.id)
      : NONE_VALUE;

  const workflowSelectValue =
    selectedworkFlow != null && selectedworkFlow.id
      ? String(selectedworkFlow.id)
      : NONE_VALUE;

  const statusSelectValue =
    status != null ? String(status.value) : NONE_VALUE;

  const mspSelectValue =
    mspStatus != null ? String(mspStatus.value) : NONE_VALUE;

  const fieldShell = "space-y-2";

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="w-full max-w-full px-4 pb-8 pt-2 md:px-6">
        <Card className={cn("border shadow-sm")}>
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {t("ns1:CompanyPage.CompanyDetail.SirketTanimlama")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className={fieldShell}>
                <Label htmlFor="work-company-name">
                  {t("ns1:CompanyPage.CompanyDetail.SirketAdi")}
                </Label>
                <Input
                  id="work-company-name"
                  value={companyData.name}
                  onChange={(e) =>
                    setCompanyData({ ...companyData, name: e.target.value })
                  }
                  className="h-9 text-sm"
                  autoComplete="organization"
                />
              </div>

              <div className={fieldShell}>
                <Label htmlFor="work-company-approve-design">
                  {t("ns1:CompanyPage.CompanyDetail.OnaySecenegi")}
                </Label>
                <Select value={approveSelectValue} onValueChange={handleApproveDesignChange}>
                  <SelectTrigger
                    id="work-company-approve-design"
                    className="h-9 w-full min-w-0"
                    size="default"
                  >
                    <SelectValue placeholder={t("ns1:CompanyPage.CompanyDetail.OnaySecenegi")} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                    <SelectItem value={NONE_VALUE}>
                      <span className="text-muted-foreground">Seçin</span>
                    </SelectItem>
                    {approveDesign.map((opt) => (
                      <SelectItem key={String(opt.id)} value={String(opt.id)}>
                        {opt.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={fieldShell}>
                <Label htmlFor="work-company-workflow">
                  {t("ns1:CompanyPage.CompanyDetail.OnayAkisi")}
                </Label>
                <Select value={workflowSelectValue} onValueChange={handleWorkflowChange}>
                  <SelectTrigger
                    id="work-company-workflow"
                    className="h-9 w-full min-w-0"
                    size="default"
                  >
                    <SelectValue placeholder={t("ns1:CompanyPage.CompanyDetail.OnayAkisi")} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                    <SelectItem value={NONE_VALUE}>
                      <span className="text-muted-foreground">Seçin</span>
                    </SelectItem>
                    {workFlows.map((wf) => (
                      <SelectItem key={String(wf.id)} value={String(wf.id)}>
                        {wf.workflowName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={fieldShell}>
                <Label htmlFor="work-company-status">Durum</Label>
                <Select value={statusSelectValue} onValueChange={handleStatusChange}>
                  <SelectTrigger
                    id="work-company-status"
                    className="h-9 w-full min-w-0"
                    size="default"
                  >
                    <SelectValue placeholder="Durum" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                    <SelectItem value={NONE_VALUE}>
                      <span className="text-muted-foreground">Seçin</span>
                    </SelectItem>
                    {statusOptions.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={fieldShell}>
                <Label htmlFor="work-company-msp">MSP</Label>
                <Select value={mspSelectValue} onValueChange={handleMspChange}>
                  <SelectTrigger
                    id="work-company-msp"
                    className="h-9 w-full min-w-0"
                    size="default"
                    aria-label="MSP seçimi"
                  >
                    <SelectValue placeholder="MSP" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                    <SelectItem value={NONE_VALUE}>
                      <span className="text-muted-foreground">Seçin</span>
                    </SelectItem>
                    {mspOptions.map((opt) => (
                      <SelectItem key={String(opt.value)} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Onaycı (kullanıcı arama) alanı önceki sürümde yorum satırındaydı; iş mantığı state/handler dosyada duruyor. */}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate("/workCompany")}
            >
              {t("ns1:CompanyPage.CompanyDetail.Iptal")}
            </Button>
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              onClick={handleSave}
            >
              <Save className="size-4" aria-hidden />
              {t("ns1:CompanyPage.CompanyDetail.Kaydet")}
            </Button>
          </CardFooter>
        </Card>
      </div>

      
    </DashboardLayout>
  );
}

export default WorkCompanyCE;
