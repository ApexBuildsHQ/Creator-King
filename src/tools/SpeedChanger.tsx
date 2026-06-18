import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Zap, Upload, Play, Volume2, Download } from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';

export const toolInfo: ToolInfo = {
  id: 'speed_changer',
  icon: 'Zap',
  category: 'video',
  isFullyInteractive: true,
  titleKey: 'tool_speed_changer_title',
  descKey: 'tool_speed_changer_desc',
};

const speedPresets = [0.5, 1.0, 1.5, 2.0] as const;

export default function SpeedChanger({ t }: ToolComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [outputFileName, setOutputFileName] = useState<string>('');
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);
  const [pitchLock, setPitchLock] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
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
    setOutputFileName(`${file.name.replace(/\.[^.]+$/, '')}_${currentSpeed}x.mp4`);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, currentSpeed]);

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
      setErrorMessage(t('speed_changer.error_format'));
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
      setStatusMessage(t('speed_changer.loading_ffmpeg'));
      await ff.load();
    }
  };

  const buildCommand = (inputName: string, outputName: string, speed: number) => {
    const commands: string[] = ['-i', inputName];

    if (speed === 1.0) {
      commands.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-c:a', 'aac', '-b:a', '128k', outputName);
      return commands;
    }

    const videoSpeed = speed.toFixed(3);
    const audioSpeed = pitchLock ? `asetrate=44100*${videoSpeed},atempo=${(speed / 2).toFixed(3)}` : `atempo=${videoSpeed}`;

    commands.push('-filter:v', `setpts=${(1 / speed).toFixed(3)}*PTS`);

    if (speed > 2.0) {
      commands.push('-filter:a', audioSpeed);
    } else {
      commands.push('-filter:a', `atempo=${videoSpeed}`);
    }

    commands.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '24', '-c:a', 'aac', '-b:a', '128k', outputName);

    return commands;
  };

  const handleChangeSpeed = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage('');
    setStatusMessage(t('speed_changer.processing'));
    setProgress(0);
    setDownloadUrl('');

    try {
      await ensureFfmpegLoaded();
      const ff = ffmpeg.current;
      const inputName = `input_${Date.now()}${file.name.slice(file.name.lastIndexOf('.'))}`;
      const outputName = `output_${Date.now()}.mp4`;
      ff.FS('writeFile', inputName, await fetchFile(file));

      const commands = buildCommand(inputName, outputName, currentSpeed);
      await ff.run(...commands);

      const data = ff.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setOutputFileName(outputName);
      setStatusMessage(t('speed_changer.ready_download'));
    } catch (error) {
      console.error(error);
      setErrorMessage(t('speed_changer.error_conversion'));
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
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
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_speed_changer_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_speed_changer_desc')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="rounded-3xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-slate-50 dark:bg-slate-950/60 p-6 text-center transition hover:border-amber-400">
            <Upload className="mx-auto h-10 w-10 text-amber-500" />
            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('dragDropText')}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('privacyBadge')}</p>
            <label className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
              {t('speed_changer.upload_btn')}
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {videoUrl && (
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <video ref={videoRef} src={videoUrl} controls className="w-full rounded-3xl bg-black" />
              <div className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                <div>{file?.name}</div>
                <div>{file ? formatFileSize(file.size) : ''}</div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('speed_changer.custom_speed')}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                {speedPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCurrentSpeed(preset)}
                    className={`rounded-3xl px-4 py-3 text-sm font-semibold transition shadow-sm ${currentSpeed === preset ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {preset}x
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('speed_changer.custom_speed_slider')}</label>
                <span className="rounded-full bg-white dark:bg-slate-800 px-4 py-1.5 text-sm font-bold text-amber-500">{currentSpeed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={0.25}
                max={4.0}
                step={0.05}
                value={currentSpeed}
                onChange={(event) => setCurrentSpeed(Number(event.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
                <span>0.25x</span>
                <span>2.0x</span>
                <span>4.0x</span>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pitchLock}
                  onChange={(event) => setPitchLock(event.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('speed_changer.pitch_lock')}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('speed_changer.pitch_lock_desc')}</p>
                </div>
              </label>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <button
                type="button"
                disabled={!file || loading}
                onClick={handleChangeSpeed}
                className="w-full inline-flex items-center justify-center gap-2 rounded-3xl bg-amber-500 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="w-5 h-5" />
                {t('speed_changer.process_btn')}
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
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-100">{t('speed_changer.title')}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('speed_changer.desc')}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('speed_changer.preset_speeds')}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('speed_changer.preset_desc')}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('speed_changer.advanced_range')}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('speed_changer.range_desc')}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">{t('speed_changer.pitch_lock')}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('speed_changer.pitch_lock_help')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
