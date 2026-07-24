type ReAuthListener = (open: boolean) => void;

let isOpen = false;
let waitPromise: Promise<boolean> | null = null;
let resolveWait: ((ok: boolean) => void) | null = null;
const listeners = new Set<ReAuthListener>();

function notify(): void {
  listeners.forEach((listener) => listener(isOpen));
}

export function subscribeReAuth(listener: ReAuthListener): () => void {
  listeners.add(listener);
  listener(isOpen);
  return () => {
    listeners.delete(listener);
  };
}

export function isReAuthOpen(): boolean {
  return isOpen;
}

/**
 * Oturum yenileme modalını açar ve kullanıcı giriş yapana (veya iptal edene) kadar bekler.
 * Aynı anda birden fazla çağrı tek promise paylaşır.
 */
export function requestReAuth(): Promise<boolean> {
  if (waitPromise) return waitPromise;

  isOpen = true;
  notify();

  waitPromise = new Promise<boolean>((resolve) => {
    resolveWait = resolve;
  }).finally(() => {
    waitPromise = null;
    resolveWait = null;
  });

  return waitPromise;
}

export function resolveReAuthSuccess(): void {
  if (!isOpen && !resolveWait) return;
  isOpen = false;
  notify();
  resolveWait?.(true);
}

export function resolveReAuthCancel(): void {
  if (!isOpen && !resolveWait) return;
  isOpen = false;
  notify();
  resolveWait?.(false);
}
