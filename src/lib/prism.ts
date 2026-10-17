import Prism from "prismjs";

// Ensure globalThis.Prism exists so Prism components can attach themselves safely
if (typeof globalThis !== "undefined") {
  (globalThis as typeof globalThis & { Prism: typeof Prism }).Prism = Prism;
}

// Load necessary language components in proper dependency order via ES imports
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-sql";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function highlightCode(code: string, language?: string): string {
  if (!code) return "";
  const l = (language || "").toLowerCase().trim();

  let grammar = Prism.languages.markup;
  let id = "markup";

  if (l === "html" || l === "markup" || l === "xml") {
    grammar = Prism.languages.markup;
    id = "markup";
  } else if (l === "php") {
    grammar = Prism.languages.php || Prism.languages.markup;
    id = "php";
  } else if (l === "python" || l === "py") {
    grammar = Prism.languages.python;
    id = "python";
  } else if (l === "sql") {
    grammar = Prism.languages.sql;
    id = "sql";
  } else if (l === "css") {
    grammar = Prism.languages.css;
    id = "css";
  } else {
    // Plain text / pseudocode
    return escapeHtml(code);
  }

  try {
    if (grammar) {
      return Prism.highlight(code, grammar, id);
    }
  } catch {
    // Fallback to escaped HTML
  }

  return escapeHtml(code);
}

export default Prism;
