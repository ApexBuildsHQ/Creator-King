import React, { useState, useEffect, useTransition } from 'react';
import { 
  Calculator, 
  Youtube, 
  Award, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Percent, 
  PiggyBank, 
  Sparkles, 
  ArrowRightLeft, 
  Check, 
  Info,
  ChevronDown,
  Copy
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'creators_calc',
  icon: 'Calculator',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_creators_calc_title',
  descKey: 'tool_creators_calc_desc',
};

// Realistic YouTube industry standard RPM guidance presets in USD
interface IndustryPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  rpm: number;
}

const INDUSTRY_RPM_PRESETS: IndustryPreset[] = [
  { id: 'finance', nameAr: 'المال والاستثمار والعملات المشفرة', nameEn: 'Finance, Crypto & Investing', rpm: 12.80 },
  { id: 'tech', nameAr: 'التكنولوجيا والهواتف والبرمجة', nameEn: 'Technology, Tech Gadgets & Software', rpm: 6.50 },
  { id: 'education', nameAr: 'التعليم والتطوير الذاتي والكورسات', nameEn: 'Education & Professional Development', rpm: 4.80 },
  { id: 'cooking', nameAr: 'الطبخ وإعداد الوصفات والطبخ المنزلي', nameEn: 'Cooking, Food reviews & Recipes', rpm: 2.20 },
  { id: 'vlogs', nameAr: 'اللايف ستايل والتدوين المرئي الفلوقات', nameEn: 'Lifestyle, Vlogs & Travel', rpm: 2.10 },
  { id: 'gaming', nameAr: 'ألعاب الفيديو والجيمنج والبث المباشر', nameEn: 'Gaming, Stream & Video Games', rpm: 1.50 },
  { id: 'beauty', nameAr: 'الجمال، والمكياج والموضة والستايل', nameEn: 'Beauty, Cosmetics & Fashion', rpm: 2.80 }
];

const LOCAL_STORAGE_YT_VIEWS_KEY = 'creators_calc_yt_views_v1';
const LOCAL_STORAGE_YT_RPM_KEY = 'creators_calc_yt_rpm_v1';
const LOCAL_STORAGE_SP_HOURS_KEY = 'creators_calc_sp_hours_v1';
const LOCAL_STORAGE_SP_RATE_KEY = 'creators_calc_sp_rate_v1';
const LOCAL_STORAGE_SP_EQUIP_KEY = 'creators_calc_sp_equip_v1';
const LOCAL_STORAGE_SP_MARGIN_KEY = 'creators_calc_sp_margin_v1';

export default function CreatorsFinancialCalculators({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [activeTab, setActiveTab] = useState<'youtube' | 'sponsor'>('youtube');
  const [isPending, startTransition] = useTransition();

  // YouTube States
  const [views, setViews] = useState<number>(100000);
  const [rpm, setRpm] = useState<number>(3.50);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('tech');
  const [calculatedYtRevenue, setCalculatedYtRevenue] = useState<number | null>(null);

  // Sponsor States
  const [workHours, setWorkHours] = useState<number>(15);
  const [hourlyRate, setHourlyRate] = useState<number>(35);
  const [productionCost, setProductionCost] = useState<number>(120);
  const [profitMargin, setProfitMargin] = useState<number>(30); // in percent %
  const [calculatedSponsorRate, setCalculatedSponsorRate] = useState<number | null>(null);

  // Copy support
  const [copySuccessText, setCopySuccessText] = useState<string | null>(null);

  // Initialize and load persistent user options
  useEffect(() => {
    try {
      const savedViews = localStorage.getItem(LOCAL_STORAGE_YT_VIEWS_KEY);
      const savedRpm = localStorage.getItem(LOCAL_STORAGE_YT_RPM_KEY);
      const savedHours = localStorage.getItem(LOCAL_STORAGE_SP_HOURS_KEY);
      const savedRate = localStorage.getItem(LOCAL_STORAGE_SP_RATE_KEY);
      const savedEquip = localStorage.getItem(LOCAL_STORAGE_SP_EQUIP_KEY);
      const savedMargin = localStorage.getItem(LOCAL_STORAGE_SP_MARGIN_KEY);

      if (savedViews) setViews(Number(savedViews));
      if (savedRpm) setRpm(Number(savedRpm));
      if (savedHours) setWorkHours(Number(savedHours));
      if (savedRate) setHourlyRate(Number(savedRate));
      if (savedEquip) setProductionCost(Number(savedEquip));
      if (savedMargin) setProfitMargin(Number(savedMargin));
    } catch (e) {
      // ignore
    }
  }, []);

  // Sync to local storage on modification
  const handleViewsChange = (val: number) => {
    setViews(val);
    localStorage.setItem(LOCAL_STORAGE_YT_VIEWS_KEY, String(val));
  };

  const handleRpmChange = (val: number) => {
    setRpm(val);
    localStorage.setItem(LOCAL_STORAGE_YT_RPM_KEY, String(val));
  };

  const handleHoursChange = (val: number) => {
    setWorkHours(val);
    localStorage.setItem(LOCAL_STORAGE_SP_HOURS_KEY, String(val));
  };

  const handleRateChange = (val: number) => {
    setHourlyRate(val);
    localStorage.setItem(LOCAL_STORAGE_SP_RATE_KEY, String(val));
  };

  const handleEquipChange = (val: number) => {
    setProductionCost(val);
    localStorage.setItem(LOCAL_STORAGE_SP_EQUIP_KEY, String(val));
  };

  const handleMarginChange = (val: number) => {
    setProfitMargin(val);
    localStorage.setItem(LOCAL_STORAGE_SP_MARGIN_KEY, String(val));
  };

  // Preset Selection Action
  const applyPresetRpm = (presetId: string) => {
    const preset = INDUSTRY_RPM_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPresetId(presetId);
      handleRpmChange(preset.rpm);
    }
  };

  // Perform Calculations
  const calculateYoutube = () => {
    triggerAd(() => {
      // Formula: (Views / 1000) * RPM
      const result = (views / 1000) * rpm;
      setCalculatedYtRevenue(result);
    });
  };

  const calculateSponsorship = () => {
    triggerAd(() => {
      // labor = hours * hourly rate
      const laborCost = workHours * hourlyRate;
      // base = labor + production costs
      const totalBaseCost = laborCost + productionCost;
      // margin additive: base + (base * margin%)
      const suggestedRate = totalBaseCost * (1 + profitMargin / 100);
      setCalculatedSponsorRate(suggestedRate);
    });
  };

  const handleCopyValue = async (val: string, label: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopySuccessText(isRtl ? `تم نسخ ${label}: ${val}!` : `Copied ${label}: ${val}!`);
      setTimeout(() => setCopySuccessText(null), 2500);
    } catch {
      // silent
    }
  };

  // Quick helper for currency formatting
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="w-full space-y-7" id="creators-financial-calculators-root">
      
      {/* Informative Dashboard Welcome Panel */}
      <div className="flex gap-4 p-5 bg-emerald-50 dark:bg-emerald-955/15 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <Calculator className="w-6 h-6 text-emerald-650 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('creators_calc.title')}
          </h3>
          <p className="text-xs">
            {t('creators_calc.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-emerald-650 dark:text-teal-400">
            {isRtl 
              ? '⚡ توجيه مالي آمن: حسابات علمية ومدروسة لحماية صانع المحتوى وتأمين السعر الأدنى عند التعاقد مع الشركات أو تسعير إعلانات السوشيال ميديا.'
              : '⚡ Protect your revenues: Clear statistical math modeling baseline margins with extreme touch/tablet responsive design support.'
            }
          </p>
        </div>
      </div>

      {/* TABS NAVIGATIONAL RULER */}
      <div className="flex border-b border-slate-105 dark:border-slate-850 gap-2">
        <button
          onClick={() => {
            setActiveTab('youtube');
            setCalculatedYtRevenue(null);
          }}
          className={`py-3 px-5 text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'youtube'
              ? 'border-emerald-600 text-emerald-650 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Youtube className="w-4.5 h-4.5" />
          <span>{t('creators_calc.tab_youtube')}</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('sponsor');
            setCalculatedSponsorRate(null);
          }}
          className={`py-3 px-5 text-sm font-bold transition flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'sponsor'
              ? 'border-emerald-600 text-emerald-650 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4.5 h-4.5" />
          <span>{t('creators_calc.tab_sponsor')}</span>
        </button>
      </div>

      {/* CORE ACTIVE FORM AND CALC ARENA */}
      <div id="creators-calculator-workspace">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: YOUTUBE ESTIMATOR */}
          {activeTab === 'youtube' && (
            <motion.div
              key="youtube-calculator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-7"
            >
              
              {/* Inputs Segment */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl p-6 shadow-3xs space-y-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                  <Youtube className="w-4 h-4 text-rose-500" />
                  <span>{isRtl ? 'بيانات وإحصاءات المشاهدات وقيمة الربح' : 'Adsense Metrics Input'}</span>
                </h4>

                {/* Dropdown for default Industry RPM values */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-450 block" htmlFor="industry-preset-dropdown">
                    {isRtl ? 'مجال القناة (مساعد استرشادي لقيمة الـ RPM ببلدك):' : 'Channel Industry Genre (RPM Guide):'}
                  </label>
                  
                  <div className="relative">
                    <select
                      id="industry-preset-dropdown"
                      value={selectedPresetId}
                      onChange={(e) => applyPresetRpm(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 text-xs text-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-slate-350 border border-slate-205 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer font-sans"
                    >
                      {INDUSTRY_RPM_PRESETS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {isRtl ? `${p.nameAr} - [RPM Avg: $${p.rpm.toFixed(2)}]` : `${p.nameEn} - [Avg: $${p.rpm.toFixed(2)}]`}
                        </option>
                      ))}
                    </select>

                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Expected Views */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 block" htmlFor="views-input">
                      {t('creators_calc.views_input')}
                    </label>
                    <div className="relative">
                      <input
                        id="views-input"
                        type="number"
                        min={0}
                        step={5000}
                        value={views}
                        onChange={(e) => handleViewsChange(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-2.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Estimated RPM */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 block" htmlFor="rpm-input">
                      {t('creators_calc.rpm_input')}
                    </label>
                    <div className="relative">
                      <input
                        id="rpm-input"
                        type="number"
                        min={0}
                        step={0.1}
                        value={rpm}
                        onChange={(e) => handleRpmChange(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full p-2.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    </div>
                  </div>
                </div>

                {/* Submit Trigger Actions */}
                <div className="pt-3">
                  <button
                    onClick={calculateYoutube}
                    className="w-full py-3.5 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-3xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>{t('creators_calc.calc_btn')}</span>
                  </button>
                </div>

              </div>

              {/* Outputs Segment */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-7 rounded-2xl shadow-md space-y-6 relative overflow-hidden select-text">
                  
                  {/* Backdrop lights */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-110 block">
                      {t('creators_calc.result_revenue')}
                    </span>
                    <h3 className="text-3xl font-black font-mono">
                      {calculatedYtRevenue !== null ? formatCurrency(calculatedYtRevenue) : '$0.00'}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/20 text-xs">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white/80">{isRtl ? 'الربح الشهري المقدر:' : 'Estimated Monthly Margin:'}</span>
                      <span className="font-bold font-mono text-emerald-100">
                        {calculatedYtRevenue !== null ? formatCurrency(calculatedYtRevenue) : '$0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white/80">{isRtl ? 'الربح السنوي المتوقع:' : 'Annual Expected Projection:'}</span>
                      <span className="font-bold font-mono text-emerald-100">
                        {calculatedYtRevenue !== null ? formatCurrency(calculatedYtRevenue * 12) : '$0.00'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white/80">{isRtl ? 'العائد لكل مقطع (فرضاً 4 شهرياً):' : 'Expected Per Video Rate (assuming 4/mo):'}</span>
                      <span className="font-bold font-mono text-emerald-100">
                        {calculatedYtRevenue !== null ? formatCurrency(calculatedYtRevenue / 4) : '$0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Actions to copy parameter */}
                  {calculatedYtRevenue !== null && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleCopyValue(formatCurrency(calculatedYtRevenue), 'Adsense Estimator')}
                        className="py-1.5 px-3 rounded-lg bg-white/15 text-white hover:bg-white/22 text-[11px] font-bold transition flex items-center justify-center gap-1.5 w-full cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'نسخ تقدير الأرباح' : 'Copy Projected Earnings'}</span>
                      </button>
                    </div>
                  )}

                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl flex gap-3 text-xs text-slate-500 mt-4 leading-normal select-text">
                  <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-white block">
                      {isRtl ? 'عن مؤشر الـ RPM:' : 'About RPM:'}
                    </strong>
                    <p>
                      {isRtl 
                        ? 'الـ RPM يعني العائد لكل ألف مشاهدة. يتفاوت العائد وفقاً لجنسية المشاهدين، وموضوع الفيديو والفصل السنوي للشركات المعلنة.'
                        : 'RPM stands for revenue per mile. Technology and finance domains often command much higher rates than vlogs or gaming streams.'
                      }
                    </p>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: SPONSORSHIP RATE CALCULATOR */}
          {activeTab === 'sponsor' && (
            <motion.div
              key="sponsorship-calculator"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-7"
            >
              
              {/* Inputs Segment */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl p-6 shadow-3xs space-y-5">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800/60 pb-3">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span>{isRtl ? 'عوامل مجهود وتكلفة صناعة الفيديو الإعلاني' : 'Labor & Expense Calculator Inputs'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Hours spent */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 block" htmlFor="work-hours-input">
                      {isRtl ? 'عدد الساعات المستغرقة بالعمل:' : 'Estimated Work Hours:'}
                    </label>
                    <div className="relative">
                      <input
                        id="work-hours-input"
                        type="number"
                        min={1}
                        value={workHours}
                        onChange={(e) => handleHoursChange(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">Hr(s)</span>
                    </div>
                  </div>

                  {/* Hourly Rate */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 block" htmlFor="hourly-rate-input">
                      {isRtl ? 'تكلفة/قيمة ساعة عملك ($):' : 'Desired Hourly Rate ($):'}
                    </label>
                    <div className="relative">
                      <input
                        id="hourly-rate-input"
                        type="number"
                        min={1}
                        value={hourlyRate}
                        onChange={(e) => handleRateChange(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Production & Equipment Cost */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 block" htmlFor="production-cost-input">
                      {isRtl ? 'تكلفة المعدات والإنتاج المباشرة ($):' : 'Equipments & Direct Expenses ($):'}
                    </label>
                    <div className="relative">
                      <input
                        id="production-cost-input"
                        type="number"
                        min={0}
                        value={productionCost}
                        onChange={(e) => handleEquipChange(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-2.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    </div>
                  </div>

                  {/* Target Profit Profit margin */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-450 block" htmlFor="profit-margin-slider">
                      {isRtl ? 'هامش الربح المطلوب (%):' : 'Profit Margin Additive (%):'}
                    </label>
                    <div className="relative">
                      <input
                        id="profit-margin-slider"
                        type="number"
                        min={0}
                        max={200}
                        value={profitMargin}
                        onChange={(e) => handleMarginChange(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full p-2.5 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                {/* Calculation buttons actions */}
                <div className="pt-3">
                  <button
                    onClick={calculateSponsorship}
                    className="w-full py-3.5 px-6 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-3xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" />
                    <span>{isRtl ? 'احسب سعر الرعاية المقترح قانونياً' : 'Calculate Sponsorship Baseline Rate'}</span>
                  </button>
                </div>

              </div>

              {/* Outputs Segment */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="bg-gradient-to-br from-indigo-650 to-blue-800 text-white p-7 rounded-2xl shadow-md space-y-6 relative overflow-hidden select-text">
                  
                  {/* Backdrop lights */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-150 block">
                      {isRtl ? 'أدنى سعر رعاية مقترح لطلبه من الشركات:' : 'Minimum Brand Sponsorship Suggestion:'}
                    </span>
                    <h3 className="text-3xl font-black font-mono text-amber-300">
                      {calculatedSponsorRate !== null ? formatCurrency(calculatedSponsorRate) : '$0.00'}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/20 text-xs">
                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white/80">{isRtl ? 'تكلفة وقت عملك الصافي:' : 'Net labor effort costs:'}</span>
                      <span className="font-bold font-mono text-indigo-100">
                        {formatCurrency(workHours * hourlyRate)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white/80">{isRtl ? 'مجموع تكلفة التخزين وعناصر الإنتاج:' : 'Equipments & production cost base:'}</span>
                      <span className="font-bold font-mono text-indigo-100">
                        {formatCurrency(productionCost)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <span className="text-white/80">{isRtl ? 'قيمة الربح الصافي المضاف (Margin value):' : 'Desired pure profit additive margin:'}</span>
                      <span className="font-bold font-mono text-emerald-300">
                        {calculatedSponsorRate !== null ? formatCurrency(calculatedSponsorRate - (workHours * hourlyRate + productionCost)) : '$0.00'}
                      </span>
                    </div>
                  </div>

                  {/* Actions copy to clipboard */}
                  {calculatedSponsorRate !== null && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleCopyValue(formatCurrency(calculatedSponsorRate), 'Sponsorship Proposal')}
                        className="py-1.5 px-3 rounded-lg bg-white/15 text-white hover:bg-white/22 text-[11px] font-bold transition flex items-center justify-center gap-1.5 w-full cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'نسخ قيمة السعر المقترح' : 'Copy Recommended Rate'}</span>
                      </button>
                    </div>
                  )}

                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl flex gap-3 text-xs text-slate-500 mt-4 leading-normal select-text">
                  <Info className="w-4 h-4 text-indigo-505 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 dark:text-white block">
                      {isRtl ? 'نصيحة التفاوض الاحترافي:' : 'Negotiation pro tips:'}
                    </strong>
                    <p>
                      {isRtl 
                        ? 'عند الحديث مع الشركات، لا تقدم سعرك كـ "سعر إجمالي اعتباطي". ضع في مقترحك تكاليف تفصيلية لساعات العمل وتراخيص الموسيقى والمعدات؛ يضفي ذلك احترافية قصوى تجعلهم يوافقون فوراً.'
                        : 'Avoid throwing baseless totals at advertisers. Structuring your quote with hourly breakdowns and expenses reinforces extreme integrity.'
                      }
                    </p>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Slide out Toast for copied status */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {copySuccessText && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-2.5 px-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-2 border border-slate-705/10 pointer-events-auto"
              id="calculator-notification-toast"
            >
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{copySuccessText}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
