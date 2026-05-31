import { useEffect, useState } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { Eye, EyeOff, LogIn, Building2 } from "lucide-react";

import { AuthApi, LoginDto, SAPReportsApi, UserApi } from "api/generated";
import { getConfigurationLogin } from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useUser } from "layouts/pages/hooks/userName";
import { useQueryClient } from "react-query";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  rightElement?: React.ReactNode;
}

const InputField = ({ label, error, rightElement, className, ...props }: InputFieldProps) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-slate-500 tracking-wide uppercase">
      {label}
    </label>
    <div className="relative">
      <input
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
        {...props}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {rightElement}
        </div>
      )}
    </div>
  </div>
);

interface DividerProps {
  label: string;
}

const Divider = ({ label }: DividerProps) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-100" />
    <span className="text-xs text-slate-400 font-medium">{label}</span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const LOGIN_REDIRECT_STORAGE_KEY = "postLoginRedirect";

function Cover(): JSX.Element {
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const { instance } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const { setuserUserAppDto } = useUser();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fieldError, setFieldError] = useState<string>("");

  // -------------------------------------------------------------------------
  // Redirect helpers
  // -------------------------------------------------------------------------

  const sanitizeReturnTo = (value?: string | null): string | null => {
    if (!value || typeof value !== "string") return null;
    if (!value.startsWith("/") || value.startsWith("//")) return null;
    const blockedPrefixes = [
      "/authentication/sign-in/cover",
      "/authentication/reset-password",
      "/LogOut",
    ];
    return blockedPrefixes.some((p) => value.startsWith(p)) ? null : value;
  };

  const getStoredReturnTo = (): string | null => {
    const fromQuery = new URLSearchParams(location.search).get("returnTo");
    const fromState = (location.state as { returnTo?: string } | null)?.returnTo ?? null;
    const fromStorage = localStorage.getItem(LOGIN_REDIRECT_STORAGE_KEY);
    return (
      sanitizeReturnTo(fromQuery) ||
      sanitizeReturnTo(fromState) ||
      sanitizeReturnTo(fromStorage)
    );
  };

  const navigateAfterLogin = (defaultRoute: string): void => {
    const returnTo = getStoredReturnTo();
    localStorage.removeItem(LOGIN_REDIRECT_STORAGE_KEY);
    navigate(returnTo ?? defaultRoute, { replace: true });
  };

  useEffect(() => {
    const returnTo = getStoredReturnTo();
    if (returnTo) localStorage.setItem(LOGIN_REDIRECT_STORAGE_KEY, returnTo);
  }, [location.search, location.state]);

  // Clear inline field error after 5 s
  useEffect(() => {
    if (!fieldError) return;
    const t = setTimeout(() => setFieldError(""), 5000);
    return () => clearTimeout(t);
  }, [fieldError]);

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleLoginWithAzure = (): void => {
    const isLocalhost = window.location.hostname === "localhost";
    const scope = isLocalhost
      ? "api://28116fc8-fd64-4ccb-ab4d-96d2f3653846/access_as_user"
      : "api://1a4e7070-9c88-4097-9805-caf72e245e79/access_as_user";

    instance
      .loginPopup({ scopes: [scope] })
      .then(async (response: { accessToken: string; account: any }) => {
        dispatchBusy({ isBusy: true });
        const conf = getConfigurationLogin();
        const api = new UserApi(conf);
        const result = await api.apiUserCheckSSOEmailControlGet(response.account.username);
        dispatchBusy({ isBusy: false });

        if (result.data.userName != undefined) {
          setuserUserAppDto(result.data);
          localStorage.setItem("accessToken", response.accessToken);
          queryClient.clear();
          localStorage.removeItem("menuNameSurmane");
          localStorage.setItem(
            "menuNameSurmane",
            result.data.firstName + " " + result.data.lastName
          );
          navigateAfterLogin("/tickets/statistic");
        } else {
          dispatchAlert({ message: "Giriş Başarılı Değil", type: "Error" });
        }
      })
      .catch((error: any) => {
        console.error("Login failed:", error);
      });
  };

  const handleLoginWithVesa = async (): Promise<void> => {
    if (!email && !password) {
      setFieldError("E-posta adresinizi ve şifrenizi giriniz.");
      return;
    }
    if (!email) {
      setFieldError("E-posta adresinizi giriniz.");
      return;
    }
    if (!password) {
      setFieldError("Şifrenizi giriniz.");
      return;
    }

    dispatchBusy({ isBusy: true });

    const loginDto: LoginDto = { email, password };
    const conf = getConfigurationLogin();
    const api = new AuthApi(conf);

    try {
      const result = await api.apiAuthCreateTokenPostCreateTokenPostPost(loginDto);

      if (result?.data?.accessToken) {
        localStorage.setItem("accessToken", result.data.accessToken);
        queryClient.clear();
        navigateAfterLogin(
          email.includes("vesacons") ? "/tickets/statistic" : "/tickets/customer"
        );
      } else {
        throw new Error("Access token alınamadı.");
      }
    } catch {
      dispatchAlert({ message: "E-posta veya şifre hatalı!", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLoginWithVesa();
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden bg-[#1e3a5f]">
        {/* Geometric accent shapes */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#3e5d8f]/40 blur-3xl" />
        <div className="absolute bottom-0 -left-24 w-[400px] h-[400px] rounded-full bg-[#5b7fad]/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#2c4f7c]/20 blur-2xl" />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Brand text */}
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/90 font-semibold text-lg tracking-wide">Vesa</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-3">
            Destek Yönetim
            <br />
            Portalına Hoş Geldiniz
          </h1>
          <p className="text-white/70 text-base font-light max-w-sm leading-relaxed">
            Tüm destek taleplerinizi tek bir yerden kolayca yönetin.
          </p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#3e5d8f] flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700 text-base tracking-wide">Vesa</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1.5">Giriş Yap</h2>
            <p className="text-sm text-slate-500">
              Hesabınıza erişmek için bilgilerinizi girin.
            </p>
          </div>

          {/* Azure SSO button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full h-11 gap-2.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm text-sm font-medium"
            onClick={handleLoginWithAzure}
          >
            {/* Microsoft icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 23 23"
              className="w-4 h-4 shrink-0"
            >
              <path fill="#f3f3f3" d="M0 0h23v23H0z" />
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Microsoft hesabıyla giriş yap
          </Button>

          <Divider label="veya e-posta ile devam et" />

          {/* Form */}
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleLoginWithVesa();
            }}
            noValidate
          >
            <InputField
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad@vesacons.com"
              autoComplete="email"
              error={!!fieldError && !email}
            />

            <InputField
              label="Şifre"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handlePasswordKeyDown}
              placeholder="••••••••••"
              autoComplete="current-password"
              error={!!fieldError && !password}
              rightElement={
                <button
                  type="button"
                  tabIndex={0}
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />

            {/* Inline error */}
            {fieldError && (
              <p className="text-xs text-rose-500 font-medium -mt-1">{fieldError}</p>
            )}

            {/* Forgot password */}
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                tabIndex={0}
                onClick={() => navigate("/authentication/reset-password")}
                className="text-xs text-slate-500 hover:text-[#3e5d8f] transition-colors font-medium"
              >
                Şifremi unuttum
              </button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full h-11 bg-[#3e5d8f] hover:bg-[#324d7a] text-white font-medium gap-2 shadow-sm shadow-[#3e5d8f]/30 transition-all duration-200"
            >
              Giriş Yap
              <LogIn className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Cover;
