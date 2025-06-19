export function getLocalizedText(
  text: string | { en: string; pt: string; ru: string } | undefined | null,
  language: string = 'en'
): string {
  if (!text) return '';
  
  if (typeof text === 'string') return text;
  
  // Return the text in the requested language, fallback to English, then any available language
  return text[language as keyof typeof text] || text.en || text.pt || text.ru || '';
}