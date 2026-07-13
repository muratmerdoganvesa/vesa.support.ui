import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import i18n from 'i18n';
import { onLuigiInit, type SupportTheme } from 'luigi';
import { isPlatformModuleMode } from './platformMode';

interface PlatformContextValue {
  isModule: boolean;
}

const PlatformContext = createContext<PlatformContextValue>({ isModule: false });

export function usePlatform(): PlatformContextValue {
  return useContext(PlatformContext);
}

function applyTheme(theme: SupportTheme): void {
  document.documentElement.dataset.supportTheme =
    theme === 'sap_horizon_dark' ? 'dark' : 'light';
}

interface PlatformProviderProps {
  children: ReactNode;
}

/**
 * WorkZone modül modunda Luigi context'ten token ve tema alır.
 * Standalone modda hemen render eder — mevcut akışa dokunmaz.
 */
export function PlatformProvider({ children }: PlatformProviderProps) {
  const isModule = isPlatformModuleMode();
  const [ready, setReady] = useState(!isModule);

  useEffect(() => {
    if (!isModule) return;

    document.documentElement.dataset.platformModule = 'true';
    let cancelled = false;

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 800);

    onLuigiInit((context) => {
      window.clearTimeout(fallbackTimer);

      if (context.accessToken) {
        localStorage.setItem('accessToken', context.accessToken);
        localStorage.setItem('lastTokenValidation', Date.now().toString());
      }

      if (context.language) {
        void i18n.changeLanguage(context.language);
      }

      applyTheme(context.theme);

      if (!cancelled) setReady(true);
    });

    const onPlatformTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ theme: SupportTheme }>).detail;
      if (detail?.theme) {
        applyTheme(detail.theme);
      }
    };

    window.addEventListener('platform-theme-change', onPlatformTheme);

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('platform-theme-change', onPlatformTheme);
      delete document.documentElement.dataset.platformModule;
    };
  }, [isModule]);

  const value = useMemo(() => ({ isModule }), [isModule]);

  if (!ready) {
    return null;
  }

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}
