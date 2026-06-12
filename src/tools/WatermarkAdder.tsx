import { useEffect, useMemo, useRef, useState, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Layers, ImagePlus, Type, Upload, Download, Palette, Sparkles } from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';

export const toolInfo: ToolInfo = {
  id: 'watermark_adder',
  icon: 'Layers',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_watermark_adder_title',
  descKey: 'tool_watermark_adder_desc',
};

const fontOptions = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
];

const positionCells = [
  { id: 1, label: 'TL' },
  { id: 2, label: 'TC' },
  { id: 3, label: 'TR' },
  { id: 4, label: 'CL' },
  { id: 5, label: 'CC' },
  { id: 6, label: 'CR' },
  { id: 7, label: 'BL' },
  { id: 8, label: 'BC' },
  { id: 9, label: 'BR' },
];

const getOverlayPosition = (position: number, offsetX: number, offsetY: number) => {
  const xMap: Record<number, string> = {
    1: `${offsetX}`,
    2: `(main_w-overlay_w)/2+${offsetX}`,
    3: `main_w-overlay_w-${offsetX}`,
    4: `${offsetX}`,
    5: `(main_w-overlay_w)/2+${offsetX}`,
    6: `main_w-overlay_w-${offsetX}`,
    7: `${offsetX}`,
    8: `(main_w-overlay_w)/2+${offsetX}`,
    9: `main_w-overlay_w-${offsetX}`,
  };

  const yMap: Record<number, string> = {
    1: `${offsetY}`,
    2: `${offsetY}`,
    3: `${offsetY}`,
    4: `(main_h-overlay_h)/2+${offsetY}`,
    5: `(main_h-overlay_h)/2+${offsetY}`,
    6: `(main_h-overlay_h)/2+${offsetY}`,
    7: `main_h-overlay_h-${offsetY}`,
    8: `main_h-overlay_h-${offsetY}`,
    9: `main_h-overlay_h-${offsetY}`,
  };

  return `${xMap[position]}:${yMap[position]}`;
};

const createWatermarkBlob = async (text: string, font: string, color: string): Promise<Blob> => {
  const fontSize = 52;
  const padding = 28;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas not supported');
  }

  context.font = `${fontSize}px ${font}, sans-serif`;
  const textMetrics = context.measureText(text);
  const width = Math.ceil(textMetrics.width + padding * 2);
  const height = Math.ceil(fontSize * 1.6 + padding * 2);

  canvas.width = Math.max(width, 120);
  canvas.height = Math.max(height, 80);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = `${fontSize}px ${font}, sans-serif`;
  context.textBaseline = 'middle';
  context.textAlign = 'left';
  context.fillStyle = color;
  context.shadowColor = 'rgba(0,0,0,0.25)';
  context.shadowBlur = 12;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.fillText(text, padding, canvas.height / 2);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate watermark image'));
      }
    }, 'image/png');
  });
};

export default function WatermarkAdder({ t }: ToolComponentProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#ffffff');
  const [selectedFont, setSelectedFont] = useState(fontOptions[0]);
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string>('');
  const [position, setPosition] = useState(9);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [opacity, setOpacity] = useState(80);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('watermarked_video.mp4');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const ffmpeg = useRef<any>(createFFmpeg({
    log: false,
    progress: ({ ratio }) => {
      if (typeof ratio === 'number') {
        setProgress(Math.round(ratio * 100));
      }
    },
  }));

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl('');
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  useEffect(() => {
    if (!watermarkImage) {
      setWatermarkImageUrl('');
      return;
    }
    const url = URL.createObjectURL(watermarkImage);
    setWatermarkImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [watermarkImage]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const isReadyToProcess = !!videoFile && (watermarkType === 'image' ? !!watermarkImage : watermarkText.trim().length > 0);

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErrorMessage(t('watermark_adder.error_invalid_video'));
      return;
    }
    setVideoFile(file);
    setOutputName(`${file.name.replace(/\.[^.]+$/, '')}_watermarked.mp4`);
    setErrorMessage('');
    setDownloadUrl('');
  };

  const handleWatermarkImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    setWatermarkImage(file);
  };

  const ensureFfmpegLoaded = async () => {
    const ff = ffmpeg.current;
    if (!ff.isLoaded()) {
      setStatusMessage(t('watermark_adder.loading_ffmpeg'));
      await ff.load();
    }
  };

  const buildOverlayFilter = () => {
    const overlayPosition = getOverlayPosition(position, offsetX, offsetY);
    const alphaValue = Math.max(0, Math.min(opacity / 100, 1));
    return `[1:v]format=rgba,colorchannelmixer=aa=${alphaValue}[wm];[0:v][wm]overlay=${overlayPosition}:format=auto,format=yuv420p`;
  };

  const createOverlayFile = async () => {
    if (watermarkType === 'image' && watermarkImage) {
      return watermarkImage;
    }

    return await createWatermarkBlob(watermarkText.trim(), selectedFont, watermarkColor);
  };

  const handleApplyWatermark = async () => {
    if (!videoFile) {
      setErrorMessage(t('watermark_adder.error_missing_video'));
      return;
    }

    if (!isReadyToProcess) {
      setErrorMessage(t('watermark_adder.error_missing_text'));
      return;
    }

    setLoadingState(true);

    try {
      await ensureFfmpegLoaded();
      const ff = ffmpeg.current;
      const inputName = 'input_video.mp4';
      const overlayName = 'overlay.png';
      const outputName = downloadFileName || 'watermarked_video.mp4';

      ff.FS('writeFile', inputName, await fetchFile(videoFile));
      const overlayBlob = await createOverlayFile();
      ff.FS('writeFile', overlayName, await fetchFile(overlayBlob));

      const filter = buildOverlayFilter();
      const commands = [
        '-i', inputName,
        '-i', overlayName,
        '-filter_complex', filter,
        '-map', '0:v',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputName,
      ];

      setStatusMessage(t('watermark_adder.processing'));
      await ff.run(...commands);

      const data = ff.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatusMessage(t('watermark_adder.ready_download'));
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage(t('watermark_adder.error_processing'));
      setStatusMessage('');
    } finally {
      setLoadingState(false);
    }
  };

  const [loadingState, setLoadingState] = useState(false);

  const watermarkPreview = useMemo(() => {
    if (watermarkType === 'image' && watermarkImageUrl) return watermarkImageUrl;
    if (watermarkType === 'text' && watermarkText.trim()) return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"120\"><rect width=\"100%\" height=\"100%\" fill=\"transparent\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"${watermarkColor}\" font-family=\"${selectedFont}\" font-size=\"42\">${watermarkText}</text></svg>`)}
    );
    return '';
  }, [watermarkType, watermarkImageUrl, watermarkText, watermarkColor, selectedFont]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_watermark_adder_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_watermark_adder_desc')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="rounded-3xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-slate-50 dark:bg-slate-950/70 p-5 text-center transition hover:border-amber-400">
            <Upload className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('watermark_adder.title')}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('watermark_adder.desc')}</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              {t('uploadBtn')}
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('original')}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{videoFile?.name || '–'}</p>
            </div>
            <div className="rounded-3xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('preview')}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{videoFile ? `${Math.round(videoFile.size / 1024 / 1024)} MB` : '–'}</p>
            </div>
          </div>

          {videoUrl && (
            <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-950">
              <video className="w-full" src={videoUrl} controls muted playsInline />
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.position_grid')}</p>
            <div className="grid grid-cols-3 gap-2">
              {positionCells.map((cell) => (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => setPosition(cell.id)}
                  className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                    position === cell.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cell.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.x_offset')}</span>
              <input
                type="number"
                value={offsetX}
                onChange={(event) => setOffsetX(Number(event.target.value))}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.y_offset')}</span>
              <input
                type="number"
                value={offsetY}
                onChange={(event) => setOffsetY(Number(event.target.value))}
                className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.opacity')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{opacity}%</p>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {t('preview')}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setWatermarkType('text')}
              className={`rounded-3xl px-4 py-4 text-sm font-semibold text-left transition ${
                watermarkType === 'text'
                  ? 'bg-amber-500 text-white border border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5" />
                <span>{t('watermark_adder.type_text')}</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setWatermarkType('image')}
              className={`rounded-3xl px-4 py-4 text-sm font-semibold text-left transition ${
                watermarkType === 'image'
                  ? 'bg-amber-500 text-white border border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-transparent hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <ImagePlus className="w-5 h-5" />
                <span>{t('watermark_adder.type_image')}</span>
              </div>
            </button>
          </div>

          {watermarkType === 'text' ? (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.text_input_placeholder')}</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(event) => setWatermarkText(event.target.value)}
                placeholder={t('watermark_adder.text_input_placeholder')}
                className="w-full rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.select_font')}</label>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('watermark_adder.color_picker')}</label>
                <select
                  value={selectedFont}
                  onChange={(event) => setSelectedFont(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
                <input
                  type="color"
                  value={watermarkColor}
                  onChange={(event) => setWatermarkColor(event.target.value)}
                  className="h-12 w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Palette className="w-6 h-6 text-amber-500" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t('watermark_adder.upload_image')}</p>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
                    {t('uploadBtn')}
                    <input type="file" accept="image/*" className="hidden" onChange={handleWatermarkImageChange} />
                  </label>
                </div>
              </div>
              {watermarkImageUrl && (
                <div className="rounded-3xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-slate-950">
                  <img className="w-full object-contain" src={watermarkImageUrl} alt="Watermark preview" />
                </div>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{t('watermark_adder.type_text')}</span>
            </div>
            {watermarkPreview && (
              <div className="mt-4 rounded-2xl bg-white dark:bg-slate-900 p-4 text-center text-sm text-slate-900 dark:text-slate-100">
                <p className="font-semibold">{t('watermark_adder.preview')}</p>
                {watermarkType === 'image' ? (
                  <img className="mx-auto mt-3 max-h-28 object-contain" src={watermarkPreview} alt="Preview" />
                ) : (
                  <div className="mt-3 inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 px-4 py-6 text-base font-semibold text-slate-900 dark:text-slate-100" style={{ fontFamily: selectedFont, color: watermarkColor }}>
                    {watermarkText || 'Watermark'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              disabled={!isReadyToProcess || loadingState}
              onClick={handleApplyWatermark}
              className="w-full inline-flex items-center justify-center gap-3 rounded-3xl bg-amber-500 px-5 py-4 text-sm font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {t('watermark_adder.apply_btn')}
            </button>

            {statusMessage && (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {statusMessage}
                {loadingState && progress > 0 && (
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-amber-100">
                    <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadFileName}
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl border border-amber-500 bg-white px-5 py-4 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
              >
                <Download className="w-4 h-4" />
                {t('downloadBtn')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
