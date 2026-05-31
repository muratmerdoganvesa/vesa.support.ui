import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import {
  ProjectTasksApi,
  UserApi,
  UserAppDtoOnlyNameId,
  TicketDepartmensListDto,
  TicketDepartmentsApi,
  TicketProjectsListDto,
  TicketProjectsApi,
} from "api/generated";
import getConfiguration from "confiuration";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import GlobalCell from "layouts/pages/talepYonetimi/allTickets/tableData/globalCell";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";

import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
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
import { cn } from "lib/utils";

/* ─── Searchable select (Popover + Command) ─────────────────────────────── */

interface SearchableSelectProps<T> {
  options: T[];
  value: T | null | undefined;
  getLabel: (option: T) => string;
  getId: (option: T) => string;
  onChange: (value: T | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect = <T,>({
  options,
  value,
  getLabel,
  getId,
  onChange,
  placeholder = "Seçiniz…",
  searchPlaceholder = "Ara…",
  disabled = false,
  className,
}: SearchableSelectProps<T>) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open && !disabled} onOpenChange={(o) => !disabled && setOpen(o)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-xl border-border/60 bg-background px-3 font-normal text-sm transition-all duration-200 ease-out",
            "hover:bg-slate-50 dark:hover:bg-slate-800/50",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{value ? getLabel(value) : placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 rounded-xl" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="__clear__"
                  onSelect={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className="text-muted-foreground italic"
                >
                  Seçimi temizle
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={getId(option)}
                  value={getLabel(option)}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value && getId(value) === getId(option) ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {getLabel(option)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/* ─── AssignUsersCell ───────────────────────────────────────────────────── */

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

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
};

/* ─── Main component ────────────────────────────────────────────────────── */

function UserProjects() {
  const dispatchAlert = useAlert();
  const dispatchBusy = useBusy();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [projectsData, setProjectsData] = useState<TicketProjectsListDto[]>([]);
  const [userData, setUserData] = useState<UserAppDtoOnlyNameId[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAppDtoOnlyNameId | null | undefined>(null);
  const [hasPerm, setHasPerm] = useState<boolean>();
  const [departmentsData, setDepartmentsData] = useState<TicketDepartmensListDto[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<
    TicketDepartmensListDto | null | undefined
  >(null);

  const fetchProjectData = async (userId?: string | null) => {
    try {
      const conf = getConfiguration();
      const api = new TicketProjectsApi(conf);
      const data = await api.apiTicketProjectsGetProjectsByUserGet(userId);
      setProjectsData(data.data as any);
    } catch (error) {
      dispatchAlert({ message: "Proje verileri getirilirken hata oluştu.", type: "Error" });
    }
  };

  const fetchUsersData = async () => {
    try {
      const config = getConfiguration();
      const api = new UserApi(config);
      const response = await api.apiUserVesaUsersWithoutPhotoGet();
      setUserData(response.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchUsersDataByDepartment = async (departmentId: string) => {
    try {
      const config = getConfiguration();
      const api = new UserApi(config);
      const response = await api.apiUserVesaUsersWithoutPhotoGet(departmentId);
      setUserData(response.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchDepartmentsData = async () => {
    try {
      const config = getConfiguration();
      const api = new TicketDepartmentsApi(config);
      const response = await api.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();
      setDepartmentsData(response.data);
    } catch (error) {
      console.log("error", error);
    }
  };

  const fetchHasPerm = async () => {
    try {
      const config = getConfiguration();
      const api = new ProjectTasksApi(config);
      const response = await api.apiProjectTasksHasPermGet();
      setHasPerm(response.data);

      if (response.data !== true) {
        const api2 = new UserApi(config);
        const response2 = await api2.apiUserGetLoginUserDetailGet();
        setSelectedUser(response2.data);
        const response3 = await api2.apiUserUserDepartmentGet();
        setSelectedDepartment(response3.data);
        await fetchProjectData(response2.data.id);
      } else {
        await fetchProjectData();
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      dispatchBusy({ isBusy: true });
      try {
        await fetchHasPerm();
        await Promise.all([fetchUsersData(), fetchDepartmentsData()]);
      } catch (error) {
        console.log("init error", error);
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      fetchUsersDataByDepartment(selectedDepartment.id);
    } else {
      fetchUsersData();
    }
    if (hasPerm === true) {
      setSelectedUser(null);
    }
  }, [selectedDepartment]);

  const handleFilter = async () => {
    dispatchBusy({ isBusy: true });
    await fetchProjectData(selectedUser?.id ?? "");
    dispatchBusy({ isBusy: false });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="flex flex-col gap-6 px-1 py-2">
        {/* Page header */}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Danışman Projeleri
          </h1>
          <p className="text-sm text-muted-foreground">Danışman projelerini görüntüleyin.</p>
        </div>

        {/* Filter bar */}
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
                onChange={setSelectedDepartment}
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
                onChange={setSelectedUser}
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
            onClick={handleFilter}
          >
            <Search className="size-4" aria-hidden />
            Getir
          </Button>
        </div>

        {/* Table card */}
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
                  projectsData.map((row: any, idx: number) => (
                    <TableRow
                      key={row.id ?? idx}
                      className="border-border/40 transition-colors duration-150"
                    >
                      <TableCell className="px-4 py-3 text-sm">
                        <AssignUsersCell value={row.userIds} />
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
                        <GlobalCell value={formatDate(row.createdDate)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default UserProjects;
