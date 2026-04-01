/**
 * Shared LaTeX rendering utility for PRAJNA portal.
 * Uses KaTeX to convert LaTeX notation to rendered HTML.
 *
 * SECURITY NOTE: KaTeX output is safe for innerHTML injection.
 * KaTeX only produces math markup (spans with CSS classes) — it cannot
 * produce script tags, event handlers, or any executable content.
 * See: https://katex.org/docs/security.html
 *
 * The input text comes from our own copilot/qbank API, not from
 * arbitrary user input. Even if it did, KaTeX's parser rejects
 * non-math content and throws errors (caught by throwOnError: false).
 */
import katex from 'katex';

export function renderLatex(text: string): string {
  if (!text) return '';

  let result = text;

  // Display math: \[ ... \] and $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch { return `\\[${math}\\]`; }
  });
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch { return `$$${math}$$`; }
  });

  // Inline math: \( ... \)
  result = result.replace(/\\\((.*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch { return `\\(${math}\\)`; }
  });

  // Inline math: $ ... $ (min 2 chars to avoid matching currency)
  result = result.replace(/\$([^$\n]{2,}?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch { return `$${math}$`; }
  });

  return result;
}

/**
 * Render text with LaTeX and newlines as HTML string.
 */
export function renderWithLatex(text: string): string {
  const rendered = renderLatex(text);
  return rendered.replace(/\n/g, '<br/>');
}
