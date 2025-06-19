/**
 * Simple translation service with manual mapping for common tour terms
 * This provides basic translations for tour-related content
 */

interface TranslationMap {
  [key: string]: {
    pt: string;
    ru: string;
  };
}

// Basic translation dictionary for common tour terms
const translationDict: TranslationMap = {
  // Tour names
  "lisbon walking tour": { pt: "Tour a Pé por Lisboa", ru: "Пешеходная экскурсия по Лиссабону" },
  "lisbon drive": { pt: "Tour de Carro por Lisboa", ru: "Автомобильная экскурсия по Лиссабону" },
  "alfama tour": { pt: "Tour pela Alfama", ru: "Экскурсия по Алфаме" },
  "cabo da roca tour": { pt: "Tour ao Cabo da Roca", ru: "Экскурсия в Кабу-да-Рока" },
  
  // Durations
  "2 hours": { pt: "2 horas", ru: "2 часа" },
  "3 hours": { pt: "3 horas", ru: "3 часа" },
  "4 hours": { pt: "4 horas", ru: "4 часа" },
  "half day": { pt: "meio dia", ru: "полдня" },
  "full day": { pt: "dia inteiro", ru: "весь день" },
  
  // Difficulties
  "easy": { pt: "fácil", ru: "лёгкий" },
  "medium": { pt: "médio", ru: "средний" },
  "hard": { pt: "difícil", ru: "трудный" },
  
  // Badges
  "most popular": { pt: "mais popular", ru: "самый популярный" },
  "best seller": { pt: "mais vendido", ru: "бестселлер" },
  "evening tour": { pt: "tour noturno", ru: "вечерняя экскурсия" },
  "historical walk": { pt: "caminhada histórica", ru: "историческая прогулка" },
  "+ comfort": { pt: "+ conforto", ru: "+ комфорт" },
  
  // Common descriptions
  "explore the historic center": { pt: "explore o centro histórico", ru: "исследуйте исторический центр" },
  "discover lisbon": { pt: "descubra lisboa", ru: "откройте для себя Лиссабон" },
  "amazing views": { pt: "vistas incríveis", ru: "потрясающие виды" },
  "traditional neighborhoods": { pt: "bairros tradicionais", ru: "традиционные районы" },
  "cultural experience": { pt: "experiência cultural", ru: "культурный опыт" }
};

/**
 * Simple translation function using dictionary lookup
 */
export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (fromLang !== 'en' || !text.trim()) {
    return text;
  }
  
  const lowerText = text.toLowerCase().trim();
  
  // Check for exact matches in dictionary
  if (translationDict[lowerText]) {
    const translation = translationDict[lowerText];
    return toLang === 'pt' ? translation.pt : toLang === 'ru' ? translation.ru : text;
  }
  
  // For unmatched text, return placeholder indicating manual translation needed
  if (toLang === 'pt') {
    return `[PT: ${text}]`;
  } else if (toLang === 'ru') {
    return `[RU: ${text}]`;
  }
  
  return text;
}

/**
 * Auto-translate tour content from English to Portuguese and Russian
 */
export async function autoTranslateTourContent(content: {
  name: string;
  shortDescription: string;
  description: string;
  duration: string;
  difficulty: string;
  badge: string;
}): Promise<{
  name: { en: string; pt: string; ru: string };
  shortDescription: { en: string; pt: string; ru: string };
  description: { en: string; pt: string; ru: string };
  duration: { en: string; pt: string; ru: string };
  difficulty: { en: string; pt: string; ru: string };
  badge: { en: string; pt: string; ru: string };
}> {
  console.log('Starting auto-translation...');
  
  try {
    // Translate to Portuguese
    const [namePt, shortDescPt, descPt, durationPt, difficultyPt, badgePt] = await Promise.all([
      translateText(content.name, 'en', 'pt'),
      translateText(content.shortDescription || '', 'en', 'pt'),
      translateText(content.description, 'en', 'pt'),
      translateText(content.duration, 'en', 'pt'),
      translateText(content.difficulty, 'en', 'pt'),
      translateText(content.badge || '', 'en', 'pt'),
    ]);

    // Translate to Russian
    const [nameRu, shortDescRu, descRu, durationRu, difficultyRu, badgeRu] = await Promise.all([
      translateText(content.name, 'en', 'ru'),
      translateText(content.shortDescription || '', 'en', 'ru'),
      translateText(content.description, 'en', 'ru'),
      translateText(content.duration, 'en', 'ru'),
      translateText(content.difficulty, 'en', 'ru'),
      translateText(content.badge || '', 'en', 'ru'),
    ]);

    console.log('Auto-translation completed successfully');

    return {
      name: { en: content.name, pt: namePt, ru: nameRu },
      shortDescription: { en: content.shortDescription || '', pt: shortDescPt, ru: shortDescRu },
      description: { en: content.description, pt: descPt, ru: descRu },
      duration: { en: content.duration, pt: durationPt, ru: durationRu },
      difficulty: { en: content.difficulty, pt: difficultyPt, ru: difficultyRu },
      badge: { en: content.badge || '', pt: badgePt, ru: badgeRu },
    };
  } catch (error) {
    console.error('Auto-translation failed:', error);
    // Return English content for all languages if translation fails
    return {
      name: { en: content.name, pt: content.name, ru: content.name },
      shortDescription: { en: content.shortDescription || '', pt: content.shortDescription || '', ru: content.shortDescription || '' },
      description: { en: content.description, pt: content.description, ru: content.description },
      duration: { en: content.duration, pt: content.duration, ru: content.duration },
      difficulty: { en: content.difficulty, pt: content.difficulty, ru: content.difficulty },
      badge: { en: content.badge || '', pt: content.badge || '', ru: content.badge || '' },
    };
  }
}

/**
 * Translate individual field from English to other languages
 */
export async function translateField(text: string): Promise<{ en: string; pt: string; ru: string }> {
  if (!text.trim()) {
    return { en: '', pt: '', ru: '' };
  }

  try {
    const [pt, ru] = await Promise.all([
      translateText(text, 'en', 'pt'),
      translateText(text, 'en', 'ru'),
    ]);

    return { en: text, pt, ru };
  } catch (error) {
    console.error('Field translation failed:', error);
    return { en: text, pt: text, ru: text };
  }
}