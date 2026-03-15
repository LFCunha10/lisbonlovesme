import { Router, type Request, type Response } from "express";
import fs from "fs";
import { storage } from "../storage";
import { getImageStoredFilePath } from "../utils/image-upload";
import { parseWithSchema } from "../http";
import { galleryReorderSchema } from "../schemas";
import type { RouteContext } from "./context";

export function createAdminContentRouter(context: RouteContext) {
  const router = Router();

  router.get("/api/articles", async (req: Request, res: Response) => {
    try {
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      const published = req.query.published === "true" || !context.isAdminRequest(req);

      let articles = await storage.getArticles();
      if (published) {
        articles = articles.filter((article) => article.isPublished);
      }
      if (parentId !== undefined) {
        articles = articles.filter((article) => article.parentId === parentId);
      }

      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching articles: " + error.message });
    }
  });

  router.get("/api/articles/tree", async (req: Request, res: Response) => {
    try {
      const published = req.query.published === "true" || !context.isAdminRequest(req);
      if (published) {
        const allArticles = await storage.getArticles();
        return res.json(allArticles.filter((article) => article.isPublished));
      }

      const articles = await storage.getArticleTree();
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching article tree: " + error.message });
    }
  });

  router.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const article = await storage.getArticle(parseInt(req.params.id));
      if (!article || (!article.isPublished && !context.isAdminRequest(req))) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching article: " + error.message });
    }
  });

  router.get("/api/articles/slug/:slug", async (req: Request, res: Response) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article || (!article.isPublished && !context.isAdminRequest(req))) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching article: " + error.message });
    }
  });

  router.post("/api/articles", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const article = await storage.createArticle(req.body);
      res.status(201).json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating article: " + error.message });
    }
  });

  router.put("/api/articles/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const article = await storage.updateArticle(parseInt(req.params.id), req.body);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating article: " + error.message });
    }
  });

  router.delete("/api/articles/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteArticle(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json({ message: "Article deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting article: " + error.message });
    }
  });

  router.get("/api/gallery", async (req: Request, res: Response) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(context.getVisibleGalleryImages(images, req));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve gallery images" });
    }
  });

  router.post("/api/gallery", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const image = await storage.createGalleryImage({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      res.status(201).json(image);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create gallery image" });
    }
  });

  router.put("/api/gallery/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const image = await storage.updateGalleryImage(parseInt(req.params.id), req.body);
      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      res.json(image);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update gallery image" });
    }
  });

  router.delete("/api/gallery/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      const existing = await storage.getGalleryImage(imageId);
      if (!existing) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      const success = await storage.deleteGalleryImage(imageId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete gallery image" });
      }

      try {
        const url = existing.imageUrl || "";
        if (typeof url === "string" && url.startsWith("/uploads/")) {
          const filename = url.split("?")[0].split("#")[0].replace(/^\/uploads\//, "");
          const filePath = getImageStoredFilePath(filename);
          if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (error) {
        console.warn("Failed to delete gallery image file from disk:", error);
      }

      res.json({ message: "Gallery image deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete gallery image" });
    }
  });

  router.post("/api/gallery/reorder", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { imageIds } = parseWithSchema(galleryReorderSchema, req.body);
      const success = await storage.reorderGalleryImages(imageIds);
      if (!success) {
        return res.status(500).json({ message: "Failed to reorder images" });
      }

      res.json({ message: "Images reordered successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reorder gallery images" });
    }
  });

  return router;
}
