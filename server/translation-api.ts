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

    // Check for partial matches and common patterns
    const patternTranslation = this.translateCommonPatterns(text, targetLang);
    if (patternTranslation !== text) {
      return patternTranslation;
    }

    // Always translate using word replacement - this is our primary translation method
    const wordTranslation = this.mockTranslate(text, targetLang);
    
    // If no translation occurred (text unchanged), force a basic translation
    if (wordTranslation === text && targetLang !== 'en') {
      if (targetLang === 'pt') {
        return `[Português] ${text}`;
      }
      if (targetLang === 'ru') {
        return `[Русский] ${text}`;
      }
    }
    
    return wordTranslation;
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
        'the': 'o',
        'and': 'e',
        'or': 'ou',
        'with': 'com',
        'from': 'de',
        'to': 'para',
        'in': 'em',
        'of': 'de',
        'through': 'através de',
        'around': 'ao redor de'
      };
      
      let translated = text.toLowerCase();
      // Sort by length (longest first) to avoid partial replacements
      const sortedEntries = Object.entries(ptTranslations).sort((a, b) => b[0].length - a[0].length);
      
      for (const [en, pt] of sortedEntries) {
        translated = translated.replace(new RegExp(`\\b${en}\\b`, 'gi'), pt);
      }
      
      // Capitalize first letter
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
        'drive': 'поездка на машине',
        'driving': 'вождение',
        'highlights': 'основные моменты',
        'city': 'город',
        'test': 'тест',
        'this': 'это',
        'is': 'является',
        'a': 'один',
        'the': '',
        'and': 'и',
        'or': 'или',
        'with': 'с',
        'from': 'из',
        'to': 'к',
        'in': 'в',
        'of': 'из',
        'through': 'через',
        'around': 'вокруг'
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