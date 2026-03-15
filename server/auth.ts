import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import type { SessionUser } from "./session";

const isProduction = process.env.NODE_ENV === "production";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (hasAuthenticatedSession(req)) {
    return next();
  }

  res.status(401).json({ message: "Unauthorized" });
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (hasAuthenticatedAdminSession(req)) {
    return next();
  }

  res.status(403).json({ message: "Forbidden - Admin access required" });
}

export function hasAuthenticatedSession(req: Request): boolean {
  return Boolean(req.session?.isAuthenticated && req.session.user);
}

export function hasAuthenticatedAdminSession(req: Request): boolean {
  return Boolean(req.session?.isAuthenticated && req.session.user?.isAdmin);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function authenticateAdminCredentials(
  username: string,
  password: string,
): Promise<User | undefined> {
  const user = await storage.getUserByUsername(username);
  if (!user?.isAdmin) {
    return undefined;
  }

  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    return undefined;
  }

  return user;
}

export function buildSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    isAdmin: Boolean(user.isAdmin),
  };
}

export function setAuthenticatedAdminSession(req: Request, user: User) {
  req.session.isAuthenticated = true;
  req.session.user = buildSessionUser(user);
}

export async function updateAdminPassword(userId: number, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword);
  return storage.updateUser(userId, { password: hashedPassword });
}

export async function createAdminUserIfNotExists() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME?.trim() || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    const existingAdmin = await storage.getUserByUsername(adminUsername);

    if (existingAdmin) {
      return;
    }

    if (!adminPassword) {
      if (isProduction) {
        console.warn(
          `Skipping bootstrap admin creation because ADMIN_PASSWORD is not configured for "${adminUsername}".`,
        );
        return;
      }

      await storage.createUser({
        username: adminUsername,
        password: await hashPassword("adminpassword"),
        isAdmin: true,
      });
      return;
    }

    await storage.createUser({
      username: adminUsername,
      password: await hashPassword(adminPassword),
      isAdmin: true,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}
