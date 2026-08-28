"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ar from "@/locales/ar";
import en from "@/locales/en";

const RTL = new Set(["ar", "he", "fa", "ur"]);

export function applyDirLang(lng: string) {
  if (typeof document === "undefined") return;
  const base = lng.split(/[-_]/)[0] ?? "en";
  const dir: "rtl" | "ltr" = RTL.has(base) ? "rtl" : "ltr";
  document.documentElement.lang = lng;
  document.documentElement.dir = dir;
}

let initialized = false;

function loadTranslationBundles() {
  i18n.addResourceBundle("en", "translation", en, true, true);
  i18n.addResourceBundle("ar", "translation", ar, true, true);
}

export function initI18n() {
  if (i18n.isInitialized) {
    loadTranslationBundles();
    return i18n;
  }

  if (initialized) return i18n;
  initialized = true;

  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      fallbackLng: "en",
      supportedLngs: ["en", "ar"],
      nonExplicitSupportedLngs: true,
      interpolation: { escapeValue: false },
      detection: {
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
      },
    })
    .then(() => {
      loadTranslationBundles();
      applyDirLang(i18n.resolvedLanguage ?? "en");
    });

  i18n.on("languageChanged", applyDirLang);

  return i18n;
}

export { i18n };
