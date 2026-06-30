import type { CrmAiFirsatAnalizi, CrmAiRaporData } from "./aiRaporTypes";

const asString = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asStringList = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    return value.map(asString).filter((item): item is string => Boolean(item?.trim()));
  }
  const single = asString(value);
  return single?.trim() ? [single] : null;
};

const normalizeAnaliz = (raw: unknown): CrmAiFirsatAnalizi | null => {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;

  return {
    firsat: asString(item.firsat ?? item.Firsat),
    ozet: asString(item.ozet ?? item.Ozet),
    firsat_skoru: asNumber(item.firsat_skoru ?? item.firsatSkoru ?? item.FirsatSkoru),
    gerekce: asString(item.gerekce ?? item.Gerekce),
    son_not_tarihi: asString(item.son_not_tarihi ?? item.sonNotTarihi ?? item.SonNotTarihi),
    onerilen_cozum: asString(item.onerilen_cozum ?? item.onerilenCozum ?? item.OnerilenCozum),
    satis_aksiyonlari: asStringList(
      item.satis_aksiyonlari ?? item.satisAksiyonlari ?? item.SatisAksiyonlari
    ),
    capraz_satis: asStringList(item.capraz_satis ?? item.caprazSatis ?? item.CaprazSatis),
    riskler: asStringList(item.riskler ?? item.Riskler),
    rakip_durumu: asString(item.rakip_durumu ?? item.rakipDurumu ?? item.RakipDurumu),
    sonraki_adim: asString(item.sonraki_adim ?? item.sonrakiAdim ?? item.SonrakiAdim),
    oncelik_sirasi: asNumber(item.oncelik_sirasi ?? item.oncelikSirasi ?? item.OncelikSirasi),
  };
};

export const normalizeAiRaporResponse = (raw: unknown): CrmAiRaporData | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const analizRaw = data.firsat_analizleri ?? data.firsatAnalizleri ?? data.FirsatAnalizleri;
  const analizler = Array.isArray(analizRaw)
    ? analizRaw.map(normalizeAnaliz).filter((item): item is CrmAiFirsatAnalizi => item != null)
    : null;

  return {
    musteri: asString(data.musteri ?? data.Musteri),
    genel_ozet: asString(data.genel_ozet ?? data.genelOzet ?? data.GenelOzet),
    firsat_analizleri: analizler,
  };
};
