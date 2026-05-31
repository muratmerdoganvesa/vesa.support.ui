import ns1tr from "./locales/tr/ns1.json";
import ns1en from "./locales/en/ns1.json";
import { initReactI18next } from "react-i18next";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
export const defaultNS = "ns1";
export const resources = {
  tr: {
    ns1: ns1tr,
  },
  en: {
    ns1: ns1en,
  },
} as const;

i18n.use(LanguageDetector).use(initReactI18next).init({
  lng: "tr",
  supportedLngs: ["tr", "en"],
  fallbackLng: "tr",
  ns: ["ns1"],
  resources,
  defaultNS,
  compatibilityJSON: "v4",
  interpolation: {
    escapeValue: false, 
    defaultVariables: {}, 
  },
});

export default i18n;
