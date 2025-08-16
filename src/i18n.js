import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi) 
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['tr', 'en', 'de', 'fr', 'es', 'it', 'zh', 'pt', 'ru', 'ja', 'hi'],
    fallbackLng: 'en', // If the user's language is not supported, use English.

    detection: {
      order: ['cookie', 'localStorage', 'htmlTag', 'path', 'subdomain'],
      caches: ['cookie'],
    },
    
    backend: {
      loadPath: '/sudoku-pdf-generator/translation/{{lng}}.json',
    },

    react: {
      useSuspense: false, // We don't want the page to be empty while translations are loading.
    },
  });

export default i18n;
