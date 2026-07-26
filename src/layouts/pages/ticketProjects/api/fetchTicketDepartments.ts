import { TicketDepartmentsApi } from "api/generated";
import getConfiguration from "confiuration";
import type { DepartmentNode } from "../utils/departmentTree";

/** API bazen id'yi UPPER, parentDepartmentId'yi lower döner — Map eşleşmesi için normalize. */
const normalizeGuid = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toLowerCase() : null;
};

/** VESA departman hiyerarşisini (parentDepartmentId ile) getirir. */
export const fetchTicketDepartments = async (): Promise<DepartmentNode[]> => {
  const api = new TicketDepartmentsApi(getConfiguration());
  const response = await api.apiTicketDepartmentsGetOnlyVesaDepartmentsGet();

  return (response.data ?? [])
    .filter((d) => d.id && d.departmentText?.trim())
    .map((d) => ({
      id: normalizeGuid(String(d.id)) as string,
      name: String(d.departmentText).trim(),
      parentId: normalizeGuid(
        d.parentDepartmentId != null ? String(d.parentDepartmentId) : null,
      ),
    }));
};
