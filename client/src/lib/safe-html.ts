import DOMPurify from "dompurify";
import { marked } from "marked";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}

export function renderMarkdownToSafeHtml(markdown: string): string {
  return sanitizeHtml((marked.parse(markdown) as string) || "");
}
