import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/language-routing";

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: "English",
  pt: "Português",
  ru: "Русский",
};

interface LanguagePreferenceModalProps {
  isOpen: boolean;
  onSelectLanguage: (language: SupportedLanguage) => void;
}

export default function LanguagePreferenceModal({
  isOpen,
  onSelectLanguage,
}: LanguagePreferenceModalProps) {
  const { t } = useTranslation();

  const availableLanguages = useMemo(
    () => SUPPORTED_LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_LABELS[language] })),
    [],
  );

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="[&>button]:hidden"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t("languagePrompt.title", "Choose your language")}</DialogTitle>
          <DialogDescription>
            {t("languagePrompt.description", "Select your preferred language to continue.")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {availableLanguages.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              variant="outline"
              onClick={() => onSelectLanguage(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
