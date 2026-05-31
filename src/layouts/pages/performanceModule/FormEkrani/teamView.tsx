import {
  ActiveCycleDto,
  PerformanceCyclesApi,
  PerformanceCyclesListDto,
  PerformanceFormAnswersApi,
  PerformanceFormListDto,
  PerformanceFormsApi,
  PerformanceFormStatus,
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
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  UsersIcon,
  PlayCircle,
  Eye,
  Calendar,
  X,
  LoaderCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import banner from "../../../../assets/images/banner.jpeg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import AimDialog, { AimRow } from "./aimDialog";
import { cn } from "lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      return <Clock className="w-3.5 h-3.5" />;
    case "1. Yönetici Değerlendirmesi":
      return <AlertCircle className="w-3.5 h-3.5" />;
    case "2. Yönetici Değerlendirmesi":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────

function TeamFormEkrani() {
  const [cycles, setCycles] = useState<PerformanceCyclesListDto[]>([]);
  const [managerTableData, setManagerTableData] = useState<PerformanceFormListDto[]>([]);
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [currentPage2, setCurrentPage2] = useState(1);
  const itemsPerPage1 = 10;
  const totalPages2 = Math.ceil(managerTableData.length / itemsPerPage1);
  const [isFormCreated, setIsFormCreate] = useState<boolean>(false);
  const [activeCycle, setActiveCycle] = useState<ActiveCycleDto>({
    id: "",
    name: "",
    quarterId: 0,
    year: 0,
  });
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCyclesListDto>({
    id: "",
    year: 0,
    quarterNumber: Quarter.NUMBER_1,
    name: "",
    startDate: "",
    endDate: "",
    status: false,
  });

  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserAppDto>({});
  const [openRejectDialog, setOpenRejectDialog] = useState<boolean>(false);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState<string>("");
  const [openAimDialog, setOpenAimDialog] = useState(false);
  const [aimNote, setAimNote] = useState<AimRow[]>([]);
  const [fullName, setFullName] = useState<string>("");
  const [isTargetPerson, setIsTargetPerson] = useState<boolean>(false);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchManagerLogTable = async (cycleId: string) => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormsApi(config);
      let response = await apiInstance.apiPerformanceFormsGetLoginNameManagerFormListGet(cycleId);
      console.log("managerLogTable", response.data);
      setManagerTableData(response.data);
      setIsTargetPerson(response.data.some((form) => form.isTargetPerson));
      dispatchBusy({ isBusy: false });
    } catch (error) {
      dispatchAlert({ message: "hata", type: "Error" });
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
      dispatchAlert({ message: "hata", type: "Error" });
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
      dispatchAlert({ message: "hata", type: "Error" });
    }
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
      dispatchAlert({ message: "hata", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    getCycles();
    getActiveCycle();
    getUserInfo();
  }, []);

  useEffect(() => {
    if (selectedCycle.id !== "") {
      fetchManagerLogTable(selectedCycle.id);
    } else if (activeCycle.id !== "") {
      fetchManagerLogTable(activeCycle.id);
    }
  }, [selectedCycle, activeCycle.id]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleViewForm = (formId: string, readOnly: boolean = false) => {
    navigate("/performanceModule/form", {
      state: {
        formId,
        isReadOnly: readOnly,
        userId: userInfo.id,
      },
    });
  };

  const handlePageChange2 = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages2) {
      setCurrentPage2(pageNumber);
    }
  };

  const handleOpenRejectDialog = (formId: string) => {
    setSelectedFormId(formId);
    setOpenRejectDialog(true);
    setRejectReason("");
  };

  const handleCloseRejectDialog = () => {
    setOpenRejectDialog(false);
    setSelectedFormId("");
    setRejectReason("");
  };

  const handleCloseAimDialog = () => {
    setOpenAimDialog(false);
    setAimNote([]);
  };

  const handleOpenAimDialog = () => {
    setOpenAimDialog(true);
    setAimNote([]);
  };

  const handleRejectForm = async (formId: string, reason: string) => {
    if (reason.trim().length < 10) {
      dispatchAlert({
        message: "Red sebebi en az 10 karakter olmalıdır",
        type: "Error",
      });
      return;
    }
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormAnswersApi(config);
      let response = await apiInstance.apiPerformanceFormAnswersSendFormFormIdPut(
        formId,
        false,
        reason
      );
      console.log("response", response.data);
      dispatchAlert({
        message: "Form başarılı şekilde reddedildi",
        type: "Success",
      });
      setOpenRejectDialog(false);
      await fetchManagerLogTable(selectedCycle.id ?? activeCycle.id);
      handleCloseRejectDialog();
    } catch (error) {
      dispatchAlert({
        message: "Form reddedilirken bir hata oluştu",
        type: "Error",
      });
      dispatchBusy({ isBusy: false });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

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
      await apiInstance.apiPerformanceFormsUpdateAimFormPut(formId, jsonString);
      setAimNote(rows);
      dispatchAlert({
        message: "Hedef başarılı şekilde güncellendi",
        type: "Success",
      });
      setOpenAimDialog(false);
      handleCloseAimDialog();
      fetchManagerLogTable(selectedCycle.id);
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="mx-auto space-y-6">

          {/* ── Page heading ── */}
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight">
              Ekip Performans Değerlendirme Sistemi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ekibinize ait formları yönetin ve değerlendirme sürecini takip edin
            </p>
          </div>

          {/* ── Banner + Active cycle row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Banner */}
            <div className="lg:col-span-3 rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <img
                src={banner}
                alt="banner"
                className="w-full h-56 object-cover"
              />
            </div>

            {/* Active cycle card */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-56 flex flex-col">
              <div className="bg-blue-600 px-5 py-4 flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-lg shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-base font-bold text-white">Aktif Dönem</h2>
              </div>
              <div className="flex-1 flex items-center justify-center px-5 py-4">
                <div className="bg-blue-50 rounded-xl p-4 w-full text-center border border-blue-100">
                  <p className="text-xs text-slate-500 mb-1.5 uppercase tracking-wide font-medium">
                    Değerlendirme Dönemi
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {activeCycle.year} — {activeCycle.quarterId}. Çeyrek
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Team forms table ── */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

            {/* Table header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200 shrink-0">
                  <UsersIcon className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-700">Ekip Form Kayıtları</h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Ekibe ait tüm performans değerlendirme formlarınız
                  </p>
                </div>
              </div>

              {/* Period selector */}
              <div className="flex flex-col gap-1.5 w-full max-w-xs">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 h-9 py-0 px-3 pr-8 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 hover:border-indigo-400 focus:border-indigo-400 transition-all duration-200 cursor-pointer"
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
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200">
                    {[
                      "Çalışan",
                      "Dönem",
                      ...(isTargetPerson ? ["Dönem Hedefleri", "Hedef Durumu"] : []),
                      "1. Yönetici",
                      "2. Yönetici",
                      "Durum",
                      "İşlemler",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {managerTableData.length > 0 ? (
                    managerTableData
                      .slice(
                        (currentPage2 - 1) * itemsPerPage1,
                        (currentPage2 - 1) * itemsPerPage1 + itemsPerPage1
                      )
                      .map((form) => (
                        <tr
                          key={form.id}
                          className="hover:bg-slate-50/60 transition-colors duration-150"
                        >
                          {/* Employee */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                                {getInitials(form.employeeName)}
                              </div>
                              <span className="text-sm font-semibold text-slate-800">
                                {form.employeeName}
                              </span>
                            </div>
                          </td>

                          {/* Period */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-slate-800 block">
                              {form.year} - Q{form.quarterNumber}
                            </span>
                            <span className="text-xs text-slate-500">{form.cycleName}</span>
                          </td>

                          {/* Target columns — conditional */}
                          {form.isTargetPerson && (
                            <td className="px-5 py-3 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenAimDialog(true);
                                  setFullName(form.employeeName);
                                  try {
                                    const parsed = form.targetContent
                                      ? JSON.parse(form.targetContent)
                                      : [];
                                    const normalized = Array.isArray(parsed)
                                      ? parsed.map((item: any, idx: number) => ({
                                          id: item.id ?? idx + 1,
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
                                className={cn(
                                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap",
                                  form?.targetContent?.trim()
                                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                    : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                )}
                              >
                                {form?.targetContent?.trim() ? "Hedef Güncelle" : "Hedef Ekle"}
                              </button>
                            </td>
                          )}
                          {form.isTargetPerson && (
                            <td className="px-5 py-3 whitespace-nowrap">
                              <span
                                className={cn(
                                  "px-2.5 py-1 rounded-full text-xs font-semibold",
                                  form?.targetContent?.trim()
                                    ? "bg-green-100 text-green-700"
                                    : "bg-slate-100 text-slate-500"
                                )}
                              >
                                {form?.targetContent?.trim() ? "Hedef Girildi" : "Hedef Yok"}
                              </span>
                            </td>
                          )}

                          {/* Manager 1 */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs shrink-0">
                                {getInitials(form.managerOneName)}
                              </div>
                              <span className="text-sm text-slate-700">{form.managerOneName}</span>
                            </div>
                          </td>

                          {/* Manager 2 */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-xs shrink-0">
                                {getInitials(form.managerTwoName)}
                              </div>
                              <span className="text-sm text-slate-700">{form.managerTwoName}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg",
                                getStatusColor(form.performanceFormStatusDescription)
                              )}
                            >
                              {getStatusIcon(form.performanceFormStatusDescription)}
                              {form.performanceFormStatusDescription}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3 whitespace-nowrap">
                            <div className="flex flex-wrap items-center gap-2">
                              {/* View / Start button */}
                              {form.performanceCycleId === activeCycle.id ? (
                                form.currentPerformanceFormPersonelId === userInfo.id ? (
                                  form.isAnswered ? (
                                    <button
                                      type="button"
                                      onClick={() => handleViewForm(form.id, true)}
                                      className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg transition-all border border-slate-300"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      Formu Görüntüle
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleViewForm(form.id)}
                                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-all shadow-sm"
                                    >
                                      <PlayCircle className="w-3.5 h-3.5" />
                                      Formu Başlat/Görüntüle
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleViewForm(form.id, true)}
                                    className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg transition-all border border-slate-300"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Formu Görüntüle
                                  </button>
                                )
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleViewForm(form.id, true)}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 px-3 rounded-lg transition-all border border-slate-300"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Geçmiş Formu Görüntüle
                                </button>
                              )}

                              {/* Waiting badge */}
                              {form.currentPerformanceFormPersonelId !== userInfo.id &&
                                form.performanceFormStatus !== PerformanceFormStatus.NUMBER_3 && (
                                  <span className="inline-flex items-center gap-1.5 bg-amber-400 text-white text-xs font-medium py-1.5 px-3 rounded-lg">
                                    <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                                    Bekleniyor
                                  </span>
                                )}

                              {/* Reject button */}
                              {form.currentPerformanceFormPersonelId === userInfo.id && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenRejectDialog(form.id)}
                                  className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium py-1.5 px-3 rounded-lg transition-all border border-red-200"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Formu Reddet
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-slate-300" />
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
            {totalPages2 > 1 && (
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/30">
                <p className="text-xs text-slate-500">
                  Toplam{" "}
                  <span className="font-semibold text-slate-700">{managerTableData.length}</span>{" "}
                  kayıt — Sayfa{" "}
                  <span className="font-semibold text-slate-700">{currentPage2}</span> /{" "}
                  {totalPages2}
                </p>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePageChange2(currentPage2 - 1)}
                    disabled={currentPage2 === 1}
                    className="flex items-center h-8 w-8 justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-default transition-colors"
                    aria-label="Önceki sayfa"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 text-white text-xs font-semibold shadow-sm">
                    {currentPage2}
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePageChange2(currentPage2 + 1)}
                    disabled={currentPage2 === totalPages2}
                    className="flex items-center h-8 w-8 justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-default transition-colors"
                    aria-label="Sonraki sayfa"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Reject dialog ── */}
      <Dialog
        open={openRejectDialog}
        onOpenChange={(open) => !open && handleCloseRejectDialog()}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">
              Formu Reddet
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <p className="text-sm text-slate-500">
              Reddedilen form tekrar doldurulması için bir önceki aşamaya gönderilecektir.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Red Sebebi{" "}
                <span className="text-slate-400 font-normal">(en az 10 karakter)</span>
              </label>
              <textarea
                placeholder="Lütfen red sebebini giriniz..."
                value={rejectReason}
                onChange={(e: any) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full text-sm px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all resize-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-1">
              <button
                type="button"
                onClick={handleCloseRejectDialog}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => handleRejectForm(selectedFormId, rejectReason)}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-medium transition-colors shadow-sm"
              >
                Formu Reddet
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Aim dialog ── */}
      <AimDialog
        open={openAimDialog}
        onClose={handleCloseAimDialog}
        initialRows={aimNote}
        isEdit={true}
        onSave={(rows: AimRow[]) => handleAimForm(selectedFormId, rows)}
        fullName={fullName}
        loginName={userInfo.userName}
      />
    </DashboardLayout>
  );
}

export default TeamFormEkrani;
