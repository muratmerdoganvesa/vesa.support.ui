// src/utils/axiosInstance.ts
import axios, { AxiosInstance, AxiosError, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';
import globalAxios from 'axios';
import { apiUrl, resolveApiBaseUrl } from 'config/apiBase';
import { isPlatformModuleMode } from 'platform/platformMode';
import {
  clearAuthSession,
  getAccessToken,
  markTokenValidated,
} from 'utils/authSession';
import { ensureFreshAccessToken, refreshAccessToken } from 'utils/tokenRefresh';
import { requestReAuth } from 'utils/reAuthGate';

const getLastValidationTime = (): number => {
  const stored = localStorage.getItem('lastTokenValidation');
  return stored ? parseInt(stored, 10) : 0;
};

let isTokenValid = true;
let validationPromise: Promise<boolean> | null = null;
const VALIDATION_INTERVAL = 5 * 60 * 1000; // 5 dakika

const PUBLIC_ENDPOINTS = [
  '/api/Auth/CreateToken',
  '/api/Auth/CreateTokenByRefreshToken',
  '/api/User/CheckSSOEmailControl',
  '/api/ForgotPassword/forgot-password',
  '/api/ForgotPassword/verify-reset-code',
  '/api/ForgotPassword/change-pw',
];

const isPublicEndpoint = (url?: string): boolean =>
  !!url && PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));

const isLoginPage = (): boolean => {
  const currentPath = window.location.pathname;
  const currentHash = window.location.hash;
  return (
    currentPath.includes('/authentication/') ||
    currentPath.includes('/sign-in') ||
    currentPath.includes('/reset-password') ||
    currentHash.includes('/authentication/')
  );
};

/** WorkZone / platform: shell login. Standalone: sayfada re-auth modal. */
const handleSessionLost = async (): Promise<boolean> => {
  isTokenValid = false;

  if (isLoginPage()) {
    return false;
  }

  if (isPlatformModuleMode()) {
    clearAuthSession();
    try {
      window.top!.location.href = '/login.html';
    } catch {
      window.location.href = '/authentication/sign-in/cover';
    }
    return false;
  }

  // Stale accessToken'ı silme — PrivateRoute sayfayı ayakta tutsun
  const ok = await requestReAuth();
  if (ok) {
    isTokenValid = true;
    markTokenValidated();
    return true;
  }

  clearAuthSession();
  return false;
};

const validateTokenIfNeeded = async (token: string): Promise<boolean> => {
  const now = Date.now();
  const lastValidationTime = getLastValidationTime();

  if (now - lastValidationTime < VALIDATION_INTERVAL) {
    return isTokenValid;
  }

  if (validationPromise) {
    return validationPromise;
  }

  validationPromise = (async () => {
    try {
      const response = await fetch(apiUrl('/api/User/validatetokenAndUser'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        isTokenValid = true;
        markTokenValidated();
        return true;
      }

      const renewed = await refreshAccessToken();
      if (renewed) {
        const retry = await fetch(apiUrl('/api/User/validatetokenAndUser'), {
          method: 'GET',
          headers: { Authorization: `Bearer ${renewed}` },
        });
        if (retry.ok) {
          isTokenValid = true;
          markTokenValidated();
          return true;
        }
      }

      return await handleSessionLost();
    } catch (error) {
      if (error instanceof TypeError) {
        // Network hatası — mevcut token ile devam
        return isTokenValid;
      }
      return await handleSessionLost();
    } finally {
      validationPromise = null;
    }
  })();

  return validationPromise;
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean; _reauth?: boolean };

const attachAuthRequestInterceptor = (
  instance: typeof globalAxios | AxiosInstance
): void => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      if (isPublicEndpoint(config.url)) {
        return config;
      }

      await ensureFreshAccessToken();

      let token = getAccessToken();

      if (!token) {
        if (!isLoginPage()) {
          const recovered = await handleSessionLost();
          token = recovered ? getAccessToken() : null;
        }
        if (!token) {
          return Promise.reject({
            message: 'Token bulunamadı',
            config,
          });
        }
      }

      config.headers.Authorization = `Bearer ${token}`;

      if (!config.url?.includes('validatetokenAndUser')) {
        const isValid = await validateTokenIfNeeded(getAccessToken() || token);
        if (!isValid) {
          return Promise.reject({
            message: 'Token geçersiz, lütfen tekrar giriş yapın',
            config,
          });
        }
        const latest = getAccessToken();
        if (latest) {
          config.headers.Authorization = `Bearer ${latest}`;
        }
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};

const attachAuthResponseInterceptor = (
  instance: typeof globalAxios | AxiosInstance
): void => {
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetryConfig | undefined;

      if (error.response?.status === 401 && original && !original._reauth) {
        if (isPublicEndpoint(original.url)) {
          return Promise.reject(error);
        }

        // 1) sessiz refresh
        if (!original._retry) {
          original._retry = true;
          const renewed = await refreshAccessToken();
          if (renewed) {
            if (!original.headers) {
              original.headers = {} as AxiosRequestHeaders;
            }
            (original.headers as Record<string, string>).Authorization = `Bearer ${renewed}`;
            return instance.request(original);
          }
        }

        // 2) sayfada yeniden giriş
        original._reauth = true;
        const recovered = await handleSessionLost();
        if (recovered) {
          const latest = getAccessToken();
          if (latest) {
            if (!original.headers) {
              original.headers = {} as AxiosRequestHeaders;
            }
            (original.headers as Record<string, string>).Authorization = `Bearer ${latest}`;
            return instance.request(original);
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

attachAuthRequestInterceptor(globalAxios);
attachAuthResponseInterceptor(globalAxios);

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: resolveApiBaseUrl(),
    timeout: 30000,
  });

  attachAuthRequestInterceptor(instance);
  attachAuthResponseInterceptor(instance);

  return instance;
};

export const axiosInstance = createAxiosInstance();
