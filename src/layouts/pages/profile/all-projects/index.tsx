import React, { useEffect, useState } from "react";
import { Eye, Edit, Trash2, Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import index0png from "assets/images/sapfiori.jpg";
import index1png from "assets/images/SAP-HR.jpg";
import index2png from "assets/images/btplogo.jpg";
import index3png from "assets/images/SAP-SuccessFactors.png";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Header from "layouts/pages/profile/components/Header";

import getConfiguration from "confiuration";
import { ProjectsApi, UserApi, UserAppDto } from "api/generated";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";

import { Button } from "components/ui/button";
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

export interface Category {
  id: string;
  categoryName?: string;
  description?: string;
  name?: string;
  userId?: string;
  categoryId?: number;
}

interface TypeOfCategory {
  description: string;
  name: string;
}

// ── Inline card ───────────────────────────────────────────────────────────────

interface CardTemplateProps extends Category {
  nameofCategories: any[];
  selectedUser: UserAppDto | null;
  onDelete: (name: string, description: string, categoryName: string, id: string, userId: string, categoryId: number) => void;
  navigate: ReturnType<typeof useNavigate>;
}

const CardTemplate: React.FC<CardTemplateProps> = ({
  name, description, id, userId, categoryName,
  nameofCategories, selectedUser, onDelete, navigate,
}) => {
  const indexOfCategory = nameofCategories.findIndex(
    (category: any) => category.description === categoryName
  );

  let image: string;
  if (indexOfCategory === 0)      image = index0png;
  else if (indexOfCategory === 1) image = index2png;
  else if (indexOfCategory === 2) image = index3png;
  else if (indexOfCategory === 3) image = index1png;

  const imageWidth = () => {
    switch (image) {
      case index0png: return "150px";
      case index1png: return "80px";
      case index2png: return "80px";
      case index3png: return "80px";
      default:        return "60px";
    }
  };

  const imageHeight = () => {
    switch (image) {
      case index0png: return "82px";
      case index1png: return "50px";
      case index2png: return "80px";
      case index3png: return "55px";
      default:        return "60px";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col overflow-hidden h-full">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">

        {/* Logo */}
        <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt="categoryIcons"
              style={{ width: imageWidth(), height: imageHeight() }}
              className="object-contain"
            />
          ) : (
            <span className="text-indigo-500 text-xl font-bold">
              {name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        {/* Title + category */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">{name}</h4>
          {categoryName && (
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {categoryName}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => navigate(`/profile/all-projects/edit-project/${id}?isOnlyRead=true`)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            aria-label="Görüntüle"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {!selectedUser && (
            <>
              <button
                type="button"
                onClick={() => navigate(`/profile/all-projects/edit-project/${id}`)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                aria-label="Düzenle"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(name, description, categoryName, id, userId, indexOfCategory)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                aria-label="Sil"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="border-slate-100 mx-4" />

      {/* Description */}
      <div
        className="px-4 py-3 flex-1 overflow-y-auto"
        style={{ minHeight: "80px", maxHeight: "100px" }}
      >
        <p className="text-xs text-slate-500 leading-relaxed">
          {description || <span className="italic text-slate-300">Açıklama yok</span>}
        </p>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

function AllProjects(): JSX.Element {
  const [slackBotMenu, setSlackBotMenu] = useState(null);
  const [isEditModalOpen, setisEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setisDeleteModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState("");
  const [resultData, setResultData] = useState<any>([]);
  const dispatchBusy = useBusy();
  const [inputName, setInputName] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TypeOfCategory>();
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState("");
  const [currentName, setCurrentName] = useState("");
  const [currentDescription, setCurrentDescription] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentId, setCurrentId] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [nameofCategories, setNameofCategories] = useState([]);
  const [ProfileData, setProfileData] = useState<UserAppDto>({});
  const [data, setData] = useState<any>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const selectedUser = location.state?.user;
  const dispatchAlert = useAlert();
  const { t } = useTranslation();

  // ── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      if (selectedUser) {
        const api = new ProjectsApi(getConfiguration());
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
  }, [selectedUser]);

  const fetchDetail = async () => {
    dispatchBusy({ isBusy: true });
    const api = new UserApi(getConfiguration());
    const res = await api.apiUserGetLoginUserDetailGet();
    setProfileData(res.data);
    dispatchBusy({ isBusy: false });
  };

  const getCategoryList = async () => {
    dispatchBusy({ isBusy: true });
    const api = new ProjectsApi(getConfiguration());
    try {
      const dataOfCategories = await api.apiProjectsGetCategoryGet();
      setNameofCategories(dataOfCategories.data as any);
      const res = await api.apiProjectsGetUserProjectGet();
      setResultData(res.data);
    } catch (error) {
      console.error("Hata :", error);
    }
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => { fetchDetail(); }, []);
  useEffect(() => { getCategoryList(); }, []);

  // ── Delete flow ──────────────────────────────────────────────────────────

  const handleDeleteCloseModal = () => setisDeleteModalOpen(false);

  const handleDelete = (
    name: string,
    description: string,
    categoryName: string,
    id: string,
    userId: string,
    categoryId: number
  ) => {
    setCurrentId(id);
    setisDeleteModalOpen(true);
  };

  const deleteProjectById = async (Id: string) => {
    const api = new ProjectsApi(getConfiguration());
    try {
      await api.apiProjectsDelete(Id);
      dispatchAlert({
        message: t("ns1:ProfilePage.AllProjects.ProjeSilindi"),
        type: "Success" as any,
      });
      await getCategoryList();
      setisDeleteModalOpen(false);
    } catch (error) {
      console.error("Hata :", error);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const activeData: Category[] = selectedUser ? data : resultData;

  return (
    <DashboardLayout>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={(v) => { if (!v) handleDeleteCloseModal(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("ns1:ProfilePage.AllProjects.SilmeOnay")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-slate-700">
                {t("ns1:ProfilePage.AllProjects.Uyari")}:
              </span>{" "}
              {t("ns1:ProfilePage.AllProjects.GeriAlinamaz")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCloseModal}>
              {t("ns1:ProfilePage.AllProjects.Iptal")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectById(currentId)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {t("ns1:ProfilePage.AllProjects.Evet")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Navbar */}
      <DashboardNavbar light absolute />

      {/* Profile header */}
      <Header headerControl profileData={selectedUser ?? ProfileData} />

      {/* Content */}
      <div className="mt-5 mb-3 mx-0.5 px-3">

        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {t("ns1:ProfilePage.AllProjects.Projelerim")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedUser
                ? `${t("ns1:ProfilePage.AllProjects.KullaniciProjeler")}${selectedUser.firstName} ${selectedUser.lastName}${t("ns1:ProfilePage.AllProjects.KullaniciProjeler2")}`
                : t("ns1:ProfilePage.AllProjects.ProjeYonetimi")}
            </p>
          </div>

          {!selectedUser && (
            <Button
              type="button"
              onClick={() => navigate("/profile/all-projects/edit-project/")}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {t("ns1:ProfilePage.AllProjects.ProjeOlustur")}
            </Button>
          )}
        </div>

        {/* Cards grid */}
        {activeData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Eye className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Henüz proje yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeData.map((item: Category) => (
              <CardTemplate
                key={item.id}
                name={item.name}
                description={item.description}
                id={item.id}
                categoryName={item.categoryName}
                userId={item.userId}
                nameofCategories={nameofCategories}
                selectedUser={selectedUser}
                onDelete={handleDelete}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}

export default AllProjects;
