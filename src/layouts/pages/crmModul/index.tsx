import { CrmModulDto, CrmModulsApi } from "api/generated";
import { Button } from "components/ui/button";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Handshake, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "lib/utils";
import { CrmModulFilters, DEFAULT_CRM_MODUL_FILTERS } from "./components/CrmModulFilters";
import { CrmModulChartsView } from "./components/CrmModulChartsView";
import { CrmModulKanbanView } from "./components/CrmModulKanbanView";
import { CrmModulGridView } from "./components/CrmModulGridView";
import { CrmModulTable } from "./components/CrmModulTable";
import { CrmModulTreeView } from "./components/CrmModulTreeView";
import { CrmModulViewToggle } from "./components/CrmModulViewToggle";
import {
  CRM_MODUL_KANBAN_SCOPE_STORAGE_KEY,
  CRM_MODUL_VIEW_MODE_STORAGE_KEY,
  CrmKanbanScope,
  CrmModulListViewMode,
  DEFAULT_CRM_MODUL_VIEW_MODE,
  ROWS_PER_PAGE,
} from "./constants";
import { buildCrmChartStats, buildCrmModulFilterOptions, buildKanbanOpportunities, flattenCrmSubItems, isDateInRange, resolveCompanyName } from "./utils";
import { useTcmbExchangeRates } from "./hooks/useTcmbExchangeRates";

const readStoredViewMode = (): CrmModulListViewMode => {
  const stored = localStorage.getItem(CRM_MODUL_VIEW_MODE_STORAGE_KEY);
  if (stored === "table" || stored === "chart" || stored === "tree" || stored === "grid" || stored === "kanban") {
    return stored;
  }
  return DEFAULT_CRM_MODUL_VIEW_MODE;
};

const readStoredKanbanScope = (): CrmKanbanScope => {
  const stored = localStorage.getItem(CRM_MODUL_KANBAN_SCOPE_STORAGE_KEY);
  return stored === "customer" ? "customer" : "all";
};

const CrmModulPage = () => {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [crmData, setCrmData] = useState<CrmModulDto[]>([]);
  const [filters, setFilters] = useState(DEFAULT_CRM_MODUL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<CrmModulListViewMode>(readStoredViewMode);
  const [kanbanScope, setKanbanScope] = useState<CrmKanbanScope>(readStoredKanbanScope);
  const [kanbanCustomerId, setKanbanCustomerId] = useState<string | null>(null);
  const { rates: exchangeRates, loading: exchangeRatesLoading } = useTcmbExchangeRates();

  const fetchData = useCallback(async () => {
    try {
      dispatchBusy({ isBusy: true });
      const crmApi = new CrmModulsApi(getConfiguration());
      const crmResponse = await crmApi.apiCrmModulsGet();
      setCrmData(crmResponse.data ?? []);
    } catch {
      dispatchAlert({ message: "CRM kayıtları getirilirken hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  }, [dispatchAlert, dispatchBusy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, viewMode]);

  const handleViewModeChange = (mode: CrmModulListViewMode) => {
    setViewMode(mode);
    localStorage.setItem(CRM_MODUL_VIEW_MODE_STORAGE_KEY, mode);
  };

  const pageSize = ROWS_PER_PAGE;

  const filterOptions = useMemo(() => buildCrmModulFilterOptions(crmData), [crmData]);

  const filteredRows = useMemo(() => {
    return crmData.filter((row) => {
      const companyName = resolveCompanyName(row);

      if (filters.company !== "all" && companyName !== filters.company) {
        return false;
      }
      if (
        filters.partnerCompany !== "all" &&
        (row.partnerCompanyName?.trim() ?? "") !== filters.partnerCompany
      ) {
        return false;
      }
      if (
        filters.opportunityStage !== "all" &&
        !(row.crmSubItems ?? []).some(
          (item) => item.opportunityStage === filters.opportunityStage
        )
      ) {
        return false;
      }
      if (
        filters.typeCode !== "all" &&
        !(row.crmSubItems ?? []).some((item) => item.typeCode === filters.typeCode)
      ) {
        return false;
      }
      if (
        filters.accountManager !== "all" &&
        (row.sapAccountManager?.trim() ?? "") !== filters.accountManager
      ) {
        return false;
      }
      const lastContactDates = (row.crmSubItems ?? [])
        .map((item) => item.lastContactDate)
        .filter(Boolean);
      if (
        lastContactDates.length > 0 &&
        !lastContactDates.some((date) =>
          isDateInRange(date, filters.dateFrom, filters.dateTo)
        )
      ) {
        return false;
      }
      if (
        lastContactDates.length === 0 &&
        !isDateInRange(row.lastContactDate, filters.dateFrom, filters.dateTo)
      ) {
        return false;
      }
      return true;
    });
  }, [crmData, filters]);

  const flatSubItems = useMemo(() => flattenCrmSubItems(filteredRows), [filteredRows]);
  const allFlatSubItems = useMemo(() => flattenCrmSubItems(crmData), [crmData]);
  const kanbanOpportunities = useMemo(
    () => buildKanbanOpportunities(filteredRows),
    [filteredRows]
  );
  const chartStats = useMemo(() => buildCrmChartStats(filteredRows), [filteredRows]);
  const kanbanCustomerOptions = useMemo(
    () =>
      filteredRows
        .filter((row) => row.id)
        .map((row) => ({ id: row.id as string, name: resolveCompanyName(row) }))
        .sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [filteredRows]
  );

  useEffect(() => {
    if (filters.company === "all") return;
    const match = kanbanCustomerOptions.find((c) => c.name === filters.company);
    if (match) setKanbanCustomerId(match.id);
  }, [filters.company, kanbanCustomerOptions]);

  const isFlatListView = viewMode === "table";
  const isChartView = viewMode === "chart";
  const isKanbanView = viewMode === "kanban";
  const isCustomerListView = viewMode === "grid";
  const listCount = isFlatListView
    ? flatSubItems.length
    : isChartView
      ? chartStats.customerCount
    : isKanbanView
      ? kanbanOpportunities.length
      : filteredRows.length;
  const listAllCount = isFlatListView ? allFlatSubItems.length : crmData.length;

  const totalPages = Math.max(
    1,
    Math.ceil((isFlatListView ? flatSubItems.length : filteredRows.length) / pageSize)
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const paginatedSubItemEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return flatSubItems.slice(start, start + pageSize);
  }, [flatSubItems, currentPage, pageSize]);

  const handleOpenCreate = () => {
    navigate("/crmModul/detail");
  };

  const handleKanbanScopeChange = (scope: CrmKanbanScope) => {
    setKanbanScope(scope);
    localStorage.setItem(CRM_MODUL_KANBAN_SCOPE_STORAGE_KEY, scope);
    if (scope === "all") setKanbanCustomerId(null);
  };

  const handleOpenEdit = (row: CrmModulDto) => {
    if (!row.id) return;
    navigate(`/crmModul/detail/${row.id}`);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className={cn("mt-2 mx-1", isKanbanView && "h-[calc(100dvh-5.5rem)]")}>
        <div
          className={cn(
            "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden",
            isKanbanView && "h-full flex flex-col"
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                <Handshake className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-800 leading-tight">
                  CRM Modül Yönetimi
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  CRM fırsat kayıtlarını görüntüleyin ve yönetin
                </p>
              </div>
            </div>

            <Button
              onClick={handleOpenCreate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-1.5"
              size="sm"
            >
              <Plus className="size-4" />
              Yeni Kayıt
            </Button>
          </div>

          <div className="shrink-0">
            <CrmModulFilters
              values={filters}
              options={filterOptions}
              onChange={setFilters}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-3 shrink-0">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{listCount}</span>{" "}
              {isFlatListView
                ? "fırsat"
                : isChartView
                  ? "müşteri · grafik özeti"
                  : isKanbanView
                    ? "fırsat paketi"
                    : isCustomerListView
                      ? "müşteri"
                      : "kayıt"}{" "}
              listeleniyor
            </p>
            <CrmModulViewToggle value={viewMode} onChange={handleViewModeChange} />
          </div>

          {viewMode === "chart" ? (
            <CrmModulChartsView
              stats={chartStats}
              exchangeRates={exchangeRates}
              exchangeRatesLoading={exchangeRatesLoading}
            />
          ) : viewMode === "kanban" ? (
            <CrmModulKanbanView
              opportunities={kanbanOpportunities}
              scope={kanbanScope}
              selectedCustomerId={kanbanCustomerId}
              customerOptions={kanbanCustomerOptions}
              onScopeChange={handleKanbanScopeChange}
              onCustomerChange={setKanbanCustomerId}
              onOpenOpportunity={(id) => navigate(`/crmModul/detail/${id}`)}
            />
          ) : viewMode === "tree" ? (
            <CrmModulTreeView
              rows={paginatedRows}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={listCount}
              allCount={listAllCount}
              onPageChange={setCurrentPage}
              onEdit={handleOpenEdit}
            />
          ) : viewMode === "grid" ? (
            <CrmModulGridView
              rows={paginatedRows}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={listCount}
              allCount={listAllCount}
              onPageChange={setCurrentPage}
              onEdit={handleOpenEdit}
            />
          ) : (
            <CrmModulTable
              entries={paginatedSubItemEntries}
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={listCount}
              allCount={listAllCount}
              onPageChange={setCurrentPage}
              onEdit={handleOpenEdit}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
export default CrmModulPage;
