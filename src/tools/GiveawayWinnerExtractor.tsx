import React, { useState, useEffect, useRef, useTransition } from 'react';
import { 
  Trophy, 
  Users, 
  Trash2, 
  Shuffle, 
  Sparkles, 
  Play, 
  Settings, 
  Info,
  Check, 
  RefreshCw,
  Copy,
  Plus,
  Volume2,
  VolumeX,
  UserCheck
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'giveaway',
  icon: 'Trophy',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_giveaway_title',
  descKey: 'tool_giveaway_desc',
};

// Simple synthesized sounds using Web Audio API
const playTickSound = (frequency = 600, duration = 0.05) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Web audio inhibited or not supported
  }
};

const playFanfareSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;
    
    const playNote = (freq: number, start: number, dur: number) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    // Uplifting chord sequence: C4, E4, G4, C5
    playNote(261.63, now, 0.15);
    playNote(329.63, now + 0.12, 0.15);
    playNote(392.00, now + 0.24, 0.15);
    playNote(523.25, now + 0.36, 0.6);
  } catch (e) {
    // Protected or ignored
  }
};

interface Particle {
  x: number;
  y: number;
  color: string;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

const DEFAULT_SAMPLE_NAMES = `أحمد الخالدي
سارة العمري
Mohamed_Gamer
Fatima99
خالد المطيري
Elena_Creative_Studio
يوسف الحربي
Amir_Tech_Tips
ليلى السعيد
Zain_Designs
عبدالرحمن_العتيبي
Yasmin_Digital
نورة البقمي
GamerPro_2026`;

export default function GiveawayWinnerExtractor({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  const [inputNames, setInputNames] = useState(DEFAULT_SAMPLE_NAMES);
  const [numberOfWinners, setNumberOfWinners] = useState(1);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [shuffleSeconds, setShuffleSeconds] = useState(3);
  const [isMuted, setIsMuted] = useState(false);

  // Drawing States
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingCurrentName, setDrawingCurrentName] = useState<string>('');
  const [finalWinners, setFinalWinners] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);

  // Clean and parse names
  const getParsedNamesList = (): string[] => {
    if (!inputNames.trim()) return [];
    
    // Split by newlines, commas, active separators or semicolons
    const rawList = inputNames
      .split(/[\n,;]+/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (removeDuplicates) {
      return Array.from(new Set(rawList));
    }
    return rawList;
  };

  const parsedNames = getParsedNamesList();

  // Draw simulation ticker and stop trigger
  const handleStartDraw = () => {
    if (parsedNames.length === 0) return;
    if (isDrawing) return;

    triggerAd(() => {
      setIsDrawing(true);
      setFinalWinners([]);
      setDrawingCurrentName('');
      
      const durationMs = shuffleSeconds * 1000;
      const startTime = Date.now();
      let tickRate = 50; // ms

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const index = Math.floor(Math.random() * parsedNames.length);
        const randomCurrentLabel = parsedNames[index] || '';
        
        setDrawingCurrentName(randomCurrentLabel);
        
        if (!isMuted) {
          playTickSound(350 + Math.random() * 250, 0.04);
        }

        if (elapsed >= durationMs) {
          clearInterval(interval);
          
          // Compute final winners safely
          const pool = [...parsedNames];
          const resultWinners: string[] = [];
          const targetCount = Math.min(numberOfWinners, pool.length);

          for (let i = 0; i < targetCount; i++) {
            const chosenIndex = Math.floor(Math.random() * pool.length);
            resultWinners.push(pool[chosenIndex]);
            pool.splice(chosenIndex, 1); // remove from pool to avoid duplicate winners in same draw
          }

          setFinalWinners(resultWinners);
          setIsDrawing(false);
          setDrawingCurrentName('');
          
          if (!isMuted) {
            playFanfareSound();
          }

          // Trigger confetti burst!
          triggerConfettiBurst();
        }
      }, tickRate);
    });
  };

  // HTML5 native Canvas Confetti engine
  const triggerConfettiBurst = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas properly
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = 360;

    const colors = [
      '#f43f5e', '#10b981', '#3b82f6', '#f59e0b', 
      '#d946ef', '#6366f1', '#06b6d4', '#e11d48'
    ];

    // Generate confetti particles
    const list: Particle[] = [];
    for (let i = 0; i < 110; i++) {
      list.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 10, // erupt from bottom
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 6 + 4,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 10, // shoot upwards
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    particlesRef.current = list;

    // Stop previous animation if running
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      let stillActive = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // physics
        p.vy += 0.28; // gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (p.y < canvas.height + 20) {
          stillActive = true;
        }

        // draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.shadowColor = 'rgba(0,0,0,0.1)';
        ctx.shadowBlur = 3;
        
        // rectangle confetti
        ctx.fillRect(-p.radius, -p.radius / 1.5, p.radius * 2, p.radius * 1.3);
        ctx.restore();
      }

      if (stillActive) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  };

  // Copy individual winner to clipboard
  const handleCopyWinner = async (name: string, index: number) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    setInputNames('');
    setFinalWinners([]);
  };

  const loadSampleList = (topic: 'standard' | 'mega') => {
    if (topic === 'standard') {
      setInputNames(DEFAULT_SAMPLE_NAMES);
    } else {
      setInputNames(`أريج خالد\nميسون السالم\nأنس المقاطي\n@Ali_Designer\nMalek_H\nريناد مأمون\nسلطان الغامدي\nUser_No9812\nأمجد الفيصل\nلينا محمد\nوسيم الحربي\nHassan_Twitch\nريما السبيعي\nFaisal_Premium\nهدى الشمري\nOmar_Creator\nجود الدوسري\nRawan_Art`);
    }
    setFinalWinners([]);
  };

  return (
    <div className="w-full space-y-7" id="giveaway-winner-extractor-root">
      
      {/* Informative Header card */}
      <div className="flex gap-4 p-5 bg-indigo-50 dark:bg-indigo-955/15 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl shadow-xs">
        <Trophy className="w-6 h-6 text-indigo-650 shrink-0 mt-0.5 animate-bounce" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('giveaway.title')}
          </h3>
          <p className="text-xs">
            {t('giveaway.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-indigo-650 dark:text-indigo-400">
            {isRtl 
              ? '⚡ مصداقية عالية لجمهورك: يتم اختيار الأسماء عشوائياً بدون أي تحيز في واجهة المتصفح بالكامل وبشكل مستقل.'
              : '⚡ Absolute Equity: All computations run exclusively in-browser. Fully deterministic pseudo-random draws with no external queries.'
            }
          </p>
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column: Configuration Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl shadow-3xs space-y-5">
            <h4 className="text-xs font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{isRtl ? 'قائمة المشاركين بالمسابقة' : 'Contestants Roll'}</span>
            </h4>

            {/* Populate lists quick presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-[10.5px] font-bold text-slate-400 self-center">
                {isRtl ? 'قوالب سريعة للتجربة:' : 'Quick Lists:'}
              </span>
              <button
                type="button"
                onClick={() => loadSampleList('standard')}
                className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-205 dark:border-slate-800 transition cursor-pointer"
              >
                {isRtl ? 'قائمة 1 (14 مشارك)' : 'List A (14 Names)'}
              </button>

              <button
                type="button"
                onClick={() => loadSampleList('mega')}
                className="py-1 px-2.5 rounded-lg text-[10px] font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-205 dark:border-slate-800 transition cursor-pointer"
              >
                {isRtl ? 'قائمة 2 (18 مشارك)' : 'List B (18 Names)'}
              </button>
            </div>

            {/* Inputs Textarea */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10.5px] text-slate-400">
                <label className="font-semibold block" htmlFor="giveaway-names-input">
                  {isRtl ? 'أدخل الاسماء (اسم في كل سطر أو مفصولة بفواصل):' : 'Enter Names (one per line):'}
                </label>
                <span className="font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 py-0.5 px-1.5 rounded-md font-bold text-[9.5px]">
                  {parsedNames.length} {isRtl ? 'اسم فريد' : 'unique names'}
                </span>
              </div>

              <textarea
                id="giveaway-names-input"
                rows={9}
                value={inputNames}
                onChange={(e) => setInputNames(e.target.value)}
                placeholder={isRtl ? "مثال:\nمحمد العلي\nسارة الحربي\n@john_doe" : "Example:\nsarah_90\nAhmed Gamin\n@creative_user"}
                className="w-full p-3.5 text-xs font-mono border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition leading-relaxed select-text"
              />
            </div>

            {/* Duplicate settings */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60">
              <input
                type="checkbox"
                id="giveaway-dedup-checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
              />
              <label 
                htmlFor="giveaway-dedup-checkbox" 
                className="text-[11px] text-slate-600 dark:text-slate-350 select-none leading-normal font-sans cursor-pointer"
              >
                <strong>{t('giveaway.dedup_labels')}</strong>
                <span className="block text-[10px] text-slate-400">
                  {isRtl ? 'يبحث في القائمة لفلترة وحذف أي اشتراك مكرر لضمان النزاهة التامة.' : 'Scans incoming inputs and strips replica strings automatically.'}
                </span>
              </label>
            </div>

            {/* Clear Box button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? 'مسح المدخلات بالكامل' : 'Wipe Participant Box'}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Right Column: Draw & Anim Arena */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl shadow-3xs space-y-5 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
            
            {/* Visual HTML5 Confetti overlay canvas element */}
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 pointer-events-none z-10 w-full h-full"
            />

            {/* Arena Top Toolbar / Options */}
            <div className="flex flex-wrap items-center justify-between gap-4 z-20 pb-4 border-b border-slate-50 dark:border-slate-850">
              <h4 className="text-xs font-black uppercase text-indigo-650 dark:text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 animate-spin-slow" />
                <span>{isRtl ? 'خيارات ضبط السحب والقرعة في الفيديو' : 'Live Draw Parameters'}</span>
              </h4>

              <div className="flex items-center gap-3">
                {/* Sound control toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-500 transition cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-indigo-500" />}
                </button>
              </div>
            </div>

            {/* Config parameters sliders in bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 z-20 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-450 uppercase block" htmlFor="winners-count-input">
                  {t('giveaway.winners_count')}
                </label>
                <input
                  id="winners-count-input"
                  type="number"
                  min={1}
                  max={Math.max(1, parsedNames.length)}
                  value={numberOfWinners}
                  onChange={(e) => setNumberOfWinners(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-450 uppercase block">
                  {t('giveaway.shuffle_duration')}: <span className="text-indigo-600 font-bold">{shuffleSeconds}s</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={shuffleSeconds}
                  onChange={(e) => setShuffleSeconds(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* THE LIVE SHUFFLE ARENA DISPLAYER */}
            <div className="py-8 text-center flex flex-col justify-center items-center relative min-h-[160px] z-20">
              
              <AnimatePresence mode="wait">
                {/* CASE 1: DRAW IS RUNNING */}
                {isDrawing && (
                  <motion.div
                    key="drawing-arena"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="space-y-3"
                  >
                    <div className="w-16 h-16 bg-indigo-550/10 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-spin-slow">
                      <Shuffle className="w-8 h-8 animate-pulse" />
                    </div>

                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                      {isRtl ? 'جاري السحب العشوائي وتحليل كروت الأسماء...' : 'Analyzing cards list & picking randomly...'}
                    </p>

                    <span className="block font-bold text-3xl md:text-4xl text-indigo-650 dark:text-indigo-400 font-mono select-text bg-indigo-50 dark:bg-indigo-950/40 py-2 px-6 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/40">
                      {drawingCurrentName || '---'}
                    </span>
                  </motion.div>
                )}

                {/* CASE 2: CONTEST WINNERS ALREADY CALLED */}
                {!isDrawing && finalWinners.length > 0 && (
                  <motion.div
                    key="winners-arena"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4 w-full"
                  >
                    <div className="flex gap-1.5 items-center justify-center text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/35 py-1.5 px-3 rounded-full border border-emerald-100 dark:border-emerald-900/30 w-fit mx-auto mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      <span>{t('giveaway.congratulations')}</span>
                    </div>

                    {/* Winners cards grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto select-text">
                      {finalWinners.map((w, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-amber-50 to-white dark:from-slate-950 dark:to-slate-900 border-2 border-amber-300 dark:border-amber-500/30 p-4 rounded-2xl shadow-xs text-center relative overflow-hidden group hover:border-amber-400/80 transition-all flex flex-col justify-between"
                        >
                          <div className="text-[10px] uppercase font-bold text-amber-600 font-mono tracking-wider flex items-center justify-center gap-1">
                            <Trophy className="w-3.5 h-3.5 fill-current" />
                            <span>{isRtl ? `الفائز #${index + 1}` : `Winner #${index + 1}`}</span>
                          </div>

                          <div className="text-lg font-black font-sans text-slate-850 dark:text-white my-2 truncate">
                            {w}
                          </div>

                          {/* Action copy */}
                          <button
                            onClick={() => handleCopyWinner(w, index)}
                            className="text-[11px] font-bold text-slate-450 hover:text-slate-750 dark:hover:text-slate-200 flex items-center justify-center gap-1 mt-1 cursor-pointer mx-auto"
                          >
                            {copiedIndex === index ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">{isRtl ? 'تم النسخ!' : 'Copied!'}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{isRtl ? 'نسخ الاسم الكلي' : 'Copy'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={triggerConfettiBurst}
                      className="py-1 px-2.5 rounded-lg text-[10.5px] font-bold text-amber-650 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40 transition flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'إطلاق القصاصات الملونة مجدداً 🎉' : 'Blow Confetti Again! 🎉'}</span>
                    </button>
                  </motion.div>
                )}

                {/* CASE 3: NO DRAW CURRENTLY ACTIVE AND NO WINNERS CHOSEN */}
                {!isDrawing && finalWinners.length === 0 && (
                  <motion.div
                    key="idle-arena"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-2 text-slate-400 max-w-md mx-auto"
                  >
                    <Trophy className="w-12 h-12 text-slate-300 mx-auto" strokeWidth={1} />
                    <p className="text-xs">
                      {isRtl 
                        ? 'أدخل قائمة الأسماء على اليمين ثم اضغط على الزر أدناه لبدء السحب التفاعلي الحي.'
                        : 'Configure your entrants list on the left side, then click the live action trigger to execute the draw.'
                      }
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* BOTTOM CTA BUTTON */}
            <div className="pt-4 border-t border-slate-50 dark:border-slate-850 z-20">
              <button
                type="button"
                disabled={isDrawing || parsedNames.length === 0}
                onClick={handleStartDraw}
                className={`w-full py-4.5 px-6 rounded-2xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                  parsedNames.length === 0
                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-600 border border-slate-200 cursor-not-allowed shadow-none'
                    : isDrawing
                      ? 'bg-slate-205 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg dark:bg-indigo-650 dark:hover:bg-indigo-700'
                }`}
                id="btn-trigger-live-draw"
              >
                <Play className="w-4.5 h-4.5" />
                <span>
                  {parsedNames.length === 0
                    ? (isRtl ? 'يرجى إدخال أسماء للبدء السحب' : 'Empty entrants list: Enter names first')
                    : isDrawing 
                      ? (isRtl ? 'جاري إجراء القرعة الحية...' : 'Drawing in progress...') 
                      : t('giveaway.draw_btn')
                  }
                </span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Auxiliary usage tips */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3 shadow-3xs">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-[10.5px] text-slate-500 leading-normal select-text">
          <p className="font-bold text-slate-850 dark:text-white mb-0.5">
            {isRtl ? 'نصيحة لصانع المحتوى لزيادة التفاعل:' : 'High Engagement Creator Tips:'}
          </p>
          <p>
            {isRtl 
              ? 'إن تسجيل شاشة جهازك أثناء حركة الخلط وتصاعد القصاصات الملونة (Confetti) مع تشغيل صوت التيكس يزيد تفاعل وثقة متابعيك بالنتائج التلقائية 100%! جرب زيادة ثواني الخلط لخلق حس من التشويق والإثارة الفائقة.' 
              : 'Record your live screen widget. Shuffling names rapidly with mechanical acoustic ticks establishes a thrilling build-up of suspense for streaming audiences.'
            }
          </p>
        </div>
      </div>

    </div>
  );
}
