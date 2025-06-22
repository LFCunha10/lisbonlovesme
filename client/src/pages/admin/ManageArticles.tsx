import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getLocalizedText } from "@/lib/tour-utils";
import { PlusIcon, EditIcon, TrashIcon, FolderIcon, FileTextIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { RichTextEditor } from '@/components/ui/RichTextEditor';

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

export default function ManageArticles() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentLanguage = i18n.language as 'en' | 'pt' | 'ru';

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [selectedParent, setSelectedParent] = useState<number | undefined>();
  const [html, setHtml] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: { en: "", pt: "", ru: "" },
    slug: "",
    content: { en: "", pt: "", ru: "" },
    excerpt: { en: "", pt: "", ru: "" },
    featuredImage: "",
    parentId: undefined as number | undefined,
    sortOrder: 0,
    isPublished: false,
  });

  // Fetch articles
  const { data: articles, isLoading } = useQuery({
    queryKey: ['/api/articles/tree'],
    queryFn: () => fetch('/api/articles/tree').then(res => res.json()),
  });

  // Create article mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles/tree'] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Article created",
        description: "The article has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create article",
        variant: "destructive",
      });
    },
  });

  // Update article mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      fetch(`/api/articles/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles/tree'] });
      setEditingArticle(null);
      resetForm();
      toast({
        title: "Article updated",
        description: "The article has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update article",
        variant: "destructive",
      });
    },
  });

  // Delete article mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/articles/${id}`, {
      method: "DELETE",
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/articles/tree'] });
      toast({
        title: "Article deleted",
        description: "The article has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: { en: "", pt: "", ru: "" },
      slug: "",
      content: { en: "", pt: "", ru: "" },
      excerpt: { en: "", pt: "", ru: "" },
      featuredImage: "",
      parentId: undefined,
      sortOrder: 0,
      isPublished: false,
    });
  };

  const handleSubmit = () => {
    if (!formData.title.en || !formData.slug) {
      toast({
        title: "Error",
        description: "Please fill in the required fields (English title and slug)",
        variant: "destructive",
      });
      return;
    }

    if (editingArticle) {
      updateMutation.mutate({ id: editingArticle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt || { en: "", pt: "", ru: "" },
      featuredImage: article.featuredImage || "",
      parentId: article.parentId,
      sortOrder: article.sortOrder,
      isPublished: article.isPublished,
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const buildTree = (articles: Article[], parentId?: number): Article[] => {
    return articles
      .filter(article => article.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  const renderArticleTree = (articles: Article[], level = 0) => {
    const children = buildTree(articles || [], selectedParent);
    
    return children.map((article) => {
      const hasChildren = (articles || []).some(a => a.parentId === article.id);
      
      return (
        <div key={article.id} className={`${level > 0 ? 'ml-8' : ''}`}>
          <Card className="mb-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {hasChildren ? (
                    <FolderIcon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileTextIcon className="h-4 w-4 text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-medium">
                      {getLocalizedText(article.title, currentLanguage)}
                    </h3>
                    <p className="text-sm text-gray-500">/{article.slug}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={article.isPublished ? "default" : "secondary"}>
                      {article.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(article)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(article.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          {hasChildren && renderArticleTree(articles, level + 1)}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading articles...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Manage Articles</h1>
          <Dialog open={showCreateDialog || !!editingArticle} onOpenChange={(open) => {
            if (!open) {
              setShowCreateDialog(false);
              setEditingArticle(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingArticle ? "Edit Article" : "Create New Article"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Slug (URL identifier)</Label>
                        <Input
                          value={formData.slug}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                          placeholder="article-url-slug"
                        />
                      </div>
                      <div>
                        <Label>Parent Article</Label>
                        <Select
                          value={formData.parentId?.toString() || "none"}
                          onValueChange={(value) => setFormData({ 
                            ...formData, 
                            parentId: value === "none" ? undefined : parseInt(value) 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No parent</SelectItem>
                            {Array.isArray(articles) && articles.map((article: Article) => (
                              <SelectItem key={article.id} value={article.id.toString()}>
                                {getLocalizedText(article.title, currentLanguage)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Sort Order</Label>
                        <Input
                          type="number"
                          value={formData.sortOrder}
                          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label>Featured Image URL</Label>
                        <Input
                          value={formData.featuredImage}
                          onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.isPublished}
                        onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                      />
                      <Label>Published</Label>
                    </div>
                  </CardContent>
                </Card>

                {/* Multilingual Content */}
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="en">
                      <TabsList>
                        <TabsTrigger value="en">English</TabsTrigger>
                        <TabsTrigger value="pt">Portuguese</TabsTrigger>
                        <TabsTrigger value="ru">Russian</TabsTrigger>
                      </TabsList>
                      
                      {['en', 'pt', 'ru'].map((lang) => (
                        <TabsContent key={lang} value={lang} className="space-y-4">
                          <div>
                            <Label>Title ({lang.toUpperCase()})</Label>
                            <Input
                              value={formData.title[lang as keyof typeof formData.title]}
                              onChange={(e) => {
                                const newTitle = { ...formData.title, [lang]: e.target.value };
                                setFormData({ 
                                  ...formData, 
                                  title: newTitle,
                                  // Auto-generate slug from English title
                                  ...(lang === 'en' ? { slug: generateSlug(e.target.value) } : {})
                                });
                              }}
                            />
                          </div>
                          
                          <div>
                            <Label>Excerpt ({lang.toUpperCase()})</Label>
                            <Textarea
                              value={formData.excerpt[lang as keyof typeof formData.excerpt]}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                excerpt: { ...formData.excerpt, [lang]: e.target.value }
                              })}
                              rows={3}
                            />
                          </div>
                          
                          <div>
                            <Label>Content ({lang.toUpperCase()})</Label>
                            <RichTextEditor
                              value={formData.content[lang as keyof typeof formData.content]}
                              onChange={(html) =>
                                setFormData({
                                  ...formData,
                                  content: {
                                    ...formData.content,
                                    [lang]: html
                                  }
                                })
                              }
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              You can use HTML tags for formatting
                            </p>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    setEditingArticle(null);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingArticle ? "Update Article" : "Create Article"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Articles Tree */}
        <Card>
          <CardHeader>
            <CardTitle>Articles Tree</CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(articles) && articles.length > 0 ? (
              <div className="space-y-2">
                {renderArticleTree(articles || [])}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No articles found. Create your first article!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}