import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { ProjectsApi } from "api/generated";
import getConfiguration from "confiuration";
import { useBusy } from "layouts/pages/hooks/useBusy";
import { useAlert } from "layouts/pages/hooks/useAlert";
import { useTranslation } from "react-i18next";

import { cn } from "lib/utils";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Separator } from "components/ui/separator";
import { Badge } from "components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { ImageIcon, Plus, X } from "lucide-react";

export interface CategoryParams {
  id: string;
  name: string;
  description: string;
  categoryId: number;
  photo: string;
  startDate: string;
  endDate: string;
  projectGain: string;
  projectLearn: string;
  projectTags: string;
}

interface ProjectInfoProps {
  CardCategory?: CategoryParams;
  params: any;
}

function ProductInfo({ params }: ProjectInfoProps): JSX.Element {
  const MAX_FILE_SIZE = 1 * 1024 * 1024;
  const dispatchAlert = useAlert();
  const [nameofCategories, setNameofCategories] = useState<{ description: string }[]>([]);
  const [CardCategory, setCardCategory] = useState<CategoryParams | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [arrayImage, setArrayImage] = useState<string[]>([]);
  const [OnlyReadMis, setOnlyReadMis] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [currentCategory, setCurrentCategory] = useState(null);
  const [denemeVerisi, setDenemeVerisi] = useState(null);
  const dispatchBusy = useBusy();
  const [tagsArray, setTagsArray] = useState<{ description: string }[]>([]);
  const [defaultLogoBase64, setDefaultLogoBase64] = useState("");
  const { t } = useTranslation();

  const [formData, setFormData] = useState<CategoryParams>({
    categoryId: null,
    description: "",
    endDate: "",
    id: "",
    name: "",
    photo: "",
    projectGain: "",
    projectLearn: "",
    projectTags: "",
    startDate: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isOnlyRead = queryParams.get("isOnlyRead") === "true";

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("en-CA", options);
  };

  useEffect(() => {
    setOnlyReadMis(isOnlyRead);
  }, []);

  const checkData = async () => {
    dispatchBusy({ isBusy: true });
    const configuration = getConfiguration();
    const api = new ProjectsApi(configuration);
    const data = await api.apiProjectsGetByProjectIdProjectListGet(params.id);
    setCardCategory(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    if (params && params.id) {
      checkData();
    } else {
      setFormData({
        categoryId: null,
        description: "",
        endDate: formatDate("2.1.2025"),
        id: "",
        name: "",
        photo: "",
        projectGain: "",
        projectLearn: "",
        projectTags: "",
        startDate: formatDate("01.01.2025"),
      });
    }
  }, [params.id]);

  useEffect(() => {
    if (CardCategory) {
      const parsedTags = CardCategory.projectTags
        .split(",")
        .map((tag) => ({ description: tag.trim() }));
      setTagsArray(parsedTags);
      setFormData({
        categoryId: CardCategory.categoryId,
        description: CardCategory.description,
        endDate: formatDate(CardCategory.endDate),
        id: CardCategory.id,
        name: CardCategory.name,
        photo: CardCategory.photo,
        projectGain: CardCategory.projectGain,
        projectLearn: CardCategory.projectLearn,
        projectTags: CardCategory.projectTags,
        startDate: formatDate(CardCategory.startDate),
      });
      setBase64Image(CardCategory.photo);
    }
  }, [CardCategory]);

  const getProject = async () => {
    dispatchBusy({ isBusy: true });
    const configuration = getConfiguration();
    const api = new ProjectsApi(configuration);
    const data = await api.apiProjectsGetCategoryGet();
    setNameofCategories(data.data as any);
    dispatchBusy({ isBusy: false });
  };

  useEffect(() => {
    getProject();
  }, []);

  const updateData = async (payload: any) => {
    dispatchBusy({ isBusy: true });
    const configuration = getConfiguration();
    const api = new ProjectsApi(configuration);
    try {
      await api.apiProjectsPut(payload);
      navigate("/profile/all-projects");
    } catch (error) {
      console.error(error);
    }
    dispatchBusy({ isBusy: false });
  };

  const createData = async (payload: any) => {
    dispatchBusy({ isBusy: true });
    const { id, ...dataWithoutId } = payload;
    if (dataWithoutId.startDate || dataWithoutId.endDate) {
      const configuration = getConfiguration();
      const api = new ProjectsApi(configuration);
      await api.apiProjectsPost(dataWithoutId);
      navigate("/profile/all-projects");
    } else {
      dispatchAlert({
        message: t("ns1:ProfilePage.EditProject.TarihDoldur"),
        type: "Error",
      });
      dispatchBusy({ isBusy: false });
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (event: any, newValue: any) => {
    if (newValue) {
      const selectedIndex = nameofCategories.findIndex(
        (category) => category.description === newValue.description,
      );
      setFormData((prev) => ({ ...prev, categoryId: selectedIndex }));
    } else {
      setFormData((prev) => ({ ...prev, categoryId: null }));
    }
  };

  const handleTagsChange = (event: any, newValue: { description: string }[]) => {
    const tagsString = newValue.map((tag) => tag.description).join(", ");
    setTagsArray(newValue);
    setFormData((prev) => ({ ...prev, projectTags: tagsString }));
  };

  const handleAddTag = (description: string) => {
    const alreadyAdded = tagsArray.some((t) => t.description === description);
    if (alreadyAdded) return;
    handleTagsChange(null, [...tagsArray, { description }]);
  };

  const handleRemoveTag = (description: string) => {
    handleTagsChange(
      null,
      tagsArray.filter((t) => t.description !== description),
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        dispatchAlert({
          message: t("ns1:ProfilePage.EditProject.DosyaBoyut"),
          type: "Error",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result.split(",")[1];
          setBase64Image(base64String);
          setArrayImage((prev) => [...prev, base64String]);
          setFormData((prev) => ({ ...prev, photo: base64String }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveClick = () => {
    setBase64Image("");
    setFormData((prev) => ({ ...prev, photo: "" }));
  };

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const handlePhotoOpenModal = () => setIsPhotoModalOpen(true);
  const handlePhotoCloseModal = () => setIsPhotoModalOpen(false);

  const displayKeys: { [key: string]: string } = {
    name: t("ns1:ProfilePage.EditProject.ProjeAdi"),
    description: t("ns1:ProfilePage.EditProject.Aciklama"),
    startDate: t("ns1:ProfilePage.EditProject.BaslangicTarihi"),
    endDate: t("ns1:ProfilePage.EditProject.BitisTarihi"),
    projectTags: t("ns1:ProfilePage.EditProject.Etiketler"),
    categoryId: t("ns1:ProfilePage.EditProject.Kategori"),
    projectLearn: t("ns1:ProfilePage.EditProject.ProjeTecrube"),
    projectGain: t("ns1:ProfilePage.EditProject.ProjeKazanimlari"),
  };

  const handleSubmit = async () => {
    for (const [key, value] of Object.entries(formData)) {
      if (key === "id" || key === "photo") continue;
      const displayKey = displayKeys[key] || key;
      if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "number" && isNaN(value))
      ) {
        dispatchAlert({
          message: displayKey + t("ns1:ProfilePage.EditProject.BosAlan"),
          type: "Error",
        });
        return;
      }
    }

    if (params?.id) {
      await updateData(formData);
    } else {
      await createData(formData);
    }
  };

  const availableTagOptions = nameofCategories.filter(
    (cat) => !tagsArray.some((t) => t.description === cat.description),
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* ── Image card ─────────────────────────────────────────────── */}
      <div className="lg:col-span-4">
        <Card className="overflow-hidden">
          {base64Image ? (
            <div className="relative w-full overflow-hidden rounded-t-xl">
              <img
                src={`data:image/png;base64,${base64Image}`}
                alt="Project"
                className="w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-52 w-full items-center justify-center bg-muted/40">
              <ImageIcon
                className="size-14 text-muted-foreground/30"
                strokeWidth={1.2}
                aria-hidden
              />
            </div>
          )}

          <CardContent className="pt-5">
            <div className="text-center">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {t("ns1:ProfilePage.EditProject.ProjeResmi")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t("ns1:ProfilePage.EditProject.ResimYukleme")}
              </p>
            </div>

            {!isOnlyRead && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleEditClick}
                  aria-label={t("ns1:ProfilePage.EditProject.Ekle")}
                >
                  <Plus className="size-3.5" aria-hidden />
                  {t("ns1:ProfilePage.EditProject.Ekle")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={handleRemoveClick}
                  aria-label={t("ns1:ProfilePage.EditProject.Kaldir")}
                >
                  <X className="size-3.5" aria-hidden />
                  {t("ns1:ProfilePage.EditProject.Kaldir")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-hidden
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Form card ──────────────────────────────────────────────── */}
      <div className="lg:col-span-8">
        <Card>
          {/* Section 1: Project info */}
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">
              {t("ns1:ProfilePage.EditProject.ProjeBilgileri")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* Name + Category */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project-name">
                  {t("ns1:ProfilePage.EditProject.ProjeAdi")}
                </Label>
                <Input
                  id="project-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled={isOnlyRead}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="project-category">
                  {t("ns1:ProfilePage.EditProject.Kategori")}
                </Label>
                <Select
                  disabled={isOnlyRead}
                  value={
                    formData.categoryId !== null ? String(formData.categoryId) : ""
                  }
                  onValueChange={(val) =>
                    handleCategoryChange(
                      null,
                      val !== "" ? nameofCategories[Number(val)] : null,
                    )
                  }
                >
                  <SelectTrigger id="project-category" className="h-9 w-full">
                    <SelectValue
                      placeholder={t("ns1:ProfilePage.EditProject.Kategori")}
                    />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {nameofCategories.map((cat, index) => (
                      <SelectItem key={index} value={String(index)}>
                        {cat.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start + End date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start-date">
                  {t("ns1:ProfilePage.EditProject.BaslangicTarihi")}
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  disabled={isOnlyRead}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-date">
                  {t("ns1:ProfilePage.EditProject.BitisTarihi")}
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  disabled={isOnlyRead}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Description + Customer */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project-description">
                  {t("ns1:ProfilePage.EditProject.Aciklama")}
                </Label>
                <Textarea
                  id="project-description"
                  name="description"
                  rows={5}
                  disabled={isOnlyRead}
                  placeholder={t("ns1:ProfilePage.EditProject.Aciklama")}
                  value={formData.description}
                  onChange={handleChange}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-customer">
                  {t("ns1:ProfilePage.EditProject.Musteri")}
                </Label>
                <Input
                  id="project-customer"
                  type="text"
                  name="customer"
                  disabled={isOnlyRead}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>

          <Separator className="my-1" />

          {/* Section 2: Details */}
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-base">
              {t("ns1:ProfilePage.EditProject.Detaylar")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {/* Gains + Learnings */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="project-gain">
                  {t("ns1:ProfilePage.EditProject.ProjeKazanimlari")}
                </Label>
                <Textarea
                  id="project-gain"
                  name="projectGain"
                  rows={4}
                  disabled={isOnlyRead}
                  value={formData.projectGain}
                  onChange={handleChange}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="project-learn">
                  {t("ns1:ProfilePage.EditProject.ProjeTecrube")}
                </Label>
                <Textarea
                  id="project-learn"
                  name="projectLearn"
                  rows={4}
                  disabled={isOnlyRead}
                  value={formData.projectLearn}
                  onChange={handleChange}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>{t("ns1:ProfilePage.EditProject.Etiketler")}</Label>

              {/* Selected tags as removable chips */}
              <div
                className={cn(
                  "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 py-2",
                  isOnlyRead && "cursor-not-allowed opacity-60",
                )}
              >
                {tagsArray.map((tag) => (
                  <Badge
                    key={tag.description}
                    variant="secondary"
                    className="gap-1 pr-1 text-xs font-medium"
                  >
                    {tag.description}
                    {!isOnlyRead && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.description)}
                        aria-label={`${tag.description} etiketini kaldır`}
                        className="ml-0.5 rounded-full p-0.5 opacity-60 transition hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <X className="size-2.5" aria-hidden />
                      </button>
                    )}
                  </Badge>
                ))}

                {tagsArray.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    {t("ns1:ProfilePage.EditProject.Etiketler")}
                  </span>
                )}
              </div>

              {/* Add tag dropdown */}
              {!isOnlyRead && availableTagOptions.length > 0 && (
                <Select onValueChange={(val) => handleAddTag(val)} value="">
                  <SelectTrigger className="h-8 w-full text-xs text-muted-foreground">
                    <SelectValue placeholder="+ Etiket ekle..." />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {availableTagOptions.map((cat, index) => (
                      <SelectItem
                        key={index}
                        value={cat.description}
                        className="text-sm"
                      >
                        {cat.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Action buttons */}
            {!isOnlyRead && (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile/all-projects")}
                >
                  {t("ns1:ProfilePage.EditProject.GeriDon")}
                </Button>
                <Button type="submit" onClick={handleSubmit}>
                  {t("ns1:ProfilePage.EditProject.Kaydet")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ProductInfo;
