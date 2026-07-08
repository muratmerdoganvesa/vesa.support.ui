import { Component, ErrorInfo, ReactNode } from "react";
import { isChunkLoadError, reloadForStaleChunk } from "utils/chunkReload";

type ChunkErrorBoundaryProps = {
  children: ReactNode;
};

type ChunkErrorBoundaryState = {
  hasError: boolean;
  isChunkError: boolean;
};

/**
 * `vite:preloadError` çoğu bayat (stale) chunk senaryosunu yakalar, ancak bazı
 * durumlarda hata React render aşamasında (örn. `Cannot read properties of
 * undefined (reading 'default')`) yüzeye çıkabilir. Bu bileşen, `<Suspense>`
 * ağacını sararak bu tür hataları da yakalayıp sayfayı sessizce yeniler.
 */
class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo): void {
    if (isChunkLoadError(error)) {
      reloadForStaleChunk();
      return;
    }
    console.error("Uygulama hatası:", error, errorInfo);
  }

  render() {
    if (this.state.isChunkError) return null;

    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Bir şeyler ters gitti. Lütfen sayfayı yenileyin.
          </p>
          <button
            type="button"
            tabIndex={0}
            aria-label="Sayfayı yenile"
            onClick={() => window.location.reload()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") window.location.reload();
            }}
            className="rounded-md bg-[#4263FF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#3450e0] focus:outline-none focus:ring-2 focus:ring-[#4263FF] focus:ring-offset-2"
          >
            Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;
