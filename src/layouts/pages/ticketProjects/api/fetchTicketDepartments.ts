import { TicketDepartmentsApi } from "api/generated";
import getConfiguration from "confiuration";
import type { DepartmentNode } from "../utils/departmentTree";

/** VESA departman hiyerarşisini (parentDepartmentId ile) getirir. */
export const fetchTicketDepartments = async (): Promise<DepartmentNode[]> => {
  const api = new TicketDepartmentsApi(getConfiguration());
  const response = await api.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();

  return (response.data ?? [])
    .filter((d) => d.id && d.departmentText?.trim())
    .map((d) => ({
      id: d.id as string,
      name: (d.departmentText as string).trim(),
      parentId: d.parentDepartmentId?.trim() || null,
    }));
};
