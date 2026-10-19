'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  Eraser,
  Eye,
  Edit3,
  FileText,
  Maximize2,
  Minimize2,
  Upload,
} from 'lucide-react';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { isMarkdown, markdownToHtml } from '@/lib/markdown-parser';
import FormattedContentRenderer from './FormattedContentRenderer';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  id?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Write your content here...',
  minHeight = '240px',
  disabled = false,
  required = false,
  error,
  helperText,
  id,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'html'>('edit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMarkdownText, setImportMarkdownText] = useState('');

  // Active formatting state for highlighting toolbar buttons
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    ul: false,
    ol: false,
    blockquote: false,
    h1: false,
    h2: false,
    h3: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  // Calculate stats
  const plainText = typeof window !== 'undefined'
    ? (editorRef.current?.innerText || value.replace(/<[^>]*>/g, ''))
    : value.replace(/<[^>]*>/g, '');
  const charCount = plainText.length;
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;

  // Initialize or synchronize value
  useEffect(() => {
    if (!editorRef.current) return;

    // Check if the current innerHTML differs from the incoming value
    const currentHtml = editorRef.current.innerHTML;

    // If incoming value is Markdown and editor is empty or raw, convert to HTML
    let targetHtml = value || '';
    if (isMarkdown(targetHtml)) {
      targetHtml = markdownToHtml(targetHtml);
    }

    if (currentHtml !== targetHtml && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = targetHtml;
    }
  }, [value]);

  const updateActiveFormats = useCallback(() => {
    if (typeof document === 'undefined') return;

    try {
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        blockquote: document.queryCommandValue('formatBlock') === 'blockquote',
        h1: document.queryCommandValue('formatBlock') === 'h1',
        h2: document.queryCommandValue('formatBlock') === 'h2',
        h3: document.queryCommandValue('formatBlock') === 'h3',
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      });
    } catch {
      // Ignore if document selection is unavailable
    }
  }, []);

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    updateActiveFormats();
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (disabled || activeTab !== 'edit') return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  };

  const formatBlock = (tag: string) => {
    if (disabled || activeTab !== 'edit') return;
    editorRef.current?.focus();
    const current = document.queryCommandValue('formatBlock');
    if (current.toLowerCase() === tag.toLowerCase()) {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${tag}>`);
    }
    handleInput();
  };

  // Insert raw HTML at cursor position
  const insertHtmlAtCursor = (html: string) => {
    if (disabled || activeTab !== 'edit') return;
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // Append to the end
      if (editorRef.current) {
        editorRef.current.innerHTML += html;
        onChange(editorRef.current.innerHTML);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const el = document.createElement('div');
    el.innerHTML = html;
    const frag = document.createDocumentFragment();
    let node: ChildNode | null;
    let lastNode: ChildNode | null = null;
    while ((node = el.firstChild)) {
      lastNode = frag.appendChild(node);
    }
    range.insertNode(frag);

    if (lastNode) {
      range.setStartAfter(lastNode);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleInput();
  };

  // Insert link
  const handleInsertLink = () => {
    if (!linkUrl) return;
    let safeUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(safeUrl) && !safeUrl.startsWith('/') && !safeUrl.startsWith('mailto:')) {
      safeUrl = `https://${safeUrl}`;
    }

    const title = linkText || safeUrl;
    const linkHtml = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:text-indigo-300 underline">${title}</a>`;
    insertHtmlAtCursor(linkHtml);

    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  // Insert image
  const handleInsertImage = () => {
    if (!imageUrl) return;
    const alt = imageAlt || 'Image';
    const imgHtml = `<img src="${imageUrl.trim()}" alt="${alt}" class="rounded-lg max-w-full h-auto my-4 border border-slate-700 shadow-md" loading="lazy" />`;
    insertHtmlAtCursor(imgHtml);

    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  // Insert table
  const handleInsertTable = () => {
    const rows = Math.max(1, Math.min(10, tableRows));
    const cols = Math.max(1, Math.min(8, tableCols));

    let html = '<div class="table-responsive my-4 overflow-x-auto"><table class="w-full text-left border-collapse border border-slate-700">';
    html += '<thead><tr class="bg-slate-800 text-slate-200 border-b border-slate-700">';
    for (let c = 1; c <= cols; c++) {
      html += `<th class="p-2.5 font-semibold text-sm border border-slate-700">Header ${c}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let r = 1; r <= rows; r++) {
      html += '<tr class="border-b border-slate-800">';
      for (let c = 1; c <= cols; c++) {
        html += `<td class="p-2.5 text-sm text-slate-300 border border-slate-800">Cell ${r}-${c}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div><p><br/></p>';

    insertHtmlAtCursor(html);
    setShowTableModal(false);
  };

  // Insert Code Block
  const handleInsertCodeBlock = () => {
    const codeBlockHtml = `<pre class="bg-slate-950 border border-slate-800 rounded-xl p-4 my-4 font-mono text-sm text-indigo-200 overflow-x-auto"><code>// Write or paste code here...</code></pre><p><br/></p>`;
    insertHtmlAtCursor(codeBlockHtml);
  };

  // Import Markdown
  const handleImportMarkdown = () => {
    if (!importMarkdownText.trim()) return;
    const convertedHtml = markdownToHtml(importMarkdownText);
    insertHtmlAtCursor(convertedHtml);
    setImportMarkdownText('');
    setShowImportModal(false);
  };

  // Handle .md file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const converted = markdownToHtml(content);
        if (editorRef.current) {
          editorRef.current.innerHTML = converted;
          onChange(converted);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner backdrop-blur-sm transition-all focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-900 shadow-2xl overflow-hidden' : ''
      } ${error ? 'border-rose-500/80' : ''}`}
    >
      {/* Hidden file input for .md import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header bar / Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-900/90 px-3 py-2 gap-2 rounded-t-xl">
        <div className="flex items-center gap-2">
          {label && (
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 mr-2">
              {label} {required && <span className="text-rose-400">*</span>}
            </span>
          )}

          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'edit'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editor
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                activeTab === 'html'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Source HTML
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Markdown Import Button */}
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-800/50 rounded-lg transition-colors"
            title="Import or paste Markdown (.md)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Upload .md file"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Fullscreen toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Visible in edit mode) */}
      {activeTab === 'edit' && (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-800/80 bg-slate-900/40 p-2">
          {/* Headings */}
          <div className="flex items-center border-r border-slate-800 pr-1.5 mr-1 gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => formatBlock('h1')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.h1
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => formatBlock('h2')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.h2
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => formatBlock('h3')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.h3
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Inline formatting */}
          <div className="flex items-center border-r border-slate-800 pr-1.5 mr-1 gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('bold')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.bold
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('italic')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.italic
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('underline')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.underline
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('strikeThrough')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.strike
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center border-r border-slate-800 pr-1.5 mr-1 gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('insertUnorderedList')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.ul
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Bulleted List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('insertOrderedList')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.ol
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => formatBlock('blockquote')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.blockquote
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleInsertCodeBlock}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center border-r border-slate-800 pr-1.5 mr-1 gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('justifyLeft')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.justifyLeft
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('justifyCenter')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.justifyCenter
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('justifyRight')}
              className={`p-1.5 rounded transition-colors ${
                activeFormats.justifyRight
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          {/* Rich Inserts (Links, Images, Tables, Dividers) */}
          <div className="flex items-center border-r border-slate-800 pr-1.5 mr-1 gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowLinkModal(true)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Insert Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('unlink')}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowImageModal(true)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowTableModal(true)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Insert Table"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('insertHorizontalRule')}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Horizontal Divider"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>

          {/* Undo/Redo & Clear */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('undo')}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('redo')}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => executeCommand('removeFormat')}
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Clear Formatting"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Content Area */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Visual ContentEditable Mode */}
        {activeTab === 'edit' && (
          <div
            id={id}
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            data-placeholder={placeholder}
            style={{ minHeight: isFullscreen ? 'calc(100vh - 160px)' : minHeight }}
            className={`prose prose-invert max-w-none p-4 text-slate-200 outline-none focus:outline-none leading-relaxed
              empty:before:content-[attr(data-placeholder)] empty:before:text-slate-500 empty:before:pointer-events-none
              [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mt-4 [&>h1]:mb-2
              [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-3 [&>h2]:mb-2
              [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-white [&>h3]:mt-2 [&>h3]:mb-1
              [&>p]:mb-3 [&>p]:leading-relaxed
              [&>ul]:list-disc [&>ul]:list-inside [&>ul]:mb-3 [&>ul]:space-y-1
              [&>ol]:list-decimal [&>ol]:list-inside [&>ol]:mb-3 [&>ol]:space-y-1
              [&>blockquote]:border-l-4 [&>blockquote]:border-indigo-500 [&>blockquote]:pl-4 [&>blockquote]:py-1 [&>blockquote]:my-3 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:bg-slate-800/40 [&>blockquote]:rounded-r
              [&>pre]:bg-slate-950 [&>pre]:border [&>pre]:border-slate-800 [&>pre]:rounded-xl [&>pre]:p-4 [&>pre]:my-3 [&>pre]:font-mono [&>pre]:text-sm [&>pre]:text-indigo-200
              [&>code]:bg-slate-800 [&>code]:text-indigo-300 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>code]:font-mono
              [&>table]:w-full [&>table]:border-collapse [&>table]:my-3 [&>table]:border [&>table]:border-slate-700
              [&>table_th]:bg-slate-800 [&>table_th]:p-2.5 [&>table_th]:border [&>table_th]:border-slate-700 [&>table_th]:text-slate-200
              [&>table_td]:p-2.5 [&>table_td]:border [&>table_td]:border-slate-800 [&>table_td]:text-slate-300
              [&>a]:text-indigo-400 [&>a]:underline
              [&>img]:rounded-lg [&>img]:max-w-full [&>img]:my-3
              [&>hr]:border-slate-800 [&>hr]:my-4`}
          />
        )}

        {/* Live Preview Mode */}
        {activeTab === 'preview' && (
          <div
            style={{ minHeight: isFullscreen ? 'calc(100vh - 160px)' : minHeight }}
            className="p-4 bg-slate-950/40 rounded-b-xl"
          >
            <FormattedContentRenderer content={value} fallbackText="Nothing to preview yet..." />
          </div>
        )}

        {/* Raw HTML Source Code Mode */}
        {activeTab === 'html' && (
          <textarea
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
            }}
            placeholder="Edit raw HTML code..."
            style={{ minHeight: isFullscreen ? 'calc(100vh - 160px)' : minHeight }}
            className="w-full bg-slate-950 p-4 font-mono text-sm text-indigo-300 outline-none resize-y border-0 focus:ring-0 leading-relaxed"
          />
        )}
      </div>

      {/* Footer bar with character / word counts */}
      <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-400 rounded-b-xl">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          {isMarkdown(value) && (
            <span className="text-amber-400/90 bg-amber-950/30 px-1.5 py-0.5 rounded border border-amber-800/40">
              Legacy Markdown detected
            </span>
          )}
        </div>
        <div>
          {error ? (
            <span className="text-rose-400 font-medium">{error}</span>
          ) : (
            <span>{helperText || 'Rich text formatting enabled'}</span>
          )}
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-400" />
              Insert Hyperlink
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Link URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Display Text (optional)</label>
                <input
                  type="text"
                  placeholder="Learn more..."
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                disabled={!linkUrl}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-indigo-400" />
              Insert Image
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Alt Text</label>
                <input
                  type="text"
                  placeholder="Description of the image"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertImage}
                disabled={!imageUrl}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-indigo-400" />
              Insert Table
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rows (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Columns (1-8)</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInsertTable}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markdown Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Import or Paste Markdown
            </h3>
            <p className="text-xs text-slate-400">
              Paste Markdown document text below. It will automatically be converted to rich formatted content and inserted at your cursor.
            </p>
            <textarea
              rows={8}
              value={importMarkdownText}
              onChange={(e) => setImportMarkdownText(e.target.value)}
              placeholder="## Course Objectives&#10;- Understand React fundamentals&#10;- Build rich applications"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportMarkdown}
                disabled={!importMarkdownText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl disabled:opacity-50"
              >
                Convert & Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
