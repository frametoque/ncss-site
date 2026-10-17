import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes an untrusted HTML string to prevent Stored XSS.
 * Removes dangerous tags, inline scripts, and javascript: pseudo-protocols.
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "rel"],
  });
}
