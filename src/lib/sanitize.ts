/**
 * Zero-dependency HTML Sanitizer for Server & Client Components.
 * Sanitizes untrusted rich-text HTML (e.g. from Quill editors) to prevent Stored XSS.
 * Removes dangerous tags (<script>, <iframe>, <object>, <embed>, <form>, etc.),
 * strips all inline event handlers (onload, onerror, onclick, etc.),
 * and restricts URL schemes on href/src to safe protocols (http, https, mailto, tel, relative).
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "span", "div",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup", "small",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "img",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
]);

const GLOBAL_ALLOWED_ATTRS = new Set(["class", "style", "title", "dir", "align"]);

const TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel", "download"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  th: new Set(["colspan", "rowspan", "scope"]),
  td: new Set(["colspan", "rowspan"]),
};

const SAFE_URL_REGEX = /^(?:(?:https?|mailto|tel):|\/|#|data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,)/i;

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty || typeof dirty !== "string") return "";

  // 1. Completely strip <script>, <style>, and HTML comments along with inner content
  let clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // 2. Filter tags and attributes
  clean = clean.replace(/<\/?([a-zA-Z0-9\-]+)([^>]*)>/g, (match, tagName, rawAttrs) => {
    const tag = tagName.toLowerCase();
    const isClosing = match.startsWith("</");

    if (!ALLOWED_TAGS.has(tag)) {
      return ""; // Strip disallowed tag
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    const attrRegex = /([a-zA-Z0-9\-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch: RegExpExecArray | null;
    const cleanAttrs: string[] = [];
    let hasTargetBlank = false;
    let hasRel = false;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      // Reject all inline event handlers (onclick, onerror, onload, onmouseover, etc.)
      if (attrName.startsWith("on")) continue;

      // Ensure attribute is permitted for this tag
      const isAllowed =
        GLOBAL_ALLOWED_ATTRS.has(attrName) ||
        (TAG_ALLOWED_ATTRS[tag] && TAG_ALLOWED_ATTRS[tag].has(attrName));

      if (!isAllowed) continue;

      // Sanitize URL attributes against javascript:, vbscript:, etc.
      if (attrName === "href" || attrName === "src") {
        const decoded = attrValue
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
          .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/\s+/g, "");

        if (!SAFE_URL_REGEX.test(decoded)) {
          continue; // Drop unsafe URL
        }
      }

      // Sanitize CSS styles (prevent javascript:, expression(), -moz-binding)
      if (attrName === "style") {
        if (/expression|javascript:|behavior:|url\(|\-moz\-binding/i.test(attrValue)) {
          continue;
        }
      }

      if (tag === "a" && attrName === "target" && attrValue === "_blank") {
        hasTargetBlank = true;
      }
      if (tag === "a" && attrName === "rel") {
        hasRel = true;
      }

      cleanAttrs.push(`${attrName}="${attrValue.replace(/"/g, "&quot;")}"`);
    }

    // Always enforce rel="noopener noreferrer" for new window links
    if (tag === "a" && hasTargetBlank && !hasRel) {
      cleanAttrs.push('rel="noopener noreferrer"');
    }

    const attrsString = cleanAttrs.length > 0 ? " " + cleanAttrs.join(" ") : "";
    const isSelfClosing = match.endsWith("/>");
    return `<${tag}${attrsString}${isSelfClosing ? " />" : ">"}`;
  });

  return clean;
}
