import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Loader2, RotateCcw, Send } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import logo from "assets/images/vesapng.png";
import {
  PerformanceFormsApi,
  PerformanceSurveyMailDto,
  UserApi,
  UserAppDto,
  WorkCompanyApi,
} from "api/generated";
import getConfiguration from "confiuration";

import { Alert, AlertDescription } from "components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Badge } from "components/ui/badge";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { Separator } from "components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { cn } from "lib/utils";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const DEFAULT_LOGO_PATH = logo;
const SURVEY_PERIOD = "2025 Dönemi";
const CUSTOMER_FEEDBACK_LABEL = "Müşteri Geri Bildirim Formu";
const ADDITIONAL_COMMENTS_MAX_LENGTH = 1000;
const MIN_RATING = 1;
const MAX_RATING = 5;
const ALLOWED_EMAIL_DOMAIN = "@vesacons.com";
const EXCLUDED_CONSULTANT_EMAILS = new Set([
  "bolat.ciftci@vesacons.com",
  "muhammed.kadan@vesacons.com",
  "veysel.karani@vesacons.com",
  "veysel.yilmaz@vesacons.com",
]);

const ratingScaleDescriptions: ReadonlyArray<string> = [
  "5 = Çok İyi",
  "4 = İyi",
  "3 = İyileştirilmeli",
  "2 = Kötü",
  "1 = Çok Kötü",
];

const ratingTextByValue: Record<number, string> = {
  5: "Çok İyi",
  4: "İyi",
  3: "İyileştirilmeli",
  2: "Kötü",
  1: "Çok Kötü",
};

/* ─── Types ──────────────────────────────────────────────────────────────── */

type RatingKey =
  | "generalSatisfaction"
  | "expertise"
  | "communicationQuality"
  | "responseSpeed"
  | "onTimeCompletion"
  | "responsibilityAndFollowUp"
  | "solutionOrientedApproach";

interface RatingQuestion {
  key: RatingKey;
  question: string;
}

interface ServiceEvaluationFormValues {
  company: string;
  fullName: string;
  email: string;
  consultantName: string;
  consultantEmail: string;
  ratings: Partial<Record<RatingKey, number>>;
  consultantStrengths: string;
  improvementAreas: string;
  expectedSupportTopics: string;
  additionalComments: string;
}

interface ServiceEvaluationRequestPayload {
  company: string;
  fullName: string;
  email: string;
  consultant: { fullName: string; email: string };
  ratings: {
    completionTime: number;
    expertise: number;
    communicationQuality: number;
    responseSpeed: number;
    onTimeCompletion: number;
    responsibilityAndFollowUp: number;
    solutionOrientedApproach: number;
  };
  averageScore: number;
  questionResponses: Array<{
    key: RatingKey;
    question: string;
    selectedOption: number;
    answer: string;
  }>;
  consultantStrengths: string;
  improvementAreas: string;
  expectedSupportTopics: string;
  additionalComments: string;
}

interface ServiceEvaluationSurveyProps {
  logoPath?: string;
}

/* ─── Static data ────────────────────────────────────────────────────────── */

const ratingQuestions: ReadonlyArray<RatingQuestion> = [
  {
    key: "generalSatisfaction",
    question: "Danışmanımızın sunduğu hizmetten genel memnuniyet düzeyinizi değerlendiriniz.",
  },
  { key: "expertise", question: "Danışmanımızın konu uzmanlığını değerlendiriniz." },
  {
    key: "communicationQuality",
    question: "Danışmanımızın iletişim kalitesini değerlendiriniz.",
  },
  {
    key: "responseSpeed",
    question: "Sorularınıza ve taleplerinize dönüş hızını değerlendiriniz.",
  },
  { key: "onTimeCompletion", question: "İşlerin zamanında tamamlanmasını değerlendiriniz." },
  {
    key: "responsibilityAndFollowUp",
    question:
      "Danışmanımızın sorumluluk alma ve takip etme performansını değerlendiriniz.",
  },
  {
    key: "solutionOrientedApproach",
    question: "Problemler karşısındaki çözüm odaklı yaklaşımını değerlendiriniz.",
  },
];

const requiredRatingKeys: ReadonlyArray<RatingKey> = ratingQuestions.map(({ key }) => key);
const TOTAL_QUESTIONS = ratingQuestions.length;

const initialValues: ServiceEvaluationFormValues = {
  company: "",
  fullName: "",
  email: "",
  consultantName: "",
  consultantEmail: "",
  ratings: {},
  consultantStrengths: "",
  improvementAreas: "",
  expectedSupportTopics: "",
  additionalComments: "",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const getEmailFromAccessToken = (): string => {
  try {
    const token = localStorage.getItem("accessToken");
    if (!token) return "";
    const parts = token.split(".");
    if (parts.length < 2) return "";
    const payload = JSON.parse(
      decodeURIComponent(
        atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      ),
    );
    return String(
      payload?.email ||
        payload?.upn ||
        payload?.preferred_username ||
        payload?.unique_name ||
        payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ||
        "",
    ).trim();
  } catch {
    return "";
  }
};

const transformFormToPayload = (
  values: ServiceEvaluationFormValues,
): ServiceEvaluationRequestPayload => {
  if (!values.consultantName?.trim() || !values.consultantEmail?.trim()) {
    throw new Error("Danışman bilgisi eksik.");
  }
  const missingRating = requiredRatingKeys.find((key) => typeof values.ratings[key] !== "number");
  if (missingRating) throw new Error(`Eksik puan alanı: ${missingRating}`);

  const getRating = (key: RatingKey): number => {
    const v = Number(values.ratings[key]);
    if (Number.isNaN(v) || v < MIN_RATING || v > MAX_RATING)
      throw new Error(`Geçersiz puan alanı: ${key}`);
    return v;
  };

  const ratingValues = requiredRatingKeys.map((key) => getRating(key));
  const averageScore = Number(
    (ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length).toFixed(2),
  );

  return {
    company: values.company.trim(),
    fullName: values.fullName.trim(),
    email: values.email.trim(),
    consultant: {
      fullName: values.consultantName.trim(),
      email: values.consultantEmail.trim(),
    },
    ratings: {
      completionTime: getRating("generalSatisfaction"),
      expertise: getRating("expertise"),
      communicationQuality: getRating("communicationQuality"),
      responseSpeed: getRating("responseSpeed"),
      onTimeCompletion: getRating("onTimeCompletion"),
      responsibilityAndFollowUp: getRating("responsibilityAndFollowUp"),
      solutionOrientedApproach: getRating("solutionOrientedApproach"),
    },
    averageScore,
    questionResponses: ratingQuestions.map((q) => {
      const selectedOption = getRating(q.key);
      return {
        key: q.key,
        question: q.question,
        selectedOption,
        answer: ratingTextByValue[selectedOption] || "",
      };
    }),
    consultantStrengths: values.consultantStrengths.trim(),
    improvementAreas: values.improvementAreas.trim(),
    expectedSupportTopics: values.expectedSupportTopics.trim(),
    additionalComments: values.additionalComments.trim(),
  };
};

/* ─── Shared field styles ────────────────────────────────────────────────── */

const fieldClass = cn(
  "rounded-xl transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/50",
);

const textareaClass = cn(
  "w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none",
  "placeholder:text-muted-foreground transition-all duration-200 ease-out",
  "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/60",
);

/* ─── TextareaField helper ───────────────────────────────────────────────── */

interface TextareaFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  error?: string;
  charCount: number;
  rows?: number;
}

const TextareaField = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  charCount,
  rows = 4,
}: TextareaFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <Label htmlFor={id} className="text-sm font-medium tracking-tight">
      {label}
    </Label>
    <textarea
      id={id}
      rows={rows}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
      maxLength={ADDITIONAL_COMMENTS_MAX_LENGTH}
      className={cn(textareaClass, error && "border-destructive focus-visible:ring-destructive/40")}
    />
    <div className="flex items-center justify-between">
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <span />
      )}
      <span className="text-xs tabular-nums text-muted-foreground">
        {charCount}/{ADDITIONAL_COMMENTS_MAX_LENGTH}
      </span>
    </div>
  </div>
);

/* ─── RatingRadioGroup ───────────────────────────────────────────────────── */

interface RatingRadioGroupProps {
  name: string;
  value: number | "" | undefined;
  onChange: (v: number) => void;
  error?: string;
  label: string;
}

const RatingRadioGroup = ({ name, value, onChange, error, label }: RatingRadioGroupProps) => (
  <div>
    <div className="flex flex-wrap gap-x-3 gap-y-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((v) => (
        <label
          key={v}
          className="flex cursor-pointer items-center gap-1.5 select-none"
          aria-label={`${v} - ${ratingTextByValue[v]}`}
        >
          <input
            type="radio"
            name={name}
            value={v}
            checked={value === v}
            onChange={() => onChange(v)}
            className="accent-primary"
          />
          <span className="text-sm">{v}</span>
        </label>
      ))}
    </div>
    {error && (
      <p className="mt-0.5 text-xs text-destructive" role="alert">
        {error}
      </p>
    )}
  </div>
);

/* ─── Main component ─────────────────────────────────────────────────────── */

const ServiceEvaluationSurvey: React.FC<ServiceEvaluationSurveyProps> = ({
  logoPath = DEFAULT_LOGO_PATH,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccessMessage, setSubmitSuccessMessage] = useState("");
  const [loggedInUserInfo, setLoggedInUserInfo] = useState({ company: "", fullName: "", email: "" });
  const [consultantOptions, setConsultantOptions] = useState<UserAppDto[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<any>(null);
  const [isConsultantLoading, setIsConsultantLoading] = useState(false);
  const [consultantPopoverOpen, setConsultantPopoverOpen] = useState(false);
  const consultantInputRef = useRef<HTMLInputElement>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<ServiceEvaluationFormValues>({
    defaultValues: initialValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    const fetchLoggedInUserInfo = async (): Promise<void> => {
      try {
        const conf = getConfiguration();
        const userApi = new UserApi(conf);
        const response = await userApi.apiUserUserCompanyGet();
        const data = response.data;
        const fullName = `${data?.firstName || ""} ${data?.lastName || ""}`.trim();
        const resolvedFullName = fullName || String(data?.userName || "").trim();
        const userName = String(data?.userName || "").trim();
        const resolvedEmail =
          String(data?.email || "").trim() ||
          (userName.includes("@") ? userName : "") ||
          getEmailFromAccessToken();
        const userCompanyId = String((data as any)?.workCompanyId || "").trim();
        let resolvedCompany = String(data?.company || "").trim();

        if (!resolvedCompany && userCompanyId) {
          const workCompanyApi = new WorkCompanyApi(conf);
          const companyResponse = await workCompanyApi.apiWorkCompanyGetAssingListGet();
          const match = (companyResponse.data || []).find((item) => item.id === userCompanyId);
          resolvedCompany = String(match?.name || "").trim();
        }

        setLoggedInUserInfo({ company: resolvedCompany, fullName: resolvedFullName, email: resolvedEmail });
        setValue("company", resolvedCompany, { shouldValidate: true });
        setValue("fullName", resolvedFullName, { shouldValidate: true });
        setValue("email", resolvedEmail, { shouldValidate: true });
      } catch (error) {
        console.error("Logged in user info fetch error:", error);
      }
    };
    void fetchLoggedInUserInfo();
  }, [setValue]);

  const handleConsultantSearch = async (value: string): Promise<void> => {
    if (!value || value.trim() === "") {
      setConsultantOptions([]);
      setConsultantPopoverOpen(false);
      return;
    }
    try {
      setIsConsultantLoading(true);
      const conf = getConfiguration();
      const api = new UserApi(conf);
      const response = await api.apiUserGetAllUsersWitNameAssignVesaconsGet(value);
      const filtered = (response.data || []).filter((user) => {
        const email = String(user?.email || "").trim().toLocaleLowerCase("en-US");
        return email.endsWith(ALLOWED_EMAIL_DOMAIN) && !EXCLUDED_CONSULTANT_EMAILS.has(email);
      });
      setConsultantOptions(filtered);
      setConsultantPopoverOpen(filtered.length > 0);
    } catch (error) {
      console.error("Consultant search error:", error);
      setConsultantOptions([]);
    } finally {
      setIsConsultantLoading(false);
    }
  };

  const onSubmit = async (values: ServiceEvaluationFormValues): Promise<void> => {
    setIsSubmitting(true);
    setSubmitSuccessMessage("");
    clearErrors("root");
    try {
      const requestPayload = transformFormToPayload(values);
      const conf = getConfiguration();
      const performanceFormsApi = new PerformanceFormsApi(conf);
      await performanceFormsApi.apiPerformanceFormsSendConsultantSurveyMailPost(
        requestPayload as PerformanceSurveyMailDto,
      );
      setSubmitSuccessMessage("Anketiniz başarıyla gönderildi. Teşekkür ederiz.");
      setSelectedConsultant(null);
      setConsultantOptions([]);
      reset({ ...initialValues, company: loggedInUserInfo.company, fullName: loggedInUserInfo.fullName, email: loggedInUserInfo.email });
    } catch (error) {
      console.error("Service Evaluation Submit Error:", error);
      setError("root", { type: "server", message: "Form gönderimi sırasında bir hata oluştu. Lütfen tekrar deneyiniz." });
      if (!values.consultantName?.trim() || !values.consultantEmail?.trim()) {
        setError("consultantName", { type: "required", message: "Lütfen listeden geçerli bir danışman seçiniz." });
      }
      requiredRatingKeys.forEach((key) => {
        if (typeof values.ratings[key] !== "number") {
          setError(`ratings.${key}`, { type: "required", message: "Bu soru için puan seçiniz." });
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = (): void => {
    setSubmitSuccessMessage("");
    setSelectedConsultant(null);
    setConsultantOptions([]);
    reset({ ...initialValues, company: loggedInUserInfo.company, fullName: loggedInUserInfo.fullName, email: loggedInUserInfo.email });
  };

  const consultantStrengthsLength = watch("consultantStrengths")?.length ?? 0;
  const improvementAreasLength = watch("improvementAreas")?.length ?? 0;
  const expectedSupportTopicsLength = watch("expectedSupportTopics")?.length ?? 0;
  const additionalCommentsLength = watch("additionalComments")?.length ?? 0;
  const watchedRatings = watch("ratings");

  const totalScore = requiredRatingKeys.reduce((sum, key) => {
    const v = Number(watchedRatings?.[key] ?? 0);
    return v >= MIN_RATING && v <= MAX_RATING ? sum + v : sum;
  }, 0);
  const answeredQuestionCount = requiredRatingKeys.filter((key) => {
    const v = Number(watchedRatings?.[key] ?? 0);
    return v >= MIN_RATING && v <= MAX_RATING;
  }).length;
  const averageScore =
    answeredQuestionCount > 0 ? (totalScore / answeredQuestionCount).toFixed(2) : "0.00";

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-screen bg-slate-50/60 px-2 py-4 dark:bg-slate-950/50">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">

          {/* Header card — logo + title */}
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
                <img
                  src={logoPath}
                  alt="Vesa Danışmanlık Logo"
                  className="h-auto w-40 shrink-0 object-contain sm:w-48 md:w-56"
                />
                <div className="flex flex-col gap-1">
                  <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                    Danışmanlık Hizmet Değerlendirme Formu
                  </h1>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Değerli müşterimiz, bu anket hizmet kalitemizi geliştirmek ve ihtiyaçlarınızı
                    daha iyi anlamak amacıyla hazırlanmıştır. Katkılarınız için teşekkür ederiz.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period / chip bar */}
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground">
                <strong>İlgili Dönem:</strong> {SURVEY_PERIOD}
              </p>
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1 text-xs font-medium">
                {CUSTOMER_FEEDBACK_LABEL}
              </Badge>
            </CardContent>
          </Card>

          {/* Main form card */}
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* ── Section: Hakkınızda ── */}
                <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">Hakkınızda</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Firma */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="company" className="text-sm font-medium tracking-tight">
                      Firma <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="company"
                      control={control}
                      rules={{ required: "Firma bilgisi zorunludur." }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="company"
                          placeholder="Firma"
                          readOnly
                          className={cn(fieldClass, "bg-muted/40", errors.company && "border-destructive")}
                        />
                      )}
                    />
                    {errors.company && (
                      <p className="text-xs text-destructive" role="alert">{errors.company.message}</p>
                    )}
                  </div>

                  {/* Ad Soyad */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="fullName" className="text-sm font-medium tracking-tight">
                      Adınız Soyadınız <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="fullName"
                      control={control}
                      rules={{ required: "Ad Soyad bilgisi zorunludur." }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="fullName"
                          placeholder="Ad Soyad"
                          readOnly
                          className={cn(fieldClass, "bg-muted/40", errors.fullName && "border-destructive")}
                        />
                      )}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-destructive" role="alert">{errors.fullName.message}</p>
                    )}
                  </div>

                  {/* E-posta */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email" className="text-sm font-medium tracking-tight">
                      E-postanız <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="email"
                      control={control}
                      rules={{
                        required: "E-posta adresi zorunludur.",
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Geçerli bir e-posta adresi giriniz." },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="ornek@firma.com"
                          readOnly={Boolean(loggedInUserInfo.email)}
                          className={cn(fieldClass, loggedInUserInfo.email && "bg-muted/40", errors.email && "border-destructive")}
                        />
                      )}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive" role="alert">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Danışman arama */}
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="consultantSearch" className="text-sm font-medium tracking-tight">
                      Danışman Adı <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="consultantName"
                      control={control}
                      rules={{
                        required: "Danışman seçimi zorunludur.",
                        validate: {
                          consultantSelected: () =>
                            Boolean(selectedConsultant) || "Lütfen listeden danışman seçiniz.",
                          consultantEmailExists: () =>
                            Boolean(watch("consultantEmail")) ||
                            "Seçilen danışman için e-posta bilgisi zorunludur.",
                        },
                      }}
                      render={({ field }) => (
                        <Popover open={consultantPopoverOpen} onOpenChange={setConsultantPopoverOpen}>
                          <PopoverTrigger asChild>
                            <div className="relative">
                              <Input
                                ref={consultantInputRef}
                                id="consultantSearch"
                                placeholder="Danışman adı yazınız…"
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  setValue("consultantEmail", "", { shouldValidate: true });
                                  setSelectedConsultant(null);
                                  void handleConsultantSearch(e.target.value);
                                }}
                                onBlur={field.onBlur}
                                autoComplete="off"
                                className={cn(
                                  fieldClass,
                                  errors.consultantName && "border-destructive",
                                )}
                              />
                              {isConsultantLoading && (
                                <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                              )}
                            </div>
                          </PopoverTrigger>
                          {consultantOptions.length > 0 && (
                            <PopoverContent
                              align="start"
                              className="z-50 w-[--radix-popover-trigger-width] rounded-xl p-1 shadow-xl"
                              onOpenAutoFocus={(e) => e.preventDefault()}
                            >
                              <ul className="max-h-64 overflow-y-auto">
                                {consultantOptions.map((option: any) => {
                                  const displayName = option.userAppName
                                    ? option.userAppName
                                    : `${option.firstName || ""} ${option.lastName || ""}`.trim();
                                  return (
                                    <li key={option.id}>
                                      <button
                                        type="button"
                                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                                        onClick={() => {
                                          field.onChange(displayName);
                                          setValue("consultantEmail", String(option.email || "").trim(), { shouldValidate: true });
                                          setSelectedConsultant(option);
                                          setConsultantPopoverOpen(false);
                                          clearErrors("consultantName");
                                        }}
                                      >
                                        <Avatar className="size-8 shrink-0">
                                          <AvatarImage
                                            src={`data:image/png;base64,${option.photo}`}
                                            alt={displayName}
                                          />
                                          <AvatarFallback className="text-xs">
                                            {(option.firstName?.[0] ?? "") + (option.lastName?.[0] ?? "")}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <p className="truncate text-sm font-medium text-foreground">
                                            {option.firstName} {option.lastName}
                                          </p>
                                          <p className="truncate text-xs text-muted-foreground">
                                            {option.email}
                                          </p>
                                        </div>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </PopoverContent>
                          )}
                        </Popover>
                      )}
                    />
                    {errors.consultantName?.message && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.consultantName.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6 bg-border/50" />

                {/* ── Section: Hizmetlerimiz Hakkında ── */}
                <div className="mb-4 flex flex-col gap-0.5">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    Hizmetlerimiz Hakkında
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Hizmeti ve hizmet sürecini 1'den 5'e kadar değerlendiriniz. Tüm puanlar 5
                    üzerinden değerlendirilmektedir.
                  </p>
                </div>

                {/* Score summary pill */}
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
                  <div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-200">
                      Ortalama Puan: {averageScore} / 5
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Cevaplanan Soru: {answeredQuestionCount} / {TOTAL_QUESTIONS}
                    </p>
                  </div>
                </div>

                {/* Rating scale legend */}
                <Alert className="mb-4 rounded-xl border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <AlertDescription>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {ratingScaleDescriptions.map((item) => (
                        <span key={item} className="text-sm text-blue-800 dark:text-blue-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Desktop table layout */}
                <div className="hidden lg:block">
                  <Table className="rounded-xl border border-border/60">
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-[55%] py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Değerlendirme Soruları
                        </TableHead>
                        <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Puan (5 üzerinden)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ratingQuestions.map((item, index) => (
                        <TableRow key={item.key} className="border-border/40">
                          <TableCell className="py-3 text-sm text-foreground">
                            {index + 1}. {item.question}
                          </TableCell>
                          <TableCell className="py-3">
                            <Controller
                              name={`ratings.${item.key}`}
                              control={control}
                              rules={{
                                required: "Bu soru için puan seçiniz.",
                                min: { value: MIN_RATING, message: "Puan 1-5 arasında olmalıdır." },
                                max: { value: MAX_RATING, message: "Puan 1-5 arasında olmalıdır." },
                              }}
                              render={({ field }) => (
                                <RatingRadioGroup
                                  name={`rating-${item.key}`}
                                  value={field.value}
                                  onChange={(v) => field.onChange(v)}
                                  error={errors.ratings?.[item.key]?.message}
                                  label={item.question}
                                />
                              )}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card layout */}
                <div className="flex flex-col gap-3 lg:hidden">
                  {ratingQuestions.map((item, index) => (
                    <Card key={item.key} className="rounded-xl border-border/60 shadow-xs">
                      <CardContent className="p-4">
                        <p className="mb-3 text-sm font-medium text-foreground">
                          {index + 1}. {item.question}
                        </p>
                        <Controller
                          name={`ratings.${item.key}`}
                          control={control}
                          rules={{
                            required: "Bu soru için puan seçiniz.",
                            min: { value: MIN_RATING, message: "Puan 1-5 arasında olmalıdır." },
                            max: { value: MAX_RATING, message: "Puan 1-5 arasında olmalıdır." },
                          }}
                          render={({ field }) => (
                            <RatingRadioGroup
                              name={`rating-mob-${item.key}`}
                              value={field.value}
                              onChange={(v) => field.onChange(v)}
                              error={errors.ratings?.[item.key]?.message}
                              label={item.question}
                            />
                          )}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Separator className="my-6 bg-border/50" />

                {/* ── Section: Açık Uçlu Sorular ── */}
                <h2 className="mb-4 text-lg font-bold tracking-tight text-foreground">
                  Açık Uçlu Sorular
                </h2>
                <div className="flex flex-col gap-5">
                  <Controller
                    name="consultantStrengths"
                    control={control}
                    rules={{
                      required: "Bu alan zorunludur.",
                      minLength: { value: 10, message: "En az 10 karakter girmelisiniz." },
                      maxLength: { value: ADDITIONAL_COMMENTS_MAX_LENGTH, message: `En fazla ${ADDITIONAL_COMMENTS_MAX_LENGTH} karakter girilebilir.` },
                    }}
                    render={({ field }) => (
                      <TextareaField
                        id="consultantStrengths"
                        label="Danışmanımızın en güçlü yönleri sizce nelerdir?"
                        placeholder="Gözlemlediğiniz güçlü yönleri yazabilirsiniz."
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.consultantStrengths?.message}
                        charCount={consultantStrengthsLength}
                      />
                    )}
                  />

                  <Controller
                    name="improvementAreas"
                    control={control}
                    rules={{
                      required: "Bu alan zorunludur.",
                      minLength: { value: 10, message: "En az 10 karakter girmelisiniz." },
                      maxLength: { value: ADDITIONAL_COMMENTS_MAX_LENGTH, message: `En fazla ${ADDITIONAL_COMMENTS_MAX_LENGTH} karakter girilebilir.` },
                    }}
                    render={({ field }) => (
                      <TextareaField
                        id="improvementAreas"
                        label="Geliştirilmesini istediğiniz alanlar nelerdir?"
                        placeholder="Geliştirilmesini beklediğiniz noktaları yazabilirsiniz."
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.improvementAreas?.message}
                        charCount={improvementAreasLength}
                      />
                    )}
                  />

                  <Controller
                    name="expectedSupportTopics"
                    control={control}
                    rules={{
                      required: "Bu alan zorunludur.",
                      minLength: { value: 10, message: "En az 10 karakter girmelisiniz." },
                      maxLength: { value: ADDITIONAL_COMMENTS_MAX_LENGTH, message: `En fazla ${ADDITIONAL_COMMENTS_MAX_LENGTH} karakter girilebilir.` },
                    }}
                    render={({ field }) => (
                      <TextareaField
                        id="expectedSupportTopics"
                        label="Önümüzdeki dönemde bizden hangi konularda destek bekliyorsunuz?"
                        placeholder="Beklediğiniz destek alanlarını yazabilirsiniz."
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={errors.expectedSupportTopics?.message}
                        charCount={expectedSupportTopicsLength}
                      />
                    )}
                  />
                </div>

                <Separator className="my-5 bg-border/50" />

                <Controller
                  name="additionalComments"
                  control={control}
                  rules={{
                    required: "Bu alan zorunludur.",
                    minLength: { value: 10, message: "En az 10 karakter girmelisiniz." },
                    maxLength: { value: ADDITIONAL_COMMENTS_MAX_LENGTH, message: `En fazla ${ADDITIONAL_COMMENTS_MAX_LENGTH} karakter girilebilir.` },
                  }}
                  render={({ field }) => (
                    <TextareaField
                      id="additionalComments"
                      label="Eklemek istediğiniz başka görüş veya öneriniz var mı?"
                      placeholder="Varsa ek görüş veya önerilerinizi yazabilirsiniz."
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.additionalComments?.message}
                      charCount={additionalCommentsLength}
                      rows={5}
                    />
                  )}
                />

                <Separator className="my-6 bg-border/50" />

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-w-[140px] gap-1.5 rounded-xl transition-all duration-200 ease-out"
                      onClick={handleReset}
                    >
                      <RotateCcw className="size-4" aria-hidden />
                      Temizle
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="min-w-[140px] gap-1.5 rounded-xl transition-all duration-200 ease-out"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Send className="size-4" aria-hidden />
                      )}
                      {isSubmitting ? "Gönderiliyor…" : "Gönder"}
                    </Button>
                  </div>
                  {errors.root?.message && (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.root.message}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success dialog */}
      <Dialog
        open={Boolean(submitSuccessMessage)}
        onOpenChange={(open) => !open && setSubmitSuccessMessage("")}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold tracking-tight">
              İşlem Başarılı
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{submitSuccessMessage}</p>
          <DialogFooter>
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => setSubmitSuccessMessage("")}
            >
              Tamam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ServiceEvaluationSurvey;
