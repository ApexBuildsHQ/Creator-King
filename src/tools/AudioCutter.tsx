import { useState, useRef, useEffect, ChangeEvent, MouseEvent } from 'react';
import { Music, Upload, Download, Volume2, Zap } from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';

export const toolInfo: ToolInfo = {
  id: 'audio_cutter',
  icon: 'Music',
  category: 'audio',
  isFullyInteractive: true,
  titleKey: 'tool_audio_cutter_title',
  descKey: 'tool_audio_cutter_desc',
};

interface TimeRange {
  start: number;
  end: number;
}

interface FadeSettings {
  fadeInDuration: number;
  fadeOutDuration: number;
}

type ViewMode = 'full' | 'start' | 'end';

const timeToSeconds = (minutes: number, seconds: number, milliseconds: number): number => {
  return minutes * 60 + seconds + milliseconds / 1000;
};

const secondsToTime = (totalSeconds: number): { minutes: number; seconds: number; milliseconds: number } => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds % 1) * 1000);
  return { minutes, seconds, milliseconds };
};

const drawWaveform = (
  canvas: HTMLCanvasElement,
  audioBuffer: AudioBuffer,
  viewMode: ViewMode,
  timeRange: TimeRange,
  highlightStart?: number,
  highlightEnd?: number,
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const sampleRate = audioBuffer.sampleRate;
  const rawData = audioBuffer.getChannelData(0);

  // Determine visible time range
  let visibleStart = viewMode === 'full' ? timeRange.start : viewMode === 'start' ? timeRange.start : timeRange.end - 5;
  let visibleEnd = viewMode === 'full' ? timeRange.end : viewMode === 'start' ? timeRange.start + 5 : timeRange.end;

  visibleStart = Math.max(visibleStart, timeRange.start);
  visibleEnd = Math.min(visibleEnd, timeRange.end);

  const startSample = Math.floor(visibleStart * sampleRate);
  const endSample = Math.floor(visibleEnd * sampleRate);
  const samplesPerPixel = Math.max(1, Math.floor((endSample - startSample) / width));

  // Draw background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Draw center line
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  // Draw waveform
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 1.5;
  ctx.beginPath();

  for (let x = 0; x < width; x++) {
    let min = 0;
    let max = 0;

    for (let i = 0; i < samplesPerPixel && startSample + x * samplesPerPixel + i < endSample; i++) {
      const sample = rawData[startSample + x * samplesPerPixel + i] || 0;
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }

    const y1 = (1 - max) * (height / 2);
    const y2 = (1 - min) * (height / 2);

    if (x === 0) {
      ctx.moveTo(x, y1);
    } else {
      ctx.lineTo(x, y1);
    }
    ctx.lineTo(x, y2);
  }

  ctx.stroke();

  // Draw highlight region if specified
  if (highlightStart !== undefined && highlightEnd !== undefined) {
    const pixelStart = Math.max(0, ((highlightStart - visibleStart) / (visibleEnd - visibleStart)) * width);
    const pixelEnd = Math.min(width, ((highlightEnd - visibleStart) / (visibleEnd - visibleStart)) * width);

    if (pixelEnd > pixelStart) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
      ctx.fillRect(pixelStart, 0, pixelEnd - pixelStart, height);

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.strokeRect(pixelStart, 0, pixelEnd - pixelStart, height);
    }
  }
};

const applyFadeGain = (buffer: AudioBuffer, startTime: number, endTime: number, fadeSettings: FadeSettings) => {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);

  const fadeInSamples = Math.floor(fadeSettings.fadeInDuration * sampleRate);
  const fadeOutSamples = Math.floor(fadeSettings.fadeOutDuration * sampleRate);

  // Apply fade-in
  for (let i = 0; i < fadeInSamples && startSample + i < endSample; i++) {
    const gain = i / Math.max(1, fadeInSamples);
    channelData[startSample + i] *= gain;
  }

  // Apply fade-out
  for (let i = 0; i < fadeOutSamples && endSample - i > startSample; i++) {
    const gain = 1 - i / Math.max(1, fadeOutSamples);
    channelData[endSample - 1 - i] *= gain;
  }
};

const extractAudioSegment = (audioBuffer: AudioBuffer, startTime: number, endTime: number): AudioBuffer => {
  const offlineAudioContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.floor((endTime - startTime) * audioBuffer.sampleRate),
    audioBuffer.sampleRate,
  );

  const startSample = Math.floor(startTime * audioBuffer.sampleRate);
  const endSample = Math.floor(endTime * audioBuffer.sampleRate);
  const length = endSample - startSample;

  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const sourceData = audioBuffer.getChannelData(channel);
    const targetData = offlineAudioContext.createBuffer(audioBuffer.numberOfChannels, length, audioBuffer.sampleRate).getChannelData(channel);
    targetData.set(sourceData.slice(startSample, endSample));
  }

  return offlineAudioContext.createBuffer(audioBuffer.numberOfChannels, length, audioBuffer.sampleRate);
};

export default function AudioCutter({ t, isRtl }: ToolComponentProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>({ start: 0, end: 0 });
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [fadeSettings, setFadeSettings] = useState<FadeSettings>({ fadeInDuration: 0.5, fadeOutDuration: 0.5 });
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadFileName, setDownloadFileName] = useState('audio_cut.wav');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioSourceRef.current && isPlaying) {
        audioSourceRef.current.stop();
        setIsPlaying(false);
      }
    };
  }, [isPlaying]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      setErrorMessage(t('audio_cutter.error_format'));
      return;
    }

    setAudioFile(file);
    setErrorMessage('');
    setStatusMessage('');
    setDownloadUrl('');
    setDownloadFileName(`${file.name.replace(/\.[^.]+$/, '')}_cut.wav`);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const ctx = audioContextRef.current;
        if (!ctx) throw new Error('Audio context not initialized');

        const decoded = await ctx.decodeAudioData(arrayBuffer);
        setAudioBuffer(decoded);
        const duration = decoded.duration;
        setTimeRange({ start: 0, end: duration });
        setSelectionStart(0);
        setSelectionEnd(duration);
        setStatusMessage(t('audio_cutter.file_loaded'));
      } catch (error) {
        console.error(error);
        setErrorMessage(t('audio_cutter.error_decode'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Draw waveform when buffer or view changes
  useEffect(() => {
    if (audioBuffer && canvasRef.current) {
      drawWaveform(canvasRef.current, audioBuffer, viewMode, timeRange, selectionStart, selectionEnd);
    }
  }, [audioBuffer, viewMode, timeRange, selectionStart, selectionEnd]);

  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = canvas.width;

    let visibleStart = viewMode === 'full' ? timeRange.start : viewMode === 'start' ? timeRange.start : timeRange.end - 5;
    let visibleEnd = viewMode === 'full' ? timeRange.end : viewMode === 'start' ? timeRange.start + 5 : timeRange.end;

    visibleStart = Math.max(visibleStart, timeRange.start);
    visibleEnd = Math.min(visibleEnd, timeRange.end);

    const clickTime = visibleStart + (x / width) * (visibleEnd - visibleStart);
    const clampedTime = Math.max(timeRange.start, Math.min(timeRange.end, clickTime));

    if (Math.abs(clampedTime - selectionStart) < Math.abs(clampedTime - selectionEnd)) {
      setSelectionStart(Math.min(clampedTime, selectionEnd));
    } else {
      setSelectionEnd(Math.max(clampedTime, selectionStart));
    }
  };

  const handleCutAudio = async () => {
    if (!audioBuffer || !audioContextRef.current) return;

    setStatusMessage(t('audio_cutter.processing'));
    setErrorMessage('');

    try {
      let cutBuffer = extractAudioSegment(audioBuffer, selectionStart, selectionEnd);
      applyFadeGain(cutBuffer, 0, cutBuffer.duration, fadeSettings);

      const channelData = cutBuffer.getChannelData(0);
      const wav = encodeWAV(channelData, cutBuffer.sampleRate);
      const blob = new Blob([wav], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setStatusMessage(t('audio_cutter.ready_download'));
    } catch (error) {
      console.error(error);
      setErrorMessage(t('audio_cutter.error_processing'));
      setStatusMessage('');
    }
  };

  const handlePlayPreview = () => {
    if (!audioBuffer || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (isPlaying && audioSourceRef.current) {
      audioSourceRef.current.stop();
      setIsPlaying(false);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const offsetTime = selectionStart;
    const duration = selectionEnd - selectionStart;

    source.start(0, offsetTime, duration);
    audioSourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const { minutes, seconds: secs, milliseconds: ms } = secondsToTime(seconds);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${Math.round(ms / 10).toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Music className="w-8 h-8 text-amber-500" />
          <h1 className={`text-3xl font-bold ${isRtl ? 'text-right' : ''}`}>
            {t('tool_audio_cutter_title')}
          </h1>
        </div>
        <p className={`text-gray-600 dark:text-gray-400 ${isRtl ? 'text-right' : ''}`}>
          {t('tool_audio_cutter_desc')}
        </p>
      </div>

      {/* Upload Section */}
      <div className="rounded-3xl border border-dashed border-amber-300 dark:border-amber-500/30 bg-slate-50 dark:bg-slate-950/60 p-8 text-center transition hover:border-amber-400">
        <Upload className="mx-auto h-10 w-10 text-amber-500 mb-4" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{t('dragDropText')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('privacyBadge')}</p>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900 transition">
          {t('audio_cutter.upload_btn')}
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
          />
        </label>
      </div>

      {audioBuffer && (
        <>
          {/* Waveform Display */}
          <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-lg font-bold ${isRtl ? 'text-right' : ''}`}>
                {t('audio_cutter.waveform_title')}
              </h2>
              <div className="flex gap-2">
                {(['full', 'start', 'end'] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      viewMode === mode
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    {mode === 'full' ? 'Full' : mode === 'start' ? 'Start' : 'End'}
                  </button>
                ))}
              </div>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={200}
              onClick={handleCanvasClick}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-2xl cursor-crosshair"
              style={{ display: 'block' }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t('audio_cutter.click_hint')}
            </p>
          </div>

          {/* Time Range Inputs */}
          <div className="grid grid-cols-2 gap-6">
            {/* Start Time */}
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 block">
                {t('audio_cutter.start_time')}
              </label>
              <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mb-4">
                {formatTime(selectionStart)}
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={timeRange.end}
                  step="0.01"
                  value={selectionStart}
                  onChange={(e) => setSelectionStart(Math.min(parseFloat(e.target.value), selectionEnd))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* End Time */}
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 block">
                {t('audio_cutter.end_time')}
              </label>
              <div className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 mb-4">
                {formatTime(selectionEnd)}
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max={timeRange.end}
                  step="0.01"
                  value={selectionEnd}
                  onChange={(e) => setSelectionEnd(Math.max(parseFloat(e.target.value), selectionStart))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Fade Settings */}
          <div className="grid grid-cols-2 gap-6">
            {/* Fade In */}
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 block">
                {t('audio_cutter.fade_in')}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={fadeSettings.fadeInDuration}
                onChange={(e) => setFadeSettings({ ...fadeSettings, fadeInDuration: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('audio_cutter.fade_unit')}</p>
            </div>

            {/* Fade Out */}
            <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300 block">
                {t('audio_cutter.fade_out')}
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={fadeSettings.fadeOutDuration}
                onChange={(e) => setFadeSettings({ ...fadeSettings, fadeOutDuration: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('audio_cutter.fade_unit')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handlePlayPreview}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-slate-600 px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-700 active:scale-95"
            >
              <Volume2 className="w-5 h-5" />
              {isPlaying ? t('audio_cutter.stop_preview') : t('audio_cutter.preview_btn')}
            </button>
            <button
              onClick={handleCutAudio}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-amber-500 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 active:scale-95"
            >
              <Zap className="w-5 h-5" />
              {t('audio_cutter.cut_btn')}
            </button>
          </div>

          {/* Status Messages */}
          {statusMessage && !errorMessage && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:text-amber-200">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-3xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700 dark:text-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Download Button */}
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={downloadFileName}
              className="inline-flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              <Download className="w-4 h-4" />
              {t('downloadBtn')}
            </a>
          )}
        </>
      )}
    </div>
  );
}

// WAV Encoder
const encodeWAV = (samples: Float32Array, sampleRate: number): Uint8Array => {
  const length = samples.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);

  let index = 44;
  for (let i = 0; i < length; i++) {
    view.setInt16(index, samples[i] < 0 ? samples[i] * 0x8000 : samples[i] * 0x7fff, true);
    index += 2;
  }

  return new Uint8Array(buffer);
};
