import { TranslationService } from "./translation-api.js";

export async function translateText(
  text: string,
  fromLang: "en" | "pt" | "ru",
  toLang: "en" | "pt" | "ru",
): Promise<string> {
  return TranslationService.translateText(text, toLang, fromLang);
}

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
  const sourceData = {
    name: content.name,
    shortDescription: content.shortDescription || "",
    description: content.description,
    duration: content.duration,
    difficulty: content.difficulty,
    badge: content.badge || "",
  };

  const translations = await TranslationService.translateTourFields(
    sourceData,
    "en",
    ["pt", "ru"],
  );

  return {
    name: {
      en: sourceData.name,
      pt: String(translations.pt?.name || sourceData.name),
      ru: String(translations.ru?.name || sourceData.name),
    },
    shortDescription: {
      en: sourceData.shortDescription,
      pt: String(translations.pt?.shortDescription || sourceData.shortDescription),
      ru: String(translations.ru?.shortDescription || sourceData.shortDescription),
    },
    description: {
      en: sourceData.description,
      pt: String(translations.pt?.description || sourceData.description),
      ru: String(translations.ru?.description || sourceData.description),
    },
    duration: {
      en: sourceData.duration,
      pt: String(translations.pt?.duration || sourceData.duration),
      ru: String(translations.ru?.duration || sourceData.duration),
    },
    difficulty: {
      en: sourceData.difficulty,
      pt: String(translations.pt?.difficulty || sourceData.difficulty),
      ru: String(translations.ru?.difficulty || sourceData.difficulty),
    },
    badge: {
      en: sourceData.badge,
      pt: String(translations.pt?.badge || sourceData.badge),
      ru: String(translations.ru?.badge || sourceData.badge),
    },
  };
}

export async function translateField(
  text: string,
): Promise<{ en: string; pt: string; ru: string }> {
  if (!text.trim()) {
    return { en: "", pt: "", ru: "" };
  }

  const [pt, ru] = await Promise.all([
    translateText(text, "en", "pt"),
    translateText(text, "en", "ru"),
  ]);

  return { en: text, pt, ru };
}
