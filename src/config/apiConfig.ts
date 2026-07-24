export interface ApiConfig {
  baseUrl: string;
}

/** Boş baseUrl = aynı origin (/api proxy veya Vercel rewrite) */
const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: '',
};

let cached: ApiConfig | null = null;


function isLocalDev(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

async function fetchJson(path: string): Promise<ApiConfig | null> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return null;
    const data = (await response.json()) as Partial<ApiConfig>;
    if (typeof data.baseUrl === 'string') {
      return { baseUrl: data.baseUrl.replace(/\/$/, '') };
    }
  } catch {
    // override yok
  }
  return null;
}

export async function loadApiConfig(): Promise<ApiConfig> {
  if (cached) return cached;

  const remote = (await fetchJson('/api-config.json')) ?? DEFAULT_CONFIG;
  const local = isLocalDev() ? await fetchJson('/api-config.local.json') : null;
  cached = local ?? remote;
  return cached;
}

export function getApiConfig(): ApiConfig {
  return cached ?? DEFAULT_CONFIG;
}
