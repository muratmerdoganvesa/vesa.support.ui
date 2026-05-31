import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Building2, Mail, KeyRound, Lock, CheckCircle2, Circle, ArrowLeft, ArrowRight } from "lucide-react";

import { ForgotPasswordApi } from "api/generated";
import { getConfigurationLogin } from "confiuration";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

import startPageImg from "assets/images/startPageImg.png";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3;

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PASSWORD_RULES: PasswordRule[] = [
  { label: "En az 6 karakter", test: (pw) => pw.length >= 6 },
  { label: "En az bir büyük harf (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { label: "En az bir rakam (0–9)", test: (pw) => /\d/.test(pw) },
  { label: 'En az bir özel karakter (!@#$…)', test: (pw) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];

const STEP_META = [
  { icon: Mail, label: "E-posta" },
  { icon: KeyRound, label: "Kod" },
  { icon: Lock, label: "Şifre" },
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  rightElement?: React.ReactNode;
}

const InputField = ({ label, error, rightElement, className, id, ...props }: InputFieldProps) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-slate-500 tracking-wide uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400",
            "outline-none transition-all duration-200",
            "focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
              : "border-slate-200",
            rightElement ? "pr-11" : "",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
};

interface StepIndicatorProps {
  currentStep: Step;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => (
  <div className="flex items-center gap-2 mb-8" aria-label="İlerleme adımları">
    {STEP_META.map(({ icon: Icon, label }, idx) => {
      const stepNum = (idx + 1) as Step;
      const isCompleted = currentStep > stepNum;
      const isActive = currentStep === stepNum;
      return (
        <div key={stepNum} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                isCompleted
                  ? "bg-emerald-100 text-emerald-600"
                  : isActive
                  ? "bg-[#3e5d8f] text-white shadow-sm shadow-[#3e5d8f]/30"
                  : "bg-slate-100 text-slate-400"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:block",
                isActive ? "text-slate-700" : "text-slate-400"
              )}
            >
              {label}
            </span>
          </div>
          {idx < STEP_META.length - 1 && (
            <div
              className={cn(
                "flex-1 h-px w-8 transition-all duration-300",
                isCompleted ? "bg-emerald-300" : "bg-slate-200"
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

interface PasswordRulesListProps {
  password: string;
}

const PasswordRulesList = ({ password }: PasswordRulesListProps) => (
  <ul className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
    {PASSWORD_RULES.map(({ label, test }) => {
      const passed = password.length > 0 && test(password);
      return (
        <li key={label} className="flex items-center gap-2">
          {passed ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          )}
          <span
            className={cn(
              "text-xs transition-colors",
              passed ? "text-emerald-600 font-medium" : "text-slate-500"
            )}
          >
            {label}
          </span>
        </li>
      );
    })}
  </ul>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validateEmail = (email: string): boolean =>
  /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());

const validatePassword = (pw: string): string => {
  if (pw.length < 6) return "Parola en az 6 karakter uzunluğunda olmalıdır.";
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return "Parola en az bir özel karakter içermelidir.";
  if (!/\d/.test(pw)) return "Parola en az bir rakam içermelidir.";
  if (!/[A-Z]/.test(pw)) return "Parola en az bir büyük harf (A-Z) içermelidir.";
  return "";
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function Cover(): JSX.Element {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [step, setStep] = useState<Step>(1);
  const [isDone, setIsDone] = useState(false);

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Step 2
  const [resetCode, setResetCode] = useState("");
  const [codeError, setCodeError] = useState("");

  // Step 3
  const [newPw, setNewPw] = useState("");
  const [newPwConfirm, setNewPwConfirm] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // -------------------------------------------------------------------------
  // Step 1 – Send reset email
  // -------------------------------------------------------------------------

  const handleSendResetEmail = async () => {
    if (!validateEmail(email)) {
      setEmailError("Geçerli bir e-posta adresi giriniz.");
      return;
    }
    setEmailError("");

    try {
      dispatchBusy({ isBusy: true });
      const api = new ForgotPasswordApi(getConfigurationLogin());
      await api.apiForgotPasswordForgotPasswordPost(email);
      setStep(2);
    } catch (error: any) {
      const msg = error?.response?.data?.errors ?? "Bir hata oluştu.";
      dispatchAlert({ message: "Hata: " + msg, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // -------------------------------------------------------------------------
  // Step 2 – Verify code
  // -------------------------------------------------------------------------

  const handleVerifyCode = async () => {
    if (!resetCode.trim()) {
      setCodeError("Lütfen doğrulama kodunu giriniz.");
      return;
    }
    setCodeError("");

    try {
      dispatchBusy({ isBusy: true });
      const api = new ForgotPasswordApi(getConfigurationLogin());
      await api.apiForgotPasswordVerifyResetCodePost(email, resetCode);
      setStep(3);
    } catch (error: any) {
      const msg = error?.response?.data?.errors ?? "Kod doğrulanamadı.";
      dispatchAlert({ message: "Hata: " + msg, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  // -------------------------------------------------------------------------
  // Step 3 – Change password
  // -------------------------------------------------------------------------

  const handleChangePassword = async () => {
    const pwValidation = validatePassword(newPw);
    if (pwValidation) {
      setPwError(pwValidation);
      return;
    }
    if (newPw !== newPwConfirm) {
      setConfirmError("Şifreler eşleşmiyor.");
      return;
    }
    setPwError("");
    setConfirmError("");

    try {
      dispatchBusy({ isBusy: true });
      const api = new ForgotPasswordApi(getConfigurationLogin());
      await api.apiForgotPasswordChangePwPost(email, resetCode, newPw);
      setIsDone(true);
    } catch (error: any) {
      dispatchAlert({ message: "Bir hata oluştu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleNewPwChange = (pw: string) => {
    setNewPw(pw);
    setPwError(pw.length > 0 ? validatePassword(pw) : "");
    if (newPwConfirm && pw !== newPwConfirm) {
      setConfirmError("Şifreler eşleşmiyor.");
    } else {
      setConfirmError("");
    }
  };

  const handleConfirmPwChange = (pw: string) => {
    setNewPwConfirm(pw);
    if (pw && pw !== newPw) {
      setConfirmError("Şifreler eşleşmiyor.");
    } else {
      setConfirmError("");
    }
  };

  const isPasswordValid = !validatePassword(newPw) && newPw === newPwConfirm && newPw.length > 0;

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderStep1 = () => (
    <div className="flex flex-col gap-5">
      <InputField
        id="email"
        label="E-posta"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSendResetEmail()}
        placeholder="ad@vesacons.com"
        autoComplete="email"
        autoFocus
        error={emailError}
      />
      <Button
        onClick={handleSendResetEmail}
        disabled={!email.trim()}
        className="w-full h-11 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium gap-2 shadow-sm shadow-[#3e5d8f]/30 transition-all duration-200"
        size="lg"
      >
        Doğrulama Kodu Gönder
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col gap-5">
      <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">{email}</span> adresine bir doğrulama kodu gönderdik.
          Gelen kutunuzu kontrol edin.
        </p>
      </div>
      <InputField
        id="reset-code"
        label="Doğrulama Kodu"
        type="text"
        value={resetCode}
        onChange={(e) => setResetCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleVerifyCode()}
        placeholder="6 haneli kod"
        autoComplete="one-time-code"
        autoFocus
        error={codeError}
      />
      <Button
        onClick={handleVerifyCode}
        disabled={!resetCode.trim()}
        className="w-full h-11 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium gap-2 shadow-sm shadow-[#3e5d8f]/30 transition-all duration-200"
        size="lg"
      >
        Kodu Doğrula
        <ArrowRight className="w-4 h-4" />
      </Button>
      <button
        type="button"
        tabIndex={0}
        onClick={() => setStep(1)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors font-medium mx-auto"
        aria-label="E-posta adresini değiştir"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        E-postayı değiştir
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col gap-4">
      <InputField
        id="new-password"
        label="Yeni Şifre"
        type={showNewPw ? "text" : "password"}
        value={newPw}
        onChange={(e) => handleNewPwChange(e.target.value)}
        placeholder="••••••••••"
        autoComplete="new-password"
        autoFocus
        error={pwError || undefined}
        rightElement={
          <button
            type="button"
            tabIndex={0}
            aria-label={showNewPw ? "Şifreyi gizle" : "Şifreyi göster"}
            onClick={() => setShowNewPw((v) => !v)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      <PasswordRulesList password={newPw} />
      <InputField
        id="confirm-password"
        label="Şifreyi Onayla"
        type={showConfirmPw ? "text" : "password"}
        value={newPwConfirm}
        onChange={(e) => handleConfirmPwChange(e.target.value)}
        placeholder="••••••••••"
        autoComplete="new-password"
        error={confirmError || undefined}
        rightElement={
          <button
            type="button"
            tabIndex={0}
            aria-label={showConfirmPw ? "Şifreyi gizle" : "Şifreyi göster"}
            onClick={() => setShowConfirmPw((v) => !v)}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      <Button
        onClick={handleChangePassword}
        disabled={!isPasswordValid}
        className="w-full h-11 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium gap-2 shadow-sm shadow-[#3e5d8f]/30 transition-all duration-200 mt-2"
        size="lg"
      >
        Şifremi Güncelle
      </Button>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">Şifre Güncellendi!</h3>
        <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
          Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.
        </p>
      </div>
      <Button
        onClick={() => navigate("/authentication/sign-in/cover")}
        className="w-full h-11 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium gap-2 shadow-sm shadow-[#3e5d8f]/30 transition-all duration-200"
        size="lg"
      >
        Giriş Sayfasına Git
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );

  const STEP_HEADINGS = {
    1: { title: "Şifrenizi Sıfırlayın", subtitle: "Kayıtlı e-posta adresinize bir doğrulama kodu göndereceğiz." },
    2: { title: "Kodu Doğrulayın", subtitle: "E-postanıza gönderilen 6 haneli kodu girin." },
    3: { title: "Yeni Şifre Belirleyin", subtitle: "Güçlü ve güvenli bir şifre seçin." },
  } as const;

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <img
          src={startPageImg}
          alt="Vesa arka plan"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-linear-to-br from-[#1e3a5f]/70 via-[#3e5d8f]/50 to-[#6b8cba]/30" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/90 font-semibold text-lg tracking-wide">Vesa</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-3">
            Şifrenizi mi
            <br />
            Unuttunuz?
          </h1>
          <p className="text-white/70 text-base font-light max-w-sm leading-relaxed">
            Endişelenmeyin, birkaç adımda şifrenizi kolayca sıfırlayabilirsiniz.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#3e5d8f] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700 text-base tracking-wide">Vesa</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 p-8">
            {isDone ? (
              renderSuccess()
            ) : (
              <>
                {/* Step indicator */}
                <StepIndicator currentStep={step} />

                {/* Heading */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    {STEP_HEADINGS[step].title}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {STEP_HEADINGS[step].subtitle}
                  </p>
                </div>

                {/* Step content */}
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </>
            )}
          </div>

          {/* Back to sign-in link */}
          {!isDone && (
            <div className="mt-6 text-center">
              <button
                type="button"
                tabIndex={0}
                onClick={() => navigate("/authentication/sign-in/cover")}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#3e5d8f] transition-colors font-medium mx-auto"
                aria-label="Giriş sayfasına dön"
              >
                <ArrowLeft className="w-4 h-4" />
                Giriş sayfasına dön
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Cover;
