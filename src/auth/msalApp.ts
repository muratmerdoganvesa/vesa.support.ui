import { PublicClientApplication } from '@azure/msal-browser';

function isLocalhostHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isLocalhost = isLocalhostHost(hostname);

/** Popup / redirect her ortamda mevcut origin'e dönsün (Vercel preview dahil). */
function resolveRedirectUri(): string {
  if (typeof window === 'undefined') {
    return isLocalhost ? 'http://localhost:3000' : 'https://support.vesa-tech.com';
  }
  return window.location.origin;
}

export function getAzureApiScope(): string {
  return isLocalhost
    ? 'api://28116fc8-fd64-4ccb-ab4d-96d2f3653846/access_as_user'
    : 'api://1a4e7070-9c88-4097-9805-caf72e245e79/access_as_user';
}

const msalConfig = isLocalhost
  ? {
      auth: {
        clientId: '28116fc8-fd64-4ccb-ab4d-96d2f3653846',
        authority:
          'https://login.microsoftonline.com/8b3326df-62dc-4c93-84c2-db8f6f28f4bb',
        redirectUri: resolveRedirectUri(),
      },
      cache: {
        cacheLocation: 'localStorage' as const,
        storeAuthStateInCookie: false,
      },
    }
  : {
      auth: {
        clientId: '1a4e7070-9c88-4097-9805-caf72e245e79',
        authority:
          'https://login.microsoftonline.com/8b3326df-62dc-4c93-84c2-db8f6f28f4bb',
        redirectUri: resolveRedirectUri(),
      },
      cache: {
        cacheLocation: 'localStorage' as const,
        storeAuthStateInCookie: true,
      },
    };

export const msalInstance = new PublicClientApplication(msalConfig);
