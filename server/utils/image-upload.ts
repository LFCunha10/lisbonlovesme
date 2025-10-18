import fs from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { resolveUploadDir } from './uploads-path';

// Resolve and ensure uploads directory (supports Render persistent disk)
const uploadDir = resolveUploadDir();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const extension = path.extname(file.originalname);
    const uniqueName = `${nanoid(10)}${extension}`;
    cb(null, uniqueName);
  }
});

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer upload
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle file upload errors
export function handleUploadErrors(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  } else if (err) {
    // A non-Multer error occurred
    return res.status(400).json({ message: err.message });
  }
  next();
}

// Function to get the public URL for an uploaded file
export function getUploadedFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

// Resolve the absolute path to a stored upload by its filename
export function getImageStoredFilePath(filename: string): string {
  return path.join(uploadDir, filename);
}
