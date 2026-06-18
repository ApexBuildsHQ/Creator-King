import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Video, Film, Upload, ArrowRight, Download } from 'lucide-react';
import { ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'video_converter',
  icon: 'Film',
  category: 'video',
  isFullyInteractive: true,
  titleKey: 'tool_video_converter_title',
  descKey: 'tool_video_converter_desc',
};

const allowedFps = [10, 15, 24] as const;
const widthPresets = [320, 480] as const;

export default function VideoConverter({ t }: { t: (key: string) => string }) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm' | 'gif'>('mp4');
  const [fps, setFps] = useState<number>(15);
  const [widthPreset, setWidthPreset] = useState<number>(320);
  const [customWidth, setCustomWidth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [outputFileName, setOutputFileName] = useState('');
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
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [videoUrl, downloadUrl]);

  useEffect(() => {
    if (!file) {
      setVideoUrl('');
      setOutputFileName('');
      return;
    }

    setErrorMessage('');
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setOutputFileName(`${file.name.replace(/\.[^.]+$/, '')}.${selectedFormat}`);
    return () => URL.revokeObjectURL(url);
  }, [file, selectedFormat]);

  useEffect(() => {
    if (selectedFormat !== 'gif') {
      setStatusMessage('');
    }
  }, [selectedFormat]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      setErrorMessage(t('video_converter.error_format'));
      return;
    }
    setFile(selectedFile);
    setErrorMessage('');
    setDownloadUrl('');
    setProgress(0);
  };

  const getOutputWidth = () => {
    if (customWidth.trim()) {
      const numeric = Number(customWidth.replace(/[^0-9]/g, ''));
      return numeric > 0 ? Math.min(960, Math.max(128, numeric)) : widthPreset;
    }
    return widthPreset;
  };

  const getOutputName = () => {
    const inputName = file?.name.replace(/\.[^.]+$/, '') || 'video';
    return `${inputName}.${selectedFormat}`;
  };

  const ensureFfmpegLoaded = async () => {
    const ff = ffmpeg.current;
    if (!ff.isLoaded()) {
      setStatusMessage(t('video_converter.loading_ffmpeg'));
      await ff.load();
    }
  };

  const runConversion = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage('');
    setStatusMessage(t('video_converter.converting'));
    setDownloadUrl('');
    setProgress(0);

    try {
      await ensureFfmpegLoaded();
      const ff = ffmpeg.current;
      const inputName = `input_${Date.now()}.${file.name.split('.').pop() || 'mp4'}`;
      const outputName = getOutputName();
      ff.FS('writeFile', inputName, await fetchFile(file));

      const commands: string[] = ['-i', inputName];

      if (selectedFormat === 'mp4') {
        commands.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-c:a', 'aac', '-b:a', '128k');
      }

      if (selectedFormat === 'webm') {
        commands.push('-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '30', '-c:a', 'libopus', '-b:a', '96k');
      }

      if (selectedFormat === 'gif') {
        const width = getOutputWidth();
        const filter = `fps=${fps},scale=${width}:-2:flags=lanczos`;
        commands.push('-vf', filter, '-loop', '0');
      }

      commands.push(outputName);
      await ff.run(...commands);
      const data = ff.FS('readFile', outputName);
      const blobType = selectedFormat === 'webm' ? 'video/webm' : selectedFormat === 'mp4' ? 'video/mp4' : 'image/gif';
      const blob = new Blob([data.buffer], { type: blobType });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setOutputFileName(outputName);
      setStatusMessage(t('video_converter.ready_download'));
    } catch (error) {
      setErrorMessage(t('video_converter.error_conversion'));
    } finally {
      setLoading(false);
    }
  };

  const handleFpsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    const closest = allowedFps.reduce((prev, current) => Math.abs(current - value) < Math.abs(prev - value) ? current : prev, allowedFps[0]);
    setFps(closest);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
          <Film className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_video_converter_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_video_converter_desc')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="rounded-3xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-slate-50 dark:bg-slate-950/60 p-5 text-center transition hover:border-amber-400">
            <Upload className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('dragDropText')}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('privacyBadge')}</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              {t('uploadBtn')}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('video_converter.target_format')}</label>
            <select
              value={selectedFormat}
              onChange={(event) => setSelectedFormat(event.target.value as 'mp4' | 'webm' | 'gif')}
              className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="mp4">{t('video_converter.format_mp4')}</option>
              <option value="webm">{t('video_converter.format_webm')}</option>
              <option value="gif">{t('video_converter.format_gif')}</option>
            </select>
          </div>

          {selectedFormat === 'gif' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('video_converter.fps_label')}</p>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300">{fps} fps</span>
                </div>
                <input
                  type="range"
                  min={allowedFps[0]}
                  max={allowedFps[allowedFps.length - 1]}
                  step={1}
                  value={fps}
                  onChange={handleFpsChange}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  {allowedFps.map((value) => (
                    <span key={value}>{value} fps</span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('video_converter.width_label')}</p>
                <div className="flex flex-wrap gap-3">
                  {widthPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setWidthPreset(preset);
                        setCustomWidth('');
                      }}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${customWidth === '' && widthPreset === preset ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                      {t(`video_converter.width_preset_${preset}`)}
                    </button>
                  ))}
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_0.8fr]">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customWidth}
                    onChange={(event) => {
                      setCustomWidth(event.target.value.replace(/[^0-9]/g, ''));
                      setWidthPreset(widthPresets[0]);
                    }}
                    placeholder={t('video_converter.custom_width_placeholder')}
                    className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('video_converter.width_label')}</p>
                    <p className="mt-2 font-semibold">{getOutputWidth()} px</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-950 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
              <Video className="w-5 h-5" />
              <span>{t('video_converter.title')}</span>
            </div>
            {file && (
              <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
                {t('video_converter.format_' + selectedFormat)}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-sm text-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{t('video_converter.file_info')}</p>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{file ? file.name : '–'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '–'}</p>
            </div>

            {videoUrl && (
              <video controls src={videoUrl} className="w-full rounded-3xl bg-black" />
            )}
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={runConversion}
              disabled={!file || loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowRight className="w-4 h-4" />
              {t('video_converter.convert_btn')}
            </button>

            {loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{statusMessage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                {errorMessage}
              </div>
            ) : null}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={outputFileName || getOutputName()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-500 px-4 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
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
