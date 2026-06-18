import { Search } from "lucide-react";

import { UserAppDtoOnlyNameId, TicketDepartmensListDto } from "api/generated";
import { Button } from "components/ui/button";

import { SearchableSelect } from "./SearchableSelect";

type UserProjectsFilterBarProps = {
  departmentsData: TicketDepartmensListDto[];
  selectedDepartment: TicketDepartmensListDto | null | undefined;
  onDepartmentChange: (value: TicketDepartmensListDto | null) => void;
  userData: UserAppDtoOnlyNameId[];
  selectedUser: UserAppDtoOnlyNameId | null | undefined;
  onUserChange: (value: UserAppDtoOnlyNameId | null) => void;
  hasPerm?: boolean;
  onFilter: () => void;
};

export const UserProjectsFilterBar = ({
  departmentsData,
  selectedDepartment,
  onDepartmentChange,
  userData,
  selectedUser,
  onUserChange,
  hasPerm,
  onFilter,
}: UserProjectsFilterBarProps) => {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-tight text-muted-foreground">
            Departman
          </label>
          <SearchableSelect<TicketDepartmensListDto>
            options={departmentsData}
            value={selectedDepartment}
            getLabel={(o) => o.departmentText ?? ""}
            getId={(o) => o.id ?? ""}
            onChange={onDepartmentChange}
            placeholder="Departman seçiniz"
            searchPlaceholder="Departman ara…"
            disabled={!hasPerm}
            className="w-[260px]"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium tracking-tight text-muted-foreground">
            Kullanıcı
          </label>
          <SearchableSelect<UserAppDtoOnlyNameId>
            options={userData}
            value={selectedUser}
            getLabel={(o) => `${o.firstName ?? ""} ${o.lastName ?? ""}`.trim()}
            getId={(o) => o.id ?? ""}
            onChange={onUserChange}
            placeholder="Kullanıcı seçiniz"
            searchPlaceholder="Kullanıcı ara…"
            disabled={!hasPerm}
            className="w-[260px]"
          />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={!hasPerm}
        className="mb-0.5 gap-1.5 rounded-xl transition-all duration-200 ease-out"
        onClick={onFilter}
      >
        <Search className="size-4" aria-hidden />
        Getir
      </Button>
    </div>
  );
};
