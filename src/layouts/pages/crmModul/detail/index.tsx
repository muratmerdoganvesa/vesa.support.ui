import { CrmModulsApi, WorkCompanyApi, WorkCompanyDto } from "api/generated";
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
import {
  crmModulDtoToFormValues,
  emptyCrmModulFormValues,
  toCreateDto,
  toUpdateDto,
  type CrmModulFormValues,
} from "../formMappers";

const CrmModulDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const isEditMode = Boolean(id);
  const [formValues, setFormValues] = useState<CrmModulFormValues>(emptyCrmModulFormValues());
  const [workCompanies, setWorkCompanies] = useState<WorkCompanyDto[]>([]);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        setLoading(true);
        const conf = getConfiguration();
        const companyApi = new WorkCompanyApi(conf);
        const companyResponse = await companyApi.apiWorkCompanyGet();
        const companies = companyResponse.data ?? [];
        setWorkCompanies(companies);

        if (id) {
          const crmApi = new CrmModulsApi(conf);
          const response = await crmApi.apiCrmModulsIdGet(id);
          setFormValues(crmModulDtoToFormValues(response.data, companies));
        } else {
          setFormValues(emptyCrmModulFormValues());
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

  const handleSave = async () => {
    if (!formValues.workCompany?.id) {
      dispatchAlert({ message: "Şirket seçimi zorunludur.", type: "error" });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      const api = new CrmModulsApi(getConfiguration());

      if (id) {
        await api.apiCrmModulsIdPut(id, toUpdateDto(formValues));
        dispatchAlert({ message: "CRM kaydı başarıyla güncellendi.", type: "success" });
      } else {
        await api.apiCrmModulsPost(toCreateDto(formValues));
        dispatchAlert({ message: "CRM kaydı başarıyla oluşturuldu.", type: "success" });
      }

      navigate("/crmModul");
    } catch {
      dispatchAlert({ message: "İşlem sırasında hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-4 mx-auto pb-6 max-w-6xl px-1">
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
                  ? "Mevcut kayıt bilgilerini güncelleyin."
                  : "Yeni bir potansiyel müşteri kaydı oluşturun."}
              </p>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-sm text-slate-500 text-center py-12">Yükleniyor...</p>
            ) : (
              <CrmModulFormFields
                values={formValues}
                workCompanies={workCompanies}
                onChange={setFormValues}
              />
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
              disabled={loading || !formValues.workCompany?.id}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              <Save className="size-4" />
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CrmModulDetailPage;
