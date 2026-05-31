import React, { useMemo, useState, useRef, useEffect } from "react";

/**
 * html2canvas cannot parse modern CSS color functions (oklch, oklab, color(display-p3 …), etc.).
 * This helper replaces every unsupported occurrence in a CSS text string by drawing a 1×1 pixel
 * on a Canvas 2D context — the browser resolves the color to sRGB natively — then reads back
 * the rgb() value via getImageData.
 *
 * willReadFrequently: true  →  avoids the "Multiple readback operations" browser warning and
 * lets the browser pick a CPU-backed canvas that is faster for repeated getImageData calls.
 */
function resolveModernColorsInCssText(text: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return text;

  // Matches oklch/oklab (with optional alpha variant) and color() wide-gamut spaces
  const unsupportedColorRe =
    /(?:oklch|oklab|oklcha|oklaba)\([^)]+\)|color\(\s*(?:display-p3|srgb|a98-rgb|prophoto-rgb|rec2020)[^)]*\)/g;

  return text.replace(unsupportedColorRe, (match) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = match;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return a < 255
      ? `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`
      : `rgb(${r},${g},${b})`;
  });
}
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { Tree } from "react-organizational-chart";
import "./orgchart-custom.css";
import { useZoom } from "./hooks/useZoom";
import { chartContainerStyle, getChartContentStyle } from "./styles/orgChart.styles";
import { NodeRenderer, RenderTreeNodes } from "./components/NodeRenderer";
import getConfiguration from "confiuration";
import {
  OrganizationApi,
  OrganizationDto,
  WorkCompanyApi,
  WorkCompanyDto,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
} from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Progress } from "components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { ZoomIn, ZoomOut, RotateCcw, Download, Search, Loader2, ChevronsUpDown, X } from "lucide-react";

interface OrgNode {
  id: string;
  name: string;
  title?: string;
  email?: string;
  photo?: string;
  children?: OrgNode[];
  expanded?: boolean;
  type?: string;
  className?: string;
}

interface ExpandedState {
  [key: string]: boolean;
}

const OrganizationalChartPage = () => {
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [workCompanyData, setWorkCompanyData] = useState<WorkCompanyDto[]>([]);
  const [selectedWorkCompany, setSelectedWorkCompany] = useState<WorkCompanyDto | null>(null);
  const [departmentData, setDepartmentData] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<TicketDepartmensListDto | null>(null);
  const [deptOpen, setDeptOpen] = useState(false);

  const mapToOrgNode = (item: OrganizationDto): OrgNode => ({
    id: item.id || "",
    name: item.name || "Kullanıcı",
    title: item.title,
    email: item.email,
    photo: item.photo,
    expanded: item.expanded,
    type: item.type,
    className: item.className,
    children: item.children ? item.children.map(mapToOrgNode) : [],
  });

  const [expandedNodes, setExpandedNodes] = useState<ExpandedState>({});

  useEffect(() => {
    if (!orgData) return;
    const initialState: ExpandedState = {};
    const initExpanded = (node: OrgNode) => {
      initialState[node.id] = true;
      if (node.children) node.children.forEach(initExpanded);
    };
    initExpanded(orgData);
    setExpandedNodes(initialState);
  }, [orgData]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const isExpanded = (nodeId: string) => expandedNodes[nodeId];

  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { zoom, contentPosition, handleZoomButton, resetZoom } = useZoom({
    containerRef: chartContainerRef,
    contentRef: contentRef,
  });

  const filteredNodes = useMemo(() => {
    if (!orgData) return null;
    if (!searchQuery.trim()) return orgData;

    const searchTerm = searchQuery.toLowerCase();
    const searchNodes = (node: OrgNode): OrgNode | null => {
      const nodeMatches = node.name.toLowerCase().includes(searchTerm);
      let matchingChildren: OrgNode[] = [];
      if (node.children && node.children.length > 0) {
        matchingChildren = node.children
          .map(searchNodes)
          .filter((child): child is OrgNode => child !== null);
      }
      if (nodeMatches || matchingChildren.length > 0) {
        return { ...node, children: matchingChildren.length > 0 ? matchingChildren : undefined };
      }
      return null;
    };
    return searchNodes(orgData);
  }, [searchQuery, orgData]);

  const handleExportToPDF = () => {
    if (isExporting) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportStage("Hazırlanıyor...");
    setShowExportModal(true);

    const chartElement = contentRef.current;
    const containerElement = chartContainerRef.current;

    if (!chartElement || !containerElement) {
      console.error("Chart or container element not found for PDF export.");
      setIsExporting(false);
      setShowExportModal(false);
      return;
    }

    const originalChartTransform = chartElement.style.transform || "";
    const originalContainerOverflow = containerElement.style.overflow || "";
    const originalContainerHeight = containerElement.style.height || "";
    const originalContainerWidth = containerElement.style.width || "";
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    function restoreStyles() {
      try {
        if (chartElement) chartElement.style.transform = originalChartTransform;
        if (containerElement) {
          containerElement.style.overflow = originalContainerOverflow;
          containerElement.style.width = originalContainerWidth;
          containerElement.style.height = originalContainerHeight;
        }
        window.scrollTo(scrollX, scrollY);
        setIsExporting(false);
      } catch (restoreError) {
        console.error("Error restoring styles:", restoreError);
        setIsExporting(false);
      }
    }

    try {
      setExportProgress(10);
      setExportStage("Görünüm düzenleniyor...");
      chartElement.style.transform = "translate(0px, 0px) scale(1)";
      containerElement.style.overflow = "visible";

      const captureWidth = Math.max(chartElement.scrollWidth, chartElement.offsetWidth);
      const captureHeight = Math.max(chartElement.scrollHeight, chartElement.offsetHeight);
      containerElement.style.width = `${captureWidth}px`;
      containerElement.style.height = `${captureHeight}px`;

      setTimeout(async () => {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);
        setExportProgress(20);
        setExportStage("Şema görüntüsü alınıyor...");

        html2canvas(chartElement, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          allowTaint: false,
          onclone: (clonedDoc) => {
            // Replace unsupported modern color functions in all <style> tags of the cloned doc
            clonedDoc.querySelectorAll("style").forEach((styleEl) => {
              if (styleEl.textContent) {
                styleEl.textContent = resolveModernColorsInCssText(styleEl.textContent);
              }
            });
            // Replace in any inline style attributes
            clonedDoc.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
              const inline = el.getAttribute("style") ?? "";
              if (inline) {
                el.setAttribute("style", resolveModernColorsInCssText(inline));
              }
            });
          },
        })
          .then((canvas) => {
            try {
              setExportProgress(60);
              setExportStage("PDF oluşturuluyor...");

              const imgData = canvas.toDataURL("image/jpeg", 0.7);
              const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
                compress: true,
              });

              pdf.setProperties({
                title: "Organizasyon Şeması",
                subject: "Şirket organizasyon yapısı",
                creator: "Vesa Support UI",
                author: "Vesa System",
              });

              setExportProgress(80);
              setExportStage("PDF yerleştiriliyor...");

              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();
              const canvasAspectRatio = canvas.width / canvas.height;

              let imageWidthInPdf = pdfWidth - 10;
              let imageHeightInPdf = imageWidthInPdf / canvasAspectRatio;
              if (imageHeightInPdf > pdfHeight - 10) {
                imageHeightInPdf = pdfHeight - 10;
                imageWidthInPdf = imageHeightInPdf * canvasAspectRatio;
              }

              const xPos = (pdfWidth - imageWidthInPdf) / 2;
              const yPos = (pdfHeight - imageHeightInPdf) / 2;
              pdf.addImage(imgData, "JPEG", xPos, yPos, imageWidthInPdf, imageHeightInPdf);

              setExportProgress(95);
              setExportStage("İndirme hazırlanıyor...");

              setTimeout(() => {
                pdf.save("organizasyon-semasi.pdf");
                setExportProgress(100);
                setExportStage("İndirme tamamlandı!");
                setTimeout(() => setShowExportModal(false), 1800);
                canvas.width = 0;
                canvas.height = 0;
              }, 300);
            } catch (pdfError) {
              console.error("Error creating PDF:", pdfError);
              setExportStage("Hata oluştu!");
              setTimeout(() => setShowExportModal(false), 1500);
            }
          })
          .catch((error) => {
            console.error("Error generating canvas:", error);
            setExportStage("Hata oluştu!");
            setTimeout(() => setShowExportModal(false), 1500);
          })
          .finally(restoreStyles);
      }, 200);
    } catch (error) {
      console.error("Unexpected error in export process:", error);
      setExportStage("Hata oluştu!");
      setTimeout(() => setShowExportModal(false), 1500);
      restoreStyles();
    }
  };

  const handleCloseExportModal = () => {
    if (exportProgress < 100 && exportProgress > 0) {
      if (window.confirm("PDF indirme işlemi devam ediyor. İptal etmek istiyor musunuz?")) {
        setShowExportModal(false);
      }
    } else {
      setShowExportModal(false);
    }
  };

  const getData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new OrganizationApi(conf);
      const res = await api.apiOrganizationGet();
      console.log("orgdata", res.data);
      setOrgData(mapToOrgNode(res.data));
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu" + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const getDataByDepartment = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new OrganizationApi(conf);
      const res = await api.apiOrganizationGetByDepartmentGet(selectedDepartment.id);
      console.log("orgdata", res.data);
      setOrgData(mapToOrgNode(res.data));
    } catch (error) {
      dispatchAlert({ message: "Hata oluştu" + error, type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const config = getConfiguration();
        const companyApi = new WorkCompanyApi(config);
        const departmentApi = new TicketDepartmentsApi(config);

        const companyRes = await companyApi.apiWorkCompanyGet();
        setWorkCompanyData(companyRes.data);
        const defaultCompany = companyRes.data.find(
          (c) => c.id === "2e5c2ba5-3eb8-414d-8bc7-08dd44716854"
        );
        setSelectedWorkCompany(defaultCompany);

        const departmentRes = await departmentApi.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();
        setDepartmentData(departmentRes.data);
      } catch (error) {
        console.error("Initial data fetch error:", error);
        dispatchAlert({
          message: "Şirket ve departman verileri alınırken hata oluştu: " + error,
          type: "Error",
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
      await getData();
    };
    fetchInitialData();
  }, []);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (selectedDepartment) {
      console.log("selected departman değişti1");
      getDataByDepartment();
    } else {
      console.log("selected departman değişti2");
      getData();
    }
  }, [selectedDepartment]);

  return (
    <DashboardLayout>
      <DashboardNavbar />

      {/* ── Export progress dialog ── */}
      <Dialog open={showExportModal} onOpenChange={(open) => !open && handleCloseExportModal()}>
        <DialogContent showCloseButton={false} className="sm:max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-base font-semibold text-[#344767]">
              {exportProgress < 100 ? "PDF indiriliyor..." : "İndirme tamamlandı!"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-2 flex flex-col gap-3">
            <Progress
              value={exportProgress}
              className={[
                "h-2 rounded-full",
                exportProgress < 100 ? "bg-blue-100 *:data-[slot=progress-indicator]:bg-blue-500" : "bg-green-100 *:data-[slot=progress-indicator]:bg-green-500",
              ].join(" ")}
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{exportStage}</span>
              <span className="tabular-nums font-medium">{exportProgress}%</span>
            </div>
          </div>

          {exportProgress === 100 && (
            <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/60">
              <Button
                size="sm"
                onClick={() => setShowExportModal(false)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                Tamam
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Main card ── */}
      <div className="p-3">
        <div className="rounded-xl bg-white shadow-md border border-gray-100 p-6">
          {/* Page title */}
          <h1 className="text-2xl font-semibold text-[#344767]">Organizasyon Şeması</h1>
          <p className="text-sm text-[#7b809a] mt-1 mb-5">
            Şirket organizasyon yapısını ve departman hiyerarşisini görüntüleyin
          </p>

          {/* Filter row */}
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Company (disabled) */}
            <Button
              variant="outline"
              disabled
              aria-label="Şirket seçin"
              className="w-64 h-9 justify-between rounded-lg border-slate-200 font-normal opacity-60 cursor-not-allowed"
            >
              <span className={selectedWorkCompany ? "text-foreground" : "text-muted-foreground"}>
                {selectedWorkCompany?.name ?? "Şirket Ara"}
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
            </Button>

            {/* Department */}
            <Popover open={deptOpen} onOpenChange={setDeptOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={deptOpen}
                  aria-label="Departman seçin"
                  className="w-64 h-9 justify-between rounded-lg border-slate-200 font-normal"
                >
                  <span className={selectedDepartment ? "text-foreground" : "text-muted-foreground"}>
                    {selectedDepartment?.departmentText ?? "Departman Ara"}
                  </span>
                  <div className="flex items-center gap-1">
                    {selectedDepartment && (
                      <X
                        className="size-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDepartment(null);
                          setDeptOpen(false);
                        }}
                        aria-label="Seçimi temizle"
                      />
                    )}
                    <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-fit p-0" align="start">
                <Command>
                  <CommandInput placeholder="Departman ara..." />
                  <CommandList>
                    <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
                    <CommandGroup>
                      {departmentData.map((d) => (
                        <CommandItem
                          key={d.id}
                          value={d.departmentText ?? ""}
                          data-checked={selectedDepartment?.id === d.id}
                          onSelect={() => {
                            setSelectedDepartment(
                              d.id === selectedDepartment?.id ? null : d
                            );
                            setDeptOpen(false);
                          }}
                        >
                          {d.departmentText}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomButton(false)}
                className="h-8 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50 hover:-translate-y-px transition-all"
                aria-label="Küçült"
              >
                <ZoomOut className="size-4" />
                Küçült
              </Button>

              <span className="min-w-12 text-center text-sm font-medium text-slate-600 tabular-nums">
                %{zoom}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleZoomButton(true)}
                className="h-8 gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50 hover:-translate-y-px transition-all"
                aria-label="Büyüt"
              >
                <ZoomIn className="size-4" />
                Büyüt
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => resetZoom()}
                className="h-8 gap-1.5 border-slate-200 text-slate-500 hover:bg-slate-50 hover:-translate-y-px transition-all"
                aria-label="Varsayılan zoom"
              >
                <RotateCcw className="size-4" />
                Varsayılan
              </Button>
            </div>

            {/* Search + PDF export */}
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Arama yap..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(e.target.value)
                  }
                  className="h-9 pl-8 rounded-lg border-slate-200"
                  aria-label="Organizasyon şemasında ara"
                />
              </div>

              {/* <Button
                size="sm"
                onClick={handleExportToPDF}
                disabled={isExporting}
                className="h-9 gap-1.5 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium hover:-translate-y-px transition-all disabled:opacity-70"
                aria-label="PDF olarak indir"
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                PDF olarak indir
              </Button> */}
            </div>
          </div>

          {/* Chart area */}
          <div className="flex justify-center w-full overflow-hidden relative mt-4 p-2">
            <div
              className="org-chart-container"
              ref={chartContainerRef}
              style={chartContainerStyle}
            >
              {filteredNodes ? (
                <div
                  ref={contentRef}
                  style={getChartContentStyle(zoom, contentPosition.x, contentPosition.y)}
                >
                  <Tree
                    lineWidth="2px"
                    lineColor="rgba(63, 81, 181, 0.6)"
                    lineBorderRadius="10px"
                    label={
                      <NodeRenderer
                        node={filteredNodes}
                        isExpanded={isExpanded}
                        toggleNode={toggleNode}
                      />
                    }
                    nodePadding="5px"
                  >
                    {filteredNodes.children && isExpanded(filteredNodes.id) && (
                      <RenderTreeNodes
                        nodes={filteredNodes.children}
                        isExpanded={isExpanded}
                        toggleNode={toggleNode}
                      />
                    )}
                  </Tree>
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-base font-medium text-muted-foreground">
                    Arama sonucu bulunamadı
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrganizationalChartPage;
