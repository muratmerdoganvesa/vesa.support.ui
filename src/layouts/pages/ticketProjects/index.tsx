import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import TicketProjectsListTab from "layouts/pages/ticketProjects/components/TicketProjectsListTab";

import { Button } from "components/ui/button";

function TicketProjects() {
  const navigate = useNavigate();


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


        <TicketProjectsListTab />
      </div>
    </DashboardLayout>
  );
}

export default TicketProjects;
