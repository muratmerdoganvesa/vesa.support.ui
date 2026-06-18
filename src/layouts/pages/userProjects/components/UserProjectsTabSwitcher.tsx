import { Briefcase, Users } from "lucide-react";

import { cn } from "lib/utils";

import type { UserProjectsTab } from "../types";

type UserProjectsTabSwitcherProps = {
  activeTab: UserProjectsTab;
  onTabChange: (tab: UserProjectsTab) => void;
};

export const UserProjectsTabSwitcher = ({
  activeTab,
  onTabChange,
}: UserProjectsTabSwitcherProps) => {
  return (
    <div
      role="tablist"
      aria-label="Görünüm seçimi"
      className="flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "consultant"}
        aria-controls="panel-consultant"
        id="tab-consultant"
        tabIndex={activeTab === "consultant" ? 0 : -1}
        onClick={() => onTabChange("consultant")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
          activeTab === "consultant"
            ? "bg-white text-indigo-700 shadow-sm ring-1 ring-border/60 dark:bg-card dark:text-indigo-300"
            : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-card/60",
        )}
      >
        <Briefcase className="size-4 shrink-0" aria-hidden />
        Danışman Projeleri
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "stats"}
        aria-controls="panel-stats"
        id="tab-stats"
        tabIndex={activeTab === "stats" ? 0 : -1}
        onClick={() => onTabChange("stats")}
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
          activeTab === "stats"
            ? "bg-white text-indigo-700 shadow-sm ring-1 ring-border/60 dark:bg-card dark:text-indigo-300"
            : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-card/60",
        )}
      >
        <Users className="size-4 shrink-0" aria-hidden />
        Kişi İstatistikleri
      </button>
    </div>
  );
};
