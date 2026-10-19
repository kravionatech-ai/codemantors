/**
 * Safe HTML Sanitizer for CodeMentors LMS
 * Runs consistently on both server-side (Node.js API routes) and client-side (React components)
 * without external C++ or jsdom dependencies.
 */

// Permitted HTML tags
const ALLOWED_TAGS = new Set([
  'p', 'div', 'span', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'del', 'strike', 'mark', 'small',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'figure', 'figcaption',
]);

// Permitted attributes by tag (or global)
const GLOBAL_ALLOWED_ATTRS = new Set(['class', 'id', 'title', 'aria-label', 'style']);
const TAG_SPECIFIC_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  th: new Set(['colspan', 'rowspan', 'scope', 'align']),
  td: new Set(['colspan', 'rowspan', 'align']),
  code: new Set(['data-language', 'data-highlighted']),
  pre: new Set(['data-language']),
};

// Safe protocols for URLs
const SAFE_URL_PATTERN = /^(https?:|\/|mailto:|#|data:image\/(?:png|jpeg|jpg|gif|webp|svg\+xml);base64,)/i;

// Safe CSS styles allowlist
const SAFE_STYLE_PATTERN = /^(?:text-align:\s*(?:left|center|right|justify)|color:\s*#[0-9a-fA-F]{3,8}|font-weight:\s*(?:bold|normal|[1-9]00)|text-decoration:\s*(?:none|underline|line-through)|background-color:\s*#[0-9a-fA-F]{3,8}|padding:\s*[\d.a-z%]+|margin:\s*[\d.a-z%]+|border(?:-[a-z]+)?:\s*[^;]+)(?:;\s*(?:text-align:\s*(?:left|center|right|justify)|color:\s*#[0-9a-fA-F]{3,8}|font-weight:\s*(?:bold|normal|[1-9]00)|text-decoration:\s*(?:none|underline|line-through)|background-color:\s*#[0-9a-fA-F]{3,8}|padding:\s*[\d.a-z%]+|margin:\s*[\d.a-z%]+|border(?:-[a-z]+)?:\s*[^;]+))*;?$/i;

/**
 * Strips script tags, invalid tags, dangerous protocols, and on* handlers.
 */
export function sanitizeHtml(dirtyHtml: string | null | undefined): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  // 1. Remove dangerous blocks completely (including content within script/style/iframe/object)
  let clean = dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, ''); // strip comments

  // 2. Parse and filter tags & attributes
  clean = clean.replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (match, rawTagName, rawAttrs) => {
    const tagName = rawTagName.toLowerCase();

    // If tag is not allowed, strip it completely
    if (!ALLOWED_TAGS.has(tagName)) {
      return '';
    }

    // If it's a closing tag, return clean closing tag
    if (match.startsWith('</')) {
      return `</${tagName}>`;
    }

    const isSelfClosing = match.endsWith('/>') || ['br', 'hr', 'img'].includes(tagName);

    // Filter attributes
    const cleanAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9-_:]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/g;
    let attrMatch: RegExpExecArray | null;

    let hasTarget = false;
    let hasRel = false;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      let attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Immediately reject inline event handlers (onclick, onerror, onload, etc.)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check if attribute is allowed for this tag
      const isAllowedAttr =
        GLOBAL_ALLOWED_ATTRS.has(attrName) ||
        (TAG_SPECIFIC_ATTRS[tagName] && TAG_SPECIFIC_ATTRS[tagName].has(attrName));

      if (!isAllowedAttr) {
        continue;
      }

      // Check URL safety for href and src
      if (attrName === 'href' || attrName === 'src') {
        const trimmed = attrValue.trim();
        if (!SAFE_URL_PATTERN.test(trimmed)) {
          continue; // Discard dangerous protocols (javascript:, vbscript:, etc.)
        }
        attrValue = trimmed;
      }

      // Check style safety
      if (attrName === 'style') {
        const trimmedStyle = attrValue.trim();
        if (!SAFE_STYLE_PATTERN.test(trimmedStyle)) {
          continue; // Discard unsafe custom styles
        }
      }

      if (attrName === 'target') {
        hasTarget = true;
        attrValue = '_blank'; // enforce safe target
      }

      if (attrName === 'rel') {
        hasRel = true;
        attrValue = 'noopener noreferrer';
      }

      // Escape quotes in attribute value
      const escapedVal = attrValue.replace(/"/g, '&quot;');
      cleanAttrs.push(`${attrName}="${escapedVal}"`);
    }

    // For <a> links, enforce rel="noopener noreferrer" if target="_blank"
    if (tagName === 'a') {
      if (hasTarget && !hasRel) {
        cleanAttrs.push('rel="noopener noreferrer"');
      }
    }

    const attrsString = cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : '';
    return isSelfClosing ? `<${tagName}${attrsString} />` : `<${tagName}${attrsString}>`;
  });

  return clean;
}

/**
 * Fast check for whether content is predominantly HTML or Markdown.
 */
export function isHtmlContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  // Check for common HTML wrapper tags
  return /^<(!DOCTYPE|html|p|div|h[1-6]|ul|ol|table|blockquote|pre|figure|section|article)\b/i.test(trimmed) ||
    /<\/(p|div|h[1-6]|ul|ol|table|blockquote|pre)>$/i.test(trimmed);
}
