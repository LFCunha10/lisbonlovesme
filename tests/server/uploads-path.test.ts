import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveUploadDir } from "../../server/utils/uploads-path";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_CWD = process.cwd();
const normalizeMacTmpPath = (value: string) => value.replace(/^\/private/, "");

describe("server/utils/uploads-path", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.chdir(ORIGINAL_CWD);
  });

  it("uses explicit UPLOAD_DIR when provided", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "llm-upload-"));
    const explicit = path.join(tempRoot, "custom-uploads");
    process.env.UPLOAD_DIR = explicit;
    delete process.env.RENDER;
    delete process.env.RENDER_EXTERNAL_URL;

    const resolved = resolveUploadDir();
    expect(resolved).toBe(path.resolve(explicit));
    expect(fs.existsSync(resolved)).toBe(true);
  });

  it("defaults to render path when running on render", () => {
    delete process.env.UPLOAD_DIR;
    process.env.RENDER = "true";
    expect(resolveUploadDir()).toBe("/data/uploads");
  });

  it("falls back to <cwd>/public/uploads in local development", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "llm-cwd-"));
    process.chdir(tempRoot);
    delete process.env.UPLOAD_DIR;
    delete process.env.RENDER;
    delete process.env.RENDER_EXTERNAL_URL;

    const resolved = resolveUploadDir();
    expect(normalizeMacTmpPath(resolved)).toBe(
      normalizeMacTmpPath(path.resolve(tempRoot, "public", "uploads")),
    );
    expect(fs.existsSync(resolved)).toBe(true);
  });
});
