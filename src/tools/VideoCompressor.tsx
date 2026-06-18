import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Zap, Sliders, Download, Upload } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'video_compressor',
  icon: 'Sliders',
  category: 'video',
  isFullyInteractive: true,
  titleKey: 'tool_video_compressor_title',
  descKey: 'tool_video_compressor_desc',
};

const ffmpeg = createFFmpeg({ log: false });

const presets = [
  { id: 'low', label: 'video_compressor.preset_low', crf: 18 },
  { id: 'mid', label: 'video_compressor.preset_mid', crf: 24 },
  { id: 'high', label: 'video_compressor.preset_high', crf: 32 },
];

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function VideoCompressor({ t }: { currentLang: Language; t: (key: string) => string; isRtl: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [crf, setCrf] = useState(24);
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [targetSize, setTargetSize] = useState<number>(25);
  const [originalSize, setOriginalSize] = useState<number|null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) return;
    setOriginalSize(file.size);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    if (!originalSize) return;
    const rate = 300 + (35 - crf) * 25;
    const duration = 60;
    const estimate = Math.max(0.5, (duration * rate) / 8 / 1024);
    setEstimatedSize(estimate);
  }, [crf, originalSize]);

  const handlePreset = (selectedCrf: number) => {
    setCrf(selectedCrf);
    if (selectedCrf === 18) setTargetSize(100);
    if (selectedCrf === 24) setTargetSize(40);
    if (selectedCrf === 32) setTargetSize(18);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) return;
    setFile(selectedFile);
    setDownloadUrl('');
  };

  const getEstimatedSize = () => {
    if (!originalSize) return 0;
    const bitrate = (crf < 20 ? 6000 : crf < 28 ? 4000 : 1800) * 1000;
    const duration = 60;
    return Math.max(0.5, (duration * bitrate) / 8 / 1024 / 1024);
  };

  const handleCompress = async () => {
    if (!file) return;
    setLoading(true);
    setDownloadUrl('');
    try {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      const inputName = 'input.mp4';
      const outputName = 'output.mp4';
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      await ffmpeg.run('-i', inputName, '-c:v', 'libx264', '-crf', String(crf), '-preset', 'medium', '-c:a', 'aac', '-b:a', '128k', outputName);
      const data = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_video_compressor_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_video_compressor_desc')}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePreset(preset.crf)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  crf === preset.crf ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {t(preset.label)}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('video_compressor.custom_size')}</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={targetSize}
                onChange={(event) => setTargetSize(Number(event.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="w-16 text-right text-sm font-semibold text-slate-900 dark:text-white">{targetSize} MB</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('video_compressor.original_size')}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{originalSize ? formatBytes(originalSize) : '–'}</p>
            </div>
            <div className="rounded-2xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('video_compressor.estimated_size')}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{(originalSize ? getEstimatedSize() : 0).toFixed(2)} MB</p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('uploadBtn')}</label>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="mt-3 w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">{t('video_compressor.desc')}</div>
            <button
              type="button"
              onClick={handleCompress}
              disabled={!file || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-white font-semibold hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sliders className="w-4 h-4" />
              {t('video_compressor.compress_btn')}
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="compressed_video.mp4"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500 px-4 py-3 text-amber-700 hover:bg-amber-50 transition"
              >
                <Download className="w-4 h-4" />
                {t('downloadBtn')}
              </a>
            )}
          </div>

          <div className="rounded-3xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('quality')}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">CRF {crf}</p>
            <div className="mt-4 rounded-2xl bg-slate-200 dark:bg-slate-800 h-2 overflow-hidden">
              <div className="h-full bg-amber-500" style={{ width: `${((crf - 18) / 17) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
