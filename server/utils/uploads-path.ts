import fs from 'fs';
import path from 'path';

// Resolve the uploads directory consistently across the app.
// Priority:
// 1) Explicit env var `UPLOAD_DIR`
// 2) On Render (detected via `RENDER`/`RENDER_EXTERNAL_URL`), default to `/data/uploads`
// 3) Fallback to local `public/uploads` (dev)
export function resolveUploadDir(): string {
  const renderEnv = !!(process.env.RENDER || process.env.RENDER_EXTERNAL_URL);
  const configured = process.env.UPLOAD_DIR && process.env.UPLOAD_DIR.trim();
  const chosen = configured
    ? configured
    : (renderEnv ? '/data/uploads' : path.join(process.cwd(), 'public', 'uploads'));

  const absolute = path.resolve(chosen);

  try {
    if (!fs.existsSync(absolute)) {
      fs.mkdirSync(absolute, { recursive: true });
    }
  } catch (e) {
    // If creation fails, still return the path so callers surface errors clearly
  }

  return absolute;
}

