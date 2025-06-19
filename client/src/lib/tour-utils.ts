import { useTranslation } from 'react-i18next';

/**
 * Helper function to get localized text from multilingual tour content
 */
export function getLocalizedText(
  text: string | { en: string; pt: string; ru: string } | undefined,
  language?: string
): string {
  if (!text) return '';
  
  // If it's already a string (legacy data), return it
  if (typeof text === 'string') {
    return text;
  }
  
  // If it's multilingual object, return the appropriate language
  const lang = language || 'en';
  const langKey = lang.startsWith('pt') ? 'pt' : lang.startsWith('ru') ? 'ru' : 'en';
  
  return text[langKey] || text.en || '';
}

/**
 * Hook to get localized tour text
 */
export function useLocalizedTourText() {
  const { i18n } = useTranslation();
  
  return (text: string | { en: string; pt: string; ru: string } | undefined): string => {
    return getLocalizedText(text, i18n.language);
  };
}

/**
 * Convert legacy tour data to multilingual format
 */
export function convertToMultilingual(text: string): { en: string; pt: string; ru: string } {
  return {
    en: text,
    pt: text,
    ru: text
  };
}