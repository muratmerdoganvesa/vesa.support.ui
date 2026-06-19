import { useEffect, useState } from "react";
import { Users } from "lucide-react";

import { UserAppDtoOnlyNameId, TicketDepartmensListDto } from "api/generated";
import { useUserPhotos } from "layouts/pages/kanban/hooks/useUserPhotos";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";

import { fetchUserProjectStats } from "../api/fetchUserProjectStats";
import type { UserProjectStatsDto } from "../types";
import { UserProjectStatsCard } from "./UserProjectStatsCard";
import { UserProjectsFilterBar } from "./UserProjectsFilterBar";

type UserProjectStatsTabProps = {
  departmentsData: TicketDepartmensListDto[];
  selectedDepartment: TicketDepartmensListDto | null | undefined;
  onDepartmentChange: (value: TicketDepartmensListDto | null) => void;
  userData: UserAppDtoOnlyNameId[];
  selectedUser: UserAppDtoOnlyNameId | null | undefined;
  onUserChange: (value: UserAppDtoOnlyNameId | null) => void;
  hasPerm?: boolean;
  isInitialized: boolean;
};

export const UserProjectStatsTab = ({
  departmentsData,
  selectedDepartment,
  onDepartmentChange,
  userData,
  selectedUser,
  onUserChange,
  hasPerm,
  isInitialized,
}: UserProjectStatsTabProps) => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const { getPhoto } = useUserPhotos();
  const [statsData, setStatsData] = useState<UserProjectStatsDto[]>([]);

  const fetchStats = async (userId?: string | null) => {
    try {
      const data = await fetchUserProjectStats({
        departmentId: selectedDepartment?.id,
        userId: userId ?? selectedUser?.id,
      });
      setStatsData(data);
    } catch {
      dispatchAlert({ message: "Kişi istatistikleri getirilirken hata oluştu.", type: "Error" });
    }
  };

  useEffect(() => {
    if (!isInitialized || hasPerm === undefined) return;
    if (hasPerm !== true && !selectedUser?.id) return;

    const loadInitialData = async () => {
      dispatchBusy({ isBusy: true });
      try {
        if (hasPerm !== true) {
          await fetchStats(selectedUser?.id);
        } else {
          await fetchStats();
        }
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    loadInitialData();
  }, [isInitialized, hasPerm, selectedUser?.id]);

  const handleFilter = async () => {
    dispatchBusy({ isBusy: true });
    await fetchStats(selectedUser?.id ?? "");
    dispatchBusy({ isBusy: false });
  };

  return (
    <section
      id="panel-stats"
      role="tabpanel"
      aria-labelledby="tab-stats"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Kişi İstatistikleri</h2>
        <p className="text-sm text-muted-foreground">
          Kullanıcıların yer aldığı projeleri kart görünümünde inceleyin.
        </p>
      </div>

      <UserProjectsFilterBar
        departmentsData={departmentsData}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={onDepartmentChange}
        userData={userData}
        selectedUser={selectedUser}
        onUserChange={onUserChange}
        hasPerm={hasPerm}
        onFilter={handleFilter}
      />

      {statsData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Users className="size-7 text-slate-300" aria-hidden />
          </div>
          <p className="font-semibold text-slate-500">Kayıt bulunamadı.</p>
          <p className="max-w-xs text-sm text-slate-400">
            Filtreleri kullanarak kullanıcıların proje bilgilerini görüntüleyebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {statsData.map((user) => (
            <UserProjectStatsCard key={user.userId} user={user} getPhoto={getPhoto} />
          ))}
        </div>
      )}
    </section>
  );
};
