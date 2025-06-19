import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface MultilingualTourData {
  name: { en: string; pt: string; ru: string };
  shortDescription: { en: string; pt: string; ru: string };
  description: { en: string; pt: string; ru: string };
  duration: { en: string; pt: string; ru: string };
  difficulty: { en: string; pt: string; ru: string };
  badge: { en: string; pt: string; ru: string };
}

interface MultilingualEditorProps {
  tourData: MultilingualTourData;
  onChange: (data: MultilingualTourData) => void;
}

export default function MultilingualEditor({ tourData, onChange }: MultilingualEditorProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState("en");

  const handleFieldChange = (
    field: keyof MultilingualTourData,
    language: 'en' | 'pt' | 'ru',
    value: string
  ) => {
    onChange({
      ...tourData,
      [field]: {
        ...tourData[field],
        [language]: value
      }
    });
  };

  const handleAutoTranslate = async () => {
    setIsTranslating(true);
    try {
      const response = await apiRequest("POST", "/api/tours/auto-translate", {
        name: tourData.name.en,
        shortDescription: tourData.shortDescription.en,
        description: tourData.description.en,
        duration: tourData.duration.en,
        difficulty: tourData.difficulty.en,
        badge: tourData.badge.en
      });
      
      const translations = await response.json();
      onChange(translations);
      
      toast({
        title: "Auto-translation completed",
        description: "All fields have been translated to Portuguese and Russian."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Translation failed",
        description: "Please try again or fill in translations manually."
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const translateSingleField = async (field: keyof MultilingualTourData) => {
    const englishText = tourData[field].en;
    if (!englishText.trim()) return;

    try {
      const response = await apiRequest("POST", "/api/translate-field", {
        text: englishText
      });
      
      const translations = await response.json();
      
      onChange({
        ...tourData,
        [field]: translations
      });
      
      toast({
        title: "Field translated",
        description: `${field} has been translated successfully.`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Translation failed",
        description: "Please try again."
      });
    }
  };

  const getLanguageFlag = (lang: string) => {
    switch (lang) {
      case 'en': return '🇬🇧';
      case 'pt': return '🇵🇹';
      case 'ru': return '🇷🇺';
      default: return '🌍';
    }
  };

  const getLanguageName = (lang: string) => {
    switch (lang) {
      case 'en': return 'English';
      case 'pt': return 'Português';
      case 'ru': return 'Русский';
      default: return lang;
    }
  };

  const FieldEditor = ({ 
    field, 
    label, 
    type = "input" 
  }: { 
    field: keyof MultilingualTourData; 
    label: string; 
    type?: "input" | "textarea";
  }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => translateSingleField(field)}
          disabled={!tourData[field].en.trim()}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          Translate
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {(['en', 'pt', 'ru'] as const).map((lang) => (
            <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
              <span>{getLanguageFlag(lang)}</span>
              <span>{getLanguageName(lang)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {(['en', 'pt', 'ru'] as const).map((lang) => (
          <TabsContent key={lang} value={lang} className="mt-4">
            {type === "textarea" ? (
              <Textarea
                value={tourData[field][lang]}
                onChange={(e) => handleFieldChange(field, lang, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()} in ${getLanguageName(lang)}`}
                rows={4}
              />
            ) : (
              <Input
                value={tourData[field][lang]}
                onChange={(e) => handleFieldChange(field, lang, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()} in ${getLanguageName(lang)}`}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Multilingual Content
          </CardTitle>
          <Button
            onClick={handleAutoTranslate}
            disabled={isTranslating || !tourData.name.en.trim()}
            variant="outline"
          >
            {isTranslating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Auto-translate All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <FieldEditor field="name" label="Tour Name" />
        <FieldEditor field="shortDescription" label="Short Description" />
        <FieldEditor field="description" label="Description" type="textarea" />
        <FieldEditor field="duration" label="Duration" />
        <FieldEditor field="difficulty" label="Difficulty" />
        <FieldEditor field="badge" label="Badge" />
      </CardContent>
    </Card>
  );
}