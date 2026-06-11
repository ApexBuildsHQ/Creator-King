import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { Music, Upload, Play, Download } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'audio_extractor',
  icon: 'Music',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_audio_extractor_title',
  descKey: 'tool_audio_extractor_desc',
};

const ffmpeg = createFFmpeg({ log: false });

export default function AudioExtractor({ t }: { currentLang: Language; t: (key: string) => string; isRtl: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrate, setBitrate] = useState<'128k' | '192k' | '320k'>('192k');
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [startTime, setStartTime] = useState('00:00:00.000');
  const [endTime, setEndTime] = useState('00:00:10.000');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [fileName, setFileName] = useState('audio_extracted');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const parseTimestamp = (value: string) => {
    const parts = value.split(':');
    if (parts.length !== 3) return 0;
    const hrs = parseFloat(parts[0]) || 0;
    const mins = parseFloat(parts[1]) || 0;
    const secs = parseFloat(parts[2]) || 0;
    return hrs * 3600 + mins * 60 + secs;
  };

  const formatTimestamp = (value: number) => {
    const hrs = Math.floor(value / 3600);
    const mins = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('video/')) return;
    setFile(selectedFile);
    setFileName(selectedFile.name.replace(/\.[^/.]+$/, ''));
  };

  const buildFilterArgs = () => {
    const args = [];
    if (trimEnabled) {
      args.push('-ss', startTime);
      args.push('-to', endTime);
    }
    return args;
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    setSuccessMessage('');
    setDownloadUrl('');
    try {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load();
      }
      const inputName = 'input_video';
      ffmpeg.FS('writeFile', inputName, await fetchFile(file));
      const outputName = `${fileName}_audio.${format}`;
      const formatArgs = format === 'mp3'
        ? ['-c:a', 'libmp3lame', '-b:a', bitrate]
        : ['-c:a', 'pcm_s16le'];
      await ffmpeg.run('-i', inputName, ...buildFilterArgs(), ...formatArgs, outputName);
      const data = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: format === 'mp3' ? 'audio/mpeg' : 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setSuccessMessage(t('audio_extractor.success_msg'));
    } catch {
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500 dark:text-amber-400">
          <Music className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_audio_extractor_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_audio_extractor_desc')}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('audio_extractor.format')}</label>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  format === 'mp3' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                MP3
              </button>
              <button
                type="button"
                onClick={() => setFormat('wav')}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  format === 'wav' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                WAV
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('audio_extractor.bitrate')}</label>
            <select
              value={bitrate}
              onChange={(event) => setBitrate(event.target.value as '128k' | '192k' | '320k')}
              className="mt-3 w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="128k">128kbps</option>
              <option value="192k">192kbps</option>
              <option value="320k">320kbps</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="trim-enabled"
            checked={trimEnabled}
            onChange={() => setTrimEnabled(!trimEnabled)}
            className="h-4 w-4 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
          />
          <label htmlFor="trim-enabled" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            {t('audio_extractor.trim_option')}
          </label>
        </div>

        {trimEnabled && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('audio_extractor.start_time')}</label>
              <input
                type="text"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                placeholder="00:00:00.000"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">{t('audio_extractor.end_time')}</label>
              <input
                type="text"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100"
                placeholder="00:00:10.000"
              />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('original')}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{file ? file.name : '–'}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('audio_extractor.format')}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{format.toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-white font-semibold hover:bg-amber-600 transition"
          >
            <Upload className="w-4 h-4" />
            {t('uploadBtn')}
          </button>
          <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
          <button
            type="button"
            onClick={handleExtract}
            disabled={!file || loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-white font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {t('audio_extractor.extract_btn')}
          </button>
        </div>

        {successMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            download={`${fileName}.${format}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-amber-500 px-4 py-3 text-amber-700 hover:bg-amber-50 transition"
          >
            <Download className="w-4 h-4" />
            {t('downloadBtn')}
          </a>
        )}
      </div>
    </div>
  );
}
