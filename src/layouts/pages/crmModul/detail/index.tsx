import { CrmModulNotesApi, CrmModulDto, ListModuleDto, ModuleApi } from "api/generated";
import { CrmModulsApi } from "api/generated/crmModulsApi";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert, AppAlertType } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildCrmAiRaporPayload } from "../aiRaporPayload";
import type { CrmAiRaporData } from "../aiRaporTypes";
import { CrmAiRaporModal } from "../components/CrmAiRaporModal";
import { normalizeAiRaporResponse } from "../normalizeAiRapor";
import { CrmDetailActionBar } from "../components/CrmDetailActionBar";
import { CrmDetailPipelineKanban } from "../components/CrmDetailPipelineKanban";
import { CrmDetailSummary } from "../components/CrmDetailSummary";
import { CrmModulFormFields } from "../components/CrmModulForm";
import { CrmModulNotePanel } from "../components/CrmModulNotePanel";
import {
  createNewOpportunity,
  CrmOpportunityList,
} from "../components/CrmOpportunityList";
import {
  crmModulDtoToFormValues,
  resolveOpportunitiesFromCrmModulDto,
  emptyCrmModulFormValues,
  mergeOpportunitiesWithServer,
  toCreateDto,
  toUpdateDto,
  validateCrmModulEmail,
  validateOpportunities,
  type CrmModulFormValues,
  type CrmOpportunityFormValues,
} from "../formMappers";
import { mergeActiveModulesWithSelected } from "../utils";
import { useTcmbExchangeRates } from "../hooks/useTcmbExchangeRates";

const CrmModulDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const isEditMode = Boolean(id);
  const [modulValues, setModulValues] = useState<CrmModulFormValues>(emptyCrmModulFormValues());
  const [opportunities, setOpportunities] = useState<CrmOpportunityFormValues[]>([]);
  const [modules, setModules] = useState<ListModuleDto[]>([]);
  const [uniqNumber, setUniqNumber] = useState<number | undefined>();
  const [updatedDate, setUpdatedDate] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [isAiRaporLoading, setIsAiRaporLoading] = useState(false);
  const [aiRaporOpen, setAiRaporOpen] = useState(false);
  const [aiRaporData, setAiRaporData] = useState<CrmAiRaporData | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveLockRef = useRef(false);
  const pendingExpandedKeyRef = useRef<string | null>(null);
  const opportunitiesRef = useRef(opportunities);
  opportunitiesRef.current = opportunities;
  const { rates: exchangeRates, loading: exchangeRatesLoading } = useTcmbExchangeRates();

  const resolveExpandedKey = useCallback(
    (loadedOpportunities: CrmOpportunityFormValues[], currentKey: string | null) => {
      const pending = pendingExpandedKeyRef.current;
      if (pending && loadedOpportunities.some((o) => o.clientKey === pending)) {
        pendingExpandedKeyRef.current = null;
        return pending;
      }
      if (currentKey && loadedOpportunities.some((o) => o.clientKey === currentKey)) {
        return currentKey;
      }
      return loadedOpportunities[0]?.clientKey ?? null;
    },
    []
  );

  const applyServerData = useCallback(
    (
      data: CrmModulDto,
      activeModules: ListModuleDto[],
      previousOpportunities?: CrmOpportunityFormValues[]
    ) => {
      setModules(mergeActiveModulesWithSelected(activeModules, data));
      const loadedOpportunities = resolveOpportunitiesFromCrmModulDto(data);
      const mergedOpportunities =
        previousOpportunities && previousOpportunities.length > 0
          ? mergeOpportunitiesWithServer(previousOpportunities, loadedOpportunities)
          : loadedOpportunities;
      setModulValues(crmModulDtoToFormValues(data));
      setOpportunities(mergedOpportunities);
      setUniqNumber(data.uniqNumber);
      setUpdatedDate(data.updatedDate ?? null);
      setUpdatedBy(data.updatedBy ?? null);
      return mergedOpportunities;
    },
    []
  );

  const syncFromServer = useCallback(
    async (
      crmModulId: string,
      preserveKey?: string | null,
      previousOpportunities?: CrmOpportunityFormValues[]
    ) => {
      const conf = getConfiguration();
      const crmApi = new CrmModulsApi(conf);
      const response = await crmApi.apiCrmModulsIdGet(crmModulId);
      const data = response.data;
      const loadedOpportunities = applyServerData(
        data,
        modules,
        previousOpportunities
      );
      setExpandedKey((current) => resolveExpandedKey(loadedOpportunities, preserveKey ?? current));
    },
    [applyServerData, modules, resolveExpandedKey]
  );

  const autoPersist = useCallback(
    async (nextModul: CrmModulFormValues, nextOpportunities: CrmOpportunityFormValues[]) => {
      if (autoSaveLockRef.current) return;

      if (!nextModul.companyName.trim()) {
        dispatchAlert({
          message: "Otomatik kayıt için önce müşteri adını girin.",
          type: "error",
        });
        return;
      }

      const emailError = validateCrmModulEmail(nextModul.email);
      if (emailError) {
        dispatchAlert({ message: emailError, type: "error" });
        return;
      }

      const oppError = validateOpportunities(nextOpportunities);
      if (oppError) {
        dispatchAlert({ message: oppError, type: "error" });
        return;
      }

      autoSaveLockRef.current = true;
      setIsAutoSaving(true);

      try {
        const api = new CrmModulsApi(getConfiguration());

        if (id) {
          await api.apiCrmModulsIdPut(id, toUpdateDto(nextModul, nextOpportunities));
          await syncFromServer(id, undefined, nextOpportunities);
          dispatchAlert({
            type: AppAlertType.Success,
            title: "Kaydedildi",
            message: "Değişiklikler otomatik olarak kaydedildi.",
          });
          return;
        }

        const response = await api.apiCrmModulsPost(toCreateDto(nextModul, nextOpportunities));
        const newId = response.data?.id;
        if (!newId) {
          throw new Error("CRM kaydı oluşturulamadı.");
        }

        navigate(`/crmModul/${newId}`, { replace: true });
        dispatchAlert({
          type: AppAlertType.Success,
          title: "Kayıt oluşturuldu",
          message: "Yeni müşteri kaydı başarıyla oluşturuldu.",
        });
      } catch {
        dispatchAlert({ message: "Otomatik kayıt sırasında hata oluştu.", type: "error" });
      } finally {
        autoSaveLockRef.current = false;
        setIsAutoSaving(false);
      }
    },
    [dispatchAlert, id, navigate, syncFromServer]
  );

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
          const loadedOpportunities = applyServerData(data, activeModules);
          setExpandedKey((current) => resolveExpandedKey(loadedOpportunities, current));
        } else {
          setModules(activeModules);
          setModulValues(emptyCrmModulFormValues());
          setOpportunities([]);
          setUniqNumber(undefined);
          setUpdatedDate(null);
          setUpdatedBy(null);
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
  }, [id, applyServerData, resolveExpandedKey]);

  const handleAddOpportunity = () => {
    const newOpp = createNewOpportunity();
    const nextOpportunities = [...opportunities, newOpp];
    pendingExpandedKeyRef.current = newOpp.clientKey;
    setOpportunities(nextOpportunities);
    setExpandedKey(newOpp.clientKey);
    void autoPersist(modulValues, nextOpportunities);
  };

  const handleChangeOpportunity = (
    values: CrmOpportunityFormValues,
    options?: { autoSave?: boolean }
  ) => {
    const nextOpportunities = opportunities.map((opp) =>
      opp.clientKey === values.clientKey ? values : opp
    );
    setOpportunities(nextOpportunities);
    if (options?.autoSave) {
      void autoPersist(modulValues, nextOpportunities);
    }
  };

  const handleDeleteOpportunity = (clientKey: string) => {
    const nextOpportunities = opportunities.filter((o) => o.clientKey !== clientKey);
    setOpportunities(nextOpportunities);
    if (expandedKey === clientKey) {
      setExpandedKey(null);
    }
    if (id) {
      void autoPersist(modulValues, nextOpportunities);
    }
  };

  const handleSave = async () => {
    if (!modulValues.companyName.trim()) {
      dispatchAlert({ message: "Müşteri adı zorunludur.", type: "error" });
      return;
    }

    const emailError = validateCrmModulEmail(modulValues.email);
    if (emailError) {
      dispatchAlert({ message: emailError, type: "error" });
      return;
    }

    const oppError = validateOpportunities(opportunitiesRef.current);
    if (oppError) {
      dispatchAlert({ message: oppError, type: "error" });
      const invalidOpp = opportunitiesRef.current.find((opp) =>
        opp.kalems.some((k) => validateOpportunities([{ ...opp, kalems: [k] }]))
      );
      if (invalidOpp) {
        setExpandedKey(invalidOpp.clientKey);
      }
      return;
    }

    try {
      setIsSaving(true);
      const api = new CrmModulsApi(getConfiguration());

      if (id) {
        await api.apiCrmModulsIdPut(id, toUpdateDto(modulValues, opportunitiesRef.current));
        await syncFromServer(id, expandedKey, opportunitiesRef.current);
        const companyLabel = modulValues.companyName.trim() || "Müşteri kaydı";
        dispatchAlert({
          type: AppAlertType.Success,
          title: "Kaydedildi",
          message: `${companyLabel} güncellendi.`,
        });
        return;
      }

      const response = await api.apiCrmModulsPost(toCreateDto(modulValues, opportunitiesRef.current));
      const newId = response.data?.id;
      if (!newId) {
        throw new Error("CRM kaydı oluşturulamadı.");
      }

      pendingExpandedKeyRef.current = expandedKey;
      navigate(`/crmModul/${newId}`, { replace: true });
      dispatchAlert({
        type: AppAlertType.Success,
        title: "Kayıt oluşturuldu",
        message: `${modulValues.companyName.trim() || "Müşteri"} kaydı oluşturuldu.`,
      });
    } catch {
      dispatchAlert({ message: "İşlem sırasında hata oluştu.", type: "error" });
    } finally {
      setIsSaving(false);
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

      const payload = buildCrmAiRaporPayload(modulValues, opportunities, modules, notes);
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
  const companyNameMissing = !loading && !modulValues.companyName.trim();

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="-m-6 min-h-full bg-[#f8f9fb] p-3 sm:p-4 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin" />
              <p className="text-sm text-slate-400">Yükleniyor...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-[90rem] mx-auto pb-6">
            <div className="space-y-3 mb-3">
              <CrmDetailSummary
                modulValues={modulValues}
                uniqNumber={uniqNumber}
                isEditMode={isEditMode}
                canSave={canSave}
                canAiRapor={canAiRapor}
                isAiRaporLoading={isAiRaporLoading}
                isSaving={isSaving}
                updatedDate={updatedDate}
                updatedBy={updatedBy}
                onBack={() => navigate("/crmModul")}
                onSave={handleSave}
                onAiRapor={handleAiRapor}
              />

              <CrmDetailPipelineKanban
                opportunities={opportunities}
                modules={modules}
                expandedKey={expandedKey}
                onExpandedKeyChange={setExpandedKey}
              />
            </div>

            <div className="space-y-3">
              <CrmModulFormFields
                values={modulValues}
                onChange={setModulValues}
                variant="detail"
              />

              <CrmOpportunityList
                opportunities={opportunities}
                modules={modules}
                expandedKey={expandedKey}
                exchangeRates={exchangeRates}
                onExpandedKeyChange={setExpandedKey}
                onChange={handleChangeOpportunity}
                onDelete={handleDeleteOpportunity}
                onAdd={handleAddOpportunity}
              />

              <CrmModulNotePanel crmModulId={id} />
            </div>
          </div>
        )}

        {!loading && (
          <CrmDetailActionBar
            canSave={canSave}
            companyNameMissing={companyNameMissing}
            opportunityCount={opportunities.length}
            isAutoSaving={isAutoSaving || isSaving}
            onBack={() => navigate("/crmModul")}
            onSave={handleSave}
          />
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
