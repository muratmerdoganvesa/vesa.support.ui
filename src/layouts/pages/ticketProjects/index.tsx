import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, FolderKanban, Plus } from "lucide-react";
import { cn } from "lib/utils";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import TicketProjectsListTab from "layouts/pages/ticketProjects/components/TicketProjectsListTab";
import ProjectStatisticsTab from "layouts/pages/ticketProjects/components/ProjectStatisticsTab";

import { Button } from "components/ui/button";

type TicketProjectsTab = "list" | "statistics";

function TicketProjects() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TicketProjectsTab>("list");

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="space-y-6 py-6">
        <div className="flex items-start justify-between rounded-xl bg-card px-6 py-5 ring-1 ring-foreground/10">
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold text-[#344767] dark:text-foreground">Proje Yönetimi</h1>
            <p className="text-sm text-[#7b809a] dark:text-muted-foreground">
              Projeleri görüntüleyin, oluşturun ve dahası
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/ticketProjects/detail")}
            className="gap-1.5 bg-linear-to-tr from-cyan-400 to-blue-500 text-white shadow-md transition-transform hover:-translate-y-px hover:opacity-90"
          >
            <Plus className="size-4" />
            Yeni Proje
          </Button>
        </div>

        <div
          role="tablist"
          aria-label="Proje görünümü"
          className="flex w-fit items-center gap-1 rounded-xl border border-border/60 bg-muted/40 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "list"}
            aria-controls="panel-project-list"
            id="tab-project-list"
            tabIndex={activeTab === "list" ? 0 : -1}
            onClick={() => setActiveTab("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              activeTab === "list"
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-border/60 dark:bg-card dark:text-indigo-300"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-card/60",
            )}
          >
            <FolderKanban className="size-4 shrink-0" aria-hidden />
            Proje Listesi
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "statistics"}
            aria-controls="panel-project-statistics"
            id="tab-project-statistics"
            tabIndex={activeTab === "statistics" ? 0 : -1}
            onClick={() => setActiveTab("statistics")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              activeTab === "statistics"
                ? "bg-white text-indigo-700 shadow-sm ring-1 ring-border/60 dark:bg-card dark:text-indigo-300"
                : "text-muted-foreground hover:bg-white/60 hover:text-foreground dark:hover:bg-card/60",
            )}
          >
            <BarChart3 className="size-4 shrink-0" aria-hidden />
            Proje İstatistikleri
          </button>
        </div>

        <div
          id="panel-project-list"
          role="tabpanel"
          aria-labelledby="tab-project-list"
          hidden={activeTab !== "list"}
          className="space-y-6"
        >
          {activeTab === "list" && <TicketProjectsListTab />}
        </div>

        <div
          id="panel-project-statistics"
          role="tabpanel"
          aria-labelledby="tab-project-statistics"
          hidden={activeTab !== "statistics"}
        >
          {activeTab === "statistics" && <ProjectStatisticsTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TicketProjects;
