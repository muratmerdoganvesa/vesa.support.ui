import { axiosInstance } from "utils/axiosInstance";

type ExcelExportResponse = {
  fileContents: string;
  contentType: string;
};

export const fetchTicketProjectsExcel = async (
  workCompanyId?: string,
): Promise<ExcelExportResponse> => {
  const basePath = import.meta.env.VITE_BASE_PATH || "";
  const response = await axiosInstance.get<ExcelExportResponse>(
    `${basePath}/api/TicketProjects/ExcelExport`,
    {
      params: workCompanyId ? { workCompanyId } : undefined,
    },
  );

  return response.data;
};

export const downloadTicketProjectsExcel = async (workCompanyId?: string): Promise<void> => {
  const data = await fetchTicketProjectsExcel(workCompanyId);
  const byteCharacters = atob(data.fileContents);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: data.contentType });
  const fileName = `Proje-Listesi-${new Date().toLocaleDateString("tr-TR")}.xlsx`;
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};
