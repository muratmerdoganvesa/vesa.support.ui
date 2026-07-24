import {
  addInitListener,
  getContext as getLuigiContext,
  getToken,
  linkManager,
} from '@luigi-project/client';
import { isPlatformModuleMode } from 'platform/platformMode';
import { persistPlatformSession } from 'utils/authSession';

export type SupportTheme = 'sap_horizon' | 'sap_horizon_dark';

export interface SupportContext {
  userId: string;
  email: string;
  displayName: string;
  roles: string[];
  language: string;
  theme: SupportTheme;
  accessToken?: string;
}

type InitCallback = (context: SupportContext) => void;

function toSupportContext(raw: Record<string, unknown>): SupportContext {
  const theme = raw.theme === 'sap_horizon_dark' ? 'sap_horizon_dark' : 'sap_horizon';
  const roles = Array.isArray(raw.roles) ? (raw.roles as string[]) : [];

  return {
    userId: typeof raw.userId === 'string' ? raw.userId : 'anonymous',
    email: typeof raw.email === 'string' ? raw.email : '',
    displayName: typeof raw.displayName === 'string' ? raw.displayName : 'Kullanıcı',
    roles,
    language: typeof raw.language === 'string' ? raw.language : 'tr',
    theme,
    accessToken: typeof raw.accessToken === 'string' ? raw.accessToken : getToken(),
  };
}

export function applyPlatformContext(context: SupportContext): void {
  if (context.accessToken) {
    persistPlatformSession(context.accessToken);
  }
}

/** Cross-origin iframe (workzone ↔ support) için third-party cookie kontrolünü kapat */
export function onLuigiInit(callback: InitCallback): void {
  addInitListener(
    () => {
      callback(toSupportContext(getLuigiContext() as Record<string, unknown>));
    },
    true,
  );
}

export function getContext(): SupportContext {
  return toSupportContext(getLuigiContext() as Record<string, unknown>);
}

export function getAccessToken(): string | undefined {
  return getContext().accessToken ?? getToken();
}

/** Shell rotasına geç — yalnızca modül modunda */
export function navigateToShell(path: string): void {
  if (isPlatformModuleMode()) {
    try {
      linkManager().fromVirtualTreeRoot().navigate(path);
    } catch {
      // shell senkronu başarısız
    }
  }
}
