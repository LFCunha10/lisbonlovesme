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
  
  return text[langKey] || '';
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

function normalizeTourDifficultyValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getTourDifficultyLabelKey(
  difficulty: string | { en: string; pt: string; ru: string } | undefined,
  language?: string,
): string | null {
  const localizedDifficulty = getLocalizedText(difficulty, language);
  const normalizedDifficulty = normalizeTourDifficultyValue(localizedDifficulty);

  if (["easy", "facil", "легкий"].includes(normalizedDifficulty)) {
    return "tours.difficultyLevels.easy";
  }

  if (["moderate", "medium", "medio", "средний"].includes(normalizedDifficulty)) {
    return "tours.difficultyLevels.medium";
  }

  if (["hard", "challenging", "dificil", "сложный"].includes(normalizedDifficulty)) {
    return "tours.difficultyLevels.hard";
  }

  return null;
}
