import {
  PerformanceQuestionInsertDto,
  PerformanceQuestionListDto,
  PerformanceQuestionOptionInsertDto,
  PerformanceQuestionOptionsApi,
  PerformanceQuestionOptionUpdateDto,
  PerformanceQuestionsApi,
  PerformanceQuestionUpdateDto,
  QuestionOptionListDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import {
  HelpCircle,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  Save,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { cn } from "lib/utils";

// ─── Component ────────────────────────────────────────────────────────────────

function SoruCevapTanimlamaEditCreate() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditQuery = searchParams.get("isEdit");
  const isEditing = isEditQuery === "true";
  const navigate = useNavigate();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const [questionForm, setQuestionForm] = useState<PerformanceQuestionListDto>({
    id: "",
    questionText: "",
    options: [],
  });
  const [localOptions, setLocalOptions] = useState<QuestionOptionListDto[]>([]);
  const [isOptionsEmpty, setIsOptionsEmpty] = useState<boolean>(true);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const fetchByID = async () => {
    if (!id) return;
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceQuestionsApi(config);
      let response = await apiInstance.apiPerformanceQuestionsQuestionGetByIdIdGet(id);
      console.log("ilgili soruya ait alan : ", response.data);
      setQuestionForm(response.data);
      setLocalOptions([]);
      if (response.data.options && response.data.options.length > 0) {
        setIsOptionsEmpty(false);
      } else {
        setIsOptionsEmpty(true);
      }
    } catch (error) {
      dispatchAlert({
        message: "Soru bulunamadı, lütfen tekrar deneyiniz.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        await fetchByID();
      };
      fetchData();
    }
  }, [id]);

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceQuestionsApi(config);
      let apiInstance2 = new PerformanceQuestionOptionsApi(config);

      if (questionForm.id) {
        let updateHeaderText: PerformanceQuestionUpdateDto = {
          id: questionForm.id,
          questionText: questionForm.questionText,
        };
        await apiInstance.apiPerformanceQuestionsQuestionUpdatePut(updateHeaderText);

        let optionDto: PerformanceQuestionOptionInsertDto = {
          questionId: id,
          text: localOptions.map((v) => v.text),
        };
        console.log(optionDto);
        await apiInstance2.apiPerformanceQuestionOptionsOptionCreatePost(optionDto);

        dispatchAlert({
          message: "Soru Başlığı / Şıklar başarıyla güncellendi / eklendi.",
          type: "Success",
        });
        await fetchByID();
      } else {
        let createForm: PerformanceQuestionInsertDto = questionForm;
        await apiInstance.apiPerformanceQuestionsQuestionCreatePost(createForm);
        dispatchAlert({
          message: "Soru başarıyla oluşturuldu",
          type: "Success",
        });
        navigate("/questionDefination");
      }
    } catch (e) {
      dispatchAlert({
        message: "Soru oluşturulurken hata oluştu, lütfen tekrar deneyiniz.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // ── Option handlers ──────────────────────────────────────────────────────────

  const handleOptionTextChange = (optionId: string, newText: any) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, text: newText } : option
      ),
    }));
  };

  const handleLocalOptionTextChange = (optionId: string, text: string) => {
    setLocalOptions((prev) =>
      prev.map((option) => (option.id === optionId ? { ...option, text } : option))
    );
  };

  const handleLocalOptionDelete = (idToDelete: string) => {
    setLocalOptions((prev) => prev.filter((option) => option.id !== idToDelete));
  };

  const handleOptionDelete = async (optionId: any) => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceQuestionOptionsApi(config);
      await apiInstance.apiPerformanceQuestionOptionsOptionDeleteIdDelete(optionId);
      dispatchAlert({ message: "Şık başarıyla silindi", type: "Success" });
      await fetchByID();
    } catch (error) {
      dispatchAlert({
        message: "Şık silinirken hata oluştu, lütfen tekrar deneyiniz.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleSingleOptionUpdate = async (optionId: string, optionText: string) => {
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceQuestionOptionsApi(config);
      let updateOptionDto: PerformanceQuestionOptionUpdateDto = {
        id: optionId,
        text: optionText,
        questionId: id,
      };
      console.log("ilgili şıkka ait alan : ", updateOptionDto);
      await apiInstance.apiPerformanceQuestionOptionsOptionUpdatePut(updateOptionDto);
      dispatchAlert({ message: "Şık başarıyla güncellendi", type: "Success" });
      console.log("ilgili soruya ait alan : ", id);
      await fetchByID();
    } catch (error) {
      dispatchAlert({
        message: "Şık güncellenirken hata oluştu, lütfen tekrar deneyiniz.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const totalOptionsCount = questionForm.options.length + localOptions.length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-2 mx-1 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center shadow-sm shrink-0">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                {id ? "Mevcut Soruyu Düzenle" : "Yeni Soru Oluştur"}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {id
                  ? "Soru metnini ve şıklarını güncelleyin"
                  : "Yeni bir performans değerlendirme sorusu tanımlayın"}
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-8">

            {/* ── Question text ── */}
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <label className="text-sm font-medium text-slate-700">
                Soru Metni
              </label>
              <textarea
                rows={4}
                disabled={!isEditing && !!id}
                placeholder="Soru Başlığı Giriniz..."
                value={questionForm.questionText ?? ""}
                onChange={(e) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    questionText: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all resize-none disabled:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {/* ── Options section ── */}
            {questionForm.id && (
              <div>
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-700">Mevcut Şıklar</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      En fazla 5 şık eklenebilir ({totalOptionsCount}/5)
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={totalOptionsCount >= 5}
                    onClick={() => {
                      setLocalOptions((prev) => {
                        const newId = `temp-${Date.now()}-${Math.floor(
                          Math.random() * 1000
                        )}`;
                        return [...prev, { id: newId, text: "Yeni Şık" }];
                      });
                    }}
                    className={cn(
                      "gap-1.5 text-xs",
                      totalOptionsCount >= 5
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed hover:bg-slate-100"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Yeni Şık Oluştur
                  </Button>
                </div>

                {/* Existing options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {questionForm.options.map((v, i) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/60 shadow-xs hover:shadow-sm transition-shadow"
                    >
                      {/* Option letter badge */}
                      <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>

                      <Input
                        type="text"
                        value={v.text}
                        onChange={(e) => handleOptionTextChange(v.id, e.target.value)}
                        placeholder={`${i + 1}. şık metnini girin`}
                        className="h-8 text-xs border-slate-200 focus:border-purple-400 focus:ring-purple-100 flex-1"
                      />

                      {/* Update */}
                      {!isOptionsEmpty && (
                        <button
                          type="button"
                          onClick={() => handleSingleOptionUpdate(v.id, v.text)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors shrink-0"
                          title="Şıkkı güncelle"
                          aria-label="Şıkkı güncelle"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleOptionDelete(v.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                        title="Şıkkı sil"
                        aria-label="Şıkkı sil"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Local (new) options */}
                  {localOptions.map((v, i) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2 p-3 rounded-xl border border-purple-200 bg-purple-50/40 shadow-xs hover:shadow-sm transition-shadow"
                    >
                      {/* Option letter badge */}
                      <span className="w-6 h-6 rounded-md bg-purple-200 text-purple-800 flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + questionForm.options.length + i)}
                      </span>

                      <Input
                        type="text"
                        value={v.text}
                        onChange={(e) => handleLocalOptionTextChange(v.id, e.target.value)}
                        placeholder={`${questionForm.options.length + i + 1}. şık metnini girin`}
                        className="h-8 text-xs border-purple-200 focus:border-purple-400 focus:ring-purple-100 flex-1 bg-white"
                      />

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleLocalOptionDelete(v.id)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                        title="Şıkkı kaldır"
                        aria-label="Yeni şıkkı kaldır"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Empty state */}
                  {totalOptionsCount === 0 && (
                    <div className="sm:col-span-2 py-8 flex flex-col items-center gap-2 text-slate-400 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                      <HelpCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm">Henüz şık eklenmedi</p>
                      <p className="text-xs">Yukarıdaki butonu kullanarak şık ekleyebilirsiniz</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-2.5 pt-5 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/questionDefination")}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Geri Dön
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm gap-1.5"
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

export default SoruCevapTanimlamaEditCreate;
