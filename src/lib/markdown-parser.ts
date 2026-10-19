/**
 * Markdown to HTML Parser for CodeMentors LMS
 * Backward compatibility parser for rendering legacy course descriptions,
 * curriculum notes, text lessons, and CMS pages written in Markdown.
 */

import { sanitizeHtml } from './sanitize-html';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Checks if content is Markdown rather than formatted HTML.
 */
export function isMarkdown(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();

  // If it starts with common HTML container tags, treat as HTML
  if (/^<([a-z]+)[^>]*>/i.test(trimmed)) {
    // If it has HTML tags, check if it's primarily HTML
    const htmlTagMatches = trimmed.match(/<\/?[a-z0-9]+[^>]*>/gi);
    if (htmlTagMatches && htmlTagMatches.length >= 2) {
      return false;
    }
  }

  // Detect common markdown patterns
  const mdPatterns = [
    /^#{1,6}\s+/m,             // Headings (# Heading)
    /```[\s\S]*?```/,          // Code blocks
    /`[^`\n]+`/,               // Inline code
    /\*\*[^*]+\*\*/,           // Bold
    /__[^_]+__/,               // Bold
    /~~[^~]+~~/,               // Strikethrough
    /^\s*[-*+]\s+/m,           // Bullet list
    /^\s*\d+\.\s+/m,           // Ordered list
    /^\s*>\s+/m,               // Blockquote
    /\[.+?\]\(.+?\)/,          // Links [text](url)
    /!\[.*?\]\(.+?\)/,         // Images ![alt](url)
    /\|.+\|[\r\n]+\|[-:| ]+\|/ // Tables
  ];

  return mdPatterns.some(pat => pat.test(trimmed));
}

/**
 * Converts Markdown text into clean, sanitized HTML.
 */
export function markdownToHtml(md: string | null | undefined): string {
  if (!md || typeof md !== 'string') return '';

  let text = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Placeholder store for code blocks so inline transforms don't mutate code contents
  const codeBlocks: string[] = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)[ \t]*\r?\n([\s\S]*?)```/g, (_match, lang, code) => {
    const cleanLang = (lang || '').trim();
    const langAttr = cleanLang ? ` data-language="${cleanLang}"` : '';
    const langClass = cleanLang ? ` class="language-${cleanLang}"` : '';
    const safeCode = escapeHtml(code.trimEnd());
    const placeholder = `XXCODEBLOCK${codeBlocks.length}XX`;
    codeBlocks.push(
      `<pre${langAttr}${langClass}><code${langClass}>${safeCode}</code></pre>`
    );
    return `\n\n${placeholder}\n\n`;
  });

  // Placeholder store for inline code
  const inlineCodes: string[] = [];
  text = text.replace(/`([^`\n]+)`/g, (_match, code) => {
    const placeholder = `XXINLINECODE${inlineCodes.length}XX`;
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return placeholder;
  });

  // Tables
  text = text.replace(
    /(?:^|\n)(\|.+?\|[\r\n]+\|[-:| ]+?\|[\r\n]+(?:\|.+?\|(?:\r?\n|$))+)/g,
    (_match, tableBlock) => {
      const lines = tableBlock.trim().split('\n').filter((l: string) => l.trim().length > 0);
      if (lines.length < 2) return tableBlock;

      const parseRow = (line: string) => {
        return line
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c: string) => c.trim());
      };

      const headerCells = parseRow(lines[0]);
      // line 1 is separator |---|---|
      const bodyLines = lines.slice(2);

      let html = '<div class="table-responsive my-4 overflow-x-auto"><table class="w-full text-left border-collapse border border-slate-700/50">';
      html += '<thead><tr class="bg-slate-800/80 text-slate-200 border-b border-slate-700">';
      headerCells.forEach((c: string) => {
        html += `<th class="p-3 font-semibold text-sm border border-slate-700/60">${c}</th>`;
      });
      html += '</tr></thead><tbody>';

      bodyLines.forEach((bLine: string) => {
        const cells = parseRow(bLine);
        html += '<tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">';
        cells.forEach((c: string) => {
          html += `<td class="p-3 text-sm text-slate-300 border border-slate-800/60">${c}</td>`;
        });
        html += '</tr>';
      });

      html += '</tbody></table></div>';
      return '\n\n' + html + '\n\n';
    }
  );

  // Horizontal rules
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="my-6 border-slate-700" />');

  // Headings (# to ######)
  text = text.replace(/^######\s+(.+)$/gm, '<h6 class="text-base font-semibold mt-4 mb-2 text-slate-200">$1</h6>');
  text = text.replace(/^#####\s+(.+)$/gm, '<h5 class="text-lg font-semibold mt-4 mb-2 text-slate-200">$1</h5>');
  text = text.replace(/^####\s+(.+)$/gm, '<h4 class="text-xl font-bold mt-5 mb-2 text-slate-100">$1</h4>');
  text = text.replace(/^###\s+(.+)$/gm, '<h3 class="text-2xl font-bold mt-6 mb-3 text-white">$1</h3>');
  text = text.replace(/^##\s+(.+)$/gm, '<h2 class="text-3xl font-bold mt-7 mb-4 text-white pb-2 border-b border-slate-800">$1</h2>');
  text = text.replace(/^#\s+(.+)$/gm, '<h1 class="text-4xl font-extrabold mt-8 mb-4 text-white">$1</h1>');

  // Blockquotes
  text = text.replace(/(?:^|\n)>\s*(.+)(?:\n>\s*(.+))*/g, (_match, ...lines) => {
    const validLines = lines.filter((l: unknown) => typeof l === 'string' && l.trim().length > 0);
    const content = validLines.join('<br />');
    return `\n\n<blockquote class="border-l-4 border-indigo-500 pl-4 py-2 my-4 italic text-slate-300 bg-slate-900/40 rounded-r">${content}</blockquote>\n\n`;
  });

  // Images ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full h-auto my-4 border border-slate-800 shadow-md" loading="lazy" />');

  // Links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">$1</a>');

  // Bold and Italic
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/___([^_]+)___/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
  text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Unordered Lists
  text = text.replace(/(?:^|\n)(?:[-*+]\s+.+(?:\n|$))+/g, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(item => item.replace(/^[-*+]\s+/, '').trim())
      .filter(Boolean)
      .map(item => `<li class="my-1">${item}</li>`)
      .join('');
    return `\n<ul class="list-disc list-inside my-3 space-y-1 text-slate-300">${items}</ul>\n`;
  });

  // Ordered Lists
  text = text.replace(/(?:^|\n)(?:\d+\.\s+.+(?:\n|$))+/g, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(item => item.replace(/^\d+\.\s+/, '').trim())
      .filter(Boolean)
      .map(item => `<li class="my-1">${item}</li>`)
      .join('');
    return `\n<ol class="list-decimal list-inside my-3 space-y-1 text-slate-300">${items}</ol>\n`;
  });

  // Paragraphs
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => {
      // If it already begins with block HTML tag or codeblock token, keep as is
      if (/^(<(h[1-6]|ul|ol|table|blockquote|pre|hr|div|p)\b|XXCODEBLOCK\d+XX)/i.test(p)) {
        return p;
      }
      // Convert remaining single linebreaks to <br/>
      const formatted = p.replace(/\n/g, '<br />');
      return `<p class="mb-4 text-slate-300 leading-relaxed">${formatted}</p>`;
    });

  let result = paragraphs.join('\n\n');

  // Restore inline codes
  inlineCodes.forEach((codeHtml, idx) => {
    result = result.replace(`XXINLINECODE${idx}XX`, codeHtml);
  });

  // Restore code blocks
  codeBlocks.forEach((blockHtml, idx) => {
    result = result.replace(`XXCODEBLOCK${idx}XX`, blockHtml);
  });

  // Final sanitization pass
  return sanitizeHtml(result);
}
