import { UserApi } from "api/generated";
import getConfiguration from "confiuration";

export const fetchUserDepartmentMap = async (): Promise<Map<string, string>> => {
  const config = getConfiguration();
  const api = new UserApi(config);
  const response = await api.apiUserVesaUsersWithoutPhotoGet();
  const map = new Map<string, string>();

  for (const user of response.data) {
    if (user.id && user.departmentText?.trim()) {
      map.set(user.id, user.departmentText.trim());
    }
  }

  return map;
};
