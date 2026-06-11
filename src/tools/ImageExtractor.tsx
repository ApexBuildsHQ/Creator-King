import { useState, DragEvent, ChangeEvent } from 'react';
import { Palette, Upload } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'extractor',
  icon: 'Palette',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_extractor_title',
  descKey: 'tool_extractor_desc',
};

interface ImageExtractorProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  isRtl: boolean;
}

export default function ImageExtractor({ t, isRtl }: ImageExtractorProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    type: string;
    dimensions: string;
    lastModified: string;
  } | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

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

        // Feed to Canvas to analyze dimensions and pixel colors
        const img = new Image();
        img.src = loadedSrc;
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;

          setFileDetails({
            name: file.name,
            size: formatSize(file.size),
            type: file.type,
            dimensions: `${w} × ${h} px`,
            lastModified: new Date(file.lastModified).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
              year: 'numeric', month: 'short', day: 'numeric'
            })
          });

          // Palette Extraction logic from Image context
          const canvas = document.createElement('canvas');
          canvas.width = 100;
          canvas.height = 100;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, 100, 100);
            const data = ctx.getImageData(0, 0, 100, 100).data;
            const colorCounts: Record<string, number> = {};

            // Sample every 4th pixel to keep loop extremely fast
            for (let i = 0; i < data.length; i += 16) {
              const r = data[i];
              const g = data[i+1];
              const b = data[i+2];
              const a = data[i+3];

              if (a < 128) continue; // skip transparent pixels

              // Quantize slightly to group similar colors
              const qr = Math.round(r / 15) * 15;
              const qg = Math.round(g / 15) * 15;
              const qb = Math.round(b / 15) * 15;

              const hex = rgbToHex(qr, qg, qb);
              colorCounts[hex] = (colorCounts[hex] || 0) + 1;
            }

            // Sort colors by presence
            const sortedColors = Object.keys(colorCounts)
              .sort((a, b) => colorCounts[b] - colorCounts[a])
              .slice(0, 8); // top 8 prominent colors

            // Ensure we have some colors, or fall back
            if (sortedColors.length > 0) {
              setPalette(sortedColors);
            } else {
              setPalette(['#1E293B', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']);
            }
          }
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

  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, c)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const handleColorCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('extractorTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('extractorDesc')}</p>
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
            id="image-extractor-input"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="image-extractor-input" className="cursor-pointer flex flex-col items-center gap-3">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-md text-gray-400 dark:text-slate-300">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              {t('dragDropText')} <span className="text-amber-500 dark:text-amber-400 underline">{t('selectFileText')}</span>
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, WEBP, SVG ({t('privacyBadge')})</p>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Details Column */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-6 bg-gray-50/50 dark:bg-slate-900/40 p-5 rounded-2xl border border-gray-100 dark:border-slate-700/40">
            {/* Color Palette visualization */}
            <div>
              <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-3">{t('colorsFound')}</h4>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {palette.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleColorCopy(color)}
                    style={{ backgroundColor: color }}
                    className="h-14 w-full rounded-xl shadow-inner relative flex items-center justify-center transition hover:scale-105 active:scale-95 group"
                    title={color}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute bg-black/75 text-[10px] text-white py-0.5 px-1.5 rounded-md pointer-events-none transition duration-150">
                      {color}
                    </span>
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-gray-400 text-center">
                {t('clickCopyHex')}
              </div>
              {copiedColor && (
                <div className="mt-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {t('copiedToClipboard')} {copiedColor}
                </div>
              )}
            </div>

            {/* File Specs Metadata */}
            <div className="border-t border-gray-100 dark:border-slate-700/60 pt-4 space-y-3">
              <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">{t('exifData')}</h4>
              {fileDetails && (
                <div className="text-xs space-y-2 font-mono">
                  <div className="flex justify-between py-1 border-b border-gray-100/30 dark:border-slate-700/20">
                    <span className="text-gray-500">{t('filenameField')}:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[150px]">{fileDetails.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100/30 dark:border-slate-700/20">
                    <span className="text-gray-500">{t('fileSizeField')}:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{fileDetails.size}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100/30 dark:border-slate-700/20">
                    <span className="text-gray-500">{t('fileMimeField')}:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium text-[10px]">{fileDetails.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-100/30 dark:border-slate-700/20">
                    <span className="text-gray-500">{t('resolutionField')}:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-bold">{fileDetails.dimensions}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">{t('modifiedDateField')}:</span>
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{fileDetails.lastModified}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setImageSrc(null);
                setFileDetails(null);
                setPalette([]);
              }}
              className="w-full py-2 px-4 text-xs font-semibold text-gray-500 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition"
            >
              {t('analyzeAnotherImage')}
            </button>
          </div>

          {/* Preview Canvas Row */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col gap-4">
            <span className="text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold animate-none">
              {t('preview')}
            </span>
            <div className="flex-1 min-h-[250px] relative border border-gray-100 dark:border-slate-700/80 bg-gray-50 dark:bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-4">
              <img
                src={imageSrc}
                alt="Source preview"
                className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
