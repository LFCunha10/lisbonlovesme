import OpenAI from "openai";

type SupportedLanguage = "en" | "pt" | "ru";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

function getTranslationModel() {
  return process.env.OPENAI_TRANSLATION_MODEL || "gpt-4o-mini";
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Translation response is not valid JSON");
    return JSON.parse(match[0]);
  }
}

async function translateFieldsWithOpenAI(
  sourceData: Record<string, string>,
  sourceLang: SupportedLanguage,
  targetLangs: SupportedLanguage[],
): Promise<Record<string, Record<string, string>>> {
  if (targetLangs.length === 0) return {};

  const client = getOpenAIClient();
  const model = getTranslationModel();
  const response = await client.chat.completions.create({
    model,
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a professional localization translator for travel/tourism content. " +
          "Translate content accurately while preserving meaning and tone. " +
          "If input contains HTML, keep all HTML tags/attributes unchanged and only translate user-facing text. " +
          "Return JSON only.",
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "translate_fields",
          sourceLang,
          targetLangs,
          sourceData,
          requiredOutputShape: {
            translations: Object.fromEntries(
              targetLangs.map((lang) => [lang, Object.fromEntries(Object.keys(sourceData).map((k) => [k, "translated text"]))]),
            ),
          },
        }),
      },
    ],
  });

  const content = response.choices[0]?.message?.content || "{}";
  const parsed = parseJsonObject(content);
  const translations = (parsed.translations || {}) as Record<string, Record<string, string>>;

  const result: Record<string, Record<string, string>> = {};
  for (const lang of targetLangs) {
    const langTranslations = translations[lang] || {};
    result[lang] = {};
    for (const key of Object.keys(sourceData)) {
      const translated = langTranslations[key];
      result[lang][key] =
        typeof translated === "string" && translated.trim().length > 0
          ? translated
          : sourceData[key];
    }
  }

  return result;
}

export class TranslationService {
  static async translateText(
    text: string,
    targetLang: SupportedLanguage,
    sourceLang: SupportedLanguage = "en",
  ): Promise<string> {
    if (!text?.trim() || targetLang === sourceLang) return text;
    const translations = await translateFieldsWithOpenAI(
      { value: text },
      sourceLang,
      [targetLang],
    );
    return translations[targetLang]?.value || text;
  }

  static async translateTourFields(
    sourceData: Record<string, unknown>,
    sourceLang: SupportedLanguage,
    targetLangs: SupportedLanguage[],
  ): Promise<Record<string, Record<string, unknown>>> {
    const stringFields: Record<string, string> = {};
    const passthrough: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(sourceData)) {
      if (typeof value === "string") {
        stringFields[key] = value;
      } else {
        passthrough[key] = value;
      }
    }

    const translatedStringFields = await translateFieldsWithOpenAI(
      stringFields,
      sourceLang,
      targetLangs,
    );

    const result: Record<string, Record<string, unknown>> = {};
    for (const lang of targetLangs) {
      result[lang] = {
        ...passthrough,
        ...translatedStringFields[lang],
      };
    }
    return result;
  }
}

export default TranslationService;
