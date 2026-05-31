import { ensureSyncfusionLicense } from "utils/syncfusionInit";
ensureSyncfusionLicense();
import { PerformanceCyclesApi, PerformanceCyclesListDto, Quarter } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { CalendarDays, ChevronLeft, Save } from "lucide-react";
import { cn } from "lib/utils";

// ─── Static data ──────────────────────────────────────────────────────────────

const quarters = [
  { label: "1. Çeyrek", value: Quarter.NUMBER_1 },
  { label: "2. Çeyrek", value: Quarter.NUMBER_2 },
  { label: "3. Çeyrek", value: Quarter.NUMBER_3 },
  { label: "4. Çeyrek", value: Quarter.NUMBER_4 },
];

const statusOptions = [
  { id: 0, label: "Pasif" },
  { id: 1, label: "Aktif" },
];

// ─── Shared field wrapper ─────────────────────────────────────────────────────

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    {children}
  </div>
);

// ─── Shared select styling ────────────────────────────────────────────────────

const selectClass = cn(
  "w-full h-9 appearance-none bg-white border border-slate-200 text-slate-700 px-3 pr-8 rounded-lg text-sm",
  "shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 hover:border-teal-400 focus:border-teal-400",
  "transition-all duration-200 cursor-pointer"
);

// ─── Component ────────────────────────────────────────────────────────────────

function DonemTanimlamaEditCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatchBusy = useBusy();

  const [donemForm, setDonemForm] = useState<PerformanceCyclesListDto>({
    id: "",
    name: "",
    year: 0,
    quarterNumber: Quarter.NUMBER_1,
    status: false,
    startDate: "",
    endDate: "",
  });

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchByID = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      let response = await apiInstance.apiPerformanceCyclesGetPerformanceCycleByIdIdGet(id);
      setDonemForm((prev) => ({ ...prev, ...response.data }));
    } catch (error) {
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    if (id) fetchByID(id);
  }, [id]);

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      if (donemForm.id) {
        apiInstance.apiPerformanceCyclesUpdatePerformanceCyclePut(donemForm);
      } else {
        let createForm: Omit<PerformanceCyclesListDto, "id" | "createdDate"> = donemForm;
        apiInstance.apiPerformanceCyclesPerformanceCycleInsertPost(createForm);
      }
      navigate("/donemTanimlama");
    } catch (e) {
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-2 mx-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center shadow-sm shrink-0">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                {id ? "Mevcut Dönemi Düzenle" : "Yeni Dönem Oluştur"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {id ? "Dönem bilgilerini güncelleyin" : "Yeni bir performans dönemi tanımlayın"}
              </p>
            </div>
          </div>

          {/* ── Form ── */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">

              {/* LEFT COLUMN */}
              {/* Dönem Adı */}
              <FormField label="Dönem Adı">
                <Input
                  value={donemForm.name}
                  onChange={(e) => setDonemForm({ ...donemForm, name: e.target.value })}
                  placeholder="Dönem adını giriniz"
                  className="h-9 border-slate-200 focus:border-teal-400 focus:ring-teal-100"
                />
              </FormField>

              {/* Yıl */}
              <FormField label="Yıl">
                <Input
                  type="number"
                  value={donemForm.year || ""}
                  onChange={(e) =>
                    setDonemForm({ ...donemForm, year: Number(e.target.value) })
                  }
                  placeholder="Yıl giriniz"
                  className="h-9 border-slate-200 focus:border-teal-400 focus:ring-teal-100"
                />
              </FormField>

              {/* Çeyrek */}
              <FormField label="Çeyrek">
                <div className="relative">
                  <select
                    value={donemForm.quarterNumber ?? ""}
                    onChange={(e) =>
                      setDonemForm({
                        ...donemForm,
                        quarterNumber: e.target.value as unknown as Quarter,
                      })
                    }
                    className={selectClass}
                  >
                    {quarters.map((q) => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </FormField>

              {/* Durum */}
              <FormField label="Durum">
                <div className="relative">
                  <select
                    value={donemForm.status === true ? 1 : 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDonemForm({ ...donemForm, status: val === 1 });
                    }}
                    className={selectClass}
                  >
                    {statusOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </FormField>

              {/* Başlangıç Tarihi */}
              <FormField label="Başlangıç Tarihi">
                <Input
                  type="date"
                  value={donemForm.startDate?.split("T")[0] ?? ""}
                  onChange={(e) =>
                    setDonemForm({ ...donemForm, startDate: e.target.value })
                  }
                  className="h-9 border-slate-200 focus:border-teal-400 focus:ring-teal-100"
                />
              </FormField>

              {/* Bitiş Tarihi */}
              <FormField label="Bitiş Tarihi">
                <Input
                  type="date"
                  value={donemForm.endDate?.split("T")[0] ?? ""}
                  onChange={(e) =>
                    setDonemForm({ ...donemForm, endDate: e.target.value })
                  }
                  className="h-9 border-slate-200 focus:border-teal-400 focus:ring-teal-100"
                />
              </FormField>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-2.5 mt-10 pt-5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/donemTanimlama")}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Geri Dön
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm gap-1.5"
              >
                <Save className="w-4 h-4" />
                Kaydet
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default DonemTanimlamaEditCreate;
