import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

const SUGGESTIONS = [
  "Bir blog yazısı için fikir ver",
  "Karmaşık bir konuyu basitçe açıkla",
  "Kod parçamı incele ve iyileştir",
  "Bu hafta için bir plan oluştur",
];

export default function ChatHome() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setLoading(false);
      setValue("");
    }, 1800);
  };

  const handleStop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = value.trim().length > 0 && !loading;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <main className="flex h-[calc(100vh-155px)] flex-col bg-background text-foreground overflow-hidden">
        <div className="flex-grow flex flex-col justify-center items-center ">
          <section aria-labelledby="welcome-heading" className="text-center">
            <div className="mx-auto w-full max-w-[600px]">
              <h1 id="welcome-heading" className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground md:text-[44px]">
                Hoş geldiniz.
              </h1>
              <p className="mt-4 text-[15px] leading-7 text-muted-foreground md:text-base">
                Nasıl yardımcı olabilirim? Bir soru sorun, bir fikir paylaşın ya da yazmaya başlayın.
              </p>
            </div>
          </section>
        </div>

        <div className="w-full max-w-[720px] mx-auto px-4 pb-5">
          <ul className="mb-3 flex flex-wrap items-center justify-center gap-2" aria-label="Öneriler">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    setValue(s);
                    textareaRef.current?.focus();
                  }}
                  className="inline-flex h-8 items-center rounded-full border border-border bg-background px-3 text-[12.5px] text-muted-foreground transition-colors hover:border-[color:oklch(0_0_0_/_0.16)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>

          <form
            onSubmit={handleSubmit}
            className="group relative rounded-2xl border border-border bg-background shadow-[0_2px_2px_rgba(0,0,0,0.04)] transition-[box-shadow,border-color] duration-150 focus-within:border-[color:oklch(0_0_0_/_0.18)] focus-within:shadow-[0_0_0_4px_oklch(0_0_0_/_0.04),0_2px_4px_rgba(0,0,0,0.04)]"
          >
            <label htmlFor="chat-input" className="sr-only">Mesajınızı yazın</label>
            <textarea
              id="chat-input"
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Bir mesaj gönderin…"
              rows={1}
              aria-label="Mesajınızı yazın"
              disabled={loading}
              className="block max-h-[240px] min-h-[56px] w-full resize-none rounded-2xl bg-transparent px-4 py-4 pr-14 text-[15px] leading-6 text-foreground placeholder:text-muted-foreground/80 focus:outline-none disabled:opacity-60"
            />
            <div className="absolute bottom-2.5 right-2.5">
              {loading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Yanıtı durdur"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-sm bg-background/40" />
                    <Square className="relative h-3 w-3 fill-current" />
                  </span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Mesajı gönder"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background transition-all duration-150 enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:bg-[color:var(--secondary)] disabled:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
                </button>
              )}
            </div>
          </form>
          <p className="mt-3 text-center text-[12px] leading-4 text-muted-foreground" aria-live="polite">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingDots />
                düşünülüyor…
              </span>
            ) : (
              <>Enter ile gönder · Shift + Enter ile yeni satır</>
            )}
          </p>
        </div>
      </main>
    </DashboardLayout>
  );
}

function LoadingDots() {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-foreground/70" />
      <span className="h-1.5 w-1.5 animate-[pulse_1.2s_ease-in-out_0.15s_infinite] rounded-full bg-foreground/70" />
      <span className="h-1.5 w-1.5 animate-[pulse_1.2s_ease-in-out_0.3s_infinite] rounded-full bg-foreground/70" />
    </span>
  );
}