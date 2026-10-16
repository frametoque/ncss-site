"use client";

import React from "react";
import katex from "katex";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text containing LaTeX math expressions enclosed in $...$ (inline) or $$...$$ (display block).
 * Falls back gracefully to raw text if an expression is invalid or incomplete.
 */
export function MathText({ text, className }: MathTextProps) {
  if (!text) return null;

  // Fast path: if no dollar sign exists, render plain text
  if (!text.includes("$")) {
    return <span className={className}>{text}</span>;
  }

  // Matches $$...$$ (display block math) or $...$ (inline math)
  const regex = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^\$\n]+?\$)/g;
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Block math: $$...$$
        if (part.startsWith("$$") && part.endsWith("$$") && part.length >= 4) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto text-center"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        }
        
        // Inline math: $...$
        if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="inline-math inline-block align-baseline mx-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return <span key={index}>{part}</span>;
          }
        }

        // Plain text parts
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
