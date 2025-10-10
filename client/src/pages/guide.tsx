import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GuideDownloadPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const lang = useMemo(() => {
    const base = (i18n.language || 'en').split('-')[0];
    return ['en', 'pt', 'ru'].includes(base) ? base : 'en';
  }, [i18n.language]);

  const slugByLang: Record<string, string> = {
    en: 'guide-en',
    pt: 'guide-pt',
    ru: 'guide-ru',
  };

  const fileSlug = slugByLang[lang] || slugByLang.en;
  const fileUrl = `/${fileSlug}`;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(fileUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('File not available');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lisbonlovesme-guide-${lang}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({
        title: t('common.error'),
        description: t('guideDownload.unavailable', 'File not available for this language yet.'),
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-10 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            {t('guideDownload.title', 'Download the Tour Guide')}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="px-6" onClick={handleDownload} disabled={downloading}>
              <Download className="w-5 h-5 mr-2" />
              {downloading ? t('common.loading') : t('guideDownload.button', 'Download PDF')}
            </Button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline"
            >
              {t('guideDownload.open', 'Open in browser')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

