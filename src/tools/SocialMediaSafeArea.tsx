import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Upload, 
  Sparkles, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Download, 
  Smartphone, 
  Sliders, 
  Film,
  Instagram,
  Youtube,
  Music,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  ThumbsUp,
  ThumbsDown,
  Repeat,
  Plus,
  Search,
  Home,
  User,
  Compass,
  AlertTriangle,
  Flame
} from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';
import { useAdManager } from '../context/AdContext';

export const toolInfo: ToolInfo = {
  id: 'safe_area',
  icon: 'Smartphone',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_safe_area_title',
  descKey: 'tool_safe_area_desc',
};

interface SocialMediaSafeAreaProps {
  currentLang: Language;
  t: (key: any) => string;
  isRtl: boolean;
}

type Platform = 'tiktok' | 'instagram' | 'youtube';

export default function SocialMediaSafeArea({ t, isRtl }: SocialMediaSafeAreaProps) {
  const { triggerAd } = useAdManager();
  const [dragActive, setDragActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    type: string;
    dimensions: string;
  } | null>(null);

  // Tools states
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('tiktok');
  const [opacity, setOpacity] = useState<number>(80); // 10% to 100%
  const [showWireframe, setShowWireframe] = useState<boolean>(true);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const loadedSrc = event.target.result as string;
        setImageSrc(loadedSrc);

        const img = new Image();
        img.src = loadedSrc;
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          setFileDetails({
            name: file.name,
            size: formatSize(file.size),
            type: file.type,
            dimensions: `${w} × ${h} px`
          });
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const triggerCleanDownload = () => {
    if (!imageSrc || !fileDetails) return;
    triggerAd(() => {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = `clean_${fileDetails.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // TikTok UI Wireframe Overlay
  const renderTikTokOverlay = () => {
    return (
      <div className="absolute inset-0 flex flex-col justify-between text-white p-3 select-none" style={{ opacity: opacity / 100 }}>
        {/* Top Header */}
        <div className="flex justify-between items-center w-full pt-1.5 px-2">
          <span className="text-[10px] font-bold tracking-tight opacity-40">LIVE</span>
          <div className="flex gap-4 text-xs font-semibold">
            <span className="opacity-60">Following</span>
            <span className="border-b-2 border-white pb-1">For You</span>
          </div>
          <Search className="w-4 h-4 opacity-70" />
        </div>

        {/* Middle and Bottom content */}
        <div className="flex flex-col justify-end h-full mt-auto w-full space-y-3">
          
          <div className="flex justify-between items-end w-full">
            
            {/* Left Box: Creator details & description (dangerous overlapping zone) */}
            <div className="max-w-[70%] space-y-1.5 text-left text-xs drop-shadow-md">
              <div className="font-bold flex items-center gap-1.5">
                <span>@designer_studio</span>
                <span className="px-1.5 py-0.5 bg-cyan-400 text-slate-950 font-sans font-bold text-[8px] rounded-sm uppercase tracking-wider">CREATOR</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-95">
                Make sure your essential text is placed above this area! Social elements here will block design components. #design #tutorial #reels
              </p>
              <div className="flex items-center gap-1.5 opacity-80 mt-1">
                <Music className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-[10px] font-mono truncate">Original sound - Designer Studio</span>
              </div>
            </div>

            {/* Right Side Buttons: Actions (extremely dangerous region) */}
            <div className="flex flex-col items-center gap-4 text-center pr-1 drop-shadow-md pb-1 z-10">
              
              {/* Creator Profile */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full border border-white bg-slate-800 flex items-center justify-center font-bold text-xs">
                  DS
                </div>
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-rose-500 rounded-full p-0.5 text-white">
                  <Plus className="w-3 h-3" />
                </div>
              </div>

              {/* Likes */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <Heart className="w-5.5 h-5.5 fill-rose-500 stroke-rose-500" />
                </div>
                <span className="text-[10px] font-semibold">124.5K</span>
              </div>

              {/* Comments */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <MessageCircle className="w-5.5 h-5.5 fill-white stroke-white" />
                </div>
                <span className="text-[10px] font-semibold">1.4K</span>
              </div>

              {/* Save/Bookmarks */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <Bookmark className="w-5.5 h-5.5 fill-amber-500 stroke-amber-500" />
                </div>
                <span className="text-[10px] font-semibold">45.2K</span>
              </div>

              {/* Share */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <Share2 className="w-5 h-5 fill-white" />
                </div>
                <span className="text-[10px] font-semibold">12.8K</span>
              </div>

              {/* Music Disk */}
              <div className="w-9 h-9 rounded-full border border-slate-700 bg-slate-950 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-slate-800 to-amber-500 flex items-center justify-center animate-spin" style={{ animationDuration: '6s' }}>
                  <Music className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Feed Navigation */}
          <div className="border-t border-white/10 pt-2.5 flex justify-around w-full text-[10px] font-semibold bg-black/30 backdrop-blur-xs rounded-b-xl -mx-3 px-3">
            <span className="text-white">Home</span>
            <span className="opacity-50">Friends</span>
            <div className="px-3 bg-white text-black font-bold text-sm rounded-md flex items-center justify-center -mt-1 h-6">
              <Plus className="w-4 h-4 text-black" />
            </div>
            <span className="opacity-50">Inbox</span>
            <span className="opacity-50">Profile</span>
          </div>

        </div>
      </div>
    );
  };

  // Instagram Reels UI Wireframe Overlay
  const renderInstagramOverlay = () => {
    return (
      <div className="absolute inset-0 flex flex-col justify-between text-white p-4 select-none" style={{ opacity: opacity / 100 }}>
        {/* Top Header */}
        <div className="flex justify-between items-center w-full pt-1">
          <span className="text-sm font-bold tracking-tight flex items-center gap-1.5 drop-shadow">
            Reels <Compass className="w-3.5 h-3.5 animate-pulse" />
          </span>
          <MoreVertical className="w-4 h-4 opacity-90 drop-shadow" />
        </div>

        {/* Middle and Bottom content */}
        <div className="flex flex-col justify-end h-full mt-auto w-full space-y-4">
          
          <div className="flex justify-between items-end w-full">
            
            {/* Left Box: User Info & Caption */}
            <div className="max-w-[70%] space-y-2 text-left text-xs drop-shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-900 border border-slate-900 flex items-center justify-center text-[10pt] font-mono leading-none">
                     ds
                  </div>
                </div>
                <span className="font-bold text-[11px]">designer_studio</span>
                <span className="px-2 py-0.5 border border-white/40 text-[9px] font-semibold rounded-md">Follow</span>
              </div>
              
              <p className="text-[11px] leading-relaxed opacity-90 font-light">
                Use this layout overlay to protect your typography. Instagram uses bottom left and right panels for vital text and tags.
              </p>
              
              <div className="flex items-center gap-1.5 opacity-80 text-[10px]">
                <Music className="w-3 h-3" />
                <span className="truncate">Original Audio • designer_studio</span>
              </div>
            </div>

            {/* Right Side Buttons */}
            <div className="flex flex-col items-center gap-5 text-center drop-shadow-md z-10 select-none pb-2">
              
              {/* Like */}
              <div className="space-y-1">
                <Heart className="w-6 h-6 stroke-white stroke-[2px] cursor-pointer hover:scale-115 transition" />
                <span className="text-[10px] font-bold block">245K</span>
              </div>

              {/* Comment */}
              <div className="space-y-1">
                <MessageCircle className="w-6 h-6 stroke-white stroke-[2px] cursor-pointer hover:scale-115 transition" />
                <span className="text-[10px] font-bold block">1.8K</span>
              </div>

              {/* Share */}
              <div className="space-y-1">
                <Share2 className="w-5.5 h-5.5 stroke-white stroke-[2px] cursor-pointer hover:scale-115 transition" />
                <span className="text-[10px] font-bold block">Share</span>
              </div>

              {/* Audio Box */}
              <div className="w-6.5 h-6.5 rounded-md border border-white/40 overflow-hidden">
                <div className="w-full h-full bg-slate-800 flex items-center justify-center font-mono text-[8px] font-bold text-slate-400">
                  ♫
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Feed Navigation */}
          <div className="border-t border-white/10 pt-3 flex justify-around w-full text-white bg-black/45 backdrop-blur-xs rounded-b-xl -mx-4 px-4 pb-1">
            <Home className="w-4.5 h-4.5 opacity-60" />
            <Search className="w-4.5 h-4.5 opacity-60" />
            <div className="w-5 h-5 rounded-md border border-white/60 flex items-center justify-center text-xs font-bold font-mono">
              +
            </div>
            <Film className="w-4.5 h-4.5 text-white" />
            <User className="w-4.5 h-4.5 opacity-60" />
          </div>

        </div>
      </div>
    );
  };

  // YouTube Shorts UI Wireframe Overlay
  const renderYouTubeOverlay = () => {
    return (
      <div className="absolute inset-0 flex flex-col justify-between text-white p-3 select-none" style={{ opacity: opacity / 100 }}>
        {/* Top Header */}
        <div className="flex justify-between items-center w-full pt-1.5 px-1">
          <span className="text-xs font-bold flex items-center gap-1 drop-shadow uppercase font-sans tracking-wide">
            <span className="bg-red-600 px-1 py-0.5 rounded text-[8px] mr-1">SHORTS</span>
          </span>
          <div className="flex gap-4">
            <Search className="w-4 h-4 opacity-80" />
            <MoreVertical className="w-4 h-4 opacity-80" />
          </div>
        </div>

        {/* Middle and Bottom content */}
        <div className="flex flex-col justify-end h-full mt-auto w-full space-y-3">
          
          <div className="flex justify-between items-end w-full">
            
            {/* Left Box: Title, Channel, & Tags */}
            <div className="max-w-[70%] space-y-2 text-left text-xs drop-shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center font-mono text-[10px] font-bold">
                  Y
                </div>
                <span className="font-bold text-[11px] truncate">@designer_studio</span>
                <span className="px-2 py-1 bg-red-600 text-[10px] font-bold rounded-lg text-white">Subscribe</span>
              </div>
              
              <p className="text-[11px] leading-relaxed opacity-95">
                Our YouTube wireframe highlights safe boundaries of Title and descriptions. Always check button heights! #youtube #shorts #safezone
              </p>
              
              <div className="flex items-center gap-1 opacity-80 text-[10px]">
                <Music className="w-3 h-3" />
                <span className="truncate">Original audio - Designer Studio</span>
              </div>
            </div>

            {/* Right Side Buttons */}
            <div className="flex flex-col items-center gap-4 text-center pr-1 drop-shadow-md z-10">
              
              {/* Like */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 fill-white" />
                </div>
                <span className="text-[10px] font-bold">95.4K</span>
              </div>

              {/* Dislike */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 fill-white/10" />
                </div>
                <span className="text-[10px] font-bold">Dislike</span>
              </div>

              {/* Comments */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <span className="text-[10px] font-bold">2.5K</span>
              </div>

              {/* Share */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <Share2 className="w-4.5 h-4.5 stroke-white" />
                </div>
                <span className="text-[10px] font-bold">Share</span>
              </div>

              {/* Remix */}
              <div className="space-y-0.5">
                <div className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center">
                  <Repeat className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-[10px] font-bold">Remix</span>
              </div>

              {/* Sound Profile */}
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/60">
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-red-500" />
              </div>

            </div>

          </div>

          {/* Bottom Space */}
          <div className="h-2" />

        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6" id="social-media-safe-area-checker-workspace">
      
      {/* Informative banner area */}
      <div className="flex gap-3 bg-indigo-50 dark:bg-indigo-955/20 border border-indigo-100 dark:border-indigo-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('safe_area.tip_title')}
          </p>
          <p>
            {t('safe_area.tip_desc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Upload Design and Bezel Viewport Canvas */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-500" />
              {isRtl ? 'معاينة شاشة الهاتف المحاكاة' : 'Simulated Mobile Viewport'}
            </h3>
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 rounded-full text-[10px] font-bold uppercase">
              9:16 Aspect
            </span>
          </div>

          {!imageSrc ? (
            /* Upload Box sandbox */
            <div
              className={`border-3 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer min-h-[420px] flex flex-col justify-center items-center gap-4 ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 bg-slate-50 dark:bg-slate-900/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('safearea-file-selector')?.click()}
            >
              <input
                id="safearea-file-selector"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-indigo-100 dark:bg-indigo-955/40 text-indigo-600 dark:text-indigo-400 rounded-full">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('safe_area.select_image')}
                </p>
                <p className="text-xs text-slate-450 max-w-sm mx-auto">
                  {t('safe_area.on_device_processing')}
                </p>
              </div>
              <button 
                type="button"
                className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition shadow active:scale-95 mt-2"
              >
                {t('safe_area.upload_image')}
              </button>
            </div>
          ) : (
            /* Bezel phone wrapper container containing the background image + overlay wireframe */
            <div className="flex flex-col items-center justify-center space-y-4">
              
              {/* Phone Device Outer Frame wrapper */}
              <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-[40px] bg-slate-950 p-2.5 shadow-2xl border-4 border-slate-800/80 outline-4 outline-slate-900 dark:outline-slate-800 ring-1 ring-black/40 flex items-center justify-center overflow-hidden">
                
                {/* Smartphone ear speaker notch speaker bar at the top */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-black rounded-full z-30 flex items-center justify-between px-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-850" />
                  <div className="w-10 h-1 bg-slate-800 rounded-full" />
                  <div className="w-2.5 h-1 bg-slate-800 rounded-full" />
                </div>

                {/* Main Screen internal container */}
                <div className="relative w-full h-full rounded-[30px] overflow-hidden bg-slate-900 flex items-center justify-center z-10 select-none">
                  
                  {/* Background user image scaled to fill/fit within device screen constraints */}
                  <img
                    src={imageSrc}
                    alt="Uploaded design template"
                    className="w-full h-full object-cover"
                  />

                  {/* Red alert boundary box indicating common dead areas if opacity is toggled */}
                  {showWireframe && (
                    <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-red-500/25 z-20">
                      {/* Left and right helper padding guides */}
                      <div className="absolute top-24 bottom-32 left-0 right-13 bg-green-500/5 border border-green-500/10 flex items-center justify-center text-[10px] font-mono text-green-500 font-bold tracking-widest uppercase">
                        {/* Perfect Safe Zone Info helper */}
                      </div>
                    </div>
                  )}

                  {/* Calibrated platform translucent vector wireframe on top */}
                  {showWireframe && selectedPlatform === 'tiktok' && renderTikTokOverlay()}
                  {showWireframe && selectedPlatform === 'instagram' && renderInstagramOverlay()}
                  {showWireframe && selectedPlatform === 'youtube' && renderYouTubeOverlay()}

                </div>

                {/* Smartphone bottom home indicator line bar */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/40 rounded-full z-30" />

              </div>

              {/* Reset layout image */}
              <button
                onClick={() => {
                  setImageSrc(null);
                  setFileDetails(null);
                }}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-bold text-slate-650 dark:text-slate-350 rounded-xl transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'رفع تصميم أو صورة مختلفة' : 'Test Different Design'}</span>
              </button>

            </div>
          )}
        </div>

        {/* Right Side: Options, platforms selectors, interactive transparency sliders */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Settings Control Panel */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-5 shadow-sm">
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2.5">
              <Sliders className="w-4 h-4 text-indigo-500" />
              {isRtl ? 'خيارات الفحص والتحكم' : 'Interactive Inspector Panel'}
            </h3>

            {/* Platform selection grids */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider block">
                {t('safe_area.select_platform')}
              </label>
              
              <div className="flex flex-col gap-2">
                
                {/* TikTok button */}
                <button
                  onClick={() => setSelectedPlatform('tiktok')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-left transition ${
                    selectedPlatform === 'tiktok'
                      ? 'bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950 border-transparent shadow'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{t('safe_area.tiktok')}</span>
                  </div>
                  <Flame className="w-4 h-4 text-rose-500" />
                </button>

                {/* Instagram button */}
                <button
                  onClick={() => setSelectedPlatform('instagram')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-left transition ${
                    selectedPlatform === 'instagram'
                      ? 'bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950 border-transparent shadow'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                    <span>{t('safe_area.instagram')}</span>
                  </div>
                  <Instagram className="w-4 h-4 text-pink-500" />
                </button>

                {/* YouTube button */}
                <button
                  onClick={() => setSelectedPlatform('youtube')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold text-left transition ${
                    selectedPlatform === 'youtube'
                      ? 'bg-slate-950 text-white dark:bg-amber-500 dark:text-slate-950 border-transparent shadow'
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                    <span>{t('safe_area.youtube')}</span>
                  </div>
                  <Youtube className="w-4 h-4 text-red-600" />
                </button>

              </div>
            </div>

            {/* Opacity slider */}
            <div className="space-y-2.5 pt-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                <span>{t('safe_area.overlay_opacity')}</span>
                <span className="font-mono text-indigo-500">{opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={(e) => setOpacity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 dark:accent-amber-500 focus:outline-none"
              />
            </div>

            {/* Toggle Overlay Wireframe completely */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isRtl ? 'عرض الطبقات التراكبية' : 'Toggle Overlay Elements'}
              </span>
              <button
                onClick={() => setShowWireframe(!showWireframe)}
                className={`p-2 rounded-xl transition ${
                  showWireframe 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-450'
                }`}
              >
                {showWireframe ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

          </div>

          {/* Action Export Button */}
          {imageSrc && (
            <div className="space-y-3">
              <button
                onClick={triggerCleanDownload}
                className="w-full py-3.5 px-6 bg-slate-950 hover:bg-slate-850 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-2xl shadow transition flex items-center justify-center gap-2 active:scale-[0.98] select-none"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{t('safe_area.download_clean')}</span>
              </button>

              {/* Display technical warning about overlapping content */}
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5 flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-[10px] text-slate-500 leading-normal">
                  <p className="font-bold text-rose-600 dark:text-rose-400 mb-0.5">
                    {isRtl ? 'تحذير تداخل النصوص والشعارات' : 'Visual Occlusion Danger Zone'}
                  </p>
                  <p>
                    {isRtl 
                      ? 'تجنب وضع النصوص الحيوية أو العناوين الهامة أو الهويات البصرية في النصف السفلي أو الحافة اليمنى لضمان أقصى حماية لظهور تصاميمك.' 
                      : 'Always keep text and headings separated from lower-right and bottom-left bounds to prevent social icons, avatars or channel subscribe tags from overlapping.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Technical file details */}
          {imageSrc && fileDetails && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                {isRtl ? 'تفاصيل ملف التصميم' : 'Design Document Details'}
              </h4>
              <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                <span className="text-slate-450">{isRtl ? 'اسم الملف الكلي' : 'Full Filename'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold select-all overflow-hidden truncate max-w-[200px]">{fileDetails.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] border-b border-slate-100 dark:border-slate-800/60 pb-1.5">
                <span className="text-slate-450">{isRtl ? 'الأبعاد الهندسية' : 'Geometric Resolution'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{fileDetails.dimensions}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-450">{isRtl ? 'صيغة وحجم الملف' : 'File Size / Format'}</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">{fileDetails.size} ({fileDetails.type.split('/')[1]?.toUpperCase()})</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
