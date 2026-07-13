import { getApiConfig } from './apiConfig';

/** Build-time override; boş bırakılırsa runtime api-config.json kullanılır */
function envApiBase(): string {
  return (import.meta.env.VITE_BASE_PATH as string | undefined)?.trim().replace(/\/$/, '') ?? '';
}

/**
 * API kök URL — boş string = same-origin /api (Vite/Vercel proxy, CORS yok).
 */
export function resolveApiBaseUrl(): string {
  const fromConfig = getApiConfig().baseUrl.trim();
  if (fromConfig) return fromConfig.replace(/\/$/, '');

  const fromEnv = envApiBase();
  if (fromEnv) return fromEnv;

  return '';
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = resolveApiBaseUrl();
  if (!base) return normalizedPath;
  return `${base}${normalizedPath}`;
}
