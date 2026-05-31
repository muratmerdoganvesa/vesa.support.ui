import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, Clock } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { cn } from "lib/utils";

interface LaunchpadTile {
  key: "documentation" | "overtime";
  title: string;
  description: string;
  route: string;
  icon: React.ReactNode;
}

const launchpadTiles: ReadonlyArray<LaunchpadTile> = [
  {
    key: "documentation",
    title: "Dökümantasyon Modülü",
    description: "Süreç rehberleri, teknik bilgi kütüphaneleri ve kurumsal içeriklere ulaşın.",
    route: "/documentation",
    icon: <BookOpen className="size-7 shrink-0" aria-hidden />,
  },
  {
    key: "overtime",
    title: "Overtime",
    description: "Mesai taleplerinizi yönetin, durumlarını takip edin ve raporlayın.",
    route: "/launchpad/overtime",
    icon: <Clock className="size-7 shrink-0" aria-hidden />,
  },
];

function Launchpad(): JSX.Element {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="px-1 py-2">
        <div className="rounded-2xl border border-slate-200/80 bg-linear-to-br from-slate-50 to-blue-50/60 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.07)] dark:border-slate-800/60 dark:from-slate-900 dark:to-slate-900/80">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Launchpad
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              SAP BTP / Fiori tarzında modüllerinize hızlı erişim sağlayın.
            </p>
          </div>

          {/* Tile grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {launchpadTiles.map((tile) => (
              <button
                key={tile.key}
                type="button"
                onClick={() => navigate(tile.route)}
                className={cn(
                  "group flex h-full w-full flex-col gap-4 rounded-xl border border-blue-100 bg-white p-5 text-left",
                  "shadow-xs transition-all duration-200 ease-out",
                  "hover:-translate-y-1 hover:border-blue-300/80 hover:shadow-[0_14px_26px_rgba(15,23,42,0.11)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  "dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:border-blue-500/40",
                )}
                aria-label={tile.title}
              >
                {/* Top row: icon + arrow */}
                <div className="flex items-start justify-between">
                  <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-blue-100/80 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
                    {tile.icon}
                  </div>
                  <ArrowRight
                    className="size-5 shrink-0 text-slate-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                    aria-hidden
                  />
                </div>

                {/* Text */}
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                    {tile.title}
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {tile.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Launchpad;
