import { ChangedTaskListDto, TicketProjectsApi } from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useEffect, useState, ChangeEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Checkbox } from "components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

function TicketProjectProgress() {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const [projectsData, setProjectsData] = useState<ChangedTaskListDto[]>([]);
  const { t } = useTranslation();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isNewProjects, setIsNewProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return projectsData;
    const q = searchQuery.toLowerCase();
    return projectsData.filter((row: any) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(q)
      )
    );
  }, [projectsData, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const fetchProjects = async (startDate: string, endDate: string) => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsGetChangedProjectsGet(startDate, endDate, isNewProjects);
      console.log("projects", data.data);
      setProjectsData(data.data);
      setCurrentPage(1);
    } catch (error) {
      dispatchAlert({
        message: "Proje verileri getirilirken hata oluştu.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleFilter = async () => {
    await fetchProjects(start, end);
  };

  const handleExcel = async () => {
    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const res = await api.apiTicketProjectsGetChangedProjectsExcelGet(start, end, isNewProjects);

      const data = res.data as any;
      const byteCharacters = atob(data.fileContents);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.contentType });
      const fileName = `Proje-Ilerleme-Raporu-${new Date().toLocaleDateString("tr-TR")}.xlsx`;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log(error);
      dispatchAlert({
        message: "Proje verileri getirilirken hata oluştu.",
        type: "Error",
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatchBusy({ isBusy: true });
        const currentDate = new Date();
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        setStart(firstDayOfMonth.toISOString().split("T")[0]);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        setEnd(lastDayOfMonth.toISOString().split("T")[0]);
        await fetchProjects(
          firstDayOfMonth.toISOString().split("T")[0],
          lastDayOfMonth.toISOString().split("T")[0]
        );
      } catch (error) {
        dispatchAlert({
          message: "Proje verileri getirilirken hata oluştu.",
          type: "Error",
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    fetchData();
  }, []);

  const AssignUsersCell = ({ value }: { value: any[] | undefined }) => {
    if (!value || value.length === 0) return <span className="text-muted-foreground">—</span>;

    if (value.length === 1) {
      const user = value[0];
      return <span className="text-sm">{`${user.firstName} ${user.lastName}`}</span>;
    }

    const firstUser = value[0];
    const otherUsers = value.slice(1);
    const tooltipContent = otherUsers
      .map((user: any) => `${user.firstName} ${user.lastName}`)
      .join(", ");

    return (
      <span className="text-sm">
        {`${firstUser.firstName} ${firstUser.lastName} `}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className="cursor-pointer font-medium text-blue-500 hover:text-blue-700 transition-colors"
                tabIndex={0}
                aria-label={`${value.length - 1} kişi daha`}
              >
                +{value.length - 1} kişi
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </span>
    );
  };

  const columns: { key: keyof ChangedTaskListDto | string; label: string }[] = [
    { key: "companyName", label: "Şirket" },
    { key: "projectName", label: "Proje Tanımı" },
    { key: "managerName", label: "Proje Yöneticisi" },
    { key: "taskName", label: "Görev Adı" },
    { key: "progress", label: "İlerleme Durumu" },
    { key: "assignUsers", label: "Atanan Kullanıcılar" },
    { key: "changeType", label: "Değişiklik Tipi" },
    { key: "createdDate", label: "Başlangıç Tarihi" },
    { key: "endDate", label: "Bitiş Tarihi" },
  ];

  const renderCell = (row: any, key: string) => {
    const value = row[key];

    if (key === "assignUsers") return <AssignUsersCell value={value} />;

    if (key === "progress") {
      return (
        <span className="text-sm text-foreground">
          {value != null ? `% ${value}` : "—"}
        </span>
      );
    }

    if (key === "createdDate" || key === "endDate") {
      return (
        <span className="text-sm text-foreground">
          {value ? formatDate(value) : "—"}
        </span>
      );
    }

    return (
      <span className="text-sm text-foreground">
        {value ?? "—"}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-[-15px] rounded-xl bg-white shadow-md overflow-hidden">
        {/* Page Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-[#344767]">Proje İlerleme Raporu</h1>
          <p className="text-sm text-[#7b809a] mt-0.5">Projelerinizi görüntüleyin ve dahası</p>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
          <div className="flex flex-wrap items-end gap-4 flex-1">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5 w-[220px]">
              <Label htmlFor="start-date" className="text-xs font-medium text-gray-600">
                Başlangıç Tarihi
              </Label>
              <Input
                id="start-date"
                type="date"
                value={start}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStart(e.target.value)}
                className="h-9 text-sm"
                aria-label="Başlangıç tarihi seçin"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5 w-[220px]">
              <Label htmlFor="end-date" className="text-xs font-medium text-gray-600">
                Bitiş Tarihi
              </Label>
              <Input
                id="end-date"
                type="date"
                value={end}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEnd(e.target.value)}
                className="h-9 text-sm"
                aria-label="Bitiş tarihi seçin"
              />
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="new-projects"
                checked={isNewProjects}
                onCheckedChange={(checked) => setIsNewProjects(Boolean(checked))}
                aria-label="Yeni eklenen projeleri de getir"
              />
              <Label
                htmlFor="new-projects"
                className="text-sm font-normal text-gray-700 cursor-pointer"
              >
                Yeni eklenen projeleri de getir.
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleFilter}
              className="h-9 bg-linear-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-sm font-medium px-4 gap-1.5"
              aria-label="Projeleri getir"
            >
              <Search className="size-4" />
              Getir
            </Button>
            <Button
              onClick={handleExcel}
              className="h-9 bg-linear-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-sm font-medium px-4 gap-1.5"
              aria-label="Excel olarak indir"
            >
              <Download className="size-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Table Card */}
        <div className="p-4">
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Table Toolbar: Search */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-muted-foreground">
                {filteredData.length} kayıt bulundu
              </p>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="h-8 pl-8 text-sm"
                  aria-label="Tabloda ara"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[520px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gray-50">
                  <TableRow className="border-b border-gray-200 hover:bg-gray-50">
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className="text-sm font-semibold text-gray-800 px-4 py-3 whitespace-nowrap"
                      >
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="py-16 text-center text-sm text-muted-foreground"
                      >
                        Gösterilecek veri bulunamadı.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row: any, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
                      >
                        {columns.map((col) => (
                          <TableCell key={col.key} className="px-4 py-2.5 whitespace-nowrap">
                            {renderCell(row, col.key)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-muted-foreground">
                Sayfa {currentPage} / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Önceki sayfa"
                  className="size-8"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= currentPage - 1 && p <= currentPage + 1)
                  )
                  .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground text-sm">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={currentPage === item ? "default" : "outline"}
                        size="icon-sm"
                        onClick={() => setCurrentPage(item as number)}
                        aria-label={`Sayfa ${item}`}
                        aria-current={currentPage === item ? "page" : undefined}
                        className="size-8 text-xs"
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Sonraki sayfa"
                  className="size-8"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TicketProjectProgress;
