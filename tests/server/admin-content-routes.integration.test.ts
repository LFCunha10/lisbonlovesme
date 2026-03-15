import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  json,
  resetRouteTestState,
  restoreRouteTestState,
  startTestServer,
  stopServer,
  testState,
} from "./support/route-test-harness";

describe("server admin content routes integration", () => {
  beforeEach(async () => {
    await resetRouteTestState();
  });

  afterEach(() => {
    restoreRouteTestState();
  });

  it("serves published content publicly and exposes draft content plus mutations to admins", async () => {
    const publishedArticle = await testState.currentStorage.createArticle({
      title: { en: "Published", pt: "Publicado", ru: "Опубликовано" },
      slug: "published-article",
      content: { en: "Body", pt: "Corpo", ru: "Текст" },
      excerpt: { en: "Excerpt", pt: "Resumo", ru: "Кратко" },
      featuredImage: "/article.jpg",
      parentId: undefined,
      sortOrder: 0,
      isPublished: true,
      publishedAt: new Date(),
    });
    await testState.currentStorage.createArticle({
      title: { en: "Draft", pt: "Rascunho", ru: "Черновик" },
      slug: "draft-article",
      content: { en: "Draft", pt: "Rascunho", ru: "Черновик" },
      excerpt: { en: "Excerpt", pt: "Resumo", ru: "Кратко" },
      featuredImage: "/draft.jpg",
      parentId: undefined,
      sortOrder: 1,
      isPublished: false,
      publishedAt: null,
    });
    const visibleImage = await testState.currentStorage.createGalleryImage({
      imageUrl: "/gallery-visible.jpg",
      title: "Visible",
      description: "Shown",
      displayOrder: 0,
      isActive: true,
    });
    await testState.currentStorage.createGalleryImage({
      imageUrl: "/gallery-hidden.jpg",
      title: "Hidden",
      description: "Hidden",
      displayOrder: 1,
      isActive: false,
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const publicArticlesResponse = await fetch(`${baseUrl}/api/articles?published=true`);
      const adminArticlesResponse = await fetch(`${baseUrl}/api/articles/tree`, {
        headers: { "x-api-key": "ops-key-for-tests-1234567890" },
      });
      const publicGalleryResponse = await fetch(`${baseUrl}/api/gallery`);
      const createArticleResponse = await fetch(`${baseUrl}/api/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "ops-key-for-tests-1234567890",
        },
        body: JSON.stringify({
          title: { en: "Created", pt: "Criado", ru: "Создано" },
          slug: "created-article",
          content: { en: "Created body", pt: "Criado corpo", ru: "Создано тело" },
          excerpt: { en: "Excerpt", pt: "Resumo", ru: "Кратко" },
          featuredImage: "/created.jpg",
          sortOrder: 2,
          isPublished: false,
        }),
      });
      const updateGalleryResponse = await fetch(`${baseUrl}/api/gallery/${visibleImage.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "ops-key-for-tests-1234567890",
        },
        body: JSON.stringify({ title: "Updated title" }),
      });

      expect(publicArticlesResponse.status).toBe(200);
      expect(adminArticlesResponse.status).toBe(200);
      expect(publicGalleryResponse.status).toBe(200);
      expect(createArticleResponse.status).toBe(201);
      expect(updateGalleryResponse.status).toBe(200);

      const publicArticles = await json<any[]>(publicArticlesResponse);
      const adminArticles = await json<any[]>(adminArticlesResponse);
      const publicGallery = await json<any[]>(publicGalleryResponse);
      const createdArticle = await json<any>(createArticleResponse);
      const updatedGallery = await json<any>(updateGalleryResponse);

      expect(publicArticles).toHaveLength(1);
      expect(publicArticles[0].id).toBe(publishedArticle.id);
      expect(adminArticles).toHaveLength(2);
      expect(publicGallery).toHaveLength(1);
      expect(publicGallery[0].imageUrl).toBe("/gallery-visible.jpg");
      expect(createdArticle.slug).toBe("created-article");
      expect(updatedGallery.title).toBe("Updated title");
    } finally {
      await stopServer(server);
    }
  });
});
