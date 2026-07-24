export type AuthMode = 'password' | 'sso' | 'platform';

const KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  accessTokenExpiration: 'accessTokenExpiration',
  refreshTokenExpiration: 'refreshTokenExpiration',
  authMode: 'authMode',
  lastTokenValidation: 'lastTokenValidation',
  menuNameSurmane: 'menuNameSurmane',
} as const;

export interface TokenPayload {
  accessToken: string;
  refreshToken?: string | null;
  accessTokenExpiration?: string | number | null;
  refreshTokenExpiration?: string | number | null;
}

function toEpochMs(value?: string | number | null): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(KEYS.accessToken);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(KEYS.refreshToken);
}

export function getAuthMode(): AuthMode | null {
  const mode = localStorage.getItem(KEYS.authMode);
  if (mode === 'password' || mode === 'sso' || mode === 'platform') return mode;
  return null;
}

export function getAccessTokenExpirationMs(): number | null {
  return toEpochMs(localStorage.getItem(KEYS.accessTokenExpiration));
}

/** Access token bitimine `skewMs` kala true (varsayılan 2 dk). */
export function isAccessTokenExpiringSoon(skewMs = 2 * 60 * 1000): boolean {
  const expiresAt = getAccessTokenExpirationMs();
  if (expiresAt == null) return false;
  return Date.now() >= expiresAt - skewMs;
}

export function persistPasswordSession(token: TokenPayload): void {
  localStorage.setItem(KEYS.accessToken, token.accessToken);
  localStorage.setItem(KEYS.authMode, 'password');

  if (token.refreshToken) {
    localStorage.setItem(KEYS.refreshToken, token.refreshToken);
  } else {
    localStorage.removeItem(KEYS.refreshToken);
  }

  const accessExp = toEpochMs(token.accessTokenExpiration);
  if (accessExp != null) {
    localStorage.setItem(KEYS.accessTokenExpiration, String(accessExp));
  } else {
    // Backend AccessTokenExpiration = 30 dk; bilinmiyorsa güvenli varsayılan
    localStorage.setItem(KEYS.accessTokenExpiration, String(Date.now() + 30 * 60 * 1000));
  }

  const refreshExp = toEpochMs(token.refreshTokenExpiration);
  if (refreshExp != null) {
    localStorage.setItem(KEYS.refreshTokenExpiration, String(refreshExp));
  }

  localStorage.setItem(KEYS.lastTokenValidation, String(Date.now()));
}

export function persistSsoSession(accessToken: string, expiresAtMs?: number | null): void {
  localStorage.setItem(KEYS.accessToken, accessToken);
  localStorage.setItem(KEYS.authMode, 'sso');
  localStorage.removeItem(KEYS.refreshToken);
  localStorage.removeItem(KEYS.refreshTokenExpiration);

  const expiresAt =
    expiresAtMs != null && Number.isFinite(expiresAtMs)
      ? expiresAtMs
      : Date.now() + 60 * 60 * 1000;
  localStorage.setItem(KEYS.accessTokenExpiration, String(expiresAt));
  localStorage.setItem(KEYS.lastTokenValidation, String(Date.now()));
}

export function persistPlatformSession(accessToken: string): void {
  localStorage.setItem(KEYS.accessToken, accessToken);
  localStorage.setItem(KEYS.authMode, 'platform');
  localStorage.setItem(KEYS.lastTokenValidation, String(Date.now()));
}

export function markTokenValidated(): void {
  localStorage.setItem(KEYS.lastTokenValidation, String(Date.now()));
}

export function clearAuthSession(): void {
  localStorage.removeItem(KEYS.accessToken);
  localStorage.removeItem(KEYS.refreshToken);
  localStorage.removeItem(KEYS.accessTokenExpiration);
  localStorage.removeItem(KEYS.refreshTokenExpiration);
  localStorage.removeItem(KEYS.authMode);
  localStorage.removeItem(KEYS.lastTokenValidation);
  localStorage.removeItem(KEYS.menuNameSurmane);
}
