import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Settings, 
  Trash2, 
  Check, 
  Copy, 
  FileText, 
  RefreshCw, 
  Braces, 
  Terminal, 
  AlertTriangle, 
  Sparkles, 
  FileCode, 
  CornerDownLeft, 
  Timer
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'code_formatter',
  icon: 'Code',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_code_formatter_title',
  descKey: 'tool_code_formatter_desc',
};

const SAMPLE_JSON = `{
  "userId": 1,
  "username": "creator_innovator",
  "active": true,
  "stats": {
    "subscribers": 142000,
    "monthlyViews": 850000,
    "rpm": 4.5
  },
  "preferredDomain": "content_monetization",
  "tags": [
    "youtube",
    "insights",
    "financials"
  ]
}`;

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<creatorProfile id="101" platform="YouTube">
  <username>visionary_coder</username>
  <metrics>
    <followers count="142000" unit="subs"/>
    <avgViewsMonthly>850000</avgViewsMonthly>
    <rpmCurrency value="USD">4.50</rpmCurrency>
  </metrics>
  <tagsList>
    <tag>automation</tag>
    <tag>coding</tag>
    <tag>finance</tag>
  </tagsList>
</creatorProfile>`;

// Local error analysis line finder for JSON
function getJsonErrorLine(errorMsg: string, input: string): number | null {
  const match = errorMsg.match(/at position (\d+)/i);
  if (match) {
    const position = parseInt(match[1], 10);
    if (!isNaN(position)) {
      const substring = input.slice(0, position);
      return substring.split('\n').length;
    }
  }
  
  const lineMatch = errorMsg.match(/at line (\d+)/i);
  if (lineMatch) {
    return parseInt(lineMatch[1], 10);
  }

  // Older Firefox style errors: "JSON.parse: expected double-quoted property name at line 5 column 3 of the JSON data"
  const lineColMatch = errorMsg.match(/line (\d+) column/i);
  if (lineColMatch) {
    return parseInt(lineColMatch[1], 10);
  }

  return null;
}

// Local custom stateful XML tag matching / syntax parser to discover errors
interface XmlValidationResult {
  isValid: boolean;
  errorLine?: number;
  message?: string;
}

function validateRawXml(xml: string): XmlValidationResult {
  const lines = xml.split('\n');
  const stack: { tag: string; line: number }[] = [];
  let inComment = false;
  let inCdata = false;
  
  for (let l = 0; l < lines.length; l++) {
    const rawLine = lines[l];
    let i = 0;
    while (i < rawLine.length) {
      if (!inComment && !inCdata) {
        if (rawLine.substring(i, i + 4) === '<!--') {
          inComment = true;
          i += 4;
          continue;
        }
        if (rawLine.substring(i, i + 9) === '<![CDATA[') {
          inCdata = true;
          i += 9;
          continue;
        }
        if (rawLine[i] === '<') {
          // Find tag closet >
          const nextClose = rawLine.indexOf('>', i);
          if (nextClose === -1) {
            return {
              isValid: false,
              errorLine: l + 1,
              message: 'Unclosed tag definition block (missing ">")'
            };
          }
          const tagContent = rawLine.substring(i + 1, nextClose).trim();
          i = nextClose + 1;
          
          if (tagContent.startsWith('?') || tagContent.startsWith('!')) {
            // Header definitions or processing commands
            continue;
          }
          
          if (tagContent.endsWith('/')) {
            // Self-closing
            continue;
          }
          
          if (tagContent.startsWith('/')) {
            // Closing Tag
            const closeTagName = tagContent.substring(1).trim().split(/\s+/)[0];
            if (stack.length === 0) {
              return {
                isValid: false,
                errorLine: l + 1,
                message: `Unexpected orphan closing tag </${closeTagName}> without an opened parent tag`
              };
            }
            const lastOpen = stack.pop()!;
            if (lastOpen.tag !== closeTagName) {
              return {
                isValid: false,
                errorLine: l + 1,
                message: `Mismatched Tag: Expected </${lastOpen.tag}> (opened at line ${lastOpen.line}) but found </${closeTagName}>`
              };
            }
          } else {
            // Opening Tag
            const openTagName = tagContent.split(/\s+/)[0];
            if (openTagName) {
              stack.push({ tag: openTagName, line: l + 1 });
            }
          }
        } else {
          i++;
        }
      } else if (inComment) {
        if (rawLine.substring(i, i + 3) === '-->') {
          inComment = false;
          i += 3;
        } else {
          i++;
        }
      } else if (inCdata) {
        if (rawLine.substring(i, i + 3) === ']]>') {
          inCdata = false;
          i += 3;
        } else {
          i++;
        }
      }
    }
  }
  
  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      isValid: false,
      errorLine: unclosed.line,
      message: `Tag opened tags structure issue: <${unclosed.tag}> started at line ${unclosed.line} remains open`
    };
  }
  
  return { isValid: true };
}

// Custom XML Beautiful markup alignment
function beautifyXmlString(xml: string, indentSize: number): string {
  const clean = xml.replace(/>\s+</g, '><').trim();
  let result = '';
  let indent = 0;
  const tab = ' '.repeat(indentSize);
  
  let i = 0;
  while (i < clean.length) {
    if (clean.substring(i, i + 4) === '<!--') {
      const end = clean.indexOf('-->', i);
      if (end === -1) {
        result += '\n' + tab.repeat(indent) + clean.substring(i);
        break;
      }
      result += '\n' + tab.repeat(indent) + clean.substring(i, end + 3);
      i = end + 3;
      continue;
    }
    
    if (clean.substring(i, i + 9) === '<![CDATA[') {
      const end = clean.indexOf(']]>', i);
      if (end === -1) {
        result += clean.substring(i);
        break;
      }
      result += clean.substring(i, end + 3);
      i = end + 3;
      continue;
    }

    if (clean[i] === '<') {
      const isClosing = clean[i + 1] === '/';
      const isHeader = clean[i + 1] === '?' || clean[i + 1] === '!';
      const nextClose = clean.indexOf('>', i);
      
      if (nextClose === -1) {
        result += '\n' + tab.repeat(indent) + clean.substring(i);
        break;
      }
      
      const tagContent = clean.substring(i, nextClose + 1);
      const isSelfClosing = clean[nextClose - 1] === '/';
      
      if (isClosing) {
        indent = Math.max(0, indent - 1);
      }
      
      if (i > 0 && result[result.length - 1] !== '\n') {
        result += '\n';
      }
      result += tab.repeat(indent) + tagContent;
      
      if (!isClosing && !isSelfClosing && !isHeader) {
        indent++;
      }
      
      i = nextClose + 1;
    } else {
      const nextOpen = clean.indexOf('<', i);
      let text = '';
      if (nextOpen === -1) {
        text = clean.substring(i).trim();
        i = clean.length;
      } else {
        text = clean.substring(i, nextOpen).trim();
        i = nextOpen;
      }
      if (text) {
        result += text;
      }
    }
  }
  return result.trim();
}

// Custom XML minifying regex
function minifyXmlString(xml: string): string {
  return xml
    .replace(/(<!--[\s\S]*?-->)/g, '') // remove comments
    .replace(/>\s+</g, '><')
    .trim();
}

export default function JsonXmlFormatter({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [mode, setMode] = useState<'json' | 'xml'>('json');
  const [inputText, setInputText] = useState<string>('');
  const [indentSpaces, setIndentSpaces] = useState<number>(2);
  const [errorDetails, setErrorDetails] = useState<{ line: number | null; message: string } | null>(null);
  
  // Analytics State
  const [stats, setStats] = useState<{
    originalBytes: number;
    formattedBytes: number;
    savedPercentage: number;
    parseTimeMs: number;
  } | null>(null);

  // Copy Alert
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // Automatically attempt format detection when text input is substantial
  useEffect(() => {
    const trimmed = inputText.trim();
    if (trimmed.startsWith('<')) {
      setMode('xml');
    } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      setMode('json');
    }
  }, [inputText]);

  const loadSample = () => {
    triggerAd(() => {
      setErrorDetails(null);
      setStats(null);
      if (mode === 'json') {
        setInputText(SAMPLE_JSON);
      } else {
        setInputText(SAMPLE_XML);
      }
    });
  };

  const clearAll = () => {
    setInputText('');
    setErrorDetails(null);
    setStats(null);
  };

  const handleBeautify = () => {
    if (!inputText.trim()) return;
    setErrorDetails(null);
    
    const startTime = performance.now();
    triggerAd(() => {
      try {
        if (mode === 'json') {
          // Parse JSON strictly to trigger error block if invalid
          const parsed = JSON.parse(inputText);
          const formatted = JSON.stringify(parsed, null, indentSpaces);
          
          setInputText(formatted);
          
          const endTime = performance.now();
          calculateStats(inputText.length, formatted.length, endTime - startTime);
        } else {
          // Validate and parse Custom XML
          const xmlCheck = validateRawXml(inputText);
          if (!xmlCheck.isValid) {
            setErrorDetails({
              line: xmlCheck.errorLine || null,
              message: xmlCheck.message || 'Malformed XML Syntax structure'
            });
            return;
          }
          
          const formatted = beautifyXmlString(inputText, indentSpaces);
          setInputText(formatted);
          
          const endTime = performance.now();
          calculateStats(inputText.length, formatted.length, endTime - startTime);
        }
      } catch (e: any) {
        const line = getJsonErrorLine(e.message || '', inputText);
        setErrorDetails({
          line: line,
          message: e.message || 'Parsing error occurred'
        });
      }
    });
  };

  const handleMinify = () => {
    if (!inputText.trim()) return;
    setErrorDetails(null);

    const startTime = performance.now();
    triggerAd(() => {
      try {
        if (mode === 'json') {
          const parsed = JSON.parse(inputText);
          const minified = JSON.stringify(parsed);
          
          setInputText(minified);
          
          const endTime = performance.now();
          calculateStats(inputText.length, minified.length, endTime - startTime);
        } else {
          const xmlCheck = validateRawXml(inputText);
          if (!xmlCheck.isValid) {
            setErrorDetails({
              line: xmlCheck.errorLine || null,
              message: xmlCheck.message || 'Malformed XML tags'
            });
            return;
          }
          
          const minified = minifyXmlString(inputText);
          setInputText(minified);
          
          const endTime = performance.now();
          calculateStats(inputText.length, minified.length, endTime - startTime);
        }
      } catch (e: any) {
        const line = getJsonErrorLine(e.message || '', inputText);
        setErrorDetails({
          line: line,
          message: e.message || 'Compress error execution'
        });
      }
    });
  };

  const calculateStats = (orig: number, formatted: number, ms: number) => {
    const saved = orig > formatted ? ((orig - formatted) / orig) * 100 : 0;
    setStats({
      originalBytes: orig,
      formattedBytes: formatted,
      savedPercentage: parseFloat(saved.toFixed(1)),
      parseTimeMs: parseFloat(ms.toFixed(2))
    });
  };

  const copyToClipboard = async () => {
    if (!inputText) return;
    try {
      await navigator.clipboard.writeText(inputText);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      // silent fail
    }
  };

  return (
    <div className="w-full space-y-6" id="json-xml-beautifier-root">
      
      {/* Dynamic Intro Frame */}
      <div className="flex gap-4 p-5 bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-150 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <Code className="w-6 h-6 text-emerald-650 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-300 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('code_formatter.title')}
          </h3>
          <p className="text-xs">
            {t('code_formatter.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-emerald-650 dark:text-emerald-400">
            {isRtl 
              ? '⚡ معالجة خصوصية فورية بنسبة 100%: الفحص والتجميل والضغط يتم بالكامل محلياً داخل المتصفح دون نقل بياناتك عبر الإنترنت.'
              : '⚡ Extreme Client-Side Isolation: All data formatting, minifications and row-based debug alerts are computed in-situ.'
            }
          </p>
        </div>
      </div>

      {/* Settings Panel & Mode Selectors */}
      <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-3xs">
        
        {/* Left Side: Type Mode selections */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMode('json');
              setErrorDetails(null);
              setStats(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'json'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400'
            }`}
          >
            <Braces className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={() => {
              setMode('xml');
              setErrorDetails(null);
              setStats(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              mode === 'xml'
                ? 'bg-emerald-600 text-white shadow-3xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>XML</span>
          </button>
        </div>

        {/* Right Side: Indent styles & quick templates */}
        <div className="flex items-center gap-3 flex-wrap">
          
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-450">
              {t('code_formatter.indent_style')}:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={() => setIndentSpaces(2)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer ${
                  indentSpaces === 2
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                2
              </button>
              <button
                onClick={() => setIndentSpaces(4)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-md cursor-pointer ${
                  indentSpaces === 4
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 shadow-3xs'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                4
              </button>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-105 dark:bg-slate-800 hidden md:block" />

          <button
            onClick={loadSample}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-950 rounded-lg hover:bg-slate-100/60 transition flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تحميل كود تجريبي' : 'Load Demo String'}</span>
          </button>
        </div>

      </div>

      {/* Form Arena with line debugger capability */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="code-editor-arena">
        
        {/* Editor and buttons */}
        <div className="lg:col-span-12 space-y-4">
          
          <div className="relative">
            {/* Rich terminal styled box header */}
            <div className="bg-slate-105 dark:bg-slate-950 flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-t border-x border-slate-205 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase ml-2 select-none tracking-wider">
                  {mode}.source_editor
                </span>
              </div>

              <div className="flex items-center gap-2">
                {inputText && (
                  <button
                    onClick={clearAll}
                    className="p-1 text-slate-405 hover:text-rose-550 transition cursor-pointer"
                    title="Clear raw content"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorDetails) setErrorDetails(null);
              }}
              placeholder={
                mode === 'json'
                  ? '{\n  "paste_your_json": "here_for_polishing"\n}'
                  : '<xml>\n  <paste_your_xml>here</paste_your_xml>\n</xml>'
              }
              className="w-full h-80 p-4 font-mono text-[12px] bg-slate-50 dark:bg-slate-900 border-x border-b border-slate-205 dark:border-slate-850 rounded-b-2xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-150 leading-relaxed resize-y select-text"
            />
          </div>

          {/* Actions grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={handleBeautify}
              disabled={!inputText.trim()}
              className="py-3.5 px-5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-3xs cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('code_formatter.beautify_btn')}</span>
            </button>

            <button
              onClick={handleMinify}
              disabled={!inputText.trim()}
              className="py-3.5 px-5 rounded-xl text-xs font-bold text-emerald-650 hover:bg-slate-100 bg-emerald-58/50 dark:bg-emerald-955/10 dark:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 border border-emerald-110 dark:border-emerald-900/30 cursor-pointer"
            >
              <Terminal className="w-4 h-4" />
              <span>{t('code_formatter.minify_btn')}</span>
            </button>

            <button
              onClick={copyToClipboard}
              disabled={!inputText.trim()}
              className="py-3.5 px-5 rounded-xl text-xs font-bold bg-slate-900 text-white dark:bg-slate-800 hover:bg-slate-950 transition flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {copiedKey ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span>{isRtl ? 'تم نسخ المزدوج بنجاح!' : 'Copied Success!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isRtl ? 'نسخ الكود الحالي للمقطع' : 'Copy Processed Markup'}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* ERROR DEBUG CARD FOR UNSATISFED SYNTAX */}
      <AnimatePresence>
        {errorDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-rose-50 dark:bg-rose-955/12 border border-rose-102 dark:border-rose-900/40 rounded-2xl flex gap-3.5 shadow-2xs text-slate-800 dark:text-slate-300 select-text"
            id="formatter-error-log-banner"
          >
            <AlertTriangle className="w-5.5 h-5.5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1 text-xs">
              <strong className="text-rose-700 dark:text-rose-450 font-bold block">
                {isRtl ? 'خطأ في بنية الكود (Syntax Error):' : 'Strict Code Parse Exception:'}
              </strong>
              
              <div className="font-mono text-slate-700 dark:text-slate-350 p-2 bg-rose-100/10 dark:bg-rose-950/20 rounded-lg">
                {errorDetails.message}
              </div>

              {errorDetails.line !== null && (
                <div className="flex items-center gap-1.5 pt-1.5 text-rose-700 dark:text-rose-450 font-bold text-[11px]">
                  <CornerDownLeft className="w-3.5 h-3.5" />
                  <span>
                    {t('code_formatter.error_invalid')}
                    <span className="bg-rose-600 text-white font-black font-mono px-2 py-0.5 rounded-md ml-1 inline-block">
                      {errorDetails.line}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOCAL WORKSPACE STATS */}
      <AnimatePresence>
        {stats && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-slate-700 dark:text-slate-300 select-text"
            id="formatter-perf-scoreboard"
          >
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-405 uppercase tracking-wider block font-bold">
                {isRtl ? 'الحجم الأصلي' : 'Original Size'}
              </span>
              <p className="font-mono font-black text-xs text-slate-800 dark:text-white">
                {stats.originalBytes} bytes
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-405 uppercase tracking-wider block font-bold">
                {isRtl ? 'الحجم النهائي' : 'Processed Size'}
              </span>
              <p className="font-mono font-black text-xs text-slate-800 dark:text-white">
                {stats.formattedBytes} bytes
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-405 uppercase tracking-wider block font-bold">
                {isRtl ? 'نسبة الضغط / التغيير' : 'Density Change'}
              </span>
              <p className="font-mono font-black text-xs text-emerald-650 dark:text-emerald-400">
                {stats.savedPercentage}%
              </p>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-405 uppercase tracking-wider block font-bold flex items-center justify-center gap-1">
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                <span>{isRtl ? 'زمن المعالجة' : 'Parse Time'}</span>
              </span>
              <p className="font-mono font-black text-xs text-slate-800 dark:text-white">
                {stats.parseTimeMs} ms
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
