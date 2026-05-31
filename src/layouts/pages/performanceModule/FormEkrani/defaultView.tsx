import {
  ActiveCycleDto,
  PerformanceCyclesApi,
  PerformanceCyclesListDto,
  PerformanceFormListDto,
  PerformanceFormsApi,
  Quarter,
  UserApi,
  UserAppDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import {
  Calendar,
  FileText,
  Eye,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserIcon,
  HelpCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import banner from "../../../../assets/images/banner.jpeg";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AimDialog, { AimRow } from "./aimDialog";

// shadcn/ui
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";

// ─── Component ────────────────────────────────────────────────────────────────

const FormEkrani = () => {
  const [cycles, setCycles] = useState<PerformanceCyclesListDto[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCyclesListDto>({
    id: "",
    year: 0,
    quarterNumber: Quarter.NUMBER_1,
    name: "",
    startDate: "",
    endDate: "",
    status: false,
  });
  const [activeCycle, setActiveCycle] = useState<ActiveCycleDto>({
    id: "",
    name: "",
    quarterId: 0,
    year: 0,
  });
  const [isFormCreated, setIsFormCreate] = useState<boolean>(false);

  const navigate = useNavigate();
  const [tableData, setTableData] = useState<PerformanceFormListDto[]>([]);
  const [managerTableData, setManagerTableData] = useState<PerformanceFormListDto[]>([]);
  const [userInfo, setUserInfo] = useState<UserAppDto>({});
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage1 = 10;
  const totalPages = Math.ceil(tableData.length / itemsPerPage1);
  const [openAimDialog, setOpenAimDialog] = useState(false);
  const [aimNote, setAimNote] = useState<AimRow[]>([]);
  const [currentPage2, setCurrentPage2] = useState(1);
  const totalPages2 = Math.ceil(managerTableData.length / itemsPerPage1);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleStartForm = async () => {
    if (activeCycle.id === "") {
      alert("bulunamadı");
    }
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormsApi(config);
      let response = await apiInstance.apiPerformanceFormsFormCreatePost(activeCycle.id);
      dispatchBusy({ isBusy: false });
      dispatchAlert({
        message: "Form Başarıyla Oluşturuldu",
        type: "Success",
      });
      await fetchLogTable(activeCycle.id);
      await getActiveCycle();
    } catch (error) {
      dispatchAlert({
        message: "hata",
        type: "Error",
      });
      dispatchBusy({ isBusy: false });
    }
  };

  const handleViewForm = (formId: string, readOnly: boolean = false) => {
    navigate("/performanceModule/form", {
      state: {
        formId: formId,
        isReadOnly: readOnly,
        userId: userInfo.id,
      },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Çalışan Değerlendirmesi":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "1. Yönetici Değerlendirmesi":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "2. Yönetici Değerlendirmesi":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-green-50 text-green-700 border border-green-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Çalışan Değerlendirmesi":
        return <Clock className="w-4 h-4" />;
      case "1. Yönetici Değerlendirmesi":
        return <AlertCircle className="w-4 h-4" />;
      case "2. Yönetici Değerlendirmesi":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const fetchLogTable = async (cycleId: string) => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormsApi(config);
      let response = await apiInstance.apiPerformanceFormsGetLoginNameFormListGet(cycleId);
      console.log("logTable", response.data);
      setTableData(response.data);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchAlert({
        message: "hata",
        type: "Error",
      });
      dispatchBusy({ isBusy: false });
    }
  };

  const getActiveCycle = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      let apiInstance2 = new PerformanceFormsApi(config);
      let response = await apiInstance.apiPerformanceCyclesGetActiveCycleGet();
      console.log("1", response.data);
      setActiveCycle(response.data);
      setSelectedCycle(response.data);
      let response2 = await apiInstance2.apiPerformanceFormsCycleFormIsCreatedGet(response.data.id);
      setIsFormCreate(response2.data);
      console.log("oluşr", response2.data);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchBusy({ isBusy: false });
      dispatchAlert({
        message: "hata",
        type: "Error",
      });
    }
  };

  const handleCloseAimDialog = () => {
    setOpenAimDialog(false);
    setAimNote([]);
  };

  const getCycles = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceCyclesApi(config);
      let response = await apiInstance.apiPerformanceCyclesGetYearAllPerformanceCyclesGet();
      console.log("cycles", response.data);
      setCycles(response.data);
    } catch (error) {
      dispatchBusy({ isBusy: false });
      dispatchAlert({
        message: "hata",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const getUserInfo = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new UserApi(config);
      let response = await apiInstance.apiUserGetLoginUserDetailGet();
      console.log("kullanıcı bilgileri", response.data);
      setUserInfo(response.data);
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchBusy({ isBusy: false });
      dispatchAlert({
        message: "hata",
        type: "Error",
      });
    }
  };

  useEffect(() => {
    getActiveCycle();
    getCycles();
    getUserInfo();
  }, []);

  useEffect(() => {
    if (selectedCycle.id !== "") {
      fetchLogTable(selectedCycle.id);
    } else if (activeCycle.id !== "") {
      fetchLogTable(activeCycle.id);
    }
  }, [selectedCycle.id, activeCycle.id]);

  const handleAimForm = async (formId: string, rows: AimRow[]) => {
    if (rows.length === 0) {
      dispatchAlert({
        message: "En az bir hedef satırı eklemelisiniz",
        type: "Error",
      });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormsApi(config);
      const jsonString = JSON.stringify(rows);
      let response = await apiInstance.apiPerformanceFormsUpdateAimFormPut(formId, jsonString);
      setAimNote(rows);
      dispatchAlert({
        message: "Hedef başarılı şekilde güncellendi",
        type: "Success",
      });
      setOpenAimDialog(false);
      handleCloseAimDialog();
      fetchLogTable(selectedCycle.id);
    } catch (error) {
      dispatchAlert({
        message: "Hedef güncellerken bir hata oluştu",
        type: "Error",
      });
      dispatchBusy({ isBusy: false });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("");

  const noActiveCycle =
    activeCycle.id === "" || activeCycle.id === "00000000-0000-0000-0000-000000000000";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
        <div className="mx-auto space-y-8">

          {/* ── Page header ── */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-800 mb-1">
              Performans Değerlendirme Sistemi
            </h1>
            <p className="text-md text-slate-600">
              Performans formlarınızı yönetin ve değerlendirme sürecinizi takip edin
            </p>
          </div>

          {/* ── Top grid: Banner + Active Cycle card ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Banner */}
            <div className="lg:col-span-3">
              <img
                src={banner}
                alt="banner"
                className="w-full h-60 object-cover rounded-xl shadow-sm"
              />
            </div>

            {/* Active Cycle card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden h-60">
                <div className="bg-blue-600 px-6 py-5 h-full flex flex-col">

                  {/* Card header row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h2 className="text-base font-bold text-white">Aktif Dönem</h2>
                    </div>

                    {/* Status / action icon */}
                    <TooltipProvider>
                      {!isFormCreated ? (
                        noActiveCycle ? (
                          /* No active cycle */
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="bg-blue-100 p-1.5 rounded-lg border border-blue-200 cursor-default">
                                <HelpCircle className="w-5 h-5 text-slate-600" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="p-0 bg-transparent border-none shadow-none"
                            >
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center max-w-[200px]">
                                <p className="text-sm text-slate-800 leading-relaxed">
                                  Aktif Dönem Bulunamamıştır.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          /* Active cycle – start form */
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={handleStartForm}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold p-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 flex items-center justify-center"
                                aria-label="Form oluştur"
                              >
                                <Plus className="w-5 h-5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="p-0 bg-transparent border-none shadow-none"
                            >
                              <div className="bg-sky-50 border border-sky-200/50 rounded-lg p-4 text-center max-w-[220px]">
                                <p className="text-sm text-sky-700 leading-relaxed">
                                  Form talebinizi oluşturarak değerlendirme sürecini
                                  başlatabilirsiniz.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )
                      ) : (
                        /* Form already created */
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-emerald-100 p-1.5 rounded-lg border border-emerald-300 cursor-default">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="p-0 bg-transparent border-none shadow-none"
                          >
                            <div className="bg-emerald-50 border border-emerald-200/50 rounded-lg p-4 text-center max-w-[200px]">
                              <h3 className="text-sm font-bold text-emerald-800 mb-1">
                                Talep Oluşturuldu
                              </h3>
                              <p className="text-xs text-emerald-600">
                                Aktif döneme ait talebiniz bulunmaktadır
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </div>

                  {/* Cycle info */}
                  <div className="flex-1 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 w-full text-center">
                      <p className="text-white/80 text-xs mb-1.5">Değerlendirme Dönemi</p>
                      <h3 className="text-2xl font-bold text-white">
                        {activeCycle.year} — {activeCycle.quarterId}. Çeyrek
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Form Records Table ── */}
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">

            {/* Table header */}
            <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-400/10 p-2.5 rounded-lg border border-slate-100">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-700">Form Kayıtları</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Tüm performans değerlendirme formlarınız
                  </p>
                </div>
              </div>

              {/* Period selector */}
              <div className="flex flex-col w-full max-w-xs gap-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">
                  Dönem Seçiniz
                </label>
                <div className="relative">
                  <select
                    value={selectedCycle.id}
                    onChange={(e: any) => {
                      const id = e.target.value;
                      const cycle = cycles.find((c) => c.id === id);
                      console.log("cycle", cycle);
                      setSelectedCycle(cycle);
                    }}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 hover:border-indigo-400 focus:border-indigo-400 transition-all duration-200 cursor-pointer"
                  >
                    {cycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.year} - Q{cycle.quarterNumber}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Çalışan",
                      "Dönem",
                      "Dönem Hedefi",
                      "Hedef Durumu",
                      "1. Yönetici",
                      "2. Yönetici",
                      "Durum",
                      "İşlemler",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-slate-100">
                  {tableData.length > 0 ? (
                    tableData
                      .slice(
                        (currentPage - 1) * itemsPerPage1,
                        (currentPage - 1) * itemsPerPage1 + itemsPerPage1
                      )
                      .map((form) => (
                        <tr
                          key={form.id}
                          className="hover:bg-slate-50 transition-colors duration-150"
                        >
                          {/* Employee */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                                {getInitials(form.employeeName)}
                              </div>
                              <span className="text-sm font-semibold text-slate-800">
                                {form.employeeName}
                              </span>
                            </div>
                          </td>

                          {/* Period */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">
                                {form.year} - Q{form.quarterNumber}
                              </span>
                              <span className="text-xs text-slate-400 mt-0.5">
                                {form.cycleName}
                              </span>
                            </div>
                          </td>

                          {/* Target button */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              disabled={!form?.targetContent?.trim()}
                              onClick={() => {
                                if (!form?.targetContent?.trim()) return;
                                setOpenAimDialog(true);
                                setFullName(form.employeeName);
                                try {
                                  const parsed = form.targetContent
                                    ? JSON.parse(form.targetContent)
                                    : [];
                                  const normalized = Array.isArray(parsed)
                                    ? parsed.map((item: any, index: number) => ({
                                        id: item.id ?? index + 1,
                                        kpi: item.kpi ?? "",
                                        kpiBoyutu: item.kpiBoyutu ?? "",
                                        olcumBoyutu: item.olcumBoyutu ?? "",
                                        hs: item.hs ?? "",
                                        durum: item.durum ?? "Başarılı",
                                        notlar: item.notlar ?? "",
                                        visible: item.visible ?? true,
                                        createdBy: item.createdBy ?? "",
                                      }))
                                    : [];
                                  setAimNote(normalized);
                                } catch {
                                  setAimNote([]);
                                }
                                setSelectedFormId(form.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                form?.targetContent?.trim()
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                                  : "bg-slate-100 text-slate-300 cursor-not-allowed"
                              }`}
                            >
                              Hedeflerim
                            </button>
                          </td>

                          {/* Target status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  form?.targetContent?.trim() ? "bg-emerald-500" : "bg-red-400"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  form?.targetContent?.trim()
                                    ? "text-emerald-700"
                                    : "text-red-600"
                                }`}
                              >
                                {form?.targetContent?.trim()
                                  ? "Hedefler Mevcut"
                                  : "Hedef Belirlenmedi"}
                              </span>
                            </div>
                          </td>

                          {/* Manager 1 */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                                {getInitials(form.managerOneName)}
                              </div>
                              <span className="text-sm text-slate-700">
                                {form.managerOneName}
                              </span>
                            </div>
                          </td>

                          {/* Manager 2 */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs shrink-0">
                                {getInitials(form.managerTwoName)}
                              </div>
                              <span className="text-sm text-slate-700">
                                {form.managerTwoName}
                              </span>
                            </div>
                          </td>

                          {/* Status badge */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg ${getStatusColor(
                                form.performanceFormStatusDescription
                              )}`}
                            >
                              {getStatusIcon(form.performanceFormStatusDescription)}
                              {form.performanceFormStatusDescription}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {form.performanceCycleId === activeCycle.id ? (
                              form.isAnswered ? (
                                <button
                                  onClick={() => handleViewForm(form.id, true)}
                                  className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg text-xs transition-all duration-200 border border-slate-300"
                                >
                                  <Eye className="w-4 h-4" />
                                  Formu Görüntüle
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleViewForm(form.id)}
                                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-xs transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  Formu Başlat
                                </button>
                              )
                            ) : (
                              <button
                                onClick={() => handleViewForm(form.id, true)}
                                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg text-xs transition-all duration-200 border border-slate-300"
                              >
                                <Eye className="w-4 h-4" />
                                Geçmiş Formu Görüntüle
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-slate-100 p-6 rounded-2xl">
                            <FileText className="w-14 h-14 text-slate-300" />
                          </div>
                          <p className="text-base font-semibold text-slate-700">
                            Henüz form kaydı bulunmamaktadır
                          </p>
                          <p className="text-sm text-slate-400">
                            Form talebi oluşturarak süreci başlatabilirsiniz
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/40">
                <span className="text-xs text-slate-500">
                  Toplam{" "}
                  <span className="font-semibold text-slate-700">{tableData.length}</span> kayıt
                  — Sayfa {currentPage} / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-slate-300 disabled:cursor-default text-slate-600 hover:bg-slate-100"
                    aria-label="Önceki sayfa"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Önceki
                  </button>

                  <button
                    disabled
                    className="w-9 h-9 rounded-full text-sm font-semibold bg-blue-600 text-white shadow-sm"
                  >
                    {currentPage}
                  </button>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-slate-300 disabled:cursor-default text-slate-600 hover:bg-slate-100"
                    aria-label="Sonraki sayfa"
                  >
                    Sonraki
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aim dialog */}
      <AimDialog
        open={openAimDialog}
        onClose={handleCloseAimDialog}
        initialRows={aimNote}
        isEdit={false}
        onSave={(rows: AimRow[]) => {
          handleAimForm(selectedFormId, rows);
        }}
        fullName={fullName}
        loginName={userInfo.userName}
      />
    </DashboardLayout>
  );
};

export default FormEkrani;
