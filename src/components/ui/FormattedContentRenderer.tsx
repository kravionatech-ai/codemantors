'use client';

import React, { useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { isMarkdown, markdownToHtml } from '@/lib/markdown-parser';

interface FormattedContentRendererProps {
  content?: string | null;
  className?: string;
  fallbackText?: string;
}

/**
 * Universal content renderer that supports both rich HTML and legacy Markdown strings.
 * Automatically sanitizes content against XSS attacks.
 */
export default function FormattedContentRenderer({
  content,
  className = '',
  fallbackText = 'No content available.',
}: FormattedContentRendererProps) {
  const safeHtml = useMemo(() => {
    if (!content || typeof content !== 'string' || !content.trim()) {
      return '';
    }

    const trimmed = content.trim();

    // If it's Markdown, parse to HTML first
    if (isMarkdown(trimmed)) {
      return markdownToHtml(trimmed);
    }

    // Otherwise sanitize the raw HTML directly
    return sanitizeHtml(trimmed);
  }, [content]);

  if (!safeHtml) {
    return (
      <div className={`text-slate-400 italic text-sm py-2 ${className}`}>
        {fallbackText}
      </div>
    );
  }

  return (
    <div
      className={`prose prose-invert max-w-none text-slate-200 leading-relaxed
        [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mt-6 [&>h1]:mb-3
        [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-5 [&>h2]:mb-3 [&>h2]:pb-2 [&>h2]:border-b [&>h2]:border-slate-800
        [&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-4 [&>h3]:mb-2
        [&>h4]:text-lg [&>h4]:font-semibold [&>h4]:text-slate-100 [&>h4]:mt-3 [&>h4]:mb-2
        [&>p]:mb-4 [&>p]:text-slate-300 [&>p]:leading-relaxed
        [&>ul]:list-disc [&>ul]:list-inside [&>ul]:mb-4 [&>ul]:space-y-1 [&>ul]:text-slate-300
        [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:mb-4 [&>ol]:space-y-1 [&>ol]:text-slate-300
        [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:pl-4 [&>blockquote]:py-2 [&>blockquote]:my-4 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:bg-slate-900/40 [&>blockquote]:rounded-r
        [&>pre]:bg-slate-950 [&>pre]:border [&>pre]:border-slate-800 [&>pre]:rounded-xl [&>pre]:p-4 [&>pre]:overflow-x-auto [&>pre]:my-4 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:text-indigo-200
        [&>code]:bg-slate-800/80 [&>code]:text-indigo-300 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
        [&>table]:w-full [&>table]:border-collapse [&>table]:my-4 [&>table]:border [&>table]:border-slate-700/60
        [&>table_th]:bg-slate-800/90 [&>table_th]:p-3 [&>table_th]:border [&>table_th]:border-slate-700 [&>table_th]:font-semibold [&>table_th]:text-slate-200
        [&>table_td]:p-3 [&>table_td]:border [&>table_td]:border-slate-800 [&>table_td]:text-slate-300
        [&>a]:text-indigo-400 [&>a]:underline [&>a]:underline-offset-2 hover:[&>a]:text-indigo-300
        [&>img]:rounded-xl [&>img]:border [&>img]:border-slate-800 [&>img]:shadow-lg [&>img]:my-4 [&>img]:max-w-full
        [&>hr]:border-slate-800 [&>hr]:my-6
        ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
