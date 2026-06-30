export type CrmAiFirsatAnalizi = {
  firsat?: string | null;
  ozet?: string | null;
  firsat_skoru?: number | null;
  gerekce?: string | null;
  son_not_tarihi?: string | null;
  onerilen_cozum?: string | null;
  satis_aksiyonlari?: string[] | null;
  capraz_satis?: string[] | null;
  riskler?: string[] | null;
  rakip_durumu?: string | null;
  sonraki_adim?: string | null;
  oncelik_sirasi?: number | null;
};

export type CrmAiRaporData = {
  musteri?: string | null;
  genel_ozet?: string | null;
  firsat_analizleri?: CrmAiFirsatAnalizi[] | null;
};

export type CrmAiRaporApiResponse = {
  message?: string;
  rapor?: CrmAiRaporData;
};
