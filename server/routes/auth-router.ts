import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import {
  authenticateAdminCredentials,
  hashPassword,
  setAuthenticatedAdminSession,
  updateAdminPassword,
  verifyPassword,
} from "../auth";
import { getApiKeyPrincipal, requestHasApiKeyScope } from "../api-keys";
import { getSessionCookieName } from "../session";
import { createAppError, parseWithSchema, toErrorResponse } from "../http";
import {
  adminCreateUserSchema,
  adminLoginSchema,
  adminPasswordChangeSchema,
} from "../schemas";
import { csrfTokenHandler, issueCsrfToken, requireCsrf } from "../security";
import {
  getEmailTransportDiagnostics,
  sendTestEmail,
  verifyEmailTransport,
} from "../emailService.js";
import type { RouteContext } from "./context";

export function createAuthRouter(context: RouteContext) {
  const router = Router();

  router.get("/api/csrf-token", csrfTokenHandler);

  router.get("/api/admin/me", ...context.adminReadGuards, async (req: Request, res: Response) => {
    const apiKeyPrincipal = getApiKeyPrincipal(req);
    if (apiKeyPrincipal) {
      return res.json({
        id: 0,
        username: apiKeyPrincipal.id,
        isAdmin: true,
        authType: "apiKey",
      });
    }

    const user = await storage.getUser(req.session.user!.id);
    if (!user?.isAdmin) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      username: user.username,
      isAdmin: true,
    });
  });

  router.post("/api/admin/create-user", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { username, password } = parseWithSchema(adminCreateUserSchema, req.body);
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        throw createAppError(409, "Username is already in use");
      }

      const newUser = await storage.createUser({
        username,
        password: await hashPassword(password),
        isAdmin: true,
      });

      res.status(201).json({
        message: "Admin user created",
        user: { id: newUser.id, username: newUser.username, isAdmin: true },
      });
    } catch (error) {
      const { status, message } = toErrorResponse(error, "Failed to create user");
      context.logUnexpectedRouteError("Create user error:", error, status);
      res.status(status).json({ message });
    }
  });

  router.post("/api/admin/login", context.loginRateLimiter, requireCsrf, async (req: Request, res: Response) => {
    try {
      const { username, password } = parseWithSchema(adminLoginSchema, req.body);
      const user = await authenticateAdminCredentials(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((sessionError) => {
          if (sessionError) {
            reject(sessionError);
            return;
          }

          setAuthenticatedAdminSession(req, user);
          resolve();
        });
      });

      res.json({
        message: "Login successful",
        user: req.session.user,
        csrfToken: issueCsrfToken(req, res),
      });
    } catch (error) {
      const { status, message } = toErrorResponse(error, "An error occurred during login");
      context.logUnexpectedRouteError("Login error:", error, status);
      res.status(status).json({ message });
    }
  });

  router.get("/api/admin/session", (req: Request, res: Response) => {
    const apiKeyPrincipal = getApiKeyPrincipal(req);
    if (apiKeyPrincipal && requestHasApiKeyScope(req, "admin:read")) {
      return res.json({
        isAuthenticated: true,
        isAdmin: true,
        user: {
          id: 0,
          username: apiKeyPrincipal.id,
          isAdmin: true,
        },
        authType: "apiKey",
      });
    }

    if (req.session?.isAuthenticated && req.session?.user?.isAdmin) {
      return res.json({
        isAuthenticated: true,
        isAdmin: true,
        user: req.session.user,
      });
    }

    res.json({
      isAuthenticated: false,
      isAdmin: false,
    });
  });

  router.post("/api/admin/logout", requireCsrf, (req: Request, res: Response) => {
    if (!req.session) {
      return res.status(200).json({ message: "No session to destroy" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }

      res.clearCookie(getSessionCookieName(), {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.clearCookie("csrfToken", {
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.json({ message: "Logged out successfully" });
    });
  });

  router.post("/api/admin/password", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = parseWithSchema(adminPasswordChangeSchema, req.body);
      const currentUser = await storage.getUser(req.session.user!.id);

      if (!currentUser?.isAdmin) {
        throw createAppError(404, "User not found");
      }

      const currentPasswordMatches = await verifyPassword(currentPassword, currentUser.password);
      if (!currentPasswordMatches) {
        throw createAppError(400, "Current password is incorrect");
      }

      await updateAdminPassword(currentUser.id, newPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      const { status, message } = toErrorResponse(error, "Failed to update password");
      context.logUnexpectedRouteError("Password update error:", error, status);
      res.status(status).json({ message });
    }
  });

  router.get("/api/settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json({
        heroBannerImageUrl: settings?.heroBannerImageUrl ?? null,
      });
    } catch (error) {
      const { status, message } = toErrorResponse(error, "Failed to retrieve settings");
      res.status(status).json({ message });
    }
  });

  router.get("/api/admin/settings", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve admin settings" });
    }
  });

  router.put("/api/admin/settings", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update admin settings" });
    }
  });

  router.get("/api/admin/email/verify", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    const diagnostics = getEmailTransportDiagnostics();
    const ok = await verifyEmailTransport();
    res.json({ ok, diagnostics });
  });

  router.post("/api/admin/email/test", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const to = req.body?.to as string | undefined;
      await sendTestEmail(to);
      res.json({ ok: true, to: to || process.env.ADMIN_EMAIL || process.env.EMAIL_USER });
    } catch (err: any) {
      console.error("Email test failed:", err);
      res.status(500).json({ ok: false, message: err?.message || "Email test failed" });
    }
  });

  return router;
}
