import { TicketProjectsApi } from "api/generated";
import getConfiguration from "confiuration";

export const fetchProjectCompanyMap = async (): Promise<Map<string, string>> => {
  const config = getConfiguration();
  const api = new TicketProjectsApi(config);
  const response = await api.apiTicketProjectsGet();
  const map = new Map<string, string>();

  for (const project of response.data) {
    if (project.id && project.workCompanyId) {
      map.set(project.id, project.workCompanyId);
    }
  }

  return map;
};
