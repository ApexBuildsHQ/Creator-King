import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Rewind, Upload, RotateCcw, Speaker, VolumeX, Volume2, Download } from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';

export const toolInfo: ToolInfo = {
  id: 'video_reverser',
  icon: 'Rewind',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_video_reverser_title',
  descKey: 'tool_video_reverser_desc',
};

type AudioMode = 'reverse' | 'mute' | 'forward';

const ffmpegRefSymbol = Symbol('ffmpegRef');

export default function VideoReverser({ t }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [audioMode, setAudioMode] = useState<AudioMode>('reverse');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const ffmpeg = useRef<any>(createFFmpeg({
    log: false,
    progress: ({ ratio }) => {
      if (typeof ratio === 'number') {
        setProgress(Math.round(ratio * 100));
      }
    },
  }));

  useEffect(() => {
    if (!file) {
      setVideoUrl('');
      setOutputFileName('');
      return;
    }

    setErrorMessage('');
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setOutputFileName(`${file.name.replace(/\.[^.]+$/, '')}_reversed.mp4`);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

export default function VideoReverser({ t }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [audioMode, setAudioMode] = useState<AudioMode>('reverse');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!file) {
      setVideoUrl('');
      setOutputFileName('');
      return;
    }

    setErrorMessage('');
    const objectUrl = URL.createObjectURL(file);
    setVideoUrl(objectUrl);
    setOutputFileName(`${file.name.replace(/\.[^.]+$/, '')}_reversed.mp4`);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) {
      setErrorMessage(t('video_reverser.error_format'));
      return;
    }
    setFile(selectedFile);
    setDownloadUrl('');
    setProgress(0);
    setStatusMessage('');
    setErrorMessage('');
  };

  const ensureFfmpegLoaded = async () => {
    const ff = ffmpeg.current;
    if (!ff.isLoaded()) {
      setStatusMessage(t('video_reverser.loading_ffmpeg'));
      await ff.load();
    }
  };

  const buildCommand = (inputName: string, outputName: string) => {
    const commands: string[] = ['-i', inputName, '-vf', 'reverse'];

    if (audioMode === 'reverse') {
      commands.push('-af', 'areverse', '-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-c:a', 'aac', '-b:a', '128k');
    }

    if (audioMode === 'mute') {
      commands.push('-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '24');
    }

    if (audioMode === 'forward') {
      commands.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-c:a', 'aac', '-b:a', '128k');
    }

    commands.push(outputName);
    return commands;
  };

  const handleReverse = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage('');
    setStatusMessage(t('video_reverser.processing'));
    setProgress(0);
    setDownloadUrl('');

    try {
      await ensureFfmpegLoaded();
      const ff = ffmpeg.current;
      const inputName = `input_${Date.now()}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const outputName = `output_${Date.now()}.mp4`;
      ff.FS('writeFile', inputName, await fetchFile(file));

      const commands = buildCommand(inputName, outputName);
      await ff.run(...commands);

      const data = ff.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setOutputFileName(outputName);
      setStatusMessage(t('video_reverser.ready_download'));
    } catch (error) {
      console.error(error);
      setErrorMessage(t('video_reverser.error_conversion'));
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleAudioModeChange = (mode: AudioMode) => {
    setAudioMode(mode);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-3xl text-amber-500">
          <Rewind className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_video_reverser_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_video_reverser_desc')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="rounded-3xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-slate-50 dark:bg-slate-950/60 p-6 text-center transition hover:border-amber-400">
            <Upload className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('dragDropText')}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('privacyBadge')}</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              {t('video_reverser.upload_btn')}
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {videoUrl && (
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <video src={videoUrl} controls className="w-full rounded-3xl bg-black" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                <div>{file?.name}</div>
                <div>{file ? formatFileSize(file.size) : ''}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('video_reverser.audio_mode')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleAudioModeChange('reverse')}
                  className={`rounded-3xl px-4 py-4 text-sm font-semibold transition shadow-sm ${audioMode === 'reverse' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {t('video_reverser.audio_reverse')}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAudioModeChange('mute')}
                  className={`rounded-3xl px-4 py-4 text-sm font-semibold transition shadow-sm ${audioMode === 'mute' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <VolumeX className="w-4 h-4" />
                    {t('video_reverser.audio_mute')}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAudioModeChange('forward')}
                  className={`rounded-3xl px-4 py-4 text-sm font-semibold transition shadow-sm ${audioMode === 'forward' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    {t('video_reverser.audio_keep')}
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <label className="sr-only" htmlFor="video-reverser-action">
                {t('video_reverser.reverse_btn')}
              </label>
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleReverse}
                className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-amber-500 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="w-5 h-5" />
                {t('video_reverser.reverse_btn')}
              </button>
            </div>

            {loading && (
              <div className="space-y-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-slate-700 dark:text-slate-100">
                <div className="flex items-center justify-between font-semibold text-amber-700 dark:text-amber-200">
                  <span>{statusMessage}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {statusMessage && !loading && !errorMessage && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                {statusMessage}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-3xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:text-rose-200">
                {errorMessage}
              </div>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={outputFileName}
                className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800"
              >
                <Download className="w-4 h-4" />
                {t('downloadBtn')}
              </a>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="rounded-3xl bg-amber-50 dark:bg-amber-500/10 p-4">
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-100">{t('video_reverser.title')}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('video_reverser.desc')}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('video_reverser.audio_mode')}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('video_reverser.audio_reverse')}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('video_reverser.audio_mode')}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('video_reverser.audio_mute')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
