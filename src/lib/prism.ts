import Prism from "prismjs";

// Ensure globalThis.Prism exists so Prism components can attach themselves safely
if (typeof globalThis !== "undefined") {
  (globalThis as any).Prism = Prism;
}

// Load necessary language components in proper dependency order
try {
  require("prismjs/components/prism-markup");
  require("prismjs/components/prism-css");
  require("prismjs/components/prism-python");
  require("prismjs/components/prism-markup-templating");
  require("prismjs/components/prism-php");
  require("prismjs/components/prism-sql");
} catch (e) {
  // Graceful fallback if any component fails
}

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
  } catch (err) {
    // Fallback to escaped HTML
  }

  return escapeHtml(code);
}

export default Prism;
