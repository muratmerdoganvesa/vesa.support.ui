import { useRef, useState, useCallback } from "react";
import { OrgChartApi } from "api/generated";
import getConfiguration from "confiuration";

type PhotoCache = Map<string, string | null>;

const normalizePhoto = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  if (raw.startsWith("data:image")) return raw;
  return `data:image/jpeg;base64,${raw}`;
};

export const useUserPhotos = () => {
  const cacheRef = useRef<PhotoCache>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  const getPhoto = useCallback((userId: string): string | null | undefined => {
    if (cacheRef.current.has(userId)) return cacheRef.current.get(userId)!;
    if (pendingRef.current.has(userId)) return undefined; // loading

    pendingRef.current.add(userId);

    const api = new OrgChartApi(getConfiguration());
    api
      .apiOrgChartPhotoUserIdGet(userId)
      .then((res) => {
        cacheRef.current.set(userId, normalizePhoto(res.data as string));
      })
      .catch(() => {
        cacheRef.current.set(userId, null);
      })
      .finally(() => {
        pendingRef.current.delete(userId);
        forceUpdate((n) => n + 1);
      });

    return undefined;
  }, []);

  return { getPhoto };
};
