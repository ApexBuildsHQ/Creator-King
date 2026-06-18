import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Film, Upload, Play, Scissors, Download } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'video_cutter',
  icon: 'Film',
  category: 'video',
  isFullyInteractive: true,
  titleKey: 'tool_video_cutter_title',
  descKey: 'tool_video_cutter_desc',
};

const ffmpeg = createFFmpeg({ log: false });

interface VideoCutterProps {
  currentLang: Language;
  t: (key: string) => string;
  isRtl: boolean;
}

function formatTimestamp(seconds: number) {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const pad = (value: number, width = 2) => String(value).padStart(width, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${String(ms).padStart(3, '0')}`;
}

function parseTimestamp(value: string) {
  const cleaned = value.trim();
  const parts = cleaned.split(':');
  if (parts.length !== 3) return 0;
  const [hh, mm, ss] = parts;
  const secondsPart = ss.includes('.') ? parseFloat(ss) : parseInt(ss, 10);
  const hours = parseInt(hh, 10) || 0;
  const minutes = parseInt(mm, 10) || 0;
  const secs = Number.isNaN(secondsPart) ? 0 : secondsPart;
  return Math.max(0, hours * 3600 + minutes * 60 + secs);
}

export default function VideoCutter({ t, isRtl }: VideoCutterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [videoUrl, downloadUrl]);

  useEffect(() => {
    if (!file) return;
    setErrorMessage('');
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setDownloadUrl('');
    setStartTime(0);
    setEndTime(0);
  }, [file]);

  useEffect(() => {
    if (duration > 0 && endTime === 0) {
      setEndTime(duration);
    }
  }, [duration, endTime]);

  useEffect(() => {
    if (endTime > duration) {
      setEndTime(duration);
    }
    if (startTime > endTime) {
      setStartTime(Math.max(0, endTime - 0.1));
    }
  }, [duration, startTime, endTime]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      setErrorMessage(t('video_cutter.error_format'));
      return;
    }
    setFile(selectedFile);
    setErrorMessage('');
  };

  const handleTimeFieldChange = (field: 'start' | 'end', value: string) => {
    const seconds = parseTimestamp(value);
    if (field === 'start') {
      const clipped = Math.min(seconds, duration, endTime);
      setStartTime(clipped);
    } else {
      const clipped = Math.min(seconds, duration);
      setEndTime(Math.max(clipped, startTime + 0.01));
    }
  };

  const handleRangeChange = (field: 'start' | 'end', value: number) => {
    if (field === 'start') {
      setStartTime(Math.min(value, endTime));
    } else {
      setEndTime(Math.max(value, startTime + 0.01));
    }
  };

  const preparePreview = () => {
    if (!videoRef.current || duration === 0) return;
    setErrorMessage('');
    const video = videoRef.current;
    video.currentTime = startTime;
    setPreviewing(true);
    const onTimeUpdate = () => {
      if (video.currentTime >= endTime || video.currentTime + 0.05 >= endTime) {
        video.pause();
        video.removeEventListener('timeupdate', onTimeUpdate);
        setPreviewing(false);
      }
    };
    video.addEventListener('timeupdate', onTimeUpdate);
    video.play().catch(() => {
      setPreviewing(false);
    });
  };

  const loadFfmpeg = async () => {
    if (!ffmpeg.isLoaded()) {
      setLoadingMessage('Loading FFmpeg...');
      await ffmpeg.load();
      setLoadingMessage('FFmpeg ready');
    }
  };

  const handleExport = async () => {
    if (!file || duration === 0) return;
    setErrorMessage('');
    setExporting(true);
    try {
      await loadFfmpeg();
      const inputName = `input_${Date.now()}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const outputName = `output_${Date.now()}.mp4`;
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      const ssArg = startTime.toFixed(3);
      const toArg = endTime.toFixed(3);
      await ffmpeg.run(
        '-i', inputName,
        '-ss', ssArg,
        '-to', toArg,
        '-c', 'copy',
        outputName
      );
      const data = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setLoadingMessage('Export completed');
    } catch (error) {
      setErrorMessage('Unable to export video segment. Please try a different file or shorten the segment.');
    } finally {
      setExporting(false);
      setTimeout(() => setLoadingMessage(''), 2500);
    }
  };

  const renderTimeInputs = (label: string, value: number, onChange: (value: string) => void) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{label}</label>
      <input
        type="text"
        value={formatTimestamp(value)}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
        placeholder="00:00:00.000"
        inputMode="numeric"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Film className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_video_cutter_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_video_cutter_desc')}</p>
        </div>
      </div>

      <div className="space-y-5">
        <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">
          {t('video_cutter.upload_btn')}
        </label>
        <div className="rounded-3xl border border-dashed border-gray-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-6 text-center">
          <input
            id="video-cutter-uploader"
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="video-cutter-uploader" className="cursor-pointer inline-flex flex-col items-center gap-3 px-4 py-6 rounded-3xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <Upload className="w-8 h-8" />
            <span className="font-medium">{t('video_cutter.upload_btn')}</span>
            <span className="text-xs text-gray-400">{t('privacyBadge')}</span>
          </label>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          {errorMessage}
        </div>
      ) : null}

      {videoUrl && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="w-full rounded-3xl bg-black"
                  onLoadedMetadata={(event) => {
                    const current = event.currentTarget;
                    setDuration(current.duration || 0);
                  }}
                />
              </div>

              <div className="space-y-4 rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      {t('video_cutter.start_time')}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatTimestamp(startTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      {t('video_cutter.end_time')}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatTimestamp(endTime)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Duration</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatTimestamp(Math.max(0, endTime - startTime))}</p>
                  </div>
                </div>

                <div className="relative h-12">
                  <div className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div
                    className="absolute inset-y-3 rounded-full bg-amber-500/25"
                    style={{ left: `${(startTime / Math.max(duration, 1)) * 100}%`, right: `${100 - (endTime / Math.max(duration, 1)) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={startTime}
                    onChange={(event) => handleRangeChange('start', Number(event.target.value))}
                    className="absolute inset-0 h-12 w-full appearance-none bg-transparent pointer-events-auto touch-none"
                    style={{ zIndex: 2 }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={endTime}
                    onChange={(event) => handleRangeChange('end', Number(event.target.value))}
                    className="absolute inset-0 h-12 w-full appearance-none bg-transparent pointer-events-auto touch-none"
                    style={{ zIndex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {renderTimeInputs(t('video_cutter.start_time'), startTime, (value) => handleTimeFieldChange('start', value))}
              {renderTimeInputs(t('video_cutter.end_time'), endTime, (value) => handleTimeFieldChange('end', value))}
              <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
                <button
                  type="button"
                  onClick={preparePreview}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-3 transition"
                >
                  <Play className="w-4 h-4" />
                  {t('video_cutter.preview')}
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting || duration === 0}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Scissors className="w-4 h-4" />
                  {exporting ? 'Exporting…' : t('video_cutter.export')}
                </button>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`cut_segment_${file?.name || 'segment'}.mp4`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-500 text-amber-700 hover:bg-amber-50 px-4 py-3 font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadBtn')}
                  </a>
                )}
                {loadingMessage && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{loadingMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
