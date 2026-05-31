import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldX, ArrowLeft, Info, AlertCircle } from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

const IconBadge = () => (
  <div className="relative flex items-center justify-center w-24 h-24 mb-6">
    {/* Outer ripple ring */}
    <span className="absolute inset-0 rounded-full bg-rose-100 animate-ping opacity-40" />
    {/* Inner soft circle */}
    <span className="absolute inset-2 rounded-full bg-rose-50" />
    <ShieldX
      className="relative z-10 w-10 h-10 text-rose-400 animate-pulse"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  </div>
);

type ErrorBannerProps = {
  visible: boolean;
  message: string;
};

const ErrorBanner = ({ visible, message }: ErrorBannerProps) => (
  <div
    role="alert"
    aria-live="polite"
    className={cn(
      "flex items-center gap-2.5 px-4 py-3 rounded-xl",
      "bg-rose-50 border border-rose-100 text-rose-600 text-sm",
      "transition-all duration-500 ease-out",
      visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
    )}
  >
    <AlertCircle className="shrink-0 w-4 h-4" aria-hidden="true" />
    <span>{message}</span>
  </div>
);

type InfoHintProps = {
  message: string;
};

const InfoHint = ({ message }: InfoHintProps) => (
  <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 text-sm">
    <Info className="shrink-0 w-4 h-4 mt-0.5" aria-hidden="true" />
    <span>{message}</span>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

const NotAuthorizationPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showError, setShowError] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const readyTimer = setTimeout(() => setVisible(true), 300);
    const errorTimer = setTimeout(() => setShowError(true), 600);

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(errorTimer);
    };
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <main
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 156px)" }}
      >
        <article
          className={cn(
            "w-full flex flex-col items-center text-center gap-4",
            "bg-white rounded-2xl border border-slate-100 shadow-sm",
            "px-8 h-full flex flex-col justify-center items-center sm:px-8",
            "transition-all duration-500 ease-out",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          aria-labelledby="not-auth-title"
        >
          <IconBadge />

          <div className="flex flex-col gap-1">
            <h1
              id="not-auth-title"
              className="text-xl font-semibold tracking-tight text-slate-800"
            >
              {t("ns1:AuthPage.NotAuth.YetkisizErisim")}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t("ns1:AuthPage.NotAuth.YetkiYok")}
            </p>
          </div>

          <ErrorBanner
            visible={showError}
            message={t("ns1:AuthPage.NotAuth.ErisimReddedildi")}
          />

          <p className="text-xs text-slate-400 leading-relaxed">
            {t("ns1:AuthPage.NotAuth.YoneticiBilgi")}
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className={cn(
              "mt-2 gap-2 text-rose-500 border-rose-200",
              "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300",
              "transition-colors duration-200"
            )}
            aria-label={t("ns1:AuthPage.NotAuth.GeriDon")}
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            {t("ns1:AuthPage.NotAuth.GeriDon")}
          </Button>

          <InfoHint message={t("ns1:AuthPage.NotAuth.YetkiTalep")} />
        </article>
      </main>

      
    </DashboardLayout>
  );
};

export default NotAuthorizationPage;
