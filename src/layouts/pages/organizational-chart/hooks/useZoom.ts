import { useState, useRef, useCallback, useEffect, RefObject } from "react";

interface UseZoomProps {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  containerRef: RefObject<HTMLElement>;
  contentRef: RefObject<HTMLElement>;
}

interface ZoomState {
  zoom: number;
  contentPosition: { x: number; y: number };
}

export const useZoom = ({
  initialZoom = 80,
  minZoom = 30,
  maxZoom = 200,
  containerRef,
  contentRef,
}: UseZoomProps) => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    zoom: initialZoom,
    contentPosition: { x: 0, y: 0 },
  });

  const isZoomingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastPositionRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const latestPositionRef = useRef({ x: 0, y: 0 });

  // En son pozisyonu güncellemek için kullanılacak
  const updatePosition = useCallback((x: number, y: number) => {
    if (!isDraggingRef.current) return;

    // Çok küçük hareketleri önle (0.5px'den az)
    if (
      Math.abs(latestPositionRef.current.x - x) < 0.5 &&
      Math.abs(latestPositionRef.current.y - y) < 0.5
    ) {
      return;
    }

    latestPositionRef.current = { x, y };

    setZoomState((prevState) => ({
      ...prevState,
      contentPosition: { x, y },
    }));
  }, []);

  const applyZoom = useCallback(
    (newZoom: number, cursorX: number, cursorY: number) => {
      if (!containerRef.current || !contentRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // mevcut zoom için cursor konumunu hesapla
      const containerOffsetX = cursorX - rect.left;
      const containerOffsetY = cursorY - rect.top;

      // cursor konumunu üzerinden ölçekleme ayarı
      const contentCursorX =
        (containerOffsetX - zoomState.contentPosition.x) / (zoomState.zoom / 100);
      const contentCursorY =
        (containerOffsetY - zoomState.contentPosition.y) / (zoomState.zoom / 100);

      // yeni ölçek ayarını yapıyoruz
      const newScale = newZoom / 100;

      // cursor noktasının aynı ekran konumunda kalması için yeni içerik konumu
      const newContentX = containerOffsetX - contentCursorX * newScale;
      const newContentY = containerOffsetY - contentCursorY * newScale;

      // zoom durumunu güncelle
      setZoomState({
        zoom: newZoom,
        contentPosition: { x: newContentX, y: newContentY },
      });
    },
    [containerRef, contentRef, zoomState]
  );

  /**
   * mouse tekerleği kontrol alanı
   */
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (isZoomingRef.current) return;

      event.preventDefault();
      isZoomingRef.current = true;

      requestAnimationFrame(() => {
        const delta = event.deltaY;
        const zoomStep = delta > 0 ? -10 : 10;
        const newZoom = Math.min(Math.max(zoomState.zoom + zoomStep, minZoom), maxZoom);

        if (newZoom !== zoomState.zoom) {
          applyZoom(newZoom, event.clientX, event.clientY);
        }

        isZoomingRef.current = false;
      });
    },
    [zoomState.zoom, applyZoom, minZoom, maxZoom]
  );

  const handleZoomButton = useCallback(
    (zoomIn: boolean) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      const centerX = window.scrollX + rect.left + rect.width / 2;
      const centerY = window.scrollY + rect.top + rect.height / 2;

      const zoomStep = zoomIn ? 10 : -10;
      const newZoom = Math.min(Math.max(zoomState.zoom + zoomStep, minZoom), maxZoom);

      applyZoom(newZoom, centerX, centerY);
    },
    [containerRef, zoomState.zoom, applyZoom, minZoom, maxZoom]
  );

  // Mouse sürükleme işlemini başlat
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (event.button !== 0) return; // Sadece sol tıklama

      // Eğer hala bir RAF varsa iptal et
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      isDraggingRef.current = true;
      dragStartRef.current = { x: event.clientX, y: event.clientY };
      lastPositionRef.current = { ...zoomState.contentPosition };
      latestPositionRef.current = { ...zoomState.contentPosition };

      if (containerRef.current) {
        containerRef.current.style.cursor = "grabbing";

        // transform kullanarak daha performanslı bir render sağla
        if (contentRef.current) {
          contentRef.current.style.willChange = "transform";
        }
      }
    },
    [zoomState.contentPosition]
  );

  // Mouse sürükleme işlemi - RequestAnimationFrame ile optimize edilmiş
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDraggingRef.current) return;

      // Prevent multiple rAFs
      if (rafRef.current !== null) {
        return;
      }

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = event.clientX - dragStartRef.current.x;
        const deltaY = event.clientY - dragStartRef.current.y;

        const newX = lastPositionRef.current.x + deltaX;
        const newY = lastPositionRef.current.y + deltaY;

        updatePosition(newX, newY);
        rafRef.current = null;
      });
    },
    [updatePosition]
  );

  // Mouse sürükleme işlemini sonlandır
  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (containerRef.current) {
        containerRef.current.style.cursor = "grab";

        // Düşük performans modu kapat
        if (contentRef.current) {
          contentRef.current.style.willChange = "auto";
        }
      }
    }
  }, []);

  /**
   * sıfırlamak için reset fonksiyonu
   */
  const resetZoom = useCallback(() => {
    setZoomState({
      zoom: initialZoom,
      contentPosition: { x: 0, y: 0 },
    });
  }, [initialZoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Wheel, mouse down, mousemove ve mouseup olaylarını dinle
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("mousedown", handleMouseDown as any);
      window.addEventListener("mousemove", handleMouseMove as any);
      window.addEventListener("mouseup", handleMouseUp);
      container.addEventListener("mouseleave", handleMouseUp);

      // İlk content stili ayarla
      if (contentRef.current) {
        contentRef.current.style.backfaceVisibility = "hidden";
      }

      // Grab stili ile sürüklenebilir olduğunu belirt
      container.style.cursor = "grab";

      return () => {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("mousedown", handleMouseDown as any);
        window.removeEventListener("mousemove", handleMouseMove as any);
        window.removeEventListener("mouseup", handleMouseUp);
        container.removeEventListener("mouseleave", handleMouseUp);
      };
    }
  }, [containerRef, handleWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    zoom: zoomState.zoom,
    contentPosition: zoomState.contentPosition,
    handleZoomButton,
    resetZoom,
  };
};
