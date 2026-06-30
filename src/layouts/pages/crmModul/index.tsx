import { CrmModulDto, CrmModulsApi } from "api/generated";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";
import { Button } from "components/ui/button";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { AlertTriangle, Handshake, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CrmModulFilters, CrmModulFilterValues } from "./components/CrmModulFilters";
import { CrmModulTable } from "./components/CrmModulTable";
import { ROWS_PER_PAGE } from "./constants";
import { isDateInRange, resolvePartnerCompanyName } from "./utils";

const defaultFilters: CrmModulFilterValues = {
  companySearch: "",
  contactSearch: "",
  opportunityStage: "all",
  dateFrom: undefined,
  dateTo: undefined,
};

const CrmModulPage = () => {
  const navigate = useNavigate();
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();

  const [crmData, setCrmData] = useState<CrmModulDto[]>([]);
  const [draftFilters, setDraftFilters] = useState<CrmModulFilterValues>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<CrmModulFilterValues>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<string>("");

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
  }, [appliedFilters]);

  const filteredRows = useMemo(() => {
    const companyQ = appliedFilters.companySearch.trim().toLowerCase();
    const contactQ = appliedFilters.contactSearch.trim().toLowerCase();

    return crmData.filter((row) => {
      const companyName = resolvePartnerCompanyName(row).toLowerCase();
      const contactPerson = (row.contactPerson ?? "").toLowerCase();

      if (companyQ && !companyName.includes(companyQ)) return false;
      if (contactQ && !contactPerson.includes(contactQ)) return false;
      if (
        appliedFilters.opportunityStage !== "all" &&
        row.opportunityStage !== appliedFilters.opportunityStage
      ) {
        return false;
      }
      if (!isDateInRange(row.lastContactDate, appliedFilters.dateFrom, appliedFilters.dateTo)) {
        return false;
      }
      return true;
    });
  }, [crmData, appliedFilters]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const handleOpenCreate = () => {
    navigate("/crmModul/detail");
  };

  const handleOpenEdit = (row: CrmModulDto) => {
    if (!row.id) return;
    navigate(`/crmModul/detail/${row.id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      dispatchBusy({ isBusy: true });
      const api = new CrmModulsApi(getConfiguration());
      await api.apiCrmModulsIdDelete(id);
      dispatchAlert({ message: "CRM kaydı başarıyla silindi.", type: "success" });
      fetchData();
    } catch {
      dispatchAlert({ message: "Silme işlemi sırasında hata oluştu.", type: "error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleOpenDeleteDialog = (id: string) => {
    setSelectedDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = (confirmed: boolean) => {
    setDeleteDialogOpen(false);
    if (confirmed && selectedDeleteId) {
      handleDelete(selectedDeleteId);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...draftFilters });
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
            onChange={setDraftFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />

          <CrmModulTable
            rows={paginatedRows}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={filteredRows.length}
            allCount={crmData.length}
            onPageChange={setCurrentPage}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDeleteDialog}
          />
        </div>
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => !open && handleCloseDeleteDialog(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              Kayıt Silinecektir
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu CRM kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleCloseDeleteDialog(false)}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCloseDeleteDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default CrmModulPage;
