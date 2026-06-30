import { CrmModulsApi, ListModuleDto, ModuleApi } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    if (!modulValues.partnerCompanyName.trim()) {
      dispatchAlert({ message: "Şirket adı zorunludur.", type: "error" });
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

  const canSave = !loading && Boolean(modulValues.partnerCompanyName.trim());

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
              onBack={() => navigate("/crmModul")}
              onSave={handleSave}
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

            <CrmModulNotePanel
              crmModulId={id}
              nextAction={modulValues.nextAction}
              onNextActionChange={(value) =>
                setModulValues((prev) => ({ ...prev, nextAction: value }))
              }
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CrmModulDetailPage;
