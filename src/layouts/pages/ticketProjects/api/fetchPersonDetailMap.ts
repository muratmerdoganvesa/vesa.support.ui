import { PositionsApi, UserApi } from "api/generated";
import getConfiguration from "confiuration";

export type PersonDetailInfo = {
  department: string | null;
  position: string | null;
  manager1Name: string | null;
  manager2Name: string | null;
  levelLabel: string | null;
};

type RawUserLevelDto = {
  id?: number | null;
  name?: string | null;
  description?: string | null;
};

/** Kişi kartlarında gösterilecek departman/pozisyon/yönetici/seviye bilgilerini kullanıcı id'sine göre eşler. */
export const fetchPersonDetailMap = async (): Promise<Map<string, PersonDetailInfo>> => {
  const config = getConfiguration();
  const userApi = new UserApi(config);
  const positionsApi = new PositionsApi(config);

  const [usersRes, positionsRes, levelsRes] = await Promise.all([
    userApi.apiUserVesaUsersWithoutPhotoGet(),
    positionsApi.apiPositionsGet(),
    userApi.apiUserUserLevelsGet(),
  ]);

  const users = usersRes.data;

  const positionNameById = new Map<string, string>();
  for (const position of positionsRes.data) {
    if (position.id && position.name) positionNameById.set(position.id, position.name);
  }

  const levelLabelById = new Map<number, string>();
  for (const level of (levelsRes.data as unknown as RawUserLevelDto[]) ?? []) {
    if (level.id != null && level.description) levelLabelById.set(level.id, level.description);
  }

  const nameById = new Map<string, string>();
  for (const user of users) {
    if (user.id) nameById.set(user.id, `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
  }

  const map = new Map<string, PersonDetailInfo>();
  for (const user of users) {
    if (!user.id) continue;

    const position =
      (user.positionId ? positionNameById.get(user.positionId) : undefined) ??
      user.sapPositionText?.trim() ??
      user.title?.trim() ??
      null;

    map.set(user.id, {
      department: user.departmentText?.trim() || null,
      position: position || null,
      manager1Name: user.manager1 ? nameById.get(user.manager1) || null : null,
      manager2Name: user.manager2 ? nameById.get(user.manager2) || null : null,
      levelLabel: user.userLevel != null ? levelLabelById.get(user.userLevel) ?? null : null,
    });
  }

  return map;
};
