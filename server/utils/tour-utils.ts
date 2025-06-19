/**
 * Server-side utility for handling multilingual tour content
 */

export function getLocalizedText(
  text: string | { en: string; pt: string; ru: string } | undefined | null,
  language?: string
): string {
  if (!text) return '';
  
  if (typeof text === 'string') return text;
  
  // Use provided language or default to 'en'
  const lang = language || 'en';
  const langKey = lang.startsWith('pt') ? 'pt' : lang.startsWith('ru') ? 'ru' : 'en';
  
  // Return the text in the requested language, fallback to English, then any available language
  return text[langKey] || text.en || text.pt || text.ru || '';
}