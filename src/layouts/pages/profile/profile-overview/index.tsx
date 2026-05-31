import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Linkedin, FolderOpen, ChevronRight, User, Mail } from "lucide-react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Header from "layouts/pages/profile/components/Header";
import ProfilesList from "examples/Lists/ProfilesList";
import CardSettings from "./components/CardSettings";

import getConfiguration from "confiuration";
import { ProjectsApi, UserApi, UserAppDto } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { Button } from "components/ui/button";
import { Category } from "../all-projects";

interface CategorySelected {
  id: string;
  categoryName?: string;
  description?: string;
  name?: string;
  userId?: string;
  categoryId?: number;
}

function Overview(): JSX.Element {
  const [profileData, setProfileData] = useState<UserAppDto>({});
  const [resultData, setresultData] = useState<any>([]);
  const [selectedUser, setSelectedUser] = useState<UserAppDto>(null);
  const [data, setData] = useState<any>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dispatchBusy = useBusy();

  // ── Fetch projects when selected user changes ─────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      if (selectedUser) {
        const conf = getConfiguration();
        const api = new ProjectsApi(conf);
        try {
          const response = await api.apiProjectsGetByUserIdProjectListGet(selectedUser.id);
          setData(response.data as any);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      } else {
        setData(resultData.slice(0, 3));
      }
    };
    fetchData();
  }, [selectedUser, resultData]);

  const handleUserSelect = (user: UserAppDto) => setSelectedUser(user);
  const handleLetEmptyUserSelect = () => setSelectedUser(null);

  // ── Initial fetch ─────────────────────────────────────────────────────────

  const GetUserProject = async () => {
    dispatchBusy({ isBusy: true });
    const api = new ProjectsApi(getConfiguration());
    const res = await api.apiProjectsGetUserProjectGet();
    setresultData(res.data);
    dispatchBusy({ isBusy: false });
  };

  const fetchDetail = async () => {
    dispatchBusy({ isBusy: true });
    const api = new UserApi(getConfiguration());
    const res = await api.apiUserGetLoginUserDetailGet();
    setProfileData(res.data);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    GetUserProject();
    fetchDetail();
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  const activeUser   = selectedUser ?? profileData;
  const fullName     = `${activeUser.firstName ?? ""} ${activeUser.lastName ?? ""}`.trim();
  const linkedinUrl  = activeUser.linkedinUrl;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <div className="mb-4" />

      <Header
        selectedUser={handleLetEmptyUserSelect}
        profileData={selectedUser ? selectedUser : profileData}
        booleanControl={selectedUser ? true : false}
      >

        {/* ── Top three-column section ── */}
        <div className="mt-6 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* 1 — User info card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
              <h3 className="text-center text-sm font-semibold ">
                {t("ns1:ProfilePage.ProfileOverview.KullaniciBilgileri")}
              </h3>

              <hr className="border-slate-100" />

              <div className="flex flex-col gap-3">
                {fullName && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Ad Soyad</p>
                      <p className="text-sm font-medium text-slate-700">{fullName}</p>
                    </div>
                  </div>
                )}

                {activeUser.email && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">E-posta</p>
                      <p className="text-sm font-medium text-slate-700 break-all">{activeUser.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {linkedinUrl && (
                <div className="pt-1">
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                </div>
              )}
            </div>

            {/* 2 — About section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
              <h3 className="text-sm font-semibold  text-center">
                {t("ns1:ProfilePage.ProfileOverview.Hakkinda")}
              </h3>
              <hr className="border-slate-100" />
              <p className="text-sm text-slate-600 leading-relaxed">
                {activeUser.profileInfo || (
                  <span className="text-slate-400 italic text-xs">Bilgi girilmemiş</span>
                )}
              </p>
            </div>

            {/* 3 — Profiles list */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <ProfilesList
                onUserSelect={handleUserSelect}
                initialUserData={profileData}
                title={t("ns1:ProfilePage.ProfileOverview.TumProfiller")}
                shadow={false}
              />
            </div>

          </div>
        </div>

        {/* ── Projects section ── */}
        <div className="pt-2 px-1">
          <hr className="border-slate-200 mb-4" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">
                {t("ns1:ProfilePage.ProfileOverview.Projelerim")}
              </h3>
            </div>

            {selectedUser && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-3 text-xs gap-1 border-slate-200 text-slate-600 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50"
                onClick={() =>
                  navigate(`/profile/all-projects/${selectedUser.id}`, {
                    state: { user: selectedUser },
                  })
                }
              >
                {t("ns1:ProfilePage.ProfileOverview.TumProjeleriGoruntule")}
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-4 max-w-2xl">
            {selectedUser ? (
              <>
                {t("ns1:ProfilePage.ProfileOverview.KullaniciProjeler")}
                {" "}{selectedUser.firstName} {selectedUser.lastName}{" "}
                {t("ns1:ProfilePage.ProfileOverview.KullaniciProjeler2")}
              </>
            ) : (
              t("ns1:ProfilePage.ProfileOverview.ProjeGoruntuleme")
            )}
          </p>

          {/* Project cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {data.slice(0, 3).map((item: Category) => (
              <CardSettings
                key={item.id}
                name={item.name}
                description={item.description}
                id={item.id}
                categoryName={item.categoryName}
                userId={item.userId}
              />
            ))}
          </div>
        </div>

      </Header>
    </DashboardLayout>
  );
}

export default Overview;
