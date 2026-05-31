import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { WorkCompanyApi, WorkCompanyDto } from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import PdfDialog from "../Components/PdfView/PdfDiallog";
import ProjectDashboard from "./projectDashboard/dashboard";

import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  FolderOpen,
  Search,
  X,
} from "lucide-react";

function MainScreen() {
  const location = useLocation();
  const [showTest, setShowTest] = useState(false);
  const [workCompanyData, setWorkCompanyData] = useState<WorkCompanyDto[]>([]);
  const [selectedWorkCompany, setSelectedWorkCompany] = useState<WorkCompanyDto | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [openPdf, setOpenPdf] = useState(false);
  const dispatchBusy = useBusy();

  useEffect(() => {
    if (location.state?.showTest) {
      setShowTest(true);
    }
    if (location.state?.workCompany) {
      setSelectedWorkCompany(location.state.workCompany);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchWorkCompanyData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const config = getConfiguration();
        const api = new WorkCompanyApi(config);
        const response = await api.apiWorkCompanyGetCompanyListInProjectIsManagerTrueGet();
        setWorkCompanyData(response.data);
      } catch (error) {
        console.error("Error fetching work company data:", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchWorkCompanyData();
  }, []);

  const handleContinue = () => {
    if (selectedWorkCompany) setShowTest(true);
  };

  const handleReturn = () => {
    setShowTest(false);
    setSelectedWorkCompany(null);
  };

  const handleClear = () => {
    setSelectedWorkCompany(null);
    setCompanySearch("");
  };

  const handlePdf = () => setOpenPdf(true);
  const handleClosePdf = () => setOpenPdf(false);

  const filteredCompanies = workCompanyData.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="relative overflow-hidden rounded-2xl" style={{ height: "80vh" }}>
        {/* ── Selection screen ──────────────────────────────────────────── */}
        <div
          className={cn(
            "absolute inset-0 flex transition-transform duration-700 ease-in-out",
            showTest ? "-translate-x-full" : "translate-x-0",
          )}
        >
          {/* Left panel — gradient brand column */}
          <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-700 to-purple-800 p-12 text-white lg:flex lg:w-[42%]">
            {/* Decorative circles */}
            <div className="absolute -left-16 -top-16 size-64 rounded-full bg-white/5" />
            <div className="absolute -bottom-20 -right-10 size-80 rounded-full bg-white/5" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-8 flex size-24 items-center justify-center rounded-3xl bg-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-sm ring-1 ring-white/20">
                <FolderOpen className="size-11" aria-hidden />
              </div>

              <h1 className="mb-3 text-3xl font-bold tracking-tight">Proje Yönetimi</h1>
              <p className="max-w-xs text-sm leading-relaxed text-indigo-200">
                Projelerinizi yönetmek için şirketinizi seçin.
              </p>

              <button
                type="button"
                onClick={handlePdf}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handlePdf()}
                aria-label="Kullanım kılavuzunu aç"
                className="mt-10 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/80 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <BookOpen className="size-3.5" aria-hidden />
                Kullanım Kılavuzu
              </button>
            </div>
          </div>

          {/* Right panel — selection content */}
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background p-8">
            <div className="w-full max-w-sm">
              {/* Mobile-only header */}
              <div className="mb-6 text-center lg:hidden">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-indigo-600">
                  <FolderOpen className="size-8 text-white" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Proje Yönetimi</h2>
                <p className="mt-1 text-sm text-muted-foreground">Şirketinizi seçin</p>
              </div>

              {/* Desktop header */}
              <div className="mb-6 hidden lg:block">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Şirket Seçin
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Devam etmek için bir şirket seçiniz.
                </p>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  placeholder="Şirket ara..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9 pr-9"
                  aria-label="Şirket ara"
                />
                {companySearch && (
                  <button
                    type="button"
                    aria-label="Aramayı temizle"
                    onClick={() => setCompanySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>

              {/* Company list */}
              <div
                role="listbox"
                aria-label="Şirket listesi"
                className="mb-5 max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-border/60 bg-card shadow-sm"
              >
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map((c) => {
                    const isSelected = selectedWorkCompany?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedWorkCompany(c)}
                        className={cn(
                          "flex w-full items-center gap-3 border-b border-border/40 px-4 py-3 text-left text-sm last:border-0",
                          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          isSelected
                            ? "bg-primary/8 text-primary"
                            : "hover:bg-accent hover:text-accent-foreground",
                        )}
                      >
                        <Building2
                          className={cn(
                            "size-4 shrink-0",
                            isSelected ? "text-primary" : "text-muted-foreground",
                          )}
                          aria-hidden
                        />
                        <span className="flex-1 font-medium">{c.name}</span>
                        {isSelected && (
                          <Check className="size-4 shrink-0 text-primary" aria-hidden />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Şirket bulunamadı.
                  </div>
                )}
              </div>

              {/* Selected badge */}
              {selectedWorkCompany && (
                <div className="mb-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
                  <Check className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  <span className="flex-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    {selectedWorkCompany.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">Seçildi</Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleClear}
                >
                  Temizle
                </Button>
                <Button
                  type="button"
                  disabled={!selectedWorkCompany}
                  className="flex-2 gap-2 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleContinue}
                >
                  Devam Et
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Dashboard screen ─────────────────────────────────────────── */}
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-700 ease-in-out",
            showTest ? "translate-x-0" : "translate-x-full",
          )}
        >
          {showTest && (
            <ProjectDashboard
              showTest={showTest}
              selectedWorkCompany={selectedWorkCompany}
              onReturn={handleReturn}
            />
          )}
        </div>
      </div>

      <PdfDialog
        open={openPdf}
        onClose={handleClosePdf}
        pdfUrl="/pdf/projectmanagement.pdf"
        title="Proje Yönetim Klavuzu"
      />
    </DashboardLayout>
  );
}

export default MainScreen;
