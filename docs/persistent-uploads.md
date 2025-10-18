Persistent uploads (documents, images)

Problem

- On many hosts (Render, Railway, Heroku, Vercel, etc.), the filesystem inside a deploy is ephemeral. Anything saved to disk during runtime is lost on the next deploy or restart, unless you use a persistent disk or external object storage.

What this repo supports

- A configurable upload directory controlled by the `UPLOAD_DIR` environment variable. If not set, it falls back to `public/uploads` in the project.
- All upload and serving code now reads `UPLOAD_DIR`:
  - server/utils/document-upload.ts
  - server/utils/image-upload.ts
  - server/index.ts (maps `GET /uploads/*` to `UPLOAD_DIR`)

Recommended setups

1) Persistent Disk (simple, no code changes)

- Render: add a Disk to your Web Service, choose a mount path (e.g. `/data`) and set `UPLOAD_DIR=/data/uploads`.
- Railway: add a Volume to the service and set `UPLOAD_DIR` to the mounted path (commonly `/mnt/data/uploads`).
- Fly.io: attach a Volume, mount at e.g. `/data` and set `UPLOAD_DIR=/data/uploads`.

2) Object Storage (best for scale/CDN)

- Use AWS S3, Cloudflare R2, Backblaze B2, or Supabase Storage. This requires wiring an S3 client and either:
  - streaming files from the bucket on `/:slug`, or
  - returning a signed URL and redirecting the client.
- If you want, we can add an `STORAGE_DRIVER=s3` mode in code and keep `local` for development.

How to enable persistence (example with Render)

1. Add a Disk to the service, mount it at `/data`.
2. Set environment variable `UPLOAD_DIR=/data/uploads`.
3. Deploy. New uploads will persist across deploys/restarts.

Notes

- Existing files stored in the old default folder won’t be copied automatically to the new persistent location; re-upload from Admin → Documents or migrate manually.
- Database rows for Documents are unchanged; they store metadata and a unique stored filename. The server uses `UPLOAD_DIR` to find the actual file on disk.

