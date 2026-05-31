import {
  AnswerDto,
  PerformanceFormAnswersApi,
  PerformanceFormListDto,
  PerformanceFormsApi,
  PerformanceFormStatus,
  QuestionAndAnswerDto,
  UserApi,
  UserAppDto,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { cn } from "lib/utils";
import profile from "../../../../assets/images/profile-icon.png";

// ─── Types ────────────────────────────────────────────────────────────────────

type ISelectedOptions = {
  questions: {
    questionID: string;
    questionAnswer: string;
  }[];
}[];

type IDescription = {
  description: string;
}[];

type Role = "employee" | "firstManager" | "secondManager";

// ─── Description pool data ────────────────────────────────────────────────────

const DESCRIPTION_SECTIONS = [
  {
    title: "Genel Performans",
    color: "blue",
    items: [
      "Belirlenen hedefleri zamanında ve beklenen kalite standartlarında yerine getirmektedir.",
      "Sorumluluk alanında istikrarlı bir performans sergilemektedir.",
      "Görevlerini sahiplenme düzeyi yüksektir ve sonuç odaklı çalışmaktadır.",
      "Performansı genel olarak pozisyon beklentileriyle uyumludur.",
    ],
  },
  {
    title: "Güçlü Yönler",
    color: "green",
    items: [
      "İletişim becerileri güçlü olup ekip içi iş birliğini olumlu yönde desteklemektedir.",
      "Analitik düşünme yetkinliği sayesinde karşılaşılan sorunlara etkin çözümler üretmektedir.",
      "Değişen önceliklere hızlı uyum sağlayabilmektedir.",
      "Teknik bilgi ve uzmanlığı, görev gereksinimlerini karşılamaktadır.",
    ],
  },
  {
    title: "Gelişim Alanları",
    color: "amber",
    items: [
      "Zaman yönetimi konusunda gelişim alanları bulunmaktadır.",
      "Önceliklendirme ve planlama süreçlerini daha sistematik hale getirmesi önerilir.",
      "Geri bildirim alma ve uygulama konusunda daha proaktif olması beklenmektedir.",
      "Yoğun dönemlerde stres yönetimi becerilerini geliştirmesi faydalı olacaktır.",
    ],
  },
  {
    title: "Hedef ve Potansiyel",
    color: "indigo",
    items: [
      "Mevcut pozisyonunda beklenen performansı sürdürmektedir.",
      "Artan sorumlulukları üstlenebilecek potansiyele sahiptir.",
      "Kariyer gelişimi açısından yeni proje ve sorumluluklarla desteklenmesi önerilir.",
    ],
  },
  {
    title: "Genel Değerlendirme ve Öneri",
    color: "rose",
    items: [
      "Genel performansı olumlu değerlendirilmekte olup, gelişim alanlarına yönelik aksiyonlar ile daha yüksek katkı sağlaması beklenmektedir.",
      "Belirlenen gelişim alanları doğrultusunda desteklenmesi önerilir.",
    ],
  },
];

const COMPETENCY_SUBSECTIONS = [
  {
    sub: "İletişim",
    items: [
      "Fikirlerini açık ve net bir şekilde ifade etmektedir.",
      "Paydaşlarla iletişiminde daha proaktif olması beklenmektedir.",
    ],
  },
  {
    sub: "Ekip Çalışması",
    items: [
      "Ekip hedeflerine katkı sağlamakta ve iş birliğine açıktır.",
      "Ekip içi koordinasyonda zaman zaman daha fazla inisiyatif alması önerilir.",
    ],
  },
  {
    sub: "Problem Çözme",
    items: [
      "Karşılaşılan problemleri analiz ederek kalıcı çözümler geliştirmektedir.",
      "Alternatif çözüm üretme konusunda gelişim potansiyeli bulunmaktadır.",
    ],
  },
];

// ─── Color maps ───────────────────────────────────────────────────────────────

const BADGE_COLOR: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  amber: "bg-amber-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
  purple: "bg-purple-500",
};

const HOVER_COLOR: Record<string, string> = {
  blue: "hover:bg-blue-50 hover:border-blue-300",
  green: "hover:bg-green-50 hover:border-green-300",
  amber: "hover:bg-amber-50 hover:border-amber-300",
  indigo: "hover:bg-indigo-50 hover:border-indigo-300",
  rose: "hover:bg-rose-50 hover:border-rose-300",
  purple: "hover:bg-purple-50 hover:border-purple-300",
};

// ─── Component ────────────────────────────────────────────────────────────────

function PerformanceModule() {
  const location = useLocation();
  const stateFormId = location.state?.formId;
  const stateIsReadOnly = location.state?.isReadOnly;
  const stateUserId = location.state?.userId;
  const stateIsAdmin = location.state?.isAdmin;

  const sessionFormId = sessionStorage.getItem("pformId");
  const sessionIsReadOnly = sessionStorage.getItem("pisReadOnly");
  const sessionUserId = sessionStorage.getItem("puserId");
  const sessionIsAdmin = sessionStorage.getItem("pisAdmin");

  const id = stateFormId ?? sessionFormId;
  const isReadOnly = stateIsReadOnly ?? sessionIsReadOnly === "true";
  const userId = stateUserId ?? sessionUserId;
  const isAdmin = stateIsAdmin ?? sessionIsAdmin === "true";

  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 15;
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const [formDetailData, setFormDetailData] = useState<PerformanceFormListDto>();
  const [description, setDescription] = useState<IDescription>([]);
  const [selectedOptions, setSelectedOptions] = useState<ISelectedOptions>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [userRole, setUserRole] = useState<Role>("employee");
  const [userIndex, setUserIndex] = useState<number>(0);
  const [isSelectDescriptionOpen, setIsSelectDescriptionOpen] = useState<boolean>(false);
  const [improvementSuggestion, setImprovementSuggestion] = useState<string>("");

  useEffect(() => {
    console.log("selcted", selectedOptions);
    console.log("description", description);
    console.log("userRole", userRole);
  }, [selectedOptions, description]);

  const handleOpenSelectDescription = () => setIsSelectDescriptionOpen(true);
  const handleCloseSelectDescription = () => setIsSelectDescriptionOpen(false);

  const handleDescSelection = (description1: string) => {
    if (description[selectedIndex]?.description.trim().length >= 0) {
      updateDescriptionAtIndex(
        selectedIndex,
        description[selectedIndex]?.description + " " + description1
      );
    } else {
      updateDescriptionAtIndex(selectedIndex, description1);
    }
    handleCloseSelectDescription();
  };

  const fetchData = async () => {
    if (!id) return;
    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormsApi(config);
      let response = await apiInstance.apiPerformanceFormsGetByFormIdFormIdGet(id, isAdmin);
      console.log("getByFormID", response.data);
      setFormDetailData(response.data);

      if (response.data.allowedOwnerCount == 1) {
        setUserRole("employee");
        setSelectedIndex(0);
        setUserIndex(0);
      } else if (response.data.allowedOwnerCount == 2) {
        setUserRole("firstManager");
        setSelectedIndex(1);
        setUserIndex(1);
      } else if (response.data.allowedOwnerCount == 3) {
        setUserRole("secondManager");
        setSelectedIndex(2);
        setUserIndex(2);
      }

      if (response.data.improvementSuggestion) {
        setImprovementSuggestion(response.data.improvementSuggestion);
      }

      if (response.data) {
        const updatedDescriptions = [...description];

        const employeeEval = response.data.generalEvaluations?.[0];
        if (!updatedDescriptions[0]) updatedDescriptions[0] = { description: "" };
        updatedDescriptions[0].description = employeeEval?.content ?? "";

        const managerEvals = response.data.managerGeneralEvaluations ?? [];
        if (!updatedDescriptions[1]) updatedDescriptions[1] = { description: "" };
        updatedDescriptions[1].description = managerEvals[0]?.content ?? "";

        if (!updatedDescriptions[2]) updatedDescriptions[2] = { description: "" };
        updatedDescriptions[2].description = managerEvals[1]?.content ?? "";

        setDescription(updatedDescriptions);
      }

      if (response.data.questions) {
        const initialEmployeeAnswers = response.data.questions
          .map((q) => {
            if (q.employeeAnswerOptionId && q.employeeAnswerOptionText) {
              return { questionID: q.id, questionAnswer: q.employeeAnswerOptionId };
            }
            return null;
          })
          .filter(Boolean) as { questionID: string; questionAnswer: string }[];

        const initialOneManagerAnswers = response.data.managerQuestions
          .map((q) => {
            if (q.manager1AnswerOptionId && q.manager1AnswerOptionText) {
              return { questionID: q.id, questionAnswer: q.manager1AnswerOptionId };
            }
            return null;
          })
          .filter(Boolean) as { questionID: string; questionAnswer: string }[];

        const initialSecondManagerAnswers = response.data.managerQuestions
          .map((q) => {
            if (q.manager2AnswerOptionId && q.manager2AnswerOptionText) {
              return { questionID: q.id, questionAnswer: q.manager2AnswerOptionId };
            }
            return null;
          })
          .filter(Boolean) as { questionID: string; questionAnswer: string }[];

        const test: ISelectedOptions = [
          { questions: initialEmployeeAnswers },
          { questions: initialOneManagerAnswers },
          { questions: initialSecondManagerAnswers },
        ];
        console.log("testt", test);
        setSelectedOptions(test);
      }
    } catch (error) {
      dispatchBusy({ isBusy: false });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAnswerChange = (
    qID: string,
    answerValue: string,
    selectedIndex: number
  ) => {
    if (isReadOnly) return;

    setSelectedOptions((prevOptions) => {
      const newOuterOptions = [...prevOptions];

      if (selectedIndex < 0 || selectedIndex >= newOuterOptions.length) {
        console.error(`Hata: selectedIndex ${selectedIndex} dış dizi sınırları içinde değil.`);
        return prevOptions;
      }

      const currentQuestions = newOuterOptions[selectedIndex].questions;
      const newQuestions = [...currentQuestions];
      const existingQuestionIndex = newQuestions.findIndex((opt) => opt.questionID === qID);

      if (existingQuestionIndex > -1) {
        newQuestions[existingQuestionIndex] = {
          ...newQuestions[existingQuestionIndex],
          questionAnswer: answerValue,
        };
      } else {
        newQuestions.push({ questionID: qID, questionAnswer: answerValue });
      }

      newOuterOptions[selectedIndex] = { questions: newQuestions };
      return newOuterOptions;
    });
  };

  const updateDescriptionAtIndex = (index: any, value: any) => {
    const updatedDescriptions = [...description];
    if (!updatedDescriptions[index]) updatedDescriptions[index] = { description: "" };
    updatedDescriptions[index].description = value;
    setDescription(updatedDescriptions);
  };

  const handleSave = async () => {
    const totalQuestionsCount = activeQuestions.length || 0;
    const answeredQuestions = selectedOptions[selectedIndex]?.questions.length || 0;

    if (answeredQuestions !== totalQuestionsCount) {
      dispatchAlert({
        message: `Lütfen tüm soruları (${totalQuestionsCount} sorudan ${answeredQuestions} tanesi cevaplandı) doldurduğunuzdan emin olun.`,
        type: "Warning",
      });
      return;
    }

    const currentDescription = description[selectedIndex]?.description || "";
    const trimmedDescription = currentDescription.trim();

    if (!/[a-zA-Z]/.test(trimmedDescription)) {
      dispatchAlert({
        message: "Açıklama en az bir harf içermelidir.",
        type: "Warning",
      });
      return;
    }

    if (description[selectedIndex].description.trim().length < 10) {
      dispatchAlert({
        message: `Açıklama en az 10 karakter olmalıdır.`,
        type: "Warning",
      });
      return;
    }

    if (improvementSuggestion.trim().length < 10) {
      dispatchAlert({
        message: `Geliştirme Önerisi en az 10 karakter olmalıdır.`,
        type: "Warning",
      });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      let config = getConfiguration();
      let apiInstance = new PerformanceFormAnswersApi(config);

      let questionAnswer: QuestionAndAnswerDto[] = selectedOptions[selectedIndex].questions.map(
        (v) => ({
          performanceQuestionId: v.questionID,
          questionOptionId: v.questionAnswer,
        })
      );

      let answers: AnswerDto = {
        generalContent: currentDescription,
        performanceFormId: id,
        questionAndAnswerDtos: questionAnswer,
      };
      console.log("deneme", answers);

      await apiInstance.apiPerformanceFormAnswersAddAnswersPost(answers);
      await apiInstance.apiPerformanceFormAnswersSendFormFormIdPut(
        id,
        true,
        "",
        improvementSuggestion
      );

      dispatchAlert({
        message: "Form başarılı şekilde gönderildi, modül ekranına yönlendiriliyorsunuz...",
        type: "Success",
      });
      navigate(-1);
    } catch (error) {
      dispatchAlert({
        message: "Kaydetme sırasında bir hata oluştu.",
        type: "Error",
      });
      console.error("Kaydetme Hatası:", error);
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const getSelectedAnswer = (questionID: string, selectedIndex: number): string | undefined => {
    const roleAnswersContainer = selectedOptions[selectedIndex];
    if (roleAnswersContainer?.questions) {
      return roleAnswersContainer.questions.find((opt) => opt.questionID === questionID)
        ?.questionAnswer;
    }
    return undefined;
  };

  const activeQuestions =
    selectedIndex === 0
      ? formDetailData?.questions || []
      : formDetailData?.managerQuestions || [];

  const progress = Math.round(
    ((selectedOptions[selectedIndex]?.questions?.length || 0) /
      (activeQuestions.length || 1)) *
      100
  );

  const roleIndexes =
    userRole === "employee"
      ? [0]
      : userRole === "firstManager"
        ? [0, 1]
        : [0, 1, 2];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all duration-200 group"
          aria-label="Geri Dön"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
          <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
            Geri
          </span>
        </button>
      </div>

      <div className="pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

          {/* ── Person cards ── */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {roleIndexes.map((_, i) => {
              const questionsForCard =
                i === 0
                  ? formDetailData?.questions || []
                  : formDetailData?.managerQuestions || [];
              const answeredCount = selectedOptions[i]?.questions?.length || 0;
              const photo =
                i === 0
                  ? formDetailData?.employePhoto
                  : i === 1
                    ? formDetailData?.managerOnePhoto
                    : formDetailData?.managerTwoPhoto;
              const name =
                i === 0
                  ? formDetailData?.employeeName
                  : i === 1
                    ? formDetailData?.managerOneName
                    : formDetailData?.managerTwoName;
              const dept =
                i === 0
                  ? formDetailData?.employeeDept
                  : i === 1
                    ? formDetailData?.managerOneDept
                    : formDetailData?.managerTwoDept;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    "flex-1 text-left bg-white rounded-xl p-4 transition-all duration-200 border-2",
                    selectedIndex === i
                      ? "border-blue-500 shadow-md shadow-blue-100"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={photo ? `data:image/jpeg;base64,${photo}` : profile}
                        alt={name ?? "profile"}
                        className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-slate-100"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 leading-tight">
                          {name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{dept ?? "—"}</p>
                      </div>
                    </div>

                    {/* Manager info shown on employee card */}
                    {i === 0 && (
                      <div className="flex flex-col items-end text-right gap-0.5">
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">1. Yönetici: </span>
                          {formDetailData?.managerOneName || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          <span className="font-medium">2. Yönetici: </span>
                          {formDetailData?.managerTwoName || "-"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-0.5">Soru Sayısı</p>
                      <p className="text-lg font-bold text-blue-500">
                        {questionsForCard.length}
                      </p>
                    </div>
                    <div className="w-px bg-slate-100" />
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-0.5">Değerlendirilen</p>
                      <p className="text-lg font-bold text-emerald-500">
                        {answeredCount} / {questionsForCard.length}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Progress bar ── */}
          <div className="flex items-center justify-end gap-3 mb-5">
            <span className="text-xs text-slate-500 font-medium">{progress}% Tamamlandı</span>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 mb-6" />

          {/* ── Questions ── */}
          <div className="max-h-[480px] overflow-y-auto pr-1 space-y-2">

            {/* Intro text */}
            <p className="text-sm font-light italic text-slate-600 leading-relaxed border-b border-slate-100 pb-5 mb-5">
              Günlük çalışma rutinimizde sıkça karşılaştığımız bazı durumlar aşağıda
              paylaşılmıştır. Danışmanlık sürecinde teknik bilgi ve beceriler kadar, etkili
              iletişim ve müşteri yönetimi de günün sonunda başarının belirleyici
              unsurlarındandır. Teknik konular nasıl öğrenilebiliyorsa, insan odaklı (soft skill)
              yetkinlikleri de geliştirilebilir ve öğrenilebilir. Bu doğrultuda aşağıdaki
              senaryolar, doğru ya da yanlış cevap arayışından ziyade, müşteri yönetimine yönelik
              farkındalık oluşturmak amacıyla hazırlanmıştır. Senaryolarda verilen soruların kesin
              bir doğru–yanlış cevabı bulunmamakta olup, eğlenceli ve katılımcıların bakış açısını
              genişletmesi, deneyim paylaşımını teşvik etmesi hedeflenmektedir. Kendinize en yakın
              ve istisnasları dışında genel yaklaşımınıza göre seçiniz.
            </p>

            {activeQuestions.map((question, index) => {
              const currentSelectedAnswer = getSelectedAnswer(question.id, selectedIndex);
              const isDisabled =
                isReadOnly || formDetailData?.performanceFormStatus !== selectedIndex;
              const hasColon = question?.questionText?.includes(":");

              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl p-4 border mb-4",
                    hasColon ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-slate-50/30"
                  )}
                >
                  {/* Question header */}
                  <div className="flex gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 bg-white">
                      <span className="text-xs font-bold text-slate-600">{index + 1}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 leading-relaxed self-center">
                      {question?.questionText}
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 ml-11">
                    {question?.options?.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className={cn(
                          "flex items-start gap-3 p-3 border-2 rounded-lg transition-all select-none",
                          isDisabled ? "cursor-default opacity-70" : "cursor-pointer",
                          currentSelectedAnswer === option.id
                            ? "border-blue-500 bg-blue-50"
                            : isDisabled
                              ? "border-slate-200 bg-white"
                              : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                        )}
                      >
                        <input
                          type="radio"
                          name={`answer-${question.id}`}
                          checked={currentSelectedAnswer === option.id}
                          onChange={() =>
                            handleAnswerChange(question.id, option.id, selectedIndex)
                          }
                          disabled={isDisabled}
                          className="mt-0.5 w-4 h-4 text-blue-500 accent-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex gap-2 flex-1">
                          <span className="text-xs font-bold text-slate-400 min-w-[18px] mt-0.5">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span className="text-sm text-slate-700 leading-relaxed">
                            {option.text}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Improvement suggestion (employee only) */}
            {selectedIndex === 0 && (
              <div className="rounded-xl p-4 border border-slate-100 bg-slate-50/30 mb-4">
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center shrink-0 bg-white">
                    <span className="text-xs font-bold text-slate-600">Ek</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed self-center">
                    Şirketin geliştirmesini düşündüğünüz bir alan söyleyip, çözüm öneriniz ve
                    somut örneklerle açıklama yapınız.
                  </p>
                </div>
                <textarea
                  rows={10}
                  readOnly={
                    isReadOnly || formDetailData?.performanceFormStatus !== selectedIndex
                  }
                  placeholder="Açıklama Giriniz..."
                  value={improvementSuggestion || ""}
                  onChange={(e) => setImprovementSuggestion(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none read-only:bg-slate-50 read-only:opacity-70 read-only:cursor-not-allowed"
                />
              </div>
            )}

            {/* General evaluation */}
            <div className="rounded-xl p-4 border border-slate-100 bg-slate-50/30">
              {/* Pick from pool button */}
              {selectedIndex === formDetailData?.performanceFormStatus &&
                (formDetailData?.performanceFormStatus === PerformanceFormStatus.NUMBER_1 ||
                  formDetailData?.performanceFormStatus === PerformanceFormStatus.NUMBER_2) && (
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={handleOpenSelectDescription}
                    className="inline-flex items-center gap-1.5 mb-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Açıklama Havuzundan Seç
                  </button>
                )}

              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Genel Değerlendirme Açıklaması
              </label>
              <textarea
                rows={10}
                readOnly={
                  isReadOnly || formDetailData?.performanceFormStatus !== selectedIndex
                }
                placeholder="Açıklama Giriniz..."
                value={description[selectedIndex]?.description || ""}
                onChange={(e) => updateDescriptionAtIndex(selectedIndex, e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none read-only:bg-slate-50 read-only:opacity-70 read-only:cursor-not-allowed"
              />

              {/* Submit button */}
              {!(
                formDetailData?.performanceFormStatus !== selectedIndex ||
                userIndex !== selectedIndex
              ) && (
                <div className="flex justify-end mt-4">
                  <Button
                    disabled={isReadOnly}
                    onClick={handleSave}
                    className="bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                  >
                    Bitir
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Description pool dialog ── */}
      <Dialog open={isSelectDescriptionOpen} onOpenChange={(open) => !open && handleCloseSelectDescription()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <div className="bg-linear-to-br from-slate-50 to-blue-50 max-h-[82vh] overflow-y-auto">
            <div className="p-6">

              {/* Dialog header */}
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold text-slate-800">
                  Değerlendirme Metinleri
                </DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Kullanmak istediğiniz metne tıklayınız. Tıklanan metin otomatik olarak genel
                  değerlendirme açıklamasına eklenir.
                </p>
              </DialogHeader>

              {/* Static sections */}
              {DESCRIPTION_SECTIONS.map((section) => (
                <div key={section.title} className="mb-6">
                  <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                        BADGE_COLOR[section.color]
                      )}
                    >
                      {DESCRIPTION_SECTIONS.indexOf(section) + 1}
                    </span>
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((text, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDescSelection(text)}
                        className={cn(
                          "w-full text-left p-4 bg-white rounded-lg shadow-xs border border-slate-200 transition-all duration-200 hover:shadow-sm",
                          HOVER_COLOR[section.color]
                        )}
                      >
                        <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Competency section */}
              <div className="mb-6">
                <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    4
                  </span>
                  Yetkinlik Bazlı Değerlendirme
                </h3>
                {COMPETENCY_SUBSECTIONS.map((sub) => (
                  <div key={sub.sub} className="mb-4">
                    <p className="text-sm font-semibold text-purple-700 mb-2 ml-2">{sub.sub}</p>
                    <div className="space-y-2">
                      {sub.items.map((text, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDescSelection(text)}
                          className={cn(
                            "w-full text-left p-4 bg-white rounded-lg shadow-xs border border-slate-200 transition-all duration-200 hover:shadow-sm",
                            HOVER_COLOR["purple"]
                          )}
                        >
                          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Close */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseSelectDescription}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

export default PerformanceModule;
