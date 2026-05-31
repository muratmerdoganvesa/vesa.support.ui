import { getAccessToken } from "confiuration";
import { axiosInstance } from "utils/axiosInstance";

type UploadImageResponse = {
  url?: string | null;
  data?: { url?: string | null } | string | null;
};

const getApiBasePath = () =>
  (((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_BASE_PATH ||
    "") as string).replace(/\/+$/, "");

export const normalizeWebEventImagePath = (value?: string | null) => {
  const imageValue = value?.trim();

  if (!imageValue) {
    return "";
  }

  if (imageValue.startsWith("uploads/")) {
    return `/${imageValue}`;
  }

  if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
    try {
      const imageUrl = new URL(imageValue);

      if (imageUrl.pathname.startsWith("/uploads/")) {
        return `${imageUrl.pathname}${imageUrl.search}${imageUrl.hash}`;
      }
    } catch (error) {
      return imageValue;
    }
  }

  return imageValue;
};

export const isWebEventImageValue = (value?: string | null) => {
  const imageValue = normalizeWebEventImagePath(value);

  if (!imageValue) {
    return true;
  }

  return (
    imageValue.startsWith("http://") ||
    imageValue.startsWith("https://") ||
    imageValue.startsWith("/") ||
    imageValue.startsWith("uploads/") ||
    /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(imageValue)
  );
};

export const toWebEventImageSource = (value?: string | null) => {
  const imageValue = normalizeWebEventImagePath(value);

  if (!imageValue || !isWebEventImageValue(imageValue)) {
    return "";
  }

  if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) {
    return imageValue;
  }

  const apiBasePath = getApiBasePath();

  if (imageValue.startsWith("/uploads/")) {
    return apiBasePath ? `${apiBasePath}${imageValue}` : imageValue;
  }

  if (imageValue.startsWith("uploads/")) {
    return apiBasePath ? `${apiBasePath}/${imageValue}` : `/${imageValue}`;
  }

  if (imageValue.startsWith("/")) {
    return imageValue;
  }

  return apiBasePath ? `${apiBasePath}/${imageValue}` : `/${imageValue}`;
};

export async function uploadWebEventImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const accessToken = getAccessToken();
  const response = await axiosInstance.post<UploadImageResponse>(
    "/api/WebEvents/UploadImage",
    formData,
    {
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  const responseData = response.data;
  const uploadedUrl =
    responseData?.url ??
    (typeof responseData?.data === "string" ? responseData.data : responseData?.data?.url);

  if (!uploadedUrl) {
    throw new Error("Upload response does not include an image url.");
  }

  return normalizeWebEventImagePath(uploadedUrl);
}
