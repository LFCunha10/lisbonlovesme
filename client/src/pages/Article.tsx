import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLocalizedText } from "@/lib/tour-utils";
import { CalendarIcon, ClockIcon } from "lucide-react";
import { format } from "date-fns";

interface Article {
  id: number;
  title: { en: string; pt: string; ru: string };
  slug: string;
  content: { en: string; pt: string; ru: string };
  excerpt?: { en: string; pt: string; ru: string };
  featuredImage?: string;
  parentId?: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language as 'en' | 'pt' | 'ru';

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['/api/articles/slug', slug],
    queryFn: () => fetch(`/api/articles/slug/${slug}`).then(res => {
      if (!res.ok) throw new Error('Article not found');
      return res.json();
    }),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="h-64 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
            <p className="text-gray-600">The article you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const localizedTitle = getLocalizedText(article.title, currentLanguage);
  const localizedContent = getLocalizedText(article.content, currentLanguage);
  const localizedExcerpt = article.excerpt ? getLocalizedText(article.excerpt, currentLanguage) : '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {localizedTitle}
                </h1>
                
                {localizedExcerpt && (
                  <p className="text-xl text-gray-600 mb-6">
                    {localizedExcerpt}
                  </p>
                )}
                
                {/* Meta information */}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  {article.publishedAt && (
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        Published {format(new Date(article.publishedAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {article.updatedAt !== article.createdAt && (
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="h-4 w-4" />
                      <span>
                        Updated {format(new Date(article.updatedAt), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  <Badge variant="outline">Article</Badge>
                </div>
              </div>

              {/* Featured Image */}
              {article.featuredImage && (
                <div className="mb-8">
                  <img
                    src={article.featuredImage}
                    alt={localizedTitle}
                    className="w-full h-64 md:h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: localizedContent }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}