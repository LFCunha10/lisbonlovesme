import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { User } from '@shared/schema';

interface SerializedUser {
  id: number;
  username: string;
  isAdmin: boolean;
}
// Session augmentation for custom session properties
declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
    isAdmin: boolean;
    user?: {
      id: number;
      username: string;
      isAdmin: boolean;
    };
  }
}

// Configure local strategy for use by Passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // Retrieve user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid username or password' });
      }

      // Only allow admin users to login to the admin panel
      if (!user.isAdmin) {
        return done(null, false, { message: 'You do not have admin privileges' });
      }

      return done(null, {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      return done(error);
    }
  })
);

// Configure Passport authenticated session persistence
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: SerializedUser, done) => {
  done(null, user);
});

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAuthenticated) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Middleware to check if user is an admin
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session?.isAuthenticated && req.session.user?.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Forbidden - Admin access required' });
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Helper function to create admin user during initialization
export async function createAdminUserIfNotExists() {
  try {
    const adminUsername = 'admin';
    const existingAdmin = await storage.getUserByUsername(adminUsername);
    
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('adminpassword');
      await storage.createUser({
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true
      });
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}