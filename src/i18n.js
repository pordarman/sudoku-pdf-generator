// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend'; // Sadece bu backend'i kullanacağız.

i18n
  // .use() ile kütüphaneye özellikler ekliyoruz.
  .use(HttpApi) // Çeviri dosyalarını URL üzerinden yüklemek için.
  .use(LanguageDetector) // Kullanıcının tarayıcı dilini otomatik algılamak için.
  .use(initReactI18next) // i18n'i React ile uyumlu hale getirmek için.
  .init({
    // Desteklediğin tüm dillerin kodlarını buraya yazmalısın.
    supportedLngs: ['tr', 'en', 'de', 'fr', 'es', 'it', 'zh', 'pt', 'ru', 'ja', 'hi'],
    
    // Eğer desteklenmeyen bir dil veya bir hata olursa kullanılacak varsayılan dil.
    fallbackLng: 'en',
    
    // Dil algılama ayarları.
    detection: {
      order: ['cookie', 'localStorage', 'htmlTag', 'path', 'subdomain'],
      caches: ['cookie'], // Kullanıcının dil seçimini cookie'de sakla.
    },

    // Backend (yani çeviri dosyalarını yükleme) ayarları.
    backend: {
      // Bu path, dosyaların web sunucusunda hangi yolda bulunacağını belirtir.
      // `public` klasörü, web sitesinin kök dizini ('/') olarak kabul edilir.
      // Bu yüzden dosya yolun '/locales/translation/{{lng}}.json' olmalı.
      // {{lng}} kısmı, i18next tarafından 'en', 'tr' gibi dil kodlarıyla otomatik değiştirilir.
      loadPath: '/sudoku-pdf-generator/translation/{{lng}}.json',
    },

    // React ile ilgili ayarlar.
    react: {
      // Suspense kullanmıyoruz, bu sayede çeviriler yüklenirken sayfa boş görünmez.
      useSuspense: false,
    },
  });

export default i18n;
