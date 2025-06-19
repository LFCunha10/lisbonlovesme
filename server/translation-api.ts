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

    // Check for exact matches in common translations
    const exactMatch = this.commonTranslations[text]?.[targetLang];
    if (exactMatch) {
      return exactMatch;
    }

    // Check for partial matches and common patterns
    const translatedText = this.translateCommonPatterns(text, targetLang);
    if (translatedText !== text) {
      return translatedText;
    }

    // In production, this would call a real translation API
    // For now, return a mock translation format
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
    if (text.startsWith('Visit ')) {
      const place = text.substring(6);
      if (targetLang === 'pt') return `Visite ${place}`;
      if (targetLang === 'ru') return `Посетите ${place}`;
    }

    // "Explore X" pattern
    if (text.startsWith('Explore ')) {
      const place = text.substring(8);
      if (targetLang === 'pt') return `Explore ${place}`;
      if (targetLang === 'ru') return `Исследуйте ${place}`;
    }

    return text;
  }

  private static getRussianHourSuffix(hours: number): string {
    if (hours === 1) return '';
    if (hours >= 2 && hours <= 4) return 'а';
    return 'ов';
  }

  private static mockTranslate(text: string, targetLang: string): string {
    // Simple mock translation - in production replace with real API call
    const prefixes: Record<string, string> = {
      pt: '[PT] ',
      ru: '[RU] '
    };
    
    return `${prefixes[targetLang] || ''}${text}`;
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