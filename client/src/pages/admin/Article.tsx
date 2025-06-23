import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { Link } from "wouter";
import { getLocalizedText } from "@/lib/tour-utils";

interface Article {
  id: number;
  title: { en: string; pt: string; ru: string };
  slug: string;
  content: { en: string; pt: string; ru: string };
  excerpt?: { en: string; pt: string; ru: string };
  featuredImage?: string;
  parentId?: number;
  sortOrder: number;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Article() {
  const [match, params] = useRoute("/articles/:slug");
  const { i18n } = useTranslation();
  
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['/api/articles/slug', params?.slug],
    queryFn: () => fetch(`/api/articles/slug/${params?.slug}`).then(res => {
      if (!res.ok) throw new Error('Article not found');
      return res.json();
    }),
    enabled: !!params?.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading article...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
              <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const localizedTitle = getLocalizedText(article.title, i18n.language);
  const localizedContent = getLocalizedText(article.content, i18n.language);
  const localizedExcerpt = article.excerpt ? getLocalizedText(article.excerpt, i18n.language) : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Article Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {article.featuredImage && (
              <img 
                src={article.featuredImage} 
                alt={localizedTitle}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            
            <div className="flex items-center gap-4 mb-4">
              <Badge variant="secondary">
                <Calendar className="mr-1 h-3 w-3" />
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString()}
              </Badge>
              <Badge variant="outline">
                <User className="mr-1 h-3 w-3" />
                Lisbonlovesme
              </Badge>
            </div>

            <h1 className="text-4xl font-bold mb-4">{localizedTitle}</h1>
            
            {localizedExcerpt && (
              <p className="text-xl text-gray-600 leading-relaxed">{localizedExcerpt}</p>
            )}
          </CardContent>
        </Card>

        {/* Article Content */}
        <Card>
          <CardContent className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: localizedContent }}
            />
          </CardContent>
        </Card>

        {/* Related Articles or Back to Top */}
        <div className="mt-8 text-center">
          <Link href="/#articles">
            <Button variant="outline">
              View More Articles
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}