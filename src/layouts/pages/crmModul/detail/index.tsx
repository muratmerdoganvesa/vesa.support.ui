import { CrmModulsApi, ListModuleDto, ModuleApi } from "api/generated";
import { Button } from "components/ui/button";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { ArrowLeft, Handshake, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CrmModulFormFields } from "../components/CrmModulForm";
import { CrmModulNotePanel } from "../components/CrmModulNotePanel";
import { CrmSubItemDialog } from "../components/CrmSubItemDialog";
import { CrmSubItemList } from "../components/CrmSubItemList";
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
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CrmSubItemFormValues | null>(null);

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
        } else {
          setModules(activeModules);
          setModulValues(emptyCrmModulFormValues());
          setSubItems([]);
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
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEditItem = (clientKey: string) => {
    const item = subItems.find((i) => i.clientKey === clientKey);
    if (!item) return;
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteItem = (clientKey: string) => {
    setSubItems((prev) => prev.filter((i) => i.clientKey !== clientKey));
  };

  const handleSaveItem = (values: CrmSubItemFormValues) => {
    setSubItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.clientKey === values.clientKey);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = values;
        return next;
      }
      return [...prev, values];
    });
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

      <div className="mt-4 mx-auto pb-6 max-w-[1400px] w-full px-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="size-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Handshake className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                {isEditMode ? "Müşteri Kaydını Düzenle" : "Potansiyel Müşteri Kaydı oluştur."}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {isEditMode
                  ? "Üst bölümde şirket bilgilerini, alt bölümde modülleri ve notları yönetin."
                  : "Şirket bilgilerini girin ve modüller ekleyin."}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-12">Yükleniyor...</p>
            ) : (
              <>
                <CrmModulFormFields values={modulValues} onChange={setModulValues} />

                <CrmSubItemList
                  items={subItems}
                  modules={modules}
                  onAdd={handleAddItem}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />

                <CrmModulNotePanel crmModulId={id} />
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/crmModul")}
              className="gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              <Save className="size-4" />
              Kaydet
            </Button>
          </div>
        </div>
      </div>

      <CrmSubItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={editingItem}
        isEditMode={Boolean(editingItem)}
        modules={modules}
        onSave={handleSaveItem}
      />
    </DashboardLayout>
  );
};

export default CrmModulDetailPage;
