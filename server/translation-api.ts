/**
 * Translation API integration
 * This module provides translation capabilities for the multilingual tour system
 */

interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLang: string;
}

interface TranslationResponse {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

// Mock translation service for demonstration
// In production, integrate with Google Translate, DeepL, or similar service
export class TranslationService {
  // Predefined translations for common tour-related terms
  private static commonTranslations: Record<string, Record<string, string>> = {
    // English base translations
    "Historic Walking Tour": {
      pt: "Tour Histórico a Pé",
      ru: "Историческая пешеходная экскурсия"
    },
    "Explore the historic center": {
      pt: "Explore o centro histórico", 
      ru: "Исследуйте исторический центр"
    },
    "Discover the beauty of": {
      pt: "Descubra a beleza de",
      ru: "Откройте для себя красоту"
    },
    "Join us for an unforgettable": {
      pt: "Junte-se a nós para uma experiência inesquecível",
      ru: "Присоединяйтесь к нам для незабываемого"
    },
    "2 hours": {
      pt: "2 horas",
      ru: "2 часа"
    },
    "3 hours": {
      pt: "3 horas",
      ru: "3 часа"
    },
    "4 hours": {
      pt: "4 horas", 
      ru: "4 часа"
    },
    "Half day": {
      pt: "Meio dia",
      ru: "Полдня"
    },
    "Full day": {
      pt: "Dia inteiro",
      ru: "Полный день"
    },
    "Easy": {
      pt: "Fácil",
      ru: "Легкий"
    },
    "Medium": {
      pt: "Médio",
      ru: "Средний"
    },
    "Hard": {
      pt: "Difícil",
      ru: "Сложный"
    },
    "Moderate": {
      pt: "Moderado",
      ru: "Умеренный"
    },
    "Challenging": {
      pt: "Desafiador",
      ru: "Сложный"
    }
  };

  static async translateText(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    // Return original text if same language
    if (sourceLang === targetLang) {
      return text;
    }

    // Check for exact matches in common translations first
    const exactMatch = this.commonTranslations[text]?.[targetLang];
    if (exactMatch) {
      return exactMatch;
    }

    try {
      // Use LibreTranslate API for real translations
      const libreTranslation = await TranslationService.translateWithLibreTranslate(text, sourceLang, targetLang);
      if (libreTranslation && libreTranslation !== text) {
        return libreTranslation;
      }
    } catch (error) {
      console.warn('LibreTranslate API failed, falling back to local translation:', error);
    }

    // Fallback to pattern matching for common phrases
    const patternTranslation = this.translateCommonPatterns(text, targetLang);
    if (patternTranslation !== text) {
      return patternTranslation;
    }

    // Final fallback to mock translation
    return this.mockTranslate(text, targetLang);
  }

  private static translateCommonPatterns(text: string, targetLang: string): string {
    // Handle common patterns like "X hours", "Visit Y", etc.
    
    // Hours pattern
    const hoursMatch = text.match(/^(\d+)\s+hours?$/i);
    if (hoursMatch) {
      const number = hoursMatch[1];
      if (targetLang === 'pt') return `${number} hora${number === '1' ? '' : 's'}`;
      if (targetLang === 'ru') return `${number} час${this.getRussianHourSuffix(parseInt(number))}`;
    }

    // "Visit X" pattern
    if (text.toLowerCase().startsWith('visit ')) {
      const place = text.substring(6);
      if (targetLang === 'pt') return `Visite ${place}`;
      if (targetLang === 'ru') return `Посетите ${place}`;
    }

    // "Explore X" pattern
    if (text.toLowerCase().startsWith('explore ')) {
      const place = text.substring(8);
      if (targetLang === 'pt') return `Explore ${place}`;
      if (targetLang === 'ru') return `Исследуйте ${place}`;
    }

    // "This is a X" pattern
    if (text.toLowerCase().startsWith('this is a ')) {
      const rest = text.substring(10);
      if (targetLang === 'pt') return `Este é um ${rest}`;
      if (targetLang === 'ru') return `Это ${rest}`;
    }

    // "Lisbon X" pattern
    if (text.toLowerCase().includes('lisbon')) {
      if (targetLang === 'pt') {
        return text.replace(/lisbon/gi, 'Lisboa');
      }
      if (targetLang === 'ru') {
        return text.replace(/lisbon/gi, 'Лиссабон');
      }
    }

    return text;
  }

  private static getRussianHourSuffix(hours: number): string {
    if (hours === 1) return '';
    if (hours >= 2 && hours <= 4) return 'а';
    return 'ов';
  }

  private static mockTranslate(text: string, targetLang: string): string {
    // Enhanced mock translation with better language handling
    // In production, replace with real translation API like Google Translate
    
    if (targetLang === 'pt') {
      // Comprehensive Portuguese translations
      const ptTranslations: Record<string, string> = {
        // Common words
        'tour': 'passeio',
        'walking': 'a pé',
        'historic': 'histórico',
        'historical': 'histórico',
        'discover': 'descubra',
        'explore': 'explore',
        'beautiful': 'belo',
        'amazing': 'incrível',
        'experience': 'experiência',
        'guide': 'guia',
        'hours': 'horas',
        'hour': 'hora',
        'easy': 'fácil',
        'medium': 'médio',
        'hard': 'difícil',
        'difficult': 'difícil',
        'lisbon': 'Lisboa',
        'drive': 'passeio de carro',
        'driving': 'dirigindo',
        'highlights': 'destaques',
        'city': 'cidade',
        'test': 'teste',
        'this': 'este',
        'is': 'é',
        'a': 'um',
        'an': 'um',
        'the': 'o',
        'and': 'e',
        'or': 'ou',
        'with': 'com',
        'from': 'de',
        'to': 'para',
        'in': 'em',
        'of': 'de',
        'through': 'através de',
        'around': 'ao redor de',
        'get': 'conheça',
        'know': 'conhecer',
        'portuguese': 'português',
        'capital': 'capital',
        'please': 'por favor',
        'follow': 'siga',
        'visit': 'visite',
        'see': 'veja',
        'learn': 'aprenda',
        'about': 'sobre',
        'culture': 'cultura',
        'history': 'história',
        'food': 'comida',
        'wine': 'vinho',
        'traditional': 'tradicional',
        'modern': 'moderno',
        'old': 'antigo',
        'new': 'novo',
        'best': 'melhor',
        'good': 'bom',
        'great': 'ótimo',
        'wonderful': 'maravilhoso',
        'perfect': 'perfeito',
        'small': 'pequeno',
        'big': 'grande',
        'local': 'local',
        'authentic': 'autêntico',
        'unique': 'único',
        'special': 'especial'
      };
      
      let translated = text.toLowerCase();
      // Sort by length (longest first) to avoid partial replacements
      const sortedEntries = Object.entries(ptTranslations).sort((a, b) => b[0].length - a[0].length);
      
      for (const [en, pt] of sortedEntries) {
        if (pt) { // Skip empty translations
          translated = translated.replace(new RegExp(`\\b${en}\\b`, 'gi'), pt);
        } else {
          // Remove words that don't translate (like articles)
          translated = translated.replace(new RegExp(`\\b${en}\\b\\s*`, 'gi'), '');
        }
      }
      
      // Clean up extra spaces and capitalize first letter
      translated = translated.replace(/\s+/g, ' ').trim();
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    if (targetLang === 'ru') {
      // Comprehensive Russian translations
      const ruTranslations: Record<string, string> = {
        // Common words
        'tour': 'экскурсия',
        'walking': 'пешеходная',
        'historic': 'исторический',
        'historical': 'исторический',
        'discover': 'откройте',
        'explore': 'исследуйте',
        'beautiful': 'красивый',
        'amazing': 'удивительный',
        'experience': 'опыт',
        'guide': 'гид',
        'hours': 'часов',
        'hour': 'час',
        'easy': 'легкий',
        'medium': 'средний',
        'hard': 'сложный',
        'difficult': 'сложный',
        'lisbon': 'Лиссабон',
        'drive': 'поездка',
        'driving': 'вождение',
        'highlights': 'достопримечательности',
        'city': 'город',
        'test': 'тест',
        'this': 'это',
        'is': 'это',
        'a': '',
        'an': '',
        'the': '',
        'and': 'и',
        'or': 'или',
        'with': 'с',
        'from': 'из',
        'to': 'в',
        'in': 'в',
        'of': '',
        'through': 'через',
        'around': 'вокруг',
        'get': 'познакомьтесь',
        'know': 'узнать',
        'portuguese': 'португальский',
        'capital': 'столица',
        'please': 'пожалуйста',
        'follow': 'следуйте',
        'visit': 'посетите',
        'see': 'увидите',
        'learn': 'изучите',
        'about': 'о',
        'culture': 'культура',
        'history': 'история',
        'food': 'еда',
        'wine': 'вино',
        'traditional': 'традиционный',
        'modern': 'современный',
        'old': 'старый',
        'new': 'новый',
        'best': 'лучший',
        'good': 'хороший',
        'great': 'отличный',
        'wonderful': 'замечательный',
        'perfect': 'идеальный',
        'small': 'маленький',
        'big': 'большой',
        'local': 'местный',
        'authentic': 'аутентичный',
        'unique': 'уникальный',
        'special': 'особенный'
      };
      
      let translated = text.toLowerCase();
      // Sort by length (longest first) to avoid partial replacements
      const sortedEntries = Object.entries(ruTranslations).sort((a, b) => b[0].length - a[0].length);
      
      for (const [en, ru] of sortedEntries) {
        if (ru) { // Skip empty translations like 'the' -> ''
          translated = translated.replace(new RegExp(`\\b${en}\\b`, 'gi'), ru);
        } else {
          translated = translated.replace(new RegExp(`\\b${en}\\b\\s*`, 'gi'), '');
        }
      }
      
      // Clean up extra spaces and capitalize first letter
      translated = translated.replace(/\s+/g, ' ').trim();
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    // Fallback for other languages
    return text;
  }

  /**
   * Use LibreTranslate API for translation
   */
  private static async translateWithLibreTranslate(
    text: string, 
    sourceLang: string, 
    targetLang: string
  ): Promise<string> {
    // Map our language codes to LibreTranslate language codes
    const langMap: Record<string, string> = {
      'en': 'en',
      'pt': 'pt',
      'ru': 'ru'
    };

    const sourceCode = langMap[sourceLang];
    const targetCode = langMap[targetLang];

    if (!sourceCode || !targetCode) {
      throw new Error(`Unsupported language pair: ${sourceLang} -> ${targetLang}`);
    }

    const requestBody: any = {
      q: text,
      source: sourceCode,
      target: targetCode,
      format: 'text'
    };

    // Add API key if available
    if (process.env.LIBRETRANSLATE_API_KEY) {
      requestBody.api_key = process.env.LIBRETRANSLATE_API_KEY;
    }

    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  }

  /**
   * Translate multiple fields of a tour object
   */
  static async translateTourFields(
    sourceData: any,
    sourceLang: string,
    targetLangs: string[]
  ): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const targetLang of targetLangs) {
      if (targetLang === sourceLang) {
        result[targetLang] = sourceData;
        continue;
      }

      result[targetLang] = {};
      
      // Translate each field
      for (const [field, value] of Object.entries(sourceData)) {
        if (typeof value === 'string' && value.trim()) {
          result[targetLang][field] = await this.translateText(value, targetLang, sourceLang);
        } else {
          result[targetLang][field] = value;
        }
      }
    }

    return result;
  }
}

export default TranslationService;