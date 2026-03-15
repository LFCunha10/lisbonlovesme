import { Router, type NextFunction, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import { storage } from "../storage";
import { exportDatabase } from "../utils/export-database-complete";
import {
  getUploadedFileUrl,
  handleUploadErrors,
  upload,
} from "../utils/image-upload";
import {
  getStoredFilePath,
  handleDocumentUploadErrors,
  uploadDocument,
} from "../utils/document-upload";
import { resolveUploadDir } from "../utils/uploads-path";
import { parseWithSchema } from "../http";
import { storageDeleteSchema } from "../schemas";
import type { RouteContext } from "./context";

const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "uploads",
  "assets",
  "static",
  "images",
  "img",
  "tours",
  "tour",
  "articles",
  "article",
  "book",
  "review",
  "gallery",
  "en",
  "pt",
  "ru",
  "3-day-guide-book",
]);

export function createFilesRouter(context: RouteContext) {
  const router = Router();

  router.post(
    "/api/upload-image",
    ...context.adminMutationGuards,
    upload.single("image"),
    handleUploadErrors,
    (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No image file uploaded" });
        }

        res.status(200).json({
          message: "Image uploaded successfully",
          imageUrl: getUploadedFileUrl(req.file.filename),
        });
      } catch (error: any) {
        console.error("Image upload error:", error);
        res.status(500).json({ message: error.message || "Image upload failed" });
      }
    },
  );

  router.get("/api/export-database", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const exportDir = path.join(process.cwd(), "exports");
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const exportPath = await exportDatabase();
      if (!fs.existsSync(exportPath)) {
        throw new Error(`Export file does not exist at ${exportPath}`);
      }

      res.setHeader("Content-Type", "application/sql");
      res.setHeader("Content-Disposition", `attachment; filename="${path.basename(exportPath)}"`);

      fs.readFile(exportPath, "utf8", (error, data) => {
        if (error) {
          console.error("Error reading export file:", error);
          return res.status(500).json({ message: "Error reading export file" });
        }

        res.send(data);
      });
    } catch (error: any) {
      console.error("Database export failed:", error);
      res.status(500).json({ message: error.message || "Database export failed" });
    }
  });

  router.get("/api/admin/storage/diagnostics", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const dir = resolveUploadDir();
      const exists = fs.existsSync(dir);
      const stats = exists ? fs.statSync(dir) : undefined;
      const isDirectory = !!stats?.isDirectory();
      const readable = (() => {
        try {
          fs.accessSync(dir, fs.constants.R_OK);
          return true;
        } catch {
          return false;
        }
      })();
      const writable = (() => {
        try {
          fs.accessSync(dir, fs.constants.W_OK);
          return true;
        } catch {
          return false;
        }
      })();

      let fileCount = 0;
      let totalBytes = 0;
      const examples: { name: string; size: number }[] = [];

      if (exists && isDirectory) {
        const walk = (currentPath: string) => {
          const entries = fs.readdirSync(currentPath, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
              walk(fullPath);
            } else if (entry.isFile()) {
              try {
                const entryStats = fs.statSync(fullPath);
                fileCount += 1;
                totalBytes += entryStats.size;
                if (examples.length < 10) {
                  examples.push({ name: path.relative(dir, fullPath), size: entryStats.size });
                }
              } catch {
                // Ignore individual stat failures.
              }
            }
          }
        };
        walk(dir);
      }

      res.json({
        uploadDir: dir,
        exists,
        isDirectory,
        readable,
        writable,
        fileCount,
        totalBytes,
        examples,
      });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Failed to compute storage diagnostics" });
    }
  });

  router.post("/api/admin/storage/delete", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const dir = resolveUploadDir();
      const { name: nameRaw } = parseWithSchema(storageDeleteSchema, req.body);

      if (nameRaw.startsWith("/") || nameRaw.includes("..")) {
        return res.status(400).json({ message: "Invalid file name" });
      }

      const abs = path.resolve(dir, nameRaw);
      if (!abs.startsWith(path.resolve(dir) + path.sep) && path.resolve(dir) !== abs) {
        return res.status(400).json({ message: "Path outside uploads directory" });
      }

      if (!fs.existsSync(abs)) {
        return res.status(404).json({ message: "File not found" });
      }
      const stats = fs.statSync(abs);
      if (!stats.isFile()) {
        return res.status(400).json({ message: "Not a file" });
      }

      fs.unlinkSync(abs);
      res.json({ ok: true, name: nameRaw });
    } catch (error: any) {
      console.error("Delete storage file failed:", error);
      res.status(500).json({ message: error?.message || "Failed to delete file" });
    }
  });

  router.get("/api/documents", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const docs = await storage.getDocuments();
      res.json(docs);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Failed to list documents" });
    }
  });

  router.post(
    "/api/documents",
    ...context.adminMutationGuards,
    uploadDocument.single("file"),
    handleDocumentUploadErrors,
    async (req: Request, res: Response) => {
      try {
        const slugRaw = (req.body?.slug || "").toString();
        const title = (req.body?.title || "").toString() || null;
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }
        if (!slugRaw) {
          return res.status(400).json({ message: "Slug is required" });
        }

        const slug = slugRaw
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\-\s]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");

        if (!slug) {
          return res.status(400).json({ message: "Invalid slug" });
        }
        if (RESERVED_SLUGS.has(slug)) {
          return res.status(400).json({ message: "Slug is reserved" });
        }

        const existing = await storage.getDocumentBySlug(slug);
        if (existing) {
          return res.status(409).json({ message: "Slug already in use" });
        }

        const doc = await storage.createDocument({
          slug,
          title: title as any,
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        } as any);

        res.status(201).json(doc);
      } catch (error: any) {
        console.error("Create document failed:", error);
        res.status(500).json({ message: error?.message || "Failed to create document" });
      }
    },
  );

  router.delete("/api/documents/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const doc = await storage.getDocument(id);
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      try {
        const filePath = getStoredFilePath(doc.storedFilename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn("Failed to delete stored file:", error);
      }

      await storage.deleteDocument(id);
      res.json({ message: "Document deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Failed to delete document" });
    }
  });

  router.get("/:slug", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      if (RESERVED_SLUGS.has(slug)) {
        return next();
      }

      const doc = await storage.getDocumentBySlug(slug);
      if (!doc) {
        return next();
      }

      const filePath = getStoredFilePath(doc.storedFilename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found");
      }

      res.setHeader("Content-Type", doc.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `inline; filename="${doc.originalFilename.replace(/"/g, "")}"`);
      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
