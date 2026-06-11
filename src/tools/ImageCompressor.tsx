import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { Download, Upload, Sliders, Image as ImageIcon } from 'lucide-react';
import { Language, TranslationSet } from '../types';

interface ImageCompressorProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  isRtl: boolean;
}

export default function ImageCompressor({ t, isRtl }: ImageCompressorProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState('');
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedSrc, setCompressedSrc] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(0.75);
  const [scale, setScale] = useState<number>(100);
  const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

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
    setOriginalName(file.name);
    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageSrc(event.target.result as string);
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

  // Run Compression
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const originalW = img.naturalWidth;
      const originalH = img.naturalHeight;
      const targetW = Math.round(originalW * (scale / 100));
      const targetH = Math.round(originalH * (scale / 100));

      setDimensions({ w: targetW, h: targetH });

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, targetW, targetH);
        
        let format = 'image/jpeg';
        if (originalName.endsWith('.png')) {
          format = 'image/png';
        } else if (originalName.endsWith('.webp')) {
          format = 'image/webp';
        }

        const compressedData = canvas.toDataURL(format, quality);
        setCompressedSrc(compressedData);

        // Calculate approximate size
        const head = `data:${format};base64,`.length;
        const approxBytes = Math.round((compressedData.length - head) * 3 / 4);
        setCompressedSize(approxBytes);
      }
    };
  }, [imageSrc, quality, scale, originalName]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const getCompressionPercentage = () => {
    if (!originalSize || !compressedSize) return 0;
    const diff = originalSize - compressedSize;
    const pct = (diff / originalSize) * 100;
    return pct > 0 ? Math.round(pct) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('compressorTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('compressorDesc')}</p>
        </div>
      </div>

      {!imageSrc ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            dragActive
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-500/5'
              : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-gray-50/30 dark:bg-slate-900/10'
          }`}
        >
          <input
            type="file"
            id="image-uploader"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="image-uploader" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-md text-gray-400 dark:text-slate-300">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {t('dragDropText')} <span className="text-amber-500 dark:text-amber-400 underline">{t('selectFileText')}</span>
            </p>
            <p className="text-xs text-gray-400">PNG, JPEG, WEBP ({t('privacyBadge')})</p>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-5 bg-gray-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/40">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{t('howToUse')}</h4>

            {/* Slider 1: Quality */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 font-medium">{t('quality')}</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Slider 2: Scale */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300 font-medium border-0">
                  {t('resizeScale')}
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{scale}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-400">
                {t('targetResolution')} {dimensions.w} × {dimensions.h} px
              </p>
            </div>

            {/* Comparison Statistics */}
            <div className="space-y-2 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/60 shadow-sm">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('original')}:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{originalSize ? formatSize(originalSize) : '--'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('compressed')}:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{compressedSize ? formatSize(compressedSize) : '--'}</span>
              </div>
              {getCompressionPercentage() > 0 && (
                <div className="mt-2 text-center py-1 px-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold ring-1 ring-emerald-500/20">
                  {t('savedSpace')} {getCompressionPercentage()}% {t('ofStorageSpace')}
                </div>
              )}
            </div>

            {/* CTA action buttons */}
            <div className="flex gap-2">
              <a
                href={compressedSrc || '#'}
                download={`compressed_${originalName}`}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition"
              >
                <Download className="w-5 h-5" />
                <span>{t('downloadBtn')}</span>
              </a>
              <button
                onClick={() => {
                  setImageSrc(null);
                  setCompressedSrc(null);
                  setOriginalSize(null);
                  setCompressedSize(null);
                }}
                className="py-3 px-4 text-sm font-semibold text-gray-500 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 select-none"
              >
                {t('clearBtn')}
              </button>
            </div>
          </div>

          {/* Preview Column */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-4">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold animate-none">
              {t('preview')}
            </span>
            <div className="flex-1 min-h-[250px] relative border border-gray-100 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-4">
              {compressedSrc ? (
                <img
                  src={compressedSrc}
                  alt="Compressed preview"
                  className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-gray-400 animate-pulse flex flex-col items-center">
                  <ImageIcon className="w-12 h-12 mb-2" />
                  <span className="text-sm">Processing Content...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
