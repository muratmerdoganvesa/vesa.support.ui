import React, { useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useNavigate, useParams } from "react-router-dom";
import {
  WebEventCreateDto,
  WebEventTranslationCreateDto,
  WebEventUpdateDto,
  WebEventsApi,
} from "api/generated/api";
import getConfiguration from "confiuration";
import { useBusy } from "../../hooks/useBusy";
import { useAlert } from "../../hooks/useAlert";
import {
  isWebEventImageValue,
  normalizeWebEventImagePath,
  toWebEventImageSource,
  uploadWebEventImage,
} from "../imageUtils";
import {
  isValidHttpUrl,
  isValidYouTubeUrl,
  normalizeExternalUrl,
  toYouTubeEmbedUrl,
} from "../urlUtils";
import { Button } from "components/ui/button";
import { Card, CardContent } from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Switch } from "components/ui/switch";
import { Textarea } from "components/ui/textarea";
import { XIcon, ExternalLinkIcon } from "lucide-react";

type LanguageCode = 1 | 2 | 3;
type TranslationForm = Record<LanguageCode, { mainTitle: string; title: string; content: string }>;

const languageConfigs: Array<{ code: LanguageCode; label: string }> = [
  { code: 1, label: "Turkce" },
  { code: 2, label: "English" },
  { code: 3, label: "Azerbaycan" },
];

const emptyTranslationForm: TranslationForm = {
  1: { mainTitle: "", title: "", content: "" },
  2: { mainTitle: "", title: "", content: "" },
  3: { mainTitle: "", title: "", content: "" },
};

const toDateTimeLocalValue = (value?: string) => {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");
  const hour = `${parsedDate.getHours()}`.padStart(2, "0");
  const minute = `${parsedDate.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

function WebEventsCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const dispatchBusy = useBusy();
  const dispatchAlert = useAlert();

  const [coverImage, setCoverImage] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [status, setStatus] = useState<boolean>(true);
  const [isEvent, setIsEvent] = useState<boolean>(true);
  const [videoLink, setVideoLink] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [translations, setTranslations] = useState<TranslationForm>(emptyTranslationForm);
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [hasUploadError, setHasUploadError] = useState(false);

  const isUploading = isCoverUploading || isGalleryUploading;

  React.useEffect(() => {
    const fetchById = async () => {
      if (!id) return;
      try {
        dispatchBusy({ isBusy: true });
        const conf = getConfiguration();
        const api = new WebEventsApi(conf);
        const response = await api.apiWebEventsGetByIdGet(id);
        const data = response.data;

        setCoverImage(
          isWebEventImageValue(data.coverImage) ? normalizeWebEventImagePath(data.coverImage) : ""
        );
        setImages(
          (data.gallery ?? [])
            .filter((image) => isWebEventImageValue(image))
            .map((image) => normalizeWebEventImagePath(image))
        );
        setLocation(data.venue?.tr ?? "");
        setCity(data.city ?? "");
        setEventDate(toDateTimeLocalValue(data.startsAt));
        setVideoLink(data.videoLink ?? "");
        setLink(data.link ?? "");

        setTranslations({
          1: {
            mainTitle: data.title?.tr ?? "",
            title: data.topic?.tr ?? "",
            content: data.summary?.tr ?? "",
          },
          2: {
            mainTitle: data.title?.en ?? "",
            title: data.topic?.en ?? "",
            content: data.summary?.en ?? "",
          },
          3: {
            mainTitle: data.title?.az ?? "",
            title: data.topic?.az ?? "",
            content: data.summary?.az ?? "",
          },
        });
      } catch (error) {
        dispatchAlert({ message: "Kayit detayi yuklenirken hata olustu.", type: "Error" });
      } finally {
        dispatchBusy({ isBusy: false });
      }
    };

    fetchById();
  }, [id]);

  const handleTranslationChange = (
    languageCode: LanguageCode,
    field: "mainTitle" | "title" | "content",
    value: string
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [languageCode]: {
        ...prev[languageCode],
        [field]: value,
      },
    }));
  };

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    try {
      setIsCoverUploading(true);
      setHasUploadError(false);
      const uploadedUrl = await uploadWebEventImage(file);
      setCoverImage(uploadedUrl);
    } catch (error) {
      setHasUploadError(true);
      dispatchAlert({
        message: "Kapak gorseli yuklenirken hata olustu.",
        type: "Error",
      });
    } finally {
      setIsCoverUploading(false);
    }
  };

  const handleGalleryImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files ?? []);
    input.value = "";
    if (selectedFiles.length === 0) return;

    try {
      setIsGalleryUploading(true);
      setHasUploadError(false);
      const uploadedUrls = await Promise.all(selectedFiles.map((file) => uploadWebEventImage(file)));
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      setHasUploadError(true);
      dispatchAlert({
        message: "Galeri gorselleri yuklenirken hata olustu.",
        type: "Error",
      });
    } finally {
      setIsGalleryUploading(false);
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setHasUploadError(false);
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const buildTranslations = (): WebEventTranslationCreateDto[] =>
    languageConfigs.map((language) => ({
      languageCode: language.code,
      mainTitle: translations[language.code].mainTitle,
      title: translations[language.code].title,
      content: translations[language.code].content,
    }));

  const hasEmptyTranslation = languageConfigs.some(
    (language) =>
      !translations[language.code].mainTitle.trim() ||
      !translations[language.code].title.trim() ||
      !translations[language.code].content.trim()
  );

  const handleSave = async () => {
    if (isUploading) {
      dispatchAlert({
        message: "Gorsel yukleme tamamlanmadan kayit gonderilemez.",
        type: "Warning",
      });
      return;
    }

    if (hasUploadError) {
      dispatchAlert({
        message: "Basarisiz gorsel yukleme var. Lutfen gorseli tekrar yukleyin.",
        type: "Warning",
      });
      return;
    }

    if (!isWebEventImageValue(coverImage) || images.some((image) => !isWebEventImageValue(image))) {
      dispatchAlert({
        message: "Gorseller URL/path formatinda olmali. Base64 gonderilemez.",
        type: "Warning",
      });
      return;
    }

    if (!eventDate) {
      dispatchAlert({ message: "Tarih alani zorunludur.", type: "Warning" });
      return;
    }

    if (hasEmptyTranslation) {
      dispatchAlert({
        message: "Tum diller icin ana baslik, baslik ve icerik alanlari doldurulmalidir.",
        type: "Warning",
      });
      return;
    }

    const trimmedVideoLink = videoLink.trim();
    const trimmedLink = link.trim();

    if (trimmedVideoLink && !isValidYouTubeUrl(trimmedVideoLink)) {
      dispatchAlert({
        message: "Video Link gecerli bir YouTube URL'si olmalidir.",
        type: "Warning",
      });
      return;
    }

    if (trimmedLink && !isValidHttpUrl(trimmedLink)) {
      dispatchAlert({
        message: "Link gecerli bir http veya https URL'si olmalidir.",
        type: "Warning",
      });
      return;
    }

    try {
      dispatchBusy({ isBusy: true });
      const conf = getConfiguration();
      const api = new WebEventsApi(conf);

      const payloadBase = {
        coverImage: normalizeWebEventImagePath(coverImage),
        location,
        city,
        eventDate,
        status,
        isEvent,
        videoLink: trimmedVideoLink || null,
        link: trimmedLink || null,
        images: images.map((imageUrl) => ({ imageUrl: normalizeWebEventImagePath(imageUrl) })),
        translations: buildTranslations(),
      };

      if (id) {
        const payload: WebEventUpdateDto = { id, ...payloadBase };
        await api.apiWebEventsPut(payload);
        dispatchAlert({ message: "Kayit basariyla guncellendi.", type: "Success" });
      } else {
        const payload: WebEventCreateDto = payloadBase;
        await api.apiWebEventsPost(payload);
        dispatchAlert({ message: "Kayit basariyla olusturuldu.", type: "Success" });
      }
      navigate("/webEvents");
    } catch (error) {
      dispatchAlert({ message: "Kayit olusturulurken hata olustu.", type: "Error" });
    } finally {
      dispatchBusy({ isBusy: false });
    }
  };

  const youtubeEmbedUrl = toYouTubeEmbedUrl(videoLink);
  const externalLinkUrl = link.trim() ? normalizeExternalUrl(link) : "";

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Card className="rounded-xl">
        <CardContent className="p-6">
          <h4 className="text-2xl font-bold text-[#344767] mb-6">Haber / Etkinlik Kayit</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
            {/* Sehir */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Sehir</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Konum */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Konum</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Tarih */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="eventDate">Tarih</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center gap-6 h-full">
              <div className="flex items-center gap-2">
                <Switch
                  id="isEvent"
                  checked={isEvent}
                  onCheckedChange={(checked) => setIsEvent(checked)}
                />
                <Label htmlFor="isEvent">{isEvent ? "Etkinlik" : "Haber"}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="status"
                  checked={status}
                  onCheckedChange={(checked) => setStatus(checked)}
                />
                <Label htmlFor="status">{status ? "Aktif" : "Pasif"}</Label>
              </div>
            </div>

            {/* Kapak Gorseli */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Kapak Gorseli</p>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                disabled={isCoverUploading}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/80 disabled:opacity-50"
              />
              {isCoverUploading && (
                <span className="text-xs text-muted-foreground">Gorsel yukleniyor...</span>
              )}
              {coverImage && (
                <div className="relative mt-2 w-full max-w-xs overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <img
                    src={toWebEventImageSource(coverImage)}
                    alt="Cover preview"
                    className="block h-44 w-full object-cover"
                  />
                  <button
                    aria-label="Kapak gorselini kaldir"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
                    onClick={() => {
                      setCoverImage("");
                      setHasUploadError(false);
                    }}
                  >
                    <XIcon className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                </div>
              )}
            </div>

            {/* Galeri Gorselleri */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">Galeri Gorselleri</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryImageChange}
                disabled={isGalleryUploading}
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/80 disabled:opacity-50"
              />
              {isGalleryUploading && (
                <span className="text-xs text-muted-foreground">Gorseller yukleniyor...</span>
              )}
              {images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                    >
                      <img
                        src={toWebEventImageSource(image)}
                        alt={`Gallery preview ${index + 1}`}
                        className="block h-24 w-full object-cover"
                      />
                      <button
                        aria-label={`Galeri gorselini kaldir ${index + 1}`}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors"
                        onClick={() => handleRemoveGalleryImage(index)}
                      >
                        <XIcon className="h-3 w-3 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Video & External Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="videoLink">Video Link (YouTube URL)</Label>
              <Input
                id="videoLink"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
              />
              {videoLink.trim() && !isValidYouTubeUrl(videoLink) && (
                <span className="text-xs text-destructive">Gecerli bir YouTube URL'si giriniz.</span>
              )}
              {youtubeEmbedUrl && (
                <div className="mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-black">
                  <div className="relative w-full pt-[56.25%]">
                    <iframe
                      title="YouTube video onizleme"
                      src={youtubeEmbedUrl}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="link">Link (Harici URL)</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              {link.trim() && !isValidHttpUrl(link) && (
                <span className="text-xs text-destructive">Gecerli bir http veya https URL'si giriniz.</span>
              )}
              {externalLinkUrl && isValidHttpUrl(link) && (
                <div className="mt-2">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={externalLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Siteyi yeni sekmede ac"
                    >
                      <ExternalLinkIcon className="mr-2 h-4 w-4" />
                      Siteyi Ac
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Dil Formlari */}
          {languageConfigs.map((language) => (
            <div key={language.code} className="mt-8">
              <h6 className="text-base font-semibold text-[#344767] mb-3">{language.label}</h6>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`mainTitle-${language.code}`}>Main Title</Label>
                  <Input
                    id={`mainTitle-${language.code}`}
                    value={translations[language.code].mainTitle}
                    onChange={(e) =>
                      handleTranslationChange(language.code, "mainTitle", e.target.value)
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`title-${language.code}`}>Title</Label>
                  <Input
                    id={`title-${language.code}`}
                    value={translations[language.code].title}
                    onChange={(e) =>
                      handleTranslationChange(language.code, "title", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-full flex flex-col gap-1.5">
                  <Label htmlFor={`content-${language.code}`}>Content</Label>
                  <Textarea
                    id={`content-${language.code}`}
                    rows={4}
                    value={translations[language.code].content}
                    onChange={(e) =>
                      handleTranslationChange(language.code, "content", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Aksiyonlar */}
          <div className="mt-8 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/webEvents")}
            >
              Iptal
            </Button>
            <Button
              variant="default"
              onClick={handleSave}
              disabled={isUploading}
            >
              {id ? "Guncelle" : "Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Footer />
    </DashboardLayout>
  );
}

export default WebEventsCreate;
