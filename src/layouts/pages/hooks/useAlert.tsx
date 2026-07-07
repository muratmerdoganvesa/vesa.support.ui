import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "components/ui/button";
import { cn } from "lib/utils";

/**
 * Plain string constants; same runtime values as `@ui5/webcomponents-react` MessageBoxType
 * so existing `dispatchAlert({ type: "Error" })` call sites keep working.
 */
export const AppAlertType = {
  Critical: "Critical",
  Error: "Error",
  Information: "Information",
  Success: "Success",
  Warning: "Warning",
} as const;

export type AppAlertTypeValue = (typeof AppAlertType)[keyof typeof AppAlertType];

export interface AlertDispatchArgs {
  message: string;
  /** Accepts any string for compatibility with legacy UI5 enum values */
  type: string;
  /** Özel başlık; verilmezse türe göre varsayılan kullanılır */
  title?: string;
}

export type AlertContextInterface = (args: AlertDispatchArgs) => void;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emptyState: AlertContextInterface = (args) => {
  return;
};

export const AlertContext = createContext<AlertContextInterface>(emptyState);

export const useAlert: () => AlertContextInterface = () =>
  useContext(AlertContext);

interface AlertProviderProps {
  children: React.ReactNode;
}

const ALERT_AUTO_DISMISS_MS = 4500;

const normalizeAlertType = (type?: string): AppAlertTypeValue | string => {
  if (!type) return AppAlertType.Information;
  const lower = type.toLowerCase();
  if (lower === "success") return AppAlertType.Success;
  if (lower === "error") return AppAlertType.Error;
  if (lower === "critical") return AppAlertType.Critical;
  if (lower === "warning") return AppAlertType.Warning;
  if (lower === "information" || lower === "info") return AppAlertType.Information;
  return type;
};

const getDefaultTitle = (type: string): string => {
  switch (type) {
    case AppAlertType.Success:
      return "Başarılı";
    case AppAlertType.Warning:
      return "Uyarı";
    case AppAlertType.Information:
      return "Bilgi";
    case AppAlertType.Error:
    case AppAlertType.Critical:
      return "Hata";
    default:
      return "Bildirim";
  }
};

type ToastVisual = {
  icon: React.ReactNode;
  iconWrap: string;
  border: string;
  bg: string;
  progress: string;
  title: string;
};

const getToastVisual = (type: string): ToastVisual => {
  switch (type) {
    case AppAlertType.Success:
      return {
        icon: <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />,
        iconWrap: "bg-emerald-100 ring-4 ring-emerald-50",
        border: "border-emerald-200/80",
        bg: "bg-gradient-to-br from-white to-emerald-50/40",
        progress: "bg-emerald-500",
        title: "text-emerald-900",
      };
    case AppAlertType.Warning:
      return {
        icon: <AlertTriangle className="size-5 text-amber-600" aria-hidden />,
        iconWrap: "bg-amber-100 ring-4 ring-amber-50",
        border: "border-amber-200/80",
        bg: "bg-gradient-to-br from-white to-amber-50/40",
        progress: "bg-amber-500",
        title: "text-amber-900",
      };
    case AppAlertType.Information:
      return {
        icon: <Info className="size-5 text-sky-600" aria-hidden />,
        iconWrap: "bg-sky-100 ring-4 ring-sky-50",
        border: "border-sky-200/80",
        bg: "bg-gradient-to-br from-white to-sky-50/40",
        progress: "bg-sky-500",
        title: "text-sky-900",
      };
    case AppAlertType.Error:
    case AppAlertType.Critical:
      return {
        icon: <AlertCircle className="size-5 text-red-600" aria-hidden />,
        iconWrap: "bg-red-100 ring-4 ring-red-50",
        border: "border-red-200/80",
        bg: "bg-gradient-to-br from-white to-red-50/40",
        progress: "bg-red-500",
        title: "text-red-900",
      };
    default:
      return {
        icon: <Info className="size-5 text-slate-600" aria-hidden />,
        iconWrap: "bg-slate-100 ring-4 ring-slate-50",
        border: "border-slate-200/80",
        bg: "bg-white",
        progress: "bg-slate-400",
        title: "text-slate-900",
      };
  }
};

export function AlertProvider({ children }: AlertProviderProps): JSX.Element {
  const [hasAlert, setHasAlert] = useState(false);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(AppAlertType.Information);

  const handleCloseAlert = useCallback(() => setHasAlert(false), []);

  const dispatchAlert = useCallback(
    ({ message: nextMessage, type: nextType, title: nextTitle }: AlertDispatchArgs) => {
      const normalized = normalizeAlertType(nextType);
      setMessage(nextMessage);
      setType(normalized);
      setTitle(nextTitle ?? getDefaultTitle(normalized));
      setHasAlert(true);
    },
    []
  );

  useEffect(() => {
    if (!hasAlert) {
      return;
    }
    const id = window.setTimeout(() => setHasAlert(false), ALERT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [hasAlert, message, type]);

  const visual = getToastVisual(type);

  return (
    <AlertContext.Provider value={dispatchAlert}>
      {hasAlert ? (
        <div
          className="pointer-events-none fixed inset-x-4 bottom-6 z-[1200] flex justify-end sm:inset-x-auto sm:right-6"
          role="presentation"
        >
          <div
            className={cn(
              "pointer-events-auto w-full max-w-sm animate-in slide-in-from-bottom-3 fade-in zoom-in-95 duration-300",
              "overflow-hidden rounded-2xl border shadow-xl shadow-slate-900/10",
              visual.border,
              visual.bg
            )}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 p-4 pr-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  visual.iconWrap
                )}
              >
                {visual.icon}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={cn("text-sm font-bold leading-tight", visual.title)}>
                  {title}
                </p>
                <p className="mt-1 text-sm text-slate-600 leading-snug">{message}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7 shrink-0 text-slate-400 hover:text-slate-600"
                onClick={handleCloseAlert}
                aria-label="Kapat"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="h-1 w-full bg-slate-100/80">
              <div
                key={`${type}-${message}-${title}`}
                className={cn("h-full origin-left", visual.progress)}
                style={{
                  animation: `crm-toast-progress ${ALERT_AUTO_DISMISS_MS}ms linear forwards`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
      <style>{`
        @keyframes crm-toast-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
      {children}
    </AlertContext.Provider>
  );
}
