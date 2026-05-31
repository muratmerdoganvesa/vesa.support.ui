import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "components/ui/alert";
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

const ALERT_AUTO_DISMISS_MS = 6000;

const TypeIcon = ({ type }: { type?: string }) => {
  switch (type) {
    case "Success":
      return (
        <CheckCircle2
          className="size-4 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
      );
    case "Warning":
      return (
        <AlertTriangle
          className="size-4 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
      );
    case "Information":
      return (
        <Info className="size-4 text-sky-600 dark:text-sky-400" aria-hidden />
      );
    case "Error":
    case "Critical":
      return <AlertCircle className="size-4" aria-hidden />;
    default:
      return <Info className="size-4" aria-hidden />;
  }
};

const getAlertVisual = (type?: string) => {
  const isDestructive =
    type === AppAlertType.Error ||
    type === AppAlertType.Critical ||
    type === "Error" ||
    type === "Critical";

  if (isDestructive) {
    return {
      isDestructive: true,
      className: cn(
        "border-destructive/40 bg-red-50 text-foreground dark:border-destructive/50 dark:bg-red-950",
        "[&_[data-slot=alert-description]]:text-foreground/90 *:[svg]:text-destructive",
      ),
    };
  }

  const className = cn(
    type === AppAlertType.Success && [
      "border-emerald-600/35 bg-emerald-50 text-foreground dark:border-emerald-500/45 dark:bg-emerald-950",
      "[&_[data-slot=alert-description]]:text-foreground/90",
    ],
    type === AppAlertType.Warning && [
      "border-amber-600/35 bg-amber-50 text-foreground dark:border-amber-500/45 dark:bg-amber-950",
      "[&_[data-slot=alert-description]]:text-foreground/90",
    ],
    type === AppAlertType.Information && [
      "border-sky-600/35 bg-sky-50 text-foreground dark:border-sky-500/45 dark:bg-sky-950",
      "[&_[data-slot=alert-description]]:text-foreground/90",
    ],
    type !== AppAlertType.Success &&
      type !== AppAlertType.Warning &&
      type !== AppAlertType.Information && [
        "border-border bg-muted text-foreground",
        "[&_[data-slot=alert-description]]:text-muted-foreground",
      ],
  );

  return { isDestructive: false, className };
};

export function AlertProvider({ children }: AlertProviderProps): JSX.Element {
  const [hasAlert, setHasAlert] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<string | undefined>();

  const handleCloseAlert = useCallback(() => setHasAlert(false), []);

  const dispatchAlert = useCallback(({ message, type: nextType }: AlertDispatchArgs) => {
    setMessage(message);
    setType(nextType);
    setHasAlert(true);
  }, []);

  useEffect(() => {
    if (!hasAlert) {
      return;
    }
    const id = window.setTimeout(() => setHasAlert(false), ALERT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [hasAlert]);

  const { isDestructive, className: typeClassName } = getAlertVisual(type);

  return (
    <AlertContext.Provider value={dispatchAlert}>
      {hasAlert ? (
        <div
          className="animate-in fade-in slide-in-from-top-2 fixed inset-x-4 top-4 z-1200 mx-auto max-w-md duration-200"
          role="presentation"
        >
          <Alert
            variant={isDestructive ? "destructive" : "default"}
            className={cn("shadow-md", typeClassName)}
          >
            <TypeIcon type={type} />
            <AlertTitle className="leading-snug">
              {type === AppAlertType.Success
                ? "Başarılı"
                : type === AppAlertType.Warning
                  ? "Uyarı"
                  : type === AppAlertType.Information
                    ? "Bilgi"
                    : isDestructive
                      ? "Hata"
                      : "Bildirim"}
            </AlertTitle>
            <AlertDescription>{message}</AlertDescription>
            <AlertAction>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-7"
                onClick={handleCloseAlert}
                aria-label="Kapat"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </AlertAction>
          </Alert>
        </div>
      ) : null}
      {children}
    </AlertContext.Provider>
  );
}
