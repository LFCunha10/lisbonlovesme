import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslations from './locales/en.json';
import ptTranslations from './locales/pt.json';
import ruTranslations from './locales/ru.json';

// Configure i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    lng: 'en', // Set default language explicitly
    interpolation: {
      escapeValue: false, // React already escapes variables
    },
    resources: {
      en: enTranslations,
      pt: ptTranslations,
      ru: ruTranslations,
    },
    detection: {
      // Order of detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache the language selection in localStorage
      caches: ['localStorage'],
      // Look for languages in these formats
      lookupLocalStorage: 'i18nextLng',
      lookupFromPathIndex: 0,
      lookupFromSubdomainIndex: 0,
      // Convert country codes to language codes
      convertDetectedLanguage: (lng: string) => {
        // Handle common variations
        if (lng.startsWith('pt')) return 'pt';
        if (lng.startsWith('ru')) return 'ru';
        if (lng.startsWith('en')) return 'en';
        return lng;
      }
    },
  });

export default i18n;