import getConfiguration from "confiuration";
import Footer from "examples/Footer";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import { useBusy } from "layouts/pages/hooks/useBusy";
import React, { useEffect, useState } from "react";
import { Card } from "components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { AppAlertType, useAlert } from "layouts/pages/hooks/useAlert";
import ProfilesList, { ProfileDto } from "./List";
import {
  TicketDepartmentsApi,
  TicketTeamApi,
  TicketTeamInsertDto,
  TicketTeamListDto,
  TicketTeamUserAppInsertDto,
  UserApi,
  WorkCompanyApi,
} from "api/generated";
import { useTranslation } from "react-i18next";
import { Plus, Save, UserPlus, UsersRound, X } from "lucide-react";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { cn } from "lib/utils";

const NONE_VALUE = "__none__";

function CreateTeam() {
  const [allDepartments, setAllDepartments] = useState([]);
  const [teamName, setTeamName] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);
  const [selectionManager, setSelectionManager] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchByName, setSearchByName] = useState<[]>([]);
  const [existingUsers, setExistingUsers] = useState<TicketTeamUserAppInsertDto[]>([]);
  const [selectedTeamUser, setSelectedTeamUser] = useState(null);
  const [selectionTeamUser, setSelectionTeamUser] = useState(null);
  const { t } = useTranslation();

  const [teamData, setTeamData] = useState<TicketTeamListDto>({
    id: null,
    name: "",
    departmentId: null,
    managerId: null,
    workCompanyId: null,
    teamList: [],
    department: null,
    workCompany: null,
    manager: null,
  });

  const [managerDisplay, setManagerDisplay] = useState("");
  const [memberDisplay, setMemberDisplay] = useState("");
  const [showManagerDd, setShowManagerDd] = useState(false);
  const [showMemberDd, setShowMemberDd] = useState(false);

  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchDepartmentData = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketDepartmentsApi(conf);
      var data = await api.apiTicketDepartmentsGet();
      setAllDepartments(data.data as any);
    } catch (error) {
      dispatchAlert({
        message: `${t("ns1:TeamPage.TeamList.HataOlustu")} : ${error}`,
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchCompany = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new WorkCompanyApi(conf);
      var response = await api.apiWorkCompanyGet();
      setCompanies(response.data);
    } catch (error) {
      dispatchAlert({
        message: `${t("ns1:TeamPage.TeamList.HataOlustu")} : ${error}`,
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const fetchTeamID = async () => {
    try {
      dispatchBusy({ isBusy: true });
      var conf = getConfiguration();
      var api = new TicketTeamApi(conf);
      var response = await api.apiTicketTeamIdGet(id);

      setTeamData({
        id: response.data.id,
        name: response.data.name,
        departmentId: response.data.departmentId,
        managerId: response.data.managerId,
        teamList: response.data.teamList,
        department: response.data.department,
        workCompany: response.data.workCompany,
        manager: response.data.manager,
        workCompanyId: response.data.workCompanyId,
      });
      setSelectedDepartment(response.data.department);
      setSelectedCompany(response.data.workCompany);
      setSelectedManager(response.data.manager);
      setExistingUsers(response.data.teamList as any);
    } catch (error) {
      dispatchAlert({
        message: `${t("ns1:TeamPage.TeamList.HataOlustu")} : ${error}`,
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchDepartmentData();
  }, []);

  useEffect(() => {
    if (id) {
      fetchTeamID();
    }
  }, [id]);

  useEffect(() => {
    if (selectedManager) {
      setManagerDisplay(`${selectedManager.firstName} ${selectedManager.lastName}`);
    }
  }, [selectedManager]);

  useEffect(() => {
    if (selectedTeamUser) {
      setMemberDisplay(`${selectedTeamUser.firstName} ${selectedTeamUser.lastName}`);
    }
  }, [selectedTeamUser]);

  useEffect(() => {
    setSearchByName([]);
    setShowManagerDd(false);
    setShowMemberDd(false);
  }, [activeIndex]);

  const handleCreateTeam = async () => {
    try {
      dispatchBusy({ isBusy: true });

      const teamList = existingUsers.map((user) => ({
        userAppId: user.userAppId,
        userApp: {
          id: user.userApp.id,
          firstName: user.userApp.firstName,
          lastName: user.userApp.lastName,
          email: user.userApp.email,
          photo: user.userApp.photo,
        },
      }));

      var jsonData: TicketTeamInsertDto = {
        departmentId: teamData.departmentId,
        name: teamData.name,
        managerId: teamData.managerId,
        teamList: teamList,
        workCompanyId: teamData.workCompanyId,
      };
      if (teamData.managerId == null) {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.YoneticiSecilmedi"),
          type: AppAlertType.Warning,
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (teamData.workCompanyId == null) {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.SirketSecilmedi"),
          type: AppAlertType.Warning,
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (teamData.name == null || teamData.name == "") {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.TakimAdiGirilmedi"),
          type: AppAlertType.Warning,
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      var conf = getConfiguration();
      var api = new TicketTeamApi(conf);
      await api.apiTicketTeamPost(jsonData);

      dispatchAlert({
        message: t("ns1:TeamPage.TeamDetail.DepartmanEklendi"),
        type: AppAlertType.Success,
      });
      dispatchBusy({ isBusy: false });
      navigate("/teams");
    } catch (error) {
      dispatchAlert({
        message: error?.toString(),
        type: AppAlertType.Error,
      });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleUpdateTeam = async () => {
    try {
      dispatchBusy({ isBusy: true });

      const teamList =
        existingUsers.length > 0
          ? existingUsers.map((user) => ({
              userAppId: user.userAppId,
              userApp: {
                id: user.userApp.id,
                firstName: user.userApp.firstName,
                lastName: user.userApp.lastName,
                email: user.userApp.email,
                photo: user.userApp.photo,
              },
            }))
          : [];

      var jsonDataWithId = {
        id: id,
        departmentId: selectedDepartment?.id || null,
        name: teamData.name,
        managerId: teamData.managerId,
        teamList: teamList,
        workCompanyId: selectedCompany.id,
      };

      if (teamData.managerId == null) {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.YoneticiSecilmedi"),
          type: AppAlertType.Warning,
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (teamData.workCompanyId == null) {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.SirketSecilmedi"),
          type: AppAlertType.Warning,
        });
        dispatchBusy({ isBusy: false });
        return;
      }
      if (teamData.name == null || teamData.name == "") {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.TakimAdiGirilmedi"),
          type: AppAlertType.Warning,
        });
        dispatchBusy({ isBusy: false });
        return;
      }

      var conf = getConfiguration();
      var api = new TicketTeamApi(conf);
      await api.apiTicketTeamPut(jsonDataWithId);

      dispatchAlert({
        message: t("ns1:TeamPage.TeamDetail.EkipGuncellendi"),
        type: AppAlertType.Success,
      });
      dispatchBusy({ isBusy: false });
      navigate("/teams");
    } catch (error) {
      dispatchAlert({ message: error?.toString(), type: AppAlertType.Error });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const handleSearchByName = async (value: string) => {
    if (value === "") {
      setSearchByName([]);
    } else {
      try {
        dispatchBusy({ isBusy: true });
        var conf = getConfiguration();
        var api = new UserApi(conf);
        var data = await api.apiUserGetAllUsersAsyncWitNameGet(value);
        var pureData = data.data;
        setSearchByName(pureData as any);
        dispatchBusy({ isBusy: false });
      } catch (error) {
        dispatchAlert({
          message: `${t("ns1:TeamPage.TeamList.HataOlustu")} : ${error}`,
          type: AppAlertType.Error,
        });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    }
  };

  const handleAddUser = () => {
    if (selectedTeamUser) {
      const userExists = existingUsers.some((user) => user.userApp.id === selectedTeamUser.id);

      if (!userExists) {
        const newUser = {
          userApp: {
            id: selectedTeamUser.id,
            firstName: selectedTeamUser.firstName,
            lastName: selectedTeamUser.lastName,
            email: selectedTeamUser.email,
            photo: selectedTeamUser.photo,
          },

          userAppId: selectedTeamUser.id,
        };

        setExistingUsers((prev) => [...prev, newUser]);
        setTeamData({ ...teamData, teamList: [...teamData.teamList, newUser] });
        setSelectedTeamUser(null);
        setSelectionTeamUser(null);
        setMemberDisplay("");
      } else {
        dispatchAlert({
          message: t("ns1:TeamPage.TeamDetail.UyeEklendi"),
          type: AppAlertType.Warning,
        });
      }
    }
  };

  const handleDeleteUser = (userId: string) => {
    setExistingUsers((prevUsers) => prevUsers.filter((user) => user.userAppId !== userId));
  };

  const tabItems = [
    { label: t("ns1:TeamPage.TeamDetail.TakimBilgileri"), icon: UserPlus },
    { label: t("ns1:TeamPage.TeamDetail.Uyeler"), icon: UsersRound },
  ];

  const fieldGap = "space-y-6";

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <div className="min-h-[calc(100vh-160px)] space-y-6 px-4 py-8 md:px-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {t("ns1:TeamPage.TeamList.TeamTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("ns1:TeamPage.TeamList.TeamSubTitle")}
          </p>
        </div>

        <Card className="rounded-2xl border-slate-100/90 bg-card/80 p-6 shadow-sm shadow-slate-200/40 ring-1 ring-border/60">
          <div className="border-b border-slate-100">
            <nav
              className="-mb-px flex flex-wrap gap-1"
              role="tablist"
              aria-label="Takım bölümleri"
            >
              {tabItems.map((item, i) => {
                const Icon = item.icon;
                const active = activeIndex === i;
                return (
                  <button
                    key={item.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-2 rounded-t-lg border border-transparent px-4 py-2.5 text-sm font-medium transition-all duration-150",
                      active
                        ? "border-slate-200 border-b-transparent bg-white text-indigo-600 shadow-sm shadow-slate-200/50"
                        : "border-transparent bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className={cn(activeIndex === 0 ? "pt-8" : "pt-8")}>
            {activeIndex === 0 ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className={cn(fieldGap)}>
                  <div className="space-y-2">
                    <Label htmlFor="company-select">
                      {t("ns1:TeamPage.TeamDetail.SirketAdi")}
                      <span className="text-rose-500"> *</span>
                    </Label>
                    <Select
                      value={
                        selectedCompany?.id != null
                          ? String(selectedCompany.id)
                          : undefined
                      }
                      onValueChange={(vid) => {
                        const co = companies.find((c: any) => String(c.id) === vid);
                        if (!co) {
                          return;
                        }
                        setSelectedCompany(co);
                        setTeamData({ ...teamData, workCompanyId: co.id });
                      }}
                    >
                      <SelectTrigger
                        id="company-select"
                        className="h-11 w-full border-slate-200 bg-white shadow-none focus-visible:ring-indigo-100"
                      >
                        <SelectValue
                          placeholder={t("ns1:TeamPage.TeamDetail.SirketAdi")}
                        />
                      </SelectTrigger>
                      <SelectContent position="popper" className="w-(--radix-select-trigger-width)">
                        {companies.map((c: any) => (
                          <SelectItem key={String(c.id)} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team-name">
                      {t("ns1:TeamPage.TeamDetail.TakimAdi")}
                      <span className="text-rose-500"> *</span>
                    </Label>
                    <Input
                      id="team-name"
                      type="text"
                      value={teamData.name}
                      onChange={(e) => {
                        setTeamData({ ...teamData, name: e.target.value });
                      }}
                      className="h-11 border-slate-200 bg-white shadow-none focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                      placeholder={t("ns1:TeamPage.TeamDetail.TakimAdi")}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className={cn(fieldGap)}>
                  <div className="space-y-2">
                    <Label>{t("ns1:TeamPage.TeamDetail.Departman")}</Label>
                    <Select
                      value={
                        selectedDepartment?.id != null
                          ? String(selectedDepartment.id)
                          : NONE_VALUE
                      }
                      onValueChange={(vid) => {
                        if (vid === NONE_VALUE) {
                          setSelectedDepartment(null);
                          setTeamData({ ...teamData, departmentId: null });
                          return;
                        }
                        const dep = allDepartments.find((d: any) => String(d.id) === vid);
                        if (!dep) {
                          return;
                        }
                        setTeamData({ ...teamData, departmentId: dep.id });
                        setSelectedDepartment(dep);
                      }}
                    >
                      <SelectTrigger className="h-11 w-full border-slate-200 bg-white shadow-none focus-visible:ring-indigo-100">
                        <SelectValue
                          placeholder={t("ns1:TeamPage.TeamDetail.DepartmanSeciniz")}
                        />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        <SelectItem value={NONE_VALUE}>
                          <span className="text-muted-foreground">—</span>
                        </SelectItem>
                        {allDepartments.map((d: any) => (
                          <SelectItem key={String(d.id)} value={String(d.id)}>
                            {d.departmentText}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager-search">
                      {t("ns1:TeamPage.TeamDetail.Yonetici")}
                      <span className="text-rose-500"> *</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="manager-search"
                        value={managerDisplay}
                        autoComplete="off"
                        placeholder={t("ns1:TeamPage.TeamDetail.YoneticiSeciniz")}
                        onChange={(e) => {
                          const v = e.target.value;
                          setManagerDisplay(v);
                          handleSearchByName(v);
                          setShowManagerDd(true);
                        }}
                        onFocus={() => setShowManagerDd(true)}
                        className="h-11 border-slate-200 bg-white shadow-none focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                      />
                      {showManagerDd && searchByName.length > 0 && (
                        <ul
                          className="absolute top-full left-0 z-1100 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-popover p-1 shadow-lg shadow-slate-200/50 ring-1 ring-foreground/5"
                          role="listbox"
                        >
                          {searchByName.map((option: any) => (
                            <li key={option.id} role="option">
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-slate-100"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setSelectionManager(`${option.firstName} ${option.lastName}`);
                                  setSelectedManager(option);
                                  setTeamData({
                                    ...teamData,
                                    managerId: option.id,
                                    manager: option,
                                  });
                                  setManagerDisplay(`${option.firstName} ${option.lastName}`);
                                  setShowManagerDd(false);
                                  setSearchByName([]);
                                }}
                              >
                                <Avatar className="size-9 shrink-0">
                                  {option.photo ? (
                                    <AvatarImage
                                      src={`data:image/png;base64,${option.photo}`}
                                      alt=""
                                    />
                                  ) : (
                                    <AvatarFallback className="bg-indigo-100 text-[10px] text-indigo-700">
                                      {(option.firstName?.[0] ?? "?") +
                                        (option.lastName?.[0] ?? "")}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium leading-tight text-slate-900">
                                    {option.firstName} {option.lastName}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {option.email}
                                  </span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(fieldGap)}>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold tracking-tight text-slate-800">
                    {t("ns1:TeamPage.TeamDetail.TakimUyeleri")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("ns1:TeamPage.TeamDetail.MevcutUyeler")}
                  </p>
                </div>

                {existingUsers.length > 0 ? (
                  <ProfilesList
                    title={`${t("ns1:TeamPage.TeamDetail.MevcutUyeler")} (${existingUsers.length})`}
                    profiles={existingUsers.map((user): ProfileDto => ({
                      id: user.userApp.id,
                      name: `${user.userApp.firstName} ${user.userApp.lastName}`,
                      description: user.userApp.email,
                      image: user.userApp.photo,
                    }))}
                    shadow={false}
                    onDelete={handleDeleteUser}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center">
                    <p className="text-sm font-medium text-slate-600">
                      {t("ns1:TeamPage.TeamDetail.UyeYok")}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="relative min-w-0 flex-1 space-y-2">
                    <Label htmlFor="member-search">
                      {t("ns1:TeamPage.TeamDetail.TakimUyesiSeciniz")}
                    </Label>
                    <Input
                      id="member-search"
                      value={memberDisplay}
                      autoComplete="off"
                      placeholder={t("ns1:TeamPage.TeamDetail.TakimUyesiSeciniz")}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMemberDisplay(v);
                        handleSearchByName(v);
                        setShowMemberDd(true);
                      }}
                      onFocus={() => setShowMemberDd(true)}
                      className="h-11 border-slate-200 bg-white shadow-none focus-visible:border-indigo-400 focus-visible:ring-indigo-100"
                    />
                    {showMemberDd && searchByName.length > 0 && (
                      <ul className="absolute top-full left-0 z-1100 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-popover p-1 shadow-lg ring-1 ring-foreground/5">
                        {searchByName.map((option: any) => (
                          <li key={option.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-100"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setSelectionTeamUser(`${option.firstName} ${option.lastName}`);
                                setSelectedTeamUser(option);
                                setMemberDisplay(`${option.firstName} ${option.lastName}`);
                                setShowMemberDd(false);
                                setSearchByName([]);
                              }}
                            >
                              <Avatar className="size-9 shrink-0">
                                {option.photo ? (
                                  <AvatarImage
                                    src={`data:image/png;base64,${option.photo}`}
                                    alt=""
                                  />
                                ) : (
                                  <AvatarFallback className="bg-indigo-100 text-[10px] text-indigo-700">
                                    {(option.firstName?.[0] ?? "?") + (option.lastName?.[0] ?? "")}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium text-slate-900">
                                  {option.firstName} {option.lastName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                  {option.email}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 border-indigo-200 bg-indigo-50/70 font-medium text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                    onClick={handleAddUser}
                    disabled={!selectedTeamUser}
                  >
                    <Plus className="mr-1 size-4" aria-hidden />
                    {t("ns1:TeamPage.TeamDetail.Ekle")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col-reverse gap-3 border-t border-slate-100 pt-8 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-slate-200 bg-white px-6 text-slate-700 hover:bg-slate-50 sm:min-w-[120px]"
              onClick={() => navigate("/teams")}
            >
              <X className="mr-1 size-4" aria-hidden />
              {t("ns1:TeamPage.TeamDetail.Iptal")}
            </Button>
            <Button
              type="button"
              className="h-11 rounded-xl bg-indigo-600 px-8 font-semibold shadow-sm shadow-indigo-200/60 transition hover:-translate-y-px hover:bg-indigo-700 hover:shadow-indigo-200/80 sm:min-w-[140px]"
              onClick={id ? handleUpdateTeam : handleCreateTeam}
            >
              <Save className="mr-2 size-4" aria-hidden />
              {t("ns1:TeamPage.TeamDetail.Kaydet")}
            </Button>
          </div>
        </Card>
      </div>

      <Footer />
    </DashboardLayout>
  );
}

export default CreateTeam;
