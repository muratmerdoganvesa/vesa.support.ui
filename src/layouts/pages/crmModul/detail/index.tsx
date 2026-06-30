import { CrmModulNotesApi, ListModuleDto, ModuleApi } from "api/generated";
import { CrmModulsApi } from "api/generated/crmModulsApi";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildCrmAiRaporPayload } from "../aiRaporPayload";
import type { CrmAiRaporData } from "../aiRaporTypes";
import { CrmAiRaporModal } from "../components/CrmAiRaporModal";
import { normalizeAiRaporResponse } from "../normalizeAiRapor";
import { CrmDetailSummary } from "../components/CrmDetailSummary";
import { CrmModulFormFields } from "../components/CrmModulForm";
import { CrmModulNotePanel } from "../components/CrmModulNotePanel";
import {
  createNewOpportunityItem,
  CrmOpportunityList,
} from "../components/CrmOpportunityList";
import {
  crmModulDtoToFormValues,
  crmSubItemDtosToFormValues,
  emptyCrmModulFormValues,
  toCreateDto,
  toUpdateDto,
  type CrmModulFormValues,
  type CrmSubItemFormValues,
} from "../formMappers";
import { mergeActiveModulesWithSelected } from "../utils";

const CrmModulDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const isEditMode = Boolean(id);
  const [modulValues, setModulValues] = useState<CrmModulFormValues>(emptyCrmModulFormValues());
  const [subItems, setSubItems] = useState<CrmSubItemFormValues[]>([]);
  const [modules, setModules] = useState<ListModuleDto[]>([]);
  const [uniqNumber, setUniqNumber] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isAiRaporLoading, setIsAiRaporLoading] = useState(false);
  const [aiRaporOpen, setAiRaporOpen] = useState(false);
  const [aiRaporData, setAiRaporData] = useState<CrmAiRaporData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        setLoading(true);
        const conf = getConfiguration();
        const moduleApi = new ModuleApi(conf);
        const modulesResponse = await moduleApi.apiModuleGetActiveModulesGet();
        const activeModules = modulesResponse.data ?? [];

        if (id) {
          const crmApi = new CrmModulsApi(conf);
          const response = await crmApi.apiCrmModulsIdGet(id);
          const data = response.data;
          setModules(mergeActiveModulesWithSelected(activeModules, data));
          setModulValues(crmModulDtoToFormValues(data));
          setSubItems(crmSubItemDtosToFormValues(data.crmSubItems ?? []));
          setUniqNumber(data.uniqNumber);
        } else {
          setModules(activeModules);
          setModulValues(emptyCrmModulFormValues());
          setSubItems([]);
          setUniqNumber(undefined);
        }
      } catch {
        dispatchAlert({
          message: isEditMode
            ? "CRM kaydı getirilirken hata oluştu."
            : "Sayfa verileri yüklenirken hata oluştu.",
          type: "error",
        });
        if (isEditMode) {
          navigate("/crmModul");
        }
      } finally {
        setLoading(false);
        dispatchBusy({ isBusy: false });
      }
    };

    loadData();
  }, [id]);

  const handleAddItem = () => {
    const newItem = createNewOpportunityItem();
    setSubItems((prev) => [...prev, newItem]);
    setExpandedKey(newItem.clientKey);
  };

  const handleChangeItem = (values: CrmSubItemFormValues) => {
    setSubItems((prev) =>
      prev.map((item) => (item.clientKey === values.clientKey ? values : item))
    );
  };

  const handleDeleteItem = (clientKey: string) => {
    setSubItems((prev) => prev.filter((i) => i.clientKey !== clientKey));
    if (expandedKey === clientKey) {
      setExpandedKey(null);
    }
  };

  const handleSave = async () => {
    if (!modulValues.companyName.trim()) {
      dispatchAlert({ message: "Müşteri adı zorunludur.", type: "error" });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      const api = new CrmModulsApi(getConfiguration());

      if (id) {
        await api.apiCrmModulsIdPut(id, toUpdateDto(modulValues, subItems));
        dispatchAlert({ message: "CRM kaydı başarıyla güncellendi.", type: "success" });
      } else {
        await api.apiCrmModulsPost(toCreateDto(modulValues, subItems));
        dispatchAlert({ message: "CRM kaydı başarıyla oluşturuldu.", type: "success" });
      }

      navigate("/crmModul");
    } catch {
      dispatchAlert({ message: "İşlem sırasında hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleAiRapor = async () => {
    if (!id) {
      dispatchAlert({
        message: "AI raporu almak için önce müşteri kaydını oluşturun.",
        type: "error",
      });
      return;
    }

    if (!modulValues.companyName.trim()) {
      dispatchAlert({ message: "Müşteri adı zorunludur.", type: "error" });
      return;
    }

    try {
      setIsAiRaporLoading(true);
      dispatchBusy({ isBusy: true });

      const notesApi = new CrmModulNotesApi(getConfiguration());
      const notesResponse = await notesApi.apiCrmModulNotesByCrmModulCrmModulIdGet(id);
      const notes = notesResponse.data ?? [];

      const payload = buildCrmAiRaporPayload(modulValues, subItems, modules, notes);
      const crmApi = new CrmModulsApi(getConfiguration());
      const response = await crmApi.apiCrmModulsIdAiRaporPost(id, payload, { timeout: 300000 });

      const rapor = normalizeAiRaporResponse(response.data?.rapor);
      if (!rapor) {
        dispatchAlert({ message: "AI raporu yanıtı alınamadı.", type: "error" });
        return;
      }

      setAiRaporData(rapor);
      setAiRaporOpen(true);
    } catch (error) {
      let message = "AI raporu oluşturulurken hata oluştu.";

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          message = "AI raporu zaman aşımına uğradı. Lütfen tekrar deneyin.";
        } else if (typeof error.response?.data === "string") {
          message = error.response.data;
        } else if (error.response?.data && typeof error.response.data === "object") {
          const data = error.response.data as Record<string, unknown>;
          const errors = data.errors ?? data.Errors;
          if (Array.isArray(errors) && typeof errors[0] === "string") {
            message = errors[0];
          } else if (typeof data.message === "string") {
            message = data.message;
          } else if (typeof data.Message === "string") {
            message = data.Message;
          }
        } else if (error.message) {
          message = error.message;
        }
      }

      dispatchAlert({ message, type: "error" });
    } finally {
      setIsAiRaporLoading(false);
      dispatchBusy({ isBusy: false });
    }
  };

  const canSave = !loading && Boolean(modulValues.companyName.trim());
  const canAiRapor = isEditMode && !loading && Boolean(modulValues.companyName.trim());

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="-m-6 min-h-full bg-slate-100/80 p-4">
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-24">Yükleniyor...</p>
        ) : (
          <div className="space-y-4 pb-6">
            <CrmDetailSummary
              modulValues={modulValues}
              subItems={subItems}
              uniqNumber={uniqNumber}
              isEditMode={isEditMode}
              canSave={canSave}
              canAiRapor={canAiRapor}
              isAiRaporLoading={isAiRaporLoading}
              onBack={() => navigate("/crmModul")}
              onSave={handleSave}
              onAiRapor={handleAiRapor}
            />

            <CrmModulFormFields
              values={modulValues}
              onChange={setModulValues}
              variant="detail"
            />

            <CrmOpportunityList
              items={subItems}
              modules={modules}
              expandedKey={expandedKey}
              onExpandedKeyChange={setExpandedKey}
              onChange={handleChangeItem}
              onDelete={handleDeleteItem}
              onAdd={handleAddItem}
            />

            <CrmModulNotePanel crmModulId={id} />
          </div>
        )}
      </div>

      <CrmAiRaporModal
        open={aiRaporOpen}
        onOpenChange={setAiRaporOpen}
        rapor={aiRaporData}
      />
    </DashboardLayout>
  );
};

export default CrmModulDetailPage;
