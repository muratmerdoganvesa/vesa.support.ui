import { useEffect, useRef, useState } from "react";

import { TicketProjectsApi, TicketProjectsListDto, UserAppDtoOnlyNameId, TicketDepartmensListDto } from "api/generated";
import getConfiguration from "confiuration";
import GlobalCell from "layouts/pages/talepYonetimi/allTickets/tableData/globalCell";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useBusy } from "layouts/pages/hooks/useBusy";

import { Card, CardContent } from "components/ui/card";
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

import { UserProjectsFilterBar } from "./UserProjectsFilterBar";

const AssignUsersCell = ({ value }: { value: string[] }) => {
  if (!value || value.length === 0) return null;
  if (value.length === 1) return <span>{value[0]}</span>;

  const [first, ...rest] = value;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default">
            {first}{" "}
            <span className="font-medium text-primary">+{rest.length} kişi</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="max-w-xs text-xs">{rest.join(", ")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
};

type ConsultantProjectsTabProps = {
  departmentsData: TicketDepartmensListDto[];
  selectedDepartment: TicketDepartmensListDto | null | undefined;
  onDepartmentChange: (value: TicketDepartmensListDto | null) => void;
  userData: UserAppDtoOnlyNameId[];
  selectedUser: UserAppDtoOnlyNameId | null | undefined;
  onUserChange: (value: UserAppDtoOnlyNameId | null) => void;
  hasPerm?: boolean;
  isInitialized: boolean;
};

export const ConsultantProjectsTab = ({
  departmentsData,
  selectedDepartment,
  onDepartmentChange,
  userData,
  selectedUser,
  onUserChange,
  hasPerm,
  isInitialized,
}: ConsultantProjectsTabProps) => {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const [projectsData, setProjectsData] = useState<TicketProjectsListDto[]>([]);
  const hasInitialFetchedRef = useRef(false);

  const fetchProjectData = async (userId?: string | null) => {
    try {
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsGetProjectsByUserGet(userId);
      setProjectsData(data.data as TicketProjectsListDto[]);
    } catch {
      dispatchAlert({ message: "Proje verileri getirilirken hata oluştu.", type: "Error" });
    }
  };

  useEffect(() => {
    if (!isInitialized || hasPerm === undefined || hasInitialFetchedRef.current) return;
    if (hasPerm !== true && !selectedUser?.id) return;

    hasInitialFetchedRef.current = true;

    const loadInitialData = async () => {
      dispatchBusy({ isBusy: true });
      try {
        if (hasPerm !== true) {
          await fetchProjectData(selectedUser?.id);
        } else {
          await fetchProjectData();
        }
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    loadInitialData();
  }, [isInitialized, hasPerm, selectedUser?.id]);

  const handleFilter = async () => {
    dispatchBusy({ isBusy: true });
    await fetchProjectData(selectedUser?.id ?? "");
    dispatchBusy({ isBusy: false });
  };

  return (
    <section
      id="panel-consultant"
      role="tabpanel"
      aria-labelledby="tab-consultant"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Danışman Projeleri</h2>
        <p className="text-sm text-muted-foreground">Danışman projelerini görüntüleyin.</p>
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

      <Card className="overflow-hidden rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                {[
                  "Atanan Kişiler",
                  "Şirket",
                  "Proje Tanımı",
                  "Proje Yöneticisi",
                  "Kategori",
                  "Oluşturulma Tarihi",
                ].map((heading) => (
                  <TableHead
                    key={heading}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectsData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-sm text-muted-foreground"
                  >
                    Kayıt bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                projectsData.map((row, idx) => (
                  <TableRow
                    key={row.id ?? idx}
                    className="border-border/40 transition-colors duration-150"
                  >
                    <TableCell className="px-4 py-3 text-sm">
                      <AssignUsersCell value={row.userIds ?? []} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <GlobalCell value={row.workCompany?.name} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-foreground">
                      {row.name}
                      {row.subProjectName && (
                        <span className="text-muted-foreground"> — {row.subProjectName}</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <GlobalCell
                        value={
                          row.manager
                            ? [row.manager.firstName, row.manager.lastName]
                                .filter(Boolean)
                                .join(" ")
                            : ""
                        }
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <GlobalCell value={row.projectCategory?.name} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                      <GlobalCell value={row.createdDate ? formatDate(row.createdDate) : ""} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
};
