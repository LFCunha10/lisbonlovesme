import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languageNames = {
  'en': 'English',
  'pt': 'Português', 
  'ru': 'Русский',
  'en-US': 'English',
  'pt-PT': 'Português',
  'pt-BR': 'Português'
};

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value);
  };

  // Get current language, handle variations like en-US -> en
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const displayValue = languageNames[currentLang as keyof typeof languageNames] || languageNames['en'];

  return (
    <div className={`relative z-10 ${className || ''}`}>
      <Select
        value={currentLang}
        onValueChange={changeLanguage}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue>{displayValue}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="pt">Português</SelectItem>
          <SelectItem value="ru">Русский</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}