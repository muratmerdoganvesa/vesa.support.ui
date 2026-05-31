import i18n from "i18n";

export const menuAPIController = (name: string) => {
  switch (name) {
    case "Profilim":
      return i18n.t("ns1:MENU.Profilim");
    case "Yönetim":
      return i18n.t("ns1:MENU.Yonetim");
    case "Talep Yönetimi":
      return i18n.t("ns1:MENU.TalepYonetimi");
    case "Form Yönetimi":
      return i18n.t("ns1:MENU.FormYonetimi");
    case "Projelerim":
      return i18n.t("ns1:MENU.Projelerim");
    case "Onay":
      return i18n.t("ns1:MENU.Onay");
    case "Gelen Talepler":
      return i18n.t("ns1:MENU.GelenTalepler");
    case "Form Tanımlama":
      return i18n.t("ns1:MENU.FormTanimlama");
    case "Şirket Tanımlama":
      return i18n.t("ns1:MENU.SirketTanimlama");
    case "Rol Tanımlama ":
      return i18n.t("ns1:MENU.RolTanimlama");
    case "Ekran Tanımlama":
      return i18n.t("ns1:MENU.EkranTanimlama");
    case "Takım Tanımlama":
      return i18n.t("ns1:MENU.TakimTanimlama");
    case "Parametre Tanımlama":
      return i18n.t("ns1:MENU.ParametreTanimlama");
    case "Şirket-Sistem Tanımlama":
      return i18n.t("ns1:MENU.SirketSistemTanimlama");
    case "Kullanıcı Tanımlama":
      return i18n.t("ns1:MENU.KullaniciTanimlama");
    case "Kural Tanımlama":
      return i18n.t("ns1:MENU.KuralTanimlama");
    case "Departman Tanımlama":
      return i18n.t("ns1:MENU.DepartmanTanimlama");
    case "Onay Akışı ":
      return i18n.t("ns1:MENU.OnayAkisi");
    case "Rol Tanımlama":
      return i18n.t("ns1:MENU.RolTanimlama");
    case "Taleplerim":
      return i18n.t("ns1:MENU.Taleplerim");
    default:
      return name;
  }
};
