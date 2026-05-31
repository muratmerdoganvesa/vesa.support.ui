import { useEffect, type ReactNode } from "react";
import getConfiguration from "confiuration";
import Footer from "examples/Footer";

import { cn } from "lib/utils";

function DashboardLayout({ children }: { children: ReactNode }): JSX.Element {

  useEffect(() => {
    let cancelled = false;

    const setupAdminChat = async () => {
      try {
        const { UserApi } = await import("api/generated");
        if (cancelled) return;

        const config = getConfiguration();
        const api = new UserApi(config);
        const res = await api.apiUserCheckIsAdminGet();
        if (!res.data || cancelled) return;

        const [n8n] = await Promise.all([import("@n8n/chat"), import("@n8n/chat/style.css")]);
        if (cancelled) return;

        n8n.createChat({
          webhookUrl:
            "https://n8n.vesa-tech.com/webhook/85f1f01d-a39d-42df-8ac5-832cd4b8a212/chat",
          mode: "window",
          defaultLanguage: "en",
          showWelcomeScreen: false,
          initialMessages: ["Merhaba Ben Vesa Danışmanlık'ın yapay zeka asistanıyım"],
          webhookConfig: {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
          loadPreviousSession: false,
          i18n: {
            en: {
              title: "Vesa Destek",
              subtitle: "Bir sohbet başlatın. 7/24 yardım alabilirsiniz.",
              footer: "",
              getStarted: "Yeni Sohbet",
              inputPlaceholder: "Sorunuzu yazın..",
              closeButtonTooltip: "Kapat",
              welcomeScreen: "Merhaba Ben Vesa Danışmanlık'ın yapay zeka asistanıyım",
            },
            tr: {
              title: "Vesa Destek",
              subtitle: "Bir sohbet başlatın. 7/24 yardım alabilirsiniz.",
              footer: "",
              getStarted: "Yeni Sohbet",
              inputPlaceholder: "Sorunuzu yazın..",
              closeButtonTooltip: "Kapat",
              welcomeScreen:
                "Vesa Destek! 👋\nBir sohbet başlatın. Size 7/24 yardımcı olmak için buradayız.",
            },
          },
        });
      } catch (error) {
        console.log(error);
      }
    };

    void setupAdminChat();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col bg-background",
        "p-6",
      )}
    >
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}

export default DashboardLayout;
