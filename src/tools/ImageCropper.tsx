import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { 
  Download, 
  Upload, 
  Crop, 
  RotateCw, 
  RotateCcw, 
  Sparkles, 
  Lock, 
  Unlock, 
  Image as ImageIcon,
  RefreshCw,
  Scaling,
  FlipHorizontal,
  FlipVertical
} from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

export const toolInfo: ToolInfo = {
  id: 'image_cropper',
  icon: 'Crop',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_image_cropper_title',
  descKey: 'tool_image_cropper_desc',
};

interface ImageCropperProps {
  currentLang: Language;
  t: (key: any) => string;
  isRtl: boolean;
}

export default function ImageCropper({ t, isRtl }: ImageCropperProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('image_cropped.png');
  const [fileType, setFileType] = useState('image/png');
  
  // CropperJS states
  const [activePreset, setActivePreset] = useState<'free' | '1_1' | '9_16' | '16_9' | '4_5'>('free');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [exportQuality, setExportQuality] = useState<number>(0.92);

  // Manual dimensions updated from crop events
  const [widthInput, setWidthInput] = useState<string>('0');
  const [heightInput, setHeightInput] = useState<string>('0');
  
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropperRef = useRef<Cropper | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // File loading function
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setOriginalName(file.name);
    setFileType(file.type);
    
    // Choose export format default matching file type
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      setExportFormat('image/jpeg');
    } else if (file.type === 'image/webp') {
      setExportFormat('image/webp');
    } else {
      setExportFormat('image/png');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
        setActivePreset('free');
        setIsLocked(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
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

  // Setup / reset CropperJS
  useEffect(() => {
    if (!imageSrc || !imageRef.current) return;

    // Destroy existing first
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    let initialAspectRatio: number = NaN;
    if (activePreset === '1_1') initialAspectRatio = 1;
    else if (activePreset === '9_16') initialAspectRatio = 9 / 16;
    else if (activePreset === '16_9') initialAspectRatio = 16 / 9;
    else if (activePreset === '4_5') initialAspectRatio = 4 / 5;

    // Instantiate Cropper.js
    const cropper = new Cropper(imageRef.current, {
      aspectRatio: initialAspectRatio,
      viewMode: 1, // restricts crop box within canvas limits
      autoCropArea: 0.85,
      background: true,
      responsive: true,
      zoomable: true,
      zoomOnTouch: true,
      zoomOnWheel: true,
      crop(event) {
        if (!isTypingRef.current) {
          setWidthInput(Math.round(event.detail.width).toString());
          setHeightInput(Math.round(event.detail.height).toString());
        }
      }
    } as any);

    cropperRef.current = cropper;

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [imageSrc, activePreset]);

  // Handle Preset changes
  const applyPreset = (preset: 'free' | '1_1' | '9_16' | '16_9' | '4_5') => {
    setActivePreset(preset);
    if (!cropperRef.current) return;
    
    if (preset === 'free') {
      cropperRef.current.setAspectRatio(NaN);
      setIsLocked(false);
    } else {
      let ratio = 1;
      if (preset === '1_1') ratio = 1;
      else if (preset === '9_16') ratio = 9 / 16;
      else if (preset === '16_9') ratio = 16 / 9;
      else if (preset === '4_5') ratio = 4 / 5;

      cropperRef.current.setAspectRatio(ratio);
      setIsLocked(true);
    }
  };

  // Toggle Aspect Ratio Proportional Lock
  const toggleRatioLock = () => {
    if (!cropperRef.current) return;
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);

    if (nextLocked) {
      const data = cropperRef.current.getData();
      const currentRatio = data.width / data.height;
      cropperRef.current.setAspectRatio(currentRatio);
    } else {
      cropperRef.current.setAspectRatio(NaN);
      setActivePreset('free');
    }
  };

  // Handle Width Input alteration manually
  const handleWidthInputChange = (val: string) => {
    setWidthInput(val);
    const parsedWidth = parseInt(val, 10);
    if (!isNaN(parsedWidth) && parsedWidth > 0 && cropperRef.current) {
      isTypingRef.current = true;
      const data = cropperRef.current.getData();
      let calculatedHeight = data.height;

      if (isLocked) {
        const ratio = data.height > 0 ? (data.width / data.height) : 1;
        calculatedHeight = parsedWidth / ratio;
      }

      cropperRef.current.setData({
        width: parsedWidth,
        height: Math.round(calculatedHeight)
      });
      setHeightInput(Math.round(calculatedHeight).toString());
      isTypingRef.current = false;
    }
  };

  // Handle Height Input alteration manually
  const handleHeightInputChange = (val: string) => {
    setHeightInput(val);
    const parsedHeight = parseInt(val, 10);
    if (!isNaN(parsedHeight) && parsedHeight > 0 && cropperRef.current) {
      isTypingRef.current = true;
      const data = cropperRef.current.getData();
      let calculatedWidth = data.width;

      if (isLocked) {
        const ratio = data.height > 0 ? (data.width / data.height) : 1;
        calculatedWidth = parsedHeight * ratio;
      }

      cropperRef.current.setData({
        width: Math.round(calculatedWidth),
        height: parsedHeight
      });
      setWidthInput(Math.round(calculatedWidth).toString());
      isTypingRef.current = false;
    }
  };

  // Cropper Manipulation Tools
  const rotateLeft = () => {
    cropperRef.current?.rotate(-90);
  };

  const rotateRight = () => {
    cropperRef.current?.rotate(90);
  };

  const flipX = () => {
    if (!cropperRef.current) return;
    const currentData = cropperRef.current.getData();
    cropperRef.current.scaleX(-cropperRef.current.getData().scaleX || -1);
  };

  const flipY = () => {
    if (!cropperRef.current) return;
    cropperRef.current.scaleY(-cropperRef.current.getData().scaleY || -1);
  };

  const triggerReset = () => {
    cropperRef.current?.reset();
    setActivePreset('free');
    setIsLocked(false);
  };

  // Generate Cropped canvas & download it
  const handleCropAndDownload = () => {
    if (!cropperRef.current) return;

    // Get cropped canvas
    const croppedCanvas = cropperRef.current.getCroppedCanvas({
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });

    if (!croppedCanvas) return;

    // Convert to target mime structure
    const dataUrl = croppedCanvas.toDataURL(exportFormat, exportQuality);
    
    // Trigger download anchor
    const downloadAnchor = document.createElement('a');
    
    // Construct premium file extension matching format selection
    const rawName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const extension = exportFormat === 'image/png' ? 'png' : exportFormat === 'image/webp' ? 'webp' : 'jpg';
    downloadAnchor.download = `${rawName}_cropped.${extension}`;
    downloadAnchor.href = dataUrl;
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  return (
    <div className="w-full space-y-6" id="image-cropper-overall-workspace">
      
      {/* Banner / Tip Alert Area */}
      <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-2xl">
        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
          <p className="font-bold text-slate-800 dark:text-white">
            {t('image_cropper.title')}
          </p>
          <p>
            {t('image_cropper.drag_tip')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Creative Sandbox Viewport */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              {t('thumbnail_maker.canvas_viewport')}
            </h3>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 rounded-full text-[10px] font-bold uppercase">
              {t('thumbnail_maker.active_sandbox')}
            </span>
          </div>

          {!imageSrc ? (
            /* Upload Box */
            <div
              className={`border-3 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer min-h-[400px] flex flex-col justify-center items-center gap-4 ${
                dragActive 
                  ? 'border-amber-500 bg-amber-500/5' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 bg-slate-50 dark:bg-slate-900/20'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('cropper-file-selector')?.click()}
            >
              <input
                id="cropper-file-selector"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t('image_cropper.select_image')}
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t('image_cropper.on_device_processing')}
                </p>
              </div>
              <button 
                type="button"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition shadow active:scale-95 mt-2"
              >
                {t('image_cropper.upload_image')}
              </button>
            </div>
          ) : (
            /* Cropper viewport panel */
            <div className="space-y-4">
              <div className="relative max-w-full h-[400px] sm:h-[450px] overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-[#0f172a] flex items-center justify-center">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Source"
                  className="max-h-full max-w-full block"
                />
              </div>

              {/* Manipulation quick toolbelt directly under viewport */}
              <div className="flex flex-wrap items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <button
                  onClick={rotateLeft}
                  title="Rotate left 90°"
                  className="p-2 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={rotateRight}
                  title="Rotate right 90°"
                  className="p-2 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                <button
                  onClick={flipX}
                  title="Horizontal Flip"
                  className="p-2 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={flipY}
                  title="Vertical Flip"
                  className="p-2 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <FlipVertical className="w-4 h-4" />
                </button>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
                <button
                  onClick={triggerReset}
                  title="Reset Cropper"
                  className="py-1 px-3 flex items-center gap-1.5 text-xs text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
                </button>

                <div className="grow" />
                <button
                  onClick={() => setImageSrc(null)}
                  className="px-2.5 py-1 text-[10px] text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300 font-mono underline"
                >
                  {isRtl ? 'تغيير الصورة' : 'Change Image'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Options and Export parameters box */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Section 1: Presets selection */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
              <Scaling className="w-4 h-4 text-amber-500" />
              {t('image_cropper.presets')}
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!imageSrc}
                onClick={() => applyPreset('free')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  !imageSrc 
                    ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-350 dark:text-slate-700' 
                    : activePreset === 'free'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-base mb-1">📐</span>
                <span className="text-[11px] font-bold block">{t('image_cropper.preset_free')}</span>
                <span className="text-[9px] text-slate-400 font-mono">Free size</span>
              </button>

              <button
                disabled={!imageSrc}
                onClick={() => applyPreset('1_1')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  !imageSrc 
                    ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-350 dark:text-slate-700' 
                    : activePreset === '1_1'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-base mb-1">🟩</span>
                <span className="text-[11px] font-bold block">{t('image_cropper.preset_1_1')}</span>
                <span className="text-[9px] text-slate-400 font-mono">1:1 Ratio</span>
              </button>

              <button
                disabled={!imageSrc}
                onClick={() => applyPreset('9_16')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  !imageSrc 
                    ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-350 dark:text-slate-700' 
                    : activePreset === '9_16'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-base mb-1">📱</span>
                <span className="text-[11px] font-bold block">{t('image_cropper.preset_9_16')}</span>
                <span className="text-[9px] text-slate-400 font-mono">9:16 Ratio</span>
              </button>

              <button
                disabled={!imageSrc}
                onClick={() => applyPreset('16_9')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition ${
                  !imageSrc 
                    ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-350 dark:text-slate-700' 
                    : activePreset === '16_9'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold'
                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-800/80 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <span className="text-base mb-1">🖥️</span>
                <span className="text-[11px] font-bold block">{t('image_cropper.preset_16_9')}</span>
                <span className="text-[9px] text-slate-400 font-mono">16:9 Ratio</span>
              </button>
            </div>
            
            <button
              disabled={!imageSrc}
              onClick={() => applyPreset('4_5')}
              className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border text-center transition ${
                !imageSrc 
                  ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-slate-800 text-slate-350' 
                  : activePreset === '4_5'
                  ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-semibold'
                  : 'border-slate-105 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-705 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span>🖼️</span>
              <span className="text-xs font-bold">{t('image_cropper.preset_4_5')} (4:5)</span>
            </button>
          </div>

          {/* Section 2: Proportional aspect locking & manual dimensions */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                {t('image_cropper.custom_dimensions')}
              </h3>
              
              {/* Aspect lock state button */}
              <button
                disabled={!imageSrc}
                onClick={toggleRatioLock}
                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                  !imageSrc
                    ? 'opacity-30 cursor-not-allowed'
                    : isLocked 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {isLocked ? (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>{t('image_cropper.lock_ratio')}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>{t('image_cropper.free_ratio')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Manual size edit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                  {t('image_cropper.width_px')}
                </label>
                <div className="relative">
                  <input
                    disabled={!imageSrc}
                    type="number"
                    value={widthInput}
                    onChange={(e) => handleWidthInputChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono text-center focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[9px] font-mono text-slate-400">px</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                  {t('image_cropper.height_px')}
                </label>
                <div className="relative">
                  <input
                    disabled={!imageSrc}
                    type="number"
                    value={heightInput}
                    onChange={(e) => handleHeightInputChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono text-center focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[9px] font-mono text-slate-400">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Professional export format and compression detail */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-800 pb-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              {isRtl ? '٣. خيارات التصدير والجودة' : '3. Export Quality & Compression'}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">{isRtl ? 'صيغة الصورة الناتجة:' : 'Output Format:'}</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      disabled={!imageSrc}
                      onClick={() => setExportFormat(fmt)}
                      className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition text-center ${
                        exportFormat === fmt
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      {fmt.split('/')[1].toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {exportFormat !== 'image/png' && (
                <div className="space-y-1 animate-fadeIn">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                    <span>{isRtl ? 'جودة الصورة التصديرية:' : 'Export Quality Percentage:'}</span>
                    <span className="text-indigo-500 font-mono">{Math.round(exportQuality * 100)}%</span>
                  </span>
                  <input
                    disabled={!imageSrc}
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Trigger conversion button */}
          <button
            disabled={!imageSrc}
            onClick={handleCropAndDownload}
            className={`w-full py-4 px-6 font-bold rounded-2xl shadow-lg transition duration-200 outline-none flex items-center justify-center gap-2 text-sm ${
              !imageSrc
                ? 'bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 active:scale-95 hover:shadow-amber-500/10 hover:shadow-xl'
            }`}
          >
            <Download className="w-5 h-5" />
            <span>{t('image_cropper.crop_btn')}</span>
          </button>

          {/* Secure details tag */}
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              {t('image_cropper.on_device_processing')}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
