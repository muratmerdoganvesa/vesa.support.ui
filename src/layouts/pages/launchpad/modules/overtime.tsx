import { Clock } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Card, CardContent } from "components/ui/card";

function OvertimeModule(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="px-1 py-2">
        <Card className="rounded-2xl border-blue-100/80 shadow-[0_12px_30px_rgba(15,23,42,0.08)] dark:border-slate-700/60">
          <CardContent className="p-6">
            <div className="flex items-center gap-2.5 mb-1.5">
              <Clock className="size-5 shrink-0 text-primary" aria-hidden />
              <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Overtime
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Fazla mesai modülü için iş akışı entegrasyonuna hazır ekran.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default OvertimeModule;
