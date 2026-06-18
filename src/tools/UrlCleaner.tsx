import React, { useState, useMemo, useEffect, useTransition } from 'react';
import { 
  Link, 
  Trash2, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  Fingerprint, 
  Zap, 
  SlidersHorizontal,
  ExternalLink,
  RefreshCw,
  Eye,
  AlertTriangle,
  HelpCircle,
  FileCode
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'url_cleaner',
  icon: 'Link',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_url_cleaner_title',
  descKey: 'tool_url_cleaner_desc',
};

// Groups of parameters to eliminate based on selected checkboxes
const PARAM_LISTS = {
  utm: [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 
    'utm_id', 'utm_reader', 'utm_referrer', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic'
  ],
  fb: [
    'fbclid', 'fbc', 'fbp', 'fb_action_ids', 'fb_action_types', 'fb_source', 'hrc', 'fb_ref'
  ],
  affiliate: [
    'ref', 'tag', 'aff_id', 'affiliate', 'clickid', 'assoc_id', 'campaign_id', 'customid', 'sourceid', 'aff'
  ],
  newsletter: [
    'mc_eid', 'mc_cid', 'ml_subscriber', 'ml_subscriber_hash', 'rb_clickid', 'list_id', 'contact_id', 'newsletter_id'
  ],
  social_shares: [
    'gclid', 'gclsrc', 'dclid', 'msclkid', 'twclid', 'ttclid', 'scid', '_hsenc', '_hsmi', 'hsCtaTracking', 'igshid', 's'
  ]
};

export default function UrlCleaner({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [inputUrl, setInputUrl] = useState<string>('');
  const [stripUtm, setStripUtm] = useState<boolean>(true);
  const [stripFb, setStripFb] = useState<boolean>(true);
  const [stripAffiliates, setStripAffiliates] = useState<boolean>(true);
  const [stripNewsletter, setStripNewsletter] = useState<boolean>(true);
  const [stripSocialShares, setStripSocialShares] = useState<boolean>(true);
  
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Set representative initial sample to showcase capabilities on load
  useEffect(() => {
    setInputUrl(
      "https://example-shop.com/collections/autumn-wear?utm_source=twitter&utm_medium=social_organic&utm_campaign=black_friday_deals&fbclid=a98s7df8a9sdf8a9s8df&affiliate=partner_deal_99&ref=instagram_profile&gclid=AIzaSyA88_XyaZ8"
    );
  }, []);

  // Main processing pipeline
  const processResults = useMemo(() => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      return {
        cleanedUrl: '',
        isValid: false,
        strippedParams: [] as string[],
        originalLen: 0,
        cleanedLen: 0,
        savedPercentage: 0,
        errorMsg: null as string | null
      };
    }

    let urlToParse = trimmed;
    // Basic automatic fix for users omitting protocol
    if (!/^https?:\/\//i.test(urlToParse)) {
      // If it looks like a domain or path, prepend https://
      if (urlToParse.includes('.') || urlToParse.startsWith('localhost')) {
        urlToParse = 'https://' + urlToParse;
      }
    }

    try {
      const parsedUrl = new URL(urlToParse);
      const initialParams = Array.from(parsedUrl.searchParams.keys());
      const strippedParams: string[] = [];

      // Determine which parameters to drop
      const paramsToDropSet = new Set<string>();
      if (stripUtm) {
        PARAM_LISTS.utm.forEach(p => paramsToDropSet.add(p));
      }
      if (stripFb) {
        PARAM_LISTS.fb.forEach(p => paramsToDropSet.add(p));
      }
      if (stripAffiliates) {
        PARAM_LISTS.affiliate.forEach(p => paramsToDropSet.add(p));
      }
      if (stripNewsletter) {
        PARAM_LISTS.newsletter.forEach(p => paramsToDropSet.add(p));
      }
      if (stripSocialShares) {
        PARAM_LISTS.social_shares.forEach(p => paramsToDropSet.add(p));
        // Also strip any single letter trackers like '?s=19' or '?s=20' representing twitter share states
        if (parsedUrl.searchParams.has('s')) {
          const sVal = parsedUrl.searchParams.get('s') || '';
          if (sVal.length <= 4) {
            paramsToDropSet.add('s');
          }
        }
      }

      // Perform clean sweep
      initialParams.forEach((paramKey) => {
        // Case insensitive match or prefix check (e.g. utm_*)
        const lowerKey = paramKey.toLowerCase();
        const shouldDrop = paramsToDropSet.has(lowerKey) || 
                           (stripUtm && lowerKey.startsWith('utm_'));

        if (shouldDrop) {
          parsedUrl.searchParams.delete(paramKey);
          strippedParams.push(paramKey);
        }
      });

      // Format anonymous output
      // Note: we preserve decoded components for standard visual elegance
      const cleanedUrl = decodeURIComponent(parsedUrl.toString());

      const originalLen = trimmed.length;
      const cleanedLen = cleanedUrl.length;
      const savedPercentage = originalLen > cleanedLen 
        ? Math.round(((originalLen - cleanedLen) / originalLen) * 105) 
        : 0;

      return {
        cleanedUrl,
        isValid: true,
        strippedParams,
        originalLen,
        cleanedLen,
        savedPercentage,
        errorMsg: null
      };

    } catch (e) {
      return {
        cleanedUrl: '',
        isValid: false,
        strippedParams: [],
        originalLen: trimmed.length,
        cleanedLen: 0,
        savedPercentage: 0,
        errorMsg: isRtl 
          ? 'تنبيه: صيغة عنوان الويب (URL) غير صالحة. يرجى التحقق من صياغته وإضافة النطاق بشكل صحيح.'
          : 'Invalid address formulation. Please enter a fully Qualified HTTP/HTTPS reference URL.'
      };
    }
  }, [inputUrl, stripUtm, stripFb, stripAffiliates, stripNewsletter, stripSocialShares, isRtl]);

  const handleCopy = async () => {
    if (!processResults.cleanedUrl) return;
    try {
      await navigator.clipboard.writeText(processResults.cleanedUrl);
      setCopied(true);
      setCopiedNotification(t('url_cleaner.copied_msg'));
      setTimeout(() => {
        setCopied(false);
        setCopiedNotification(null);
      }, 2000);
    } catch {
      // fallback
    }
  };

  const handleClear = () => {
    setInputUrl('');
  };

  const loadSample = () => {
    triggerAd(() => {
      startTransition(() => {
        setInputUrl(
          "https://blog.techplatform.co/article/ultimate-typescript-tips?utm_source=newsletter&utm_medium=email&utm_campaign=annual_summit_2026&mc_eid=8826a7df8b&aff_id=9872&gclid=Cj0KCQjwy4OmBhCNARIsAPPLiH6e"
        );
      });
    });
  };

  return (
    <div className="w-full space-y-7" id="url-cleaner-root">
      
      {/* Dynamic Splash Header banner with Clean visual layout */}
      <div className="flex gap-4 p-5 bg-teal-50 dark:bg-emerald-955/15 border border-teal-100 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <ShieldCheck className="w-6 h-6 text-teal-650 shrink-0 mt-0.5" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('url_cleaner.title')}
          </h3>
          <p className="text-xs">
            {t('url_cleaner.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-teal-650 dark:text-teal-400">
            {isRtl 
              ? '⚡ خصوصية بيانات التتبع كاملة: تتم التصفية والمعالجة محلياً 100% بدون إرسال عناوين الويب لأي مخدم خارجي.'
              : '⚡ Full diagnostic privacy: 100% client side URL sanitization engine ensuring your queried links never touch a server.'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* INPUT FORM & PREFERENCES (7 Columns) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main text area container */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-3xs">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Link className="w-4 h-4 text-teal-500" />
                {t('url_cleaner.original_link_lbl')}
              </span>

              {inputUrl && (
                <button
                  onClick={handleClear}
                  className="py-1 px-3 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{t('url_cleaner.clear_workspace')}</span>
                </button>
              )}
            </div>

            {/* Input textarea */}
            <textarea
              value={inputUrl}
              onChange={(e) => startTransition(() => setInputUrl(e.target.value))}
              placeholder={t('url_cleaner.input_placeholder')}
              rows={4}
              className="w-full p-4 text-slate-850 dark:text-slate-100 bg-slate-55 dark:bg-slate-950/60 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-mono text-xs select-text resize-none transition"
              id="raw-tracked-url-input"
            />

            {/* Error notifications block */}
            {processResults.errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex gap-2.5 items-start">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-sans">{processResults.errorMsg}</p>
              </div>
            )}

            {/* Quick action: Load sample links */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono">
                {isRtl ? '💡 ترغب في رؤية مثال حي سريع للميزة؟' : '💡 Want to test with a dummy tracked link?'}
              </span>
              <button
                onClick={loadSample}
                className="py-1.5 px-3 rounded-lg text-[10.5px] font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-emerald-950/30 dark:text-emerald-400 border border-teal-200/40 dark:border-emerald-900/40 transition flex items-center gap-1.5 cursor-pointer"
                id="btn-load-sample-url"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('url_cleaner.load_sample_btn')}</span>
              </button>
            </div>

          </div>

          {/* CHECKBOX CONFIGURATOR */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-3xs">
            
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <SlidersHorizontal className="w-4 h-4 text-teal-500" />
              {isRtl ? 'قواعد التطهير وتتبع البيانات المحددة' : 'Active Cleansing Param Categories'}
            </h4>

            <div className="space-y-2.5">
              
              {/* Box 1: UTM */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition cursor-pointer ${
                  stripUtm 
                    ? 'border-teal-200 bg-teal-50/15 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stripUtm}
                  onChange={(e) => setStripUtm(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 shrink-0"
                  id="chk-utm-tokens"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('url_cleaner.strip_utm')}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isRtl 
                      ? 'يحذف وسوم تتبع الحملات المضافة للمنشورات والروابط الترويجية.'
                      : 'Eliminates campaign trackers embedded for analytical audience segmentation.'
                    }
                  </p>
                </div>
              </label>

              {/* Box 2: FB Tracking */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition cursor-pointer ${
                  stripFb 
                    ? 'border-teal-200 bg-teal-50/15 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stripFb}
                  onChange={(e) => setStripFb(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 shrink-0"
                  id="chk-fb-tokens"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('url_cleaner.strip_fb')}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isRtl 
                      ? 'يمنع فيسبوك من تتبع سلوكك وقص هوية المستخدم عند النقر والانتقال من موقعه.'
                      : 'Surgically strips pixel telemetry and targeted outbound click identifiers.'
                    }
                  </p>
                </div>
              </label>

              {/* Box 3: Affiliates */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition cursor-pointer ${
                  stripAffiliates 
                    ? 'border-teal-200 bg-teal-50/15 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stripAffiliates}
                  onChange={(e) => setStripAffiliates(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 shrink-0"
                  id="chk-affiliate-tokens"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('url_cleaner.strip_affiliates')}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isRtl 
                      ? 'يحظر وسوم المسوقين وعائدات البيع بالعمولة المرفقة بروابط أمازون وعلي إكسبرس.'
                      : 'Clears e-commerce store associations from Amazon, AliExpress, and common stores.'
                    }
                  </p>
                </div>
              </label>

              {/* Box 4: Newsletter campaigns */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition cursor-pointer ${
                  stripNewsletter 
                    ? 'border-teal-200 bg-teal-50/15 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stripNewsletter}
                  onChange={(e) => setStripNewsletter(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 shrink-0"
                  id="chk-newsletter-tokens"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('url_cleaner.strip_newsletter')}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isRtl 
                      ? 'يعطل معلومات المشتركين القادمة من بوابات Mailchimp وMailerlite الكبرى.'
                      : 'Removes unique campaign recipient handshake strings from major broadcast emails.'
                    }
                  </p>
                </div>
              </label>

              {/* Box 5: Social Handshakes */}
              <label 
                className={`p-3.5 rounded-xl border flex items-start gap-3.5 transition cursor-pointer ${
                  stripSocialShares 
                    ? 'border-teal-200 bg-teal-50/15 text-teal-900 dark:bg-teal-950/10 dark:text-teal-300 dark:border-teal-900/60' 
                    : 'border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-850 dark:bg-slate-950/20'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stripSocialShares}
                  onChange={(e) => setStripSocialShares(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4 shrink-0"
                  id="chk-social-tokens"
                />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold">{t('url_cleaner.strip_social_shares')}</p>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isRtl 
                      ? 'يتخلص من وسوم تتبع تويتر، تيك توك، وإنستغرام الإضافية (مثل gclid و msclkid).'
                      : 'Purges search click and other auxiliary social metadata variables.'
                    }
                  </p>
                </div>
              </label>

            </div>

          </div>

        </div>

        {/* METRICS & PURIFIED RESULTS PREVIEW (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Giant space saved gradient card */}
          <div className="p-6 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-3xl space-y-4 shadow-lg relative overflow-hidden">
            
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
              <Fingerprint className="w-48 h-48" />
            </div>

            <div className="space-y-1 relative">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-100 opacity-85 block">
                {t('url_cleaner.stats_saved_percentage')}
              </span>
              <p className="text-5xl font-mono font-extrabold tracking-tight drop-shadow-xs">
                {processResults.savedPercentage}%
              </p>
            </div>

            {/* Metrics grid detailing original vs trimmed URL characters */}
            <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-white/10 text-xs text-white/90 relative">
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('url_cleaner.stats_original_len')}</p>
                <p className="font-mono text-lg font-bold">{processResults.originalLen} {isRtl ? 'حرف' : 'chars'}</p>
              </div>
              <div>
                <p className="font-bold opacity-75 text-[10px] uppercase tracking-wider">{t('url_cleaner.stats_cleaned_len')}</p>
                <p className="font-mono text-lg font-bold text-teal-200">{processResults.cleanedLen} {isRtl ? 'حرف' : 'chars'}</p>
              </div>
            </div>

            {/* Stripped params tag count */}
            <div className="pt-2 text-[11px] text-emerald-100 font-medium flex gap-1.5 items-center">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {isRtl 
                  ? `تم استئصال وإلغاء ${processResults.strippedParams.length} ملوث من أكواد التتبع بنجاح!` 
                  : `Successfully isolated and discarded ${processResults.strippedParams.length} track identifiers.`}
              </span>
            </div>

          </div>

          {/* PURIFIED OUTPUT PREVIEW BOX */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-sm relative">
            
            <div className="flex items-center justify-between pb-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Eye className="w-4 h-4 text-emerald-500" />
                {t('url_cleaner.purified_link_lbl')}
              </h4>

              {processResults.cleanedUrl && (
                <a
                  href={processResults.cleanedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 text-[10.5px] font-bold flex items-center gap-1 transition"
                  title="Test link in new tab"
                >
                  <span>{isRtl ? 'معاينة بمبوبة' : 'Open'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Simulated Clean Link Box */}
            <div className="relative">
              <div 
                className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 text-xs font-mono h-28 max-h-28 overflow-y-auto break-all leading-relaxed select-all text-slate-705 dark:text-slate-350"
                id="purified-url-output"
              >
                {processResults.cleanedUrl ? (
                  processResults.cleanedUrl
                ) : (
                  <p className="text-slate-405 italic font-sans">
                    {t('url_cleaner.output_placeholder')}
                  </p>
                )}
              </div>

              {processResults.cleanedUrl && (
                <button
                  onClick={handleCopy}
                  className="absolute bottom-2.5 right-2.5 py-1.5 px-3 rounded-lg text-[11.5px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-teal-600 dark:text-teal-400 shadow-xs transition flex items-center gap-1 cursor-pointer"
                  id="copy-purified-url-btn"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? t('hashtag_cleaner.copied_msg') : t('url_cleaner.copy_purified_btn')}</span>
                </button>
              )}
            </div>

            {/* List of exact variables eliminated */}
            {processResults.strippedParams.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block font-mono">
                  {isRtl ? 'العوامل الإحصائية التي تمت تصفيتها:' : 'Stated params surgically removed:'}
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {processResults.strippedParams.map((param, idx) => (
                    <span 
                      key={idx} 
                      className="py-0.5 px-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100/40 dark:border-rose-900/40 text-[10px] font-mono hover:scale-105 transition"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Outbound track notes */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 shadow-3xs">
            <Info className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
            <div className="text-[10.5px] text-slate-500 leading-normal select-text">
              <p className="font-bold text-slate-850 dark:text-white mb-0.5">
                {isRtl ? 'أثر بصمات التتبع الرقمي' : 'Outbound Link Telemetry'}
              </p>
              <p>
                {isRtl 
                  ? 'تميل الروابط المشتركة على منصات السوشيال للمحافظة على أكواد تعريفية تعكس هوية صاحب الحساب وتوقيت المشاركة. تنظيف هذه المعاملات يضمن سرية تفاعلاتك.' 
                  : 'Social share buttons append identifying hashes linking click streams to your digital avatar. Purification guarantees completely blank context.'
                }
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Bilingual Success Toasts */}
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
