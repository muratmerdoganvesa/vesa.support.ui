import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { apiUrl } from 'config/apiBase';
import { getAzureApiScope, msalInstance } from 'auth/msalApp';
import {
  getAuthMode,
  getRefreshToken,
  isAccessTokenExpiringSoon,
  persistPasswordSession,
  persistSsoSession,
  type TokenPayload,
} from 'utils/authSession';

interface ApiTokenDto {
  accessToken?: string;
  AccessToken?: string;
  refreshToken?: string | null;
  RefreshToken?: string | null;
  accessTokenExpiration?: string;
  AccessTokenExpiration?: string;
  refreshTokenExpiration?: string;
  RefreshTokenExpiration?: string;
}

interface ApiEnvelope {
  data?: ApiTokenDto;
  Data?: ApiTokenDto;
  statusCode?: number;
  StatusCode?: number;
}

let refreshPromise: Promise<string | null> | null = null;

function pickTokenDto(raw: ApiEnvelope | ApiTokenDto): ApiTokenDto {
  if (raw && typeof raw === 'object') {
    if ('data' in raw && raw.data) return raw.data;
    if ('Data' in raw && raw.Data) return raw.Data;
  }
  return raw as ApiTokenDto;
}

function toPayload(dto: ApiTokenDto): TokenPayload | null {
  const accessToken = dto.accessToken ?? dto.AccessToken;
  if (!accessToken) return null;
  return {
    accessToken,
    refreshToken: dto.refreshToken ?? dto.RefreshToken,
    accessTokenExpiration: dto.accessTokenExpiration ?? dto.AccessTokenExpiration,
    refreshTokenExpiration: dto.refreshTokenExpiration ?? dto.RefreshTokenExpiration,
  };
}

async function refreshPasswordToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(apiUrl('/api/Auth/CreateTokenByRefreshToken'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as ApiEnvelope | ApiTokenDto;
  const payload = toPayload(pickTokenDto(json));
  if (!payload) return null;

  persistPasswordSession(payload);
  return payload.accessToken;
}

async function refreshSsoToken(): Promise<string | null> {
  await msalInstance.initialize();

  const accounts = msalInstance.getAllAccounts();
  const account = msalInstance.getActiveAccount() ?? accounts[0];
  if (!account) return null;

  if (!msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(account);
  }

  try {
    const result = await msalInstance.acquireTokenSilent({
      account,
      scopes: [getAzureApiScope()],
    });
    const expiresAt = result.expiresOn?.getTime() ?? null;
    persistSsoSession(result.accessToken, expiresAt);
    return result.accessToken;
  } catch (error) {
    if (error instanceof InteractionRequiredAuthError) {
      return null;
    }
    console.warn('SSO silent token yenileme başarısız:', error);
    return null;
  }
}

/**
 * Tek uçuşlu token yenileme. Başarılıysa yeni accessToken, değilse null.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const mode = getAuthMode();
    try {
      if (mode === 'password') return await refreshPasswordToken();
      if (mode === 'sso') return await refreshSsoToken();
      // mode bilinmiyorsa: önce refreshToken, yoksa SSO dene
      if (getRefreshToken()) return await refreshPasswordToken();
      return await refreshSsoToken();
    } catch (error) {
      console.warn('Token yenileme hatası:', error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * İstek öncesi: süresi dolmak üzereyse yenile.
 * Zaten geçerliyse mevcut token'ı döner (caller localStorage'dan okur).
 */
export async function ensureFreshAccessToken(): Promise<boolean> {
  if (!isAccessTokenExpiringSoon()) return true;
  const renewed = await refreshAccessToken();
  return !!renewed;
}
