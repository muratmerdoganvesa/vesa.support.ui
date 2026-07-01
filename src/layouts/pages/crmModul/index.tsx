import { CrmModulDto, CrmModulsApi } from "api/generated";
import { Button } from "components/ui/button";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Handshake, Plus } from "lucide-react";import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrmModulFilters, CrmModulFilterValues } from "./components/CrmModulFilters";
import { CrmModulGridView } from "./components/CrmModulGridView";
import { CrmModulTable } from "./components/CrmModulTable";
import { CrmModulTreeView } from "./components/CrmModulTreeView";
import { CrmModulViewToggle } from "./components/CrmModulViewToggle";
import {
  CRM_MODUL_VIEW_MODE_STORAGE_KEY,
  CrmModulListViewMode,
  DEFAULT_CRM_MODUL_VIEW_MODE,
  GRID_ITEMS_PER_PAGE,
  ROWS_PER_PAGE,
} from "./constants";
import { buildCrmModulFilterOptions, flattenCrmSubItems, isDateInRange, resolveCompanyName } from "./utils";

const defaultFilters: CrmModulFilterValues = {
  company: "all",
  leadSource: "all",
  opportunityStage: "all",
  contactPerson: "all",
  accountManager: "all",
  dateFrom: undefined,
  dateTo: undefined,
};

const readStoredViewMode = (): CrmModulListViewMode => {
  const stored = localStorage.getItem(CRM_MODUL_VIEW_MODE_STORAGE_KEY);
  if (stored === "table" || stored === "tree" || stored === "grid") {
    return stored;
  }
  return DEFAULT_CRM_MODUL_VIEW_MODE;
};

const CrmModulPage = () => {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [crmData, setCrmData] = useState<CrmModulDto[]>([]);
  const [draftFilters, setDraftFilters] = useState<CrmModulFilterValues>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<CrmModulFilterValues>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<CrmModulListViewMode>(readStoredViewMode);

  const fetchData = useCallback(async () => {    try {
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
  }, [appliedFilters, viewMode]);

  const handleViewModeChange = (mode: CrmModulListViewMode) => {
    setViewMode(mode);
    localStorage.setItem(CRM_MODUL_VIEW_MODE_STORAGE_KEY, mode);
  };

  const pageSize = viewMode === "grid" ? GRID_ITEMS_PER_PAGE : ROWS_PER_PAGE;

  const filterOptions = useMemo(() => buildCrmModulFilterOptions(crmData), [crmData]);

  const filteredRows = useMemo(() => {
    return crmData.filter((row) => {
      const companyName = resolveCompanyName(row);

      if (appliedFilters.company !== "all" && companyName !== appliedFilters.company) {
        return false;
      }
      if (
        appliedFilters.leadSource !== "all" &&
        row.leadSource !== appliedFilters.leadSource
      ) {
        return false;
      }
      if (
        appliedFilters.opportunityStage !== "all" &&
        !(row.crmSubItems ?? []).some(
          (item) => item.opportunityStage === appliedFilters.opportunityStage
        )
      ) {
        return false;
      }
      if (
        appliedFilters.contactPerson !== "all" &&
        (row.contactPerson?.trim() ?? "") !== appliedFilters.contactPerson
      ) {
        return false;
      }
      if (
        appliedFilters.accountManager !== "all" &&
        (row.accountManager?.trim() ?? "") !== appliedFilters.accountManager
      ) {
        return false;
      }
      const lastContactDates = (row.crmSubItems ?? [])
        .map((item) => item.lastContactDate)
        .filter(Boolean);
      if (
        lastContactDates.length > 0 &&
        !lastContactDates.some((date) =>
          isDateInRange(date, appliedFilters.dateFrom, appliedFilters.dateTo)
        )
      ) {
        return false;
      }
      if (
        lastContactDates.length === 0 &&
        !isDateInRange(row.lastContactDate, appliedFilters.dateFrom, appliedFilters.dateTo)
      ) {
        return false;
      }
      return true;
    });
  }, [crmData, appliedFilters]);

  const flatSubItems = useMemo(() => flattenCrmSubItems(filteredRows), [filteredRows]);
  const allFlatSubItems = useMemo(() => flattenCrmSubItems(crmData), [crmData]);

  const isFlatListView = viewMode === "table";
  const listCount = isFlatListView ? flatSubItems.length : filteredRows.length;
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

  const handleOpenEdit = (row: CrmModulDto) => {
    if (!row.id) return;
    navigate(`/crmModul/detail/${row.id}`);
  };

  const handleApplyFilters = () => {    setAppliedFilters({ ...draftFilters });
  };

  const handleResetFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="mt-2 mx-1">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
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

          <CrmModulFilters
            values={draftFilters}
            options={filterOptions}
            onChange={setDraftFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-6 py-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{listCount}</span>{" "}
              {isFlatListView ? "fırsat" : "kayıt"} listeleniyor
            </p>
            <CrmModulViewToggle value={viewMode} onChange={handleViewModeChange} />
          </div>

          {viewMode === "tree" ? (
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
