import { useState, useEffect, useRef, DragEvent, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Video, Upload, ArrowUpDown, RotateCcw, Download, ListChecks } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'video_merger',
  icon: 'Video',
  category: 'video',
  isFullyInteractive: true,
  titleKey: 'tool_video_merger_title',
  descKey: 'tool_video_merger_desc',
};

const ffmpeg = createFFmpeg({ log: false });

interface ClipItem {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  duration: number;
}

interface VideoMergerProps {
  currentLang: Language;
  t: (key: string) => string;
  isRtl: boolean;
}

const presets = [
  { id: 'first', label: 'Match first video' },
  { id: '16_9', label: '16:9' },
  { id: '9_16', label: '9:16' },
];

function createObjectURL(file: File) {
  return URL.createObjectURL(file);
}

export default function VideoMerger({ t }: VideoMergerProps) {
  const [clips, setClips] = useState<ClipItem[]>([]);
  const [activePreset, setActivePreset] = useState<'first' | '16_9' | '9_16'>('first');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      clips.forEach((clip) => URL.revokeObjectURL(clip.url));
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [clips, downloadUrl]);

  const loadClipMetadata = (file: File) => {
    return new Promise<ClipItem>((resolve, reject) => {
      const url = createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => {
        resolve({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          url,
          width: video.videoWidth || 0,
          height: video.videoHeight || 0,
          duration: video.duration || 0,
        });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).filter((file) => file.type.startsWith('video/'));
    if (selected.length === 0) {
      setErrorMessage(t('video_cutter.error_format'));
      return;
    }
    setErrorMessage('');
    const loadedClips: ClipItem[] = [];
    for (const file of selected) {
      try {
        const clip = await loadClipMetadata(file);
        loadedClips.push(clip);
      } catch {
        setErrorMessage(t('video_cutter.error_format'));
      }
    }
    setClips((current) => [...current, ...loadedClips]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const moveClip = (index: number, direction: 'up' | 'down') => {
    setClips((current) => {
      const next = [...current];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return next;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeClip = (index: number) => {
    setClips((current) => {
      const next = [...current];
      URL.revokeObjectURL(next[index].url);
      next.splice(index, 1);
      return next;
    });
  };

  const getTargetDimensions = () => {
    if (activePreset === 'first' && clips.length > 0) {
      return { width: clips[0].width, height: clips[0].height };
    }
    return activePreset === '16_9' ? { width: 1280, height: 720 } : { width: 720, height: 1280 };
  };

  const buildFilter = (clip: ClipItem, target: { width: number; height: number }) => {
    const { width, height } = clip;
    const targetAspect = target.width / target.height;
    const clipAspect = width / height;
    let scaleFilter = '';
    let padFilter = '';
    if (clipAspect > targetAspect) {
      scaleFilter = `scale=${target.width}:-2`;
      padFilter = `pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2:black`;
    } else {
      scaleFilter = `scale=-2:${target.height}`;
      padFilter = `pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2:black`;
    }
    return `${scaleFilter},${padFilter}`;
  };

  const runMerge = async () => {
    if (clips.length < 2) {
      setErrorMessage(t('video_cutter.error_format'));
      return;
    }
    setErrorMessage('');
    setLoading(true);
    setDownloadUrl('');
    try {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      const target = getTargetDimensions();
      const inputs: string[] = [];
      const filterComplex: string[] = [];
      const concatInputs: string[] = [];
      for (let index = 0; index < clips.length; index += 1) {
        const clip = clips[index];
        const name = `input${index}.mp4`;
        ffmpeg.FS('writeFile', name, await fetchFile(clip.file));
        inputs.push('-i', name);
        const filter = buildFilter(clip, target);
        filterComplex.push(`[${index}:v]${filter}[v${index}]`);
        filterComplex.push(`[${index}:a]aresample=async=1[a${index}]`);
        concatInputs.push(`[v${index}][a${index}]`);
      }

      const outputName = `merged_${Date.now()}.mp4`;
      const filterString = `${filterComplex.join(';')};${concatInputs.join('')}concat=n=${clips.length}:v=1:a=1[outv][outa]`;
      await ffmpeg.run(...inputs, '-filter_complex', filterString, '-map', '[outv]', '-map', '[outa]', '-c:v', 'libx264', '-c:a', 'aac', outputName);
      const data = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error) {
      setErrorMessage(t('video_cutter.error_format'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Video className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_video_merger_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_video_merger_desc')}</p>
        </div>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-500/40 bg-slate-50 dark:bg-slate-900/60 p-8 text-center transition hover:border-amber-400"
      >
        <Upload className="mx-auto h-10 w-10 text-amber-500" />
        <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('video_merger.drop_zone')}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('privacyBadge')}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) => handleFiles(event.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-amber-500 text-white px-4 py-3 font-semibold hover:bg-amber-600 transition"
        >
          <ListChecks className="w-4 h-4" />
          {t('uploadBtn')}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          {errorMessage}
        </div>
      )}

      {clips.length > 0 && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('video_merger.reorder')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{clips.length} clips</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActivePreset(preset.id as 'first' | '16_9' | '9_16')}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activePreset === preset.id
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {clips.map((clip, index) => (
                <div key={clip.id} className="grid grid-cols-[auto_1fr_auto] gap-4 items-center rounded-2xl border border-gray-100 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-950">
                  <div className="min-w-[84px] min-h-[56px] rounded-2xl overflow-hidden bg-black">
                    <video src={clip.url} className="h-full w-full object-cover" muted preload="metadata" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{clip.file.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {Math.round(clip.duration)} sec · {clip.width}×{clip.height}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => moveClip(index, 'up')}
                      disabled={index === 0}
                      className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                    >
                      <ArrowUpDown className="w-4 h-4 rotate-[-90deg]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveClip(index, 'down')}
                      disabled={index === clips.length - 1}
                      className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 disabled:opacity-40"
                    >
                      <ArrowUpDown className="w-4 h-4 rotate-[90deg]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeClip(index)}
                      className="rounded-2xl bg-rose-100 text-rose-600 p-2 hover:bg-rose-200 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{t('video_merger.resolution_preset')}</p>
              <span className="text-xs text-slate-500 dark:text-slate-400">{getTargetDimensions().width}×{getTargetDimensions().height}</span>
            </div>
            <button
              type="button"
              onClick={runMerge}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? t('video_merger.processing') : t('video_merger.merge_btn')}
            </button>
            {downloadUrl && (
              <a
                href={downloadUrl}
                download="merged_video.mp4"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500 px-4 py-3 font-semibold text-amber-700 hover:bg-amber-50 transition"
              >
                <Download className="w-4 h-4" />
                {t('downloadBtn')}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
