import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Clock, Sparkles, ExternalLink, ShieldAlert, X, AlertCircle } from 'lucide-react';
import { getTranslation } from '../i18n';

interface AdContextType {
  triggerAd: (onComplete: () => void) => void;
  isCooldownActive: boolean;
  cooldownRemaining: number; // in seconds
}

const AdContext = createContext<AdContextType | undefined>(undefined);

const COOLDOWN_KEY = '_creator_king_ad_cooldown';
const ROTATION_INDEX_KEY = '_creator_king_ad_index';
const COOLDOWN_TIME_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

// Standardized Premium Smart Links Rotation (Monetag, Adsterra, etc.)
const SMART_LINKS = [
  'https://www.profitablecpmgate.com/example-monetag-smartlink1',
  'https://www.highperformancegate.com/example-adsterra-smartlink2',
  'https://www.displayrevenuegate.com/example-socialbar-smartlink3'
];

export const AdProvider: React.FC<{ children: React.ReactNode; lang?: string }> = ({ children, lang }) => {
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  
  // WebView / In-App Browser modal controls
  const [showWebViewModal, setShowWebViewModal] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(10);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  // Detect current language (defaults to 'ar' according to the Majestic Creator King theme)
  const currentLang = lang || (typeof document !== 'undefined' ? document.documentElement.lang : 'ar') || 'ar';
  const isRtl = currentLang === 'ar';

  // Check remaining cooldown time
  const updateCooldownStatus = () => {
    if (typeof window === 'undefined') return;
    const savedTime = localStorage.getItem(COOLDOWN_KEY);
    if (savedTime) {
      const parsedTime = parseInt(savedTime, 10);
      const now = Date.now();
      const difference = parsedTime + COOLDOWN_TIME_MS - now;
      if (difference > 0) {
        setIsCooldownActive(true);
        setCooldownRemaining(Math.ceil(difference / 1000));
      } else {
        setIsCooldownActive(false);
        setCooldownRemaining(0);
        localStorage.removeItem(COOLDOWN_KEY);
      }
    } else {
      setIsCooldownActive(false);
      setCooldownRemaining(0);
    }
  };

  useEffect(() => {
    updateCooldownStatus();
    // Run an interval to update remaining cooldown live
    const interval = setInterval(() => {
      updateCooldownStatus();
    }, 1000);

    // Global download button interceptor to guarantee 100% ad-management coverage across all tools
    const handleGlobalClick = (e: MouseEvent) => {
      if (typeof window === 'undefined') return;
      
      const target = e.target as HTMLElement;
      const downloadAnchor = target.closest('a[download]');
      
      if (downloadAnchor) {
        // If anchor has the bypass class, download normal
        if (downloadAnchor.classList.contains('ad-bypassed')) {
          return;
        }

        // Check if cooldown is active, if so, allow normal instant download
        const savedTime = localStorage.getItem(COOLDOWN_KEY);
        let active = false;
        if (savedTime) {
          const parsedTime = parseInt(savedTime, 10);
          active = (parsedTime + COOLDOWN_TIME_MS) > Date.now();
        }

        if (active) {
          return;
        }

        // Intercept download
        e.preventDefault();
        e.stopPropagation();

        const href = downloadAnchor.getAttribute('href');
        const filename = downloadAnchor.getAttribute('download') || 'download';

        triggerAd(() => {
          const tempAnchor = document.createElement('a');
          tempAnchor.href = href || '';
          tempAnchor.setAttribute('download', filename);
          tempAnchor.classList.add('ad-bypassed');
          document.body.appendChild(tempAnchor);
          tempAnchor.click();
          document.body.removeChild(tempAnchor);
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      clearInterval(interval);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, []);

  // Set the cooldown timestamp
  const activateCooldown = () => {
    const now = Date.now();
    localStorage.setItem(COOLDOWN_KEY, now.toString());
    updateCooldownStatus();
  };

  // WebView Browser Detection Logic
  const checkIsWebView = (): boolean => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    const ua = window.navigator.userAgent || window.navigator.vendor || (window as any).opera || "";
    
    // Check for webview signs:
    // 1. Common In-App social browsers inside iOS/Android
    const hasSocialAppInUA = /FB_IAB|FBAV|FBIOS|FBAN|Instagram|Twitter|TwitterAndroid|Telegram|Line|musical_ly|TikTok|Snapchat/i.test(ua);
    // 2. Android WebView specific signatures
    const isAndroidWebView = /wv|Android.*Version\/[0-9.]+/i.test(ua) && !/Chrome\/[0-9.]+/i.test(ua);
    // 3. iOS in-app webview (missing Safari but contains AppleWebKit)
    const isAppleWebView = /iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua) && /AppleWebKit/i.test(ua);

    return hasSocialAppInUA || isAndroidWebView || isAppleWebView;
  };

  // WebView internal countdown effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showWebViewModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showWebViewModal && countdown === 0) {
      // Countdown completed, proceed with action and close
      handleWebViewCompletion();
    }
    return () => clearTimeout(timer);
  }, [showWebViewModal, countdown]);

  const handleWebViewCompletion = () => {
    setShowWebViewModal(false);
    activateCooldown();
    if (pendingCallbackRef.current) {
      pendingCallbackRef.current();
      pendingCallbackRef.current = null;
    }
  };

  const triggerAd = (onComplete: () => void) => {
    // 1. If currently in a cooldown period, execute original callback immediately
    if (isCooldownActive) {
      onComplete();
      return;
    }

    const isWebViewUser = checkIsWebView();

    if (isWebViewUser) {
      // 2. Restricted Browser Mode (In-App WebView): Show the custom popup with 10s countdown
      pendingCallbackRef.current = onComplete;
      setCountdown(10);
      setShowWebViewModal(true);
    } else {
      // 3. Standard Browser Mode: Open direct smart link in a new tab smoothly
      try {
        // Rotate between the 3 Direct/Smart links to maintain safe account standing and distribute traffic
        let lastIndex = 0;
        const savedIndex = localStorage.getItem(ROTATION_INDEX_KEY);
        if (savedIndex) {
          lastIndex = (parseInt(savedIndex, 10) + 1) % SMART_LINKS.length;
        }
        localStorage.setItem(ROTATION_INDEX_KEY, lastIndex.toString());
        const selectedLink = SMART_LINKS[lastIndex];

        // Open direct smart link in new tab
        window.open(selectedLink, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn("Popup blocked or failed to open", e);
      }

      // Activate cooldown state
      activateCooldown();

      // Execute original callback in the source window immediately without holding down user
      onComplete();
    }
  };

  const { t } = getTranslation(currentLang);

  return (
    <AdContext.Provider value={{ triggerAd, isCooldownActive, cooldownRemaining }}>
      {children}

      {/* WebView Custom Elegant Pop-up Alert Modal (Tailwind CSS) */}
      {showWebViewModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          dir={isRtl ? 'rtl' : 'ltr'}
          id="custom-ad-modal-overlay"
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-amber-500/20 rounded-3xl shadow-2xl shadow-amber-500/5 overflow-hidden transition-all duration-300 transform scale-100 flex flex-col"
            id="custom-ad-modal-content"
          >
            {/* Header branding */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="font-bold text-sm tracking-tight text-slate-800 dark:text-amber-400">
                  Creator King Ads Center
                </span>
              </div>
              <button 
                onClick={handleWebViewCompletion}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 text-center">
              {/* Spinning Timer Indicator */}
              <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-amber-500/5 dark:bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse">
                <div className="absolute inset-2 border-2 border-dashed border-amber-500 rounded-full animate-spin [animation-duration:8s]" />
                <span className="text-3xl font-black font-mono text-amber-500">
                  {countdown}
                </span>
              </div>

              {/* Status Header */}
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {t('ads_modalTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {t('ads_modalSub')}
                </p>
              </div>

              {/* Progress counter pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-100 dark:border-amber-950">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {t('ads_remainingTime').replace("{seconds}", countdown.toString())}
                </span>
              </div>

              {/* ADVERTISING BANNER PLACEHOLDERS (AS SPECIFIED IN GUIDELINES) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                  {t('ads_adLabel')}
                </span>

                {/* 
                  ========================================================================
                  MONETIZATION SCRIPT PLACEMENT GUIDE
                  ========================================================================
                  Adsterra / Monetag Code Integration:
                  To serve live native banners with auto-refresh instead of our custom mockup,
                  you can directly insert your iframe code or script logic inside these divs.
                  Example script loader:
                  <script type="text/javascript">
                     atOptions = { 'key' : 'your_ad_key', 'format' : 'iframe', ... };
                  </script>
                  ========================================================================
                */}

                {/* Custom Responsive Banner Area (Interactive to trigger callback instantly) */}
                <div 
                  onClick={handleWebViewCompletion}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-amber-200 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10 p-4 hover:border-amber-500 dark:hover:border-amber-500/60 transition duration-300"
                  id="ad-banner-block"
                >
                  {/* Subtle Glowing Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300" />
                  
                  <div className="relative space-y-1">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                      {t('ads_bannerTitle')} 
                      <ExternalLink className="w-3 h-3 text-amber-500" />
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal max-w-xs mx-auto">
                      {t('ads_bannerBody')}
                    </p>
                    <p className="text-[10px] text-amber-500 font-medium pt-1 hover:underline">
                      {t('ads_clickToSkip')}
                    </p>
                  </div>
                </div>

                {/* Technical placeholder specs to demonstrate readiness for Ad Broker code snippets */}
                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-400 dark:text-slate-500 pt-1">
                  <div className="p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    Mobile: 320x50px Banner
                  </div>
                  <div className="p-1 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                    Desktop: 728x90px Leaderboard
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Action CTA */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={handleWebViewCompletion}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-amber-500/10 active:scale-[0.98]"
              >
                {t('ads_unblockBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdContext.Provider>
  );
};

export const useAdManager = () => {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAdManager must be used within an AdProvider');
  }
  return context;
};
