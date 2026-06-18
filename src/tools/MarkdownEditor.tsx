import React, { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import { 
  FileText, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  Download, 
  Columns, 
  Rows, 
  Eye, 
  Edit3, 
  Heading1, 
  Bold, 
  Italic, 
  List, 
  Table, 
  Code, 
  Link, 
  BookOpen, 
  RefreshCw,
  FileCode,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';
import { marked } from 'marked';

export const toolInfo: ToolInfo = {
  id: 'markdown_editor',
  icon: 'FileText',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_markdown_editor_title',
  descKey: 'tool_markdown_editor_desc',
};

// Seed sample documentation demonstrating rich structures
const INITIAL_MARKDOWN = `# 🚀 Ultimate Developer Cheat Sheet

This is a **responsive live** Markdown renderer. You can edit this document on the left (or top on mobile devices) and instantly view the beautifully rendered typography on the right.

## Key Features

1. **Live Synchronous Compiling**: Built on top of high-performance parsers.
2. **Local Processing**: Code is processed in-browser. Zero tracking.
3. **Template Exchanger**: One-click download of styled stand-alone HTML documents.

### Modern Typography & Accents

We support code blocks with inline tags:

\`\`\`javascript
// Quick JavaScript snippet
const greet = (username) => {
  console.log(\`Hello, \${username}! Built with local storage!\`);
};
greet("Creative Web Artisan");
\`\`\`

> "Good design is thorough down to the last detail." — Dieter Rams

---

### Interactive Component Table

| Syntax | Action | Outcome |
| :--- | :---: | :--- |
| \`**bold**\` | Strong Emphasis | Thickens visual stroke weight |
| \`*italic*\` | Emphasis | Slants letterform angles slightly |
| \`\`\`code\`\`\` | Code Block | Renders elements inside neutral-mono box |

Enjoy crafting documents securely with total offline peace of mind.
`;

export default function MarkdownEditor({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [markdown, setMarkdown] = useState<string>('');
  const [viewMode, setViewMode] = useState<'split-v' | 'split-h' | 'editor' | 'preview'>('split-v');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPending, startTransition] = useTransition();

  // Set initial document sample on load
  useEffect(() => {
    setMarkdown(INITIAL_MARKDOWN);
  }, []);

  // Compute stats on demand
  const stats = useMemo(() => {
    const text = markdown.trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = markdown.length;
    const lines = markdown ? markdown.split('\n').length : 0;
    return { words, chars, lines };
  }, [markdown]);

  // Convert Markdown to clean structured HTML safely
  const parsedHtml = useMemo(() => {
    try {
      // marked.parse returns a string or Promise depending on config.
      // We parse synchronously.
      const htmlResult = marked.parse(markdown || '', {
        gfm: true,
        breaks: true,
      });
      return typeof htmlResult === 'string' ? htmlResult : '';
    } catch (e) {
      return `<p style="color:red;">Error parsing markdown: ${(e as Error).message}</p>`;
    }
  }, [markdown]);

  // Help insert markdown templates precisely at the cursor location
  const insertSyntax = (syntaxType: 'heading' | 'bold' | 'italic' | 'list' | 'table' | 'code' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = textarea.value;
    const selectedText = currentText.substring(start, end);

    let insertion = '';
    let cursorOffset = 0;

    switch (syntaxType) {
      case 'heading':
        insertion = `\n## ${selectedText || 'Heading'}\n`;
        cursorOffset = insertion.length;
        break;
      case 'bold':
        insertion = `**${selectedText || 'bold text'}**`;
        cursorOffset = selectedText ? insertion.length : 2;
        break;
      case 'italic':
        insertion = `*${selectedText || 'italicized text'}*`;
        cursorOffset = selectedText ? insertion.length : 1;
        break;
      case 'list':
        insertion = `\n- ${selectedText || 'List item'}\n`;
        cursorOffset = insertion.length;
        break;
      case 'table':
        insertion = `\n| Column 1 | Column 2 |\n| :--- | :--- |\n| Row A | Content |\n| Row B | Content |\n`;
        cursorOffset = insertion.length;
        break;
      case 'code':
        insertion = `\n\`\`\`javascript\n${selectedText || '// Write your code here'}\n\`\`\`\n`;
        cursorOffset = insertion.length;
        break;
      case 'link':
        insertion = `[${selectedText || 'Link Title'}](https://example.com)`;
        cursorOffset = selectedText ? insertion.length : 1;
        break;
    }

    const nextText = currentText.substring(0, start) + insertion + currentText.substring(end);
    setMarkdown(nextText);

    // Refocus and restore cursor selection coordinates gracefully
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(parsedHtml);
      setCopied(true);
      setCopiedNotification(t('markdown_editor.copied_msg'));
      setTimeout(() => {
        setCopied(false);
        setCopiedNotification(null);
      }, 2000);
    } catch {
      // fallback
    }
  };

  // Export as perfectly compiled standalone single HTML file with stunning typography
  const handleExportHtmlFile = () => {
    triggerAd(() => {
      const fullDocument = `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Markdown Document</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.7;
      color: #1e293b;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px;
      background-color: #f8fafc;
    }
    .container {
      background: #ffffff;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
      border: 1px solid #e2e8f0;
    }
    h1 { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 1.5rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }
    h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-top: 2rem; margin-bottom: 1rem; }
    h3 { font-size: 1.25rem; font-weight: 600; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    p { margin-bottom: 1.25rem; }
    a { color: #0d9488; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    ul, ol { margin-bottom: 1.25rem; padding-left: 20px; }
    li { margin-bottom: 0.5rem; }
    code { font-family: 'JetBrains Mono', monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.875em; color: #0f172a; }
    pre { background: #0f172a; color: #f8fafc; padding: 20px; border-radius: 8px; overflow-x: auto; margin-bottom: 1.5rem; }
    pre code { background: transparent; padding: 0; font-size: 0.875rem; color: #f8fafc; }
    blockquote { border-left: 4px solid #0d9488; padding-left: 16px; color: #475569; font-style: italic; margin: 1.5rem 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    hr { border: 0; height: 1px; background: #e2e8f0; margin: 2rem 0; }
    @media (max-width: 640px) {
      body { margin: 16px auto; }
      .container { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${parsedHtml}
  </div>
</body>
</html>`;

      const blob = new Blob([fullDocument], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'purified_document.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleClear = () => {
    setMarkdown('');
  };

  const loadSample = () => {
    triggerAd(() => {
      startTransition(() => {
        setMarkdown(INITIAL_MARKDOWN);
      });
    });
  };

  return (
    <div className="w-full space-y-6" id="markdown-editor-root">
      
      {/* Information Header Block */}
      <div className="flex gap-4 p-5 bg-teal-50 dark:bg-emerald-955/15 border border-teal-100 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <FileCode className="w-6 h-6 text-teal-650 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('markdown_editor.title')}
          </h3>
          <p className="text-xs">
            {t('markdown_editor.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-teal-650 dark:text-teal-400">
            {isRtl 
              ? '⚡ فحص آمن: كامل الشفرة وعملية التصيير تتم مباشرة في متصفحك بشكل محلي بالكامل لضمان قصوى مستويات الخصوصية.'
              : '⚡ Enterprise Privacy: Render documentation schemas natively inside your browser. No cloud relays or telemetry records stored.'
            }
          </p>
        </div>
      </div>

      {/* VIEW CONTROL / ACTION TOOLBAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl shadow-3xs">
        
        {/* Workspace views split buttons group */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setViewMode('split-v')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              viewMode === 'split-v' 
                ? 'bg-teal-650 text-white shadow-3xs dark:bg-teal-605' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-850'
            }`}
            title="Split Vertically"
          >
            <Columns className="w-4 h-4" />
            <span>{t('markdown_editor.view_split_vertical')}</span>
          </button>

          <button
            onClick={() => setViewMode('split-h')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              viewMode === 'split-h' 
                ? 'bg-teal-650 text-white shadow-3xs dark:bg-teal-605' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-850'
            }`}
            title="Split Horizontally"
          >
            <Rows className="w-4 h-4" />
            <span>{t('markdown_editor.view_split_horizontal')}</span>
          </button>

          <button
            onClick={() => setViewMode('editor')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              viewMode === 'editor' 
                ? 'bg-teal-650 text-white shadow-3xs dark:bg-teal-605' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-850'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{t('markdown_editor.view_only_editor')}</span>
          </button>

          <button
            onClick={() => setViewMode('preview')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              viewMode === 'preview' 
                ? 'bg-teal-650 text-white shadow-3xs dark:bg-teal-605' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-850'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>{t('markdown_editor.view_only_preview')}</span>
          </button>
        </div>

        {/* Global actions: Load representative sample, Clear space */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadSample}
            className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('markdown_editor.load_sample_btn')}</span>
          </button>

          <button
            onClick={handleClear}
            className="py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('markdown_editor.clear_workspace')}</span>
          </button>
        </div>

      </div>

      {/* WORKSPACE AREA */}
      <div 
        className={`grid gap-6 ${
          viewMode === 'split-v' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        } ${viewMode === 'split-h' ? 'flex flex-col' : ''}`}
      >
        
        {/* EDITOR COMPONENT */}
        {(viewMode === 'split-v' || viewMode === 'split-h' || viewMode === 'editor') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl flex flex-col overflow-hidden shadow-3xs min-h-[460px]">
            
            {/* Syntax formatting helper toolbar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 flex flex-wrap gap-1.5 items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {t('markdown_editor.workspace_editor')}
              </span>
              
              <div className="flex flex-wrap gap-1 items-center">
                <button
                  type="button"
                  onClick={() => insertSyntax('heading')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title={t('markdown_editor.add_header_btn')}
                >
                  <Heading1 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_header_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertSyntax('bold')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_bold_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertSyntax('italic')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_italic_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertSyntax('list')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="List"
                >
                  <List className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_list_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertSyntax('table')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Table"
                >
                  <Table className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_table_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertSyntax('code')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Code Block"
                >
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_code_btn')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => insertSyntax('link')}
                  className="p-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Hyperlink"
                >
                  <Link className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">{t('markdown_editor.add_link_btn')}</span>
                </button>
              </div>
            </div>

            {/* Editing canvas */}
            <div className="flex-1 min-h-[380px] relative">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Type some markdown syntax here or load a sample document above..."
                className="w-full h-full min-h-[380px] p-5 text-slate-850 dark:text-slate-100 bg-slate-55 dark:bg-slate-950/50 focus:outline-none leading-relaxed font-mono text-xs select-text resize-y"
                id="raw-markdown-textarea"
              />
            </div>

            {/* Word statistics footer panel */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex items-center gap-4 text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{stats.words}</span>
                <span>{t('markdown_editor.words_count')}</span>
              </div>
              <div className="h-3 w-px bg-slate-205 dark:bg-slate-800" />
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{stats.chars}</span>
                <span>{t('markdown_editor.chars_count')}</span>
              </div>
              <div className="h-3 w-px bg-slate-205 dark:bg-slate-800" />
              <div className="flex items-center gap-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">{stats.lines}</span>
                <span>{t('markdown_editor.lines_count')}</span>
              </div>
            </div>

          </div>
        )}

        {/* PREVIEW COMPONENT */}
        {(viewMode === 'split-v' || viewMode === 'split-h' || viewMode === 'preview') && (
          <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl flex flex-col overflow-hidden shadow-3xs min-h-[460px]">
            
            {/* Preview header toolbar actions */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                {t('markdown_editor.preview_pane')}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyHtml}
                  className="py-1 px-2.5 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Copy Compiled raw HTML code"
                  id="btn-copy-html"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{copied ? t('hashtag_cleaner.copied_msg') : t('markdown_editor.copy_html_btn')}</span>
                </button>

                <button
                  onClick={handleExportHtmlFile}
                  className="py-1 px-2.5 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-teal-200/40 dark:border-emerald-900/40 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                  title="Download stylized html"
                  id="btn-export-html-file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('markdown_editor.export_html')}</span>
                </button>
              </div>
            </div>

            {/* Markdown rendered layout container */}
            <div className="flex-1 p-6 md:p-8 bg-white dark:bg-slate-900/10 overflow-y-auto min-h-[380px] select-text select-all">
              <div 
                className="prose dark:prose-invert max-w-full text-slate-800 dark:text-slate-100 text-xs text-start leading-relaxed prose-headings:text-slate-900 dark:prose-headings:text-white prose-a:text-teal-650 dark:prose-a:text-teal-400 prose-blockquote:border-l-4 prose-blockquote:border-teal-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-code:bg-slate-100 dark:prose-code:bg-slate-950 prose-code:p-1 prose-code:rounded prose-code:text-[11px] prose-code:font-mono prose-pre:bg-slate-950 prose-pre:text-white prose-pre:p-4 prose-pre:rounded-lg prose-table:border-collapse prose-table:w-full prose-td:border prose-td:border-slate-200 dark:prose-td:border-slate-800 prose-td:p-2 prose-th:border prose-th:border-slate-200 dark:prose-th:border-slate-800 prose-th:p-2 prose-th:bg-slate-50 dark:prose-th:bg-slate-950"
                dangerouslySetInnerHTML={{ __html: parsedHtml || `<p class="text-slate-400 italic">${t('url_cleaner.output_placeholder')}</p>` }}
                id="markdown-rendered-view"
              />
            </div>

          </div>
        )}

      </div>

      {/* Auxiliary informative note */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 shadow-3xs">
        <BookOpen className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
        <div className="text-[10.5px] text-slate-500 leading-normal select-text">
          <p className="font-bold text-slate-850 dark:text-white mb-0.5">
            {isRtl ? 'بناء وثائق غنية وتصدير فوري' : 'Rich Document Structuring'}
          </p>
          <p>
            {isRtl 
              ? 'تعتبر لغة التنسيق الماركداون المعيار والحل الأمثل لكتابة المقالات والبرمجيات والمستندات التقنية. يمكنك كتابته ورؤيته هنا مع تصديره كصفحة ويب كاملة المظهر بأسلوب مميز بنقرة واحدة.' 
              : 'Markdown is the gold-standard lightweight markup formulation used by engineers worldwide to construct readmes, manuals, and technical layouts. Design and export styled documents instantly.'
            }
          </p>
        </div>
      </div>

      {/* Copied Toasts Notification System */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {copiedNotification && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-2 px-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-extrabold rounded-full shadow-lg flex items-center gap-2 border border-slate-700/10 pointer-events-auto"
              id="copied-notification-toast"
            >
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{copiedNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
