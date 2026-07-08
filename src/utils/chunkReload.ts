/**
 * Yeni bir deploy sonrası, tarayıcıda hâlâ açık olan eski sekmeler eski (artık
 * sunucudan silinmiş) hash'li chunk dosyalarını indirmeye çalışabilir. Bu durumda
 * Vercel'in SPA rewrite kuralı isteği index.html'e yönlendirdiği için tarayıcı
 * "Expected a JavaScript module but server responded with text/html" hatası alır.
 *
 * Vite, derlenmiş kodda her dinamik import() çağrısını kendi runtime yardımcısıyla
 * sarar ve bu tür bir yükleme hatası oluştuğunda `window` üzerinde `vite:preloadError`
 * event'ini tetikler. Bunu dinleyip sayfayı sessizce yeniliyoruz; böylece kullanıcı
 * hatayı hiç görmeden en güncel sürüme geçiyor.
 */
const RELOAD_STORAGE_KEY = "vesa:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

const hasReloadedRecently = (): boolean => {
  const lastReload = Number(sessionStorage.getItem(RELOAD_STORAGE_KEY) ?? 0);
  return Date.now() - lastReload < RELOAD_COOLDOWN_MS;
};

const markReloaded = (): void => {
  sessionStorage.setItem(RELOAD_STORAGE_KEY, String(Date.now()));
};

export const reloadForStaleChunk = (): void => {
  if (hasReloadedRecently()) return;
  markReloaded();
  window.location.reload();
};

export const isChunkLoadError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk .* failed|Unable to preload CSS/i.test(
    message
  );
};

export const registerChunkPreloadErrorHandler = (): void => {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    reloadForStaleChunk();
  });
};
