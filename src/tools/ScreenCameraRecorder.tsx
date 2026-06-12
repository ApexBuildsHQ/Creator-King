import { useEffect, useRef, useState } from 'react';
import { Camera, Monitor, Video, Mic, MicOff, LayoutGrid, LayoutList, Columns, Play, Square, Download } from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';

export const toolInfo: ToolInfo = {
  id: 'screen_camera_recorder',
  icon: 'Video',
  category: 'media',
  isFullyInteractive: true,
  titleKey: 'tool_screen_camera_recorder_title',
  descKey: 'tool_screen_camera_recorder_desc',
};

type SourceMode = 'screen' | 'camera' | 'screen_camera';
type CamLayout = 'floating' | 'side' | 'split';

const sourceOptions: Array<{ id: SourceMode; Icon: typeof Monitor | typeof Camera | typeof Video }> = [
  { id: 'screen', Icon: Monitor },
  { id: 'camera', Icon: Camera },
  { id: 'screen_camera', Icon: Video },
];

const layoutOptions: Array<{ id: CamLayout; Icon: typeof LayoutGrid | typeof LayoutList | typeof Columns }> = [
  { id: 'floating', Icon: LayoutGrid },
  { id: 'side', Icon: LayoutList },
  { id: 'split', Icon: Columns },
];

const stopStreamTracks = (stream: MediaStream | null | undefined) => {
  stream?.getTracks().forEach((track) => track.stop());
};

const getSupportedMimeType = () => {
  if (typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }

  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
    return 'video/webm;codecs=vp9';
  }

  if (MediaRecorder.isTypeSupported('video/mp4')) {
    return 'video/mp4';
  }

  if (MediaRecorder.isTypeSupported('video/webm')) {
    return 'video/webm';
  }

  return 'video/webm';
};

const waitForVideoReady = (video: HTMLVideoElement | null) =>
  new Promise<void>((resolve) => {
    if (!video) {
      resolve();
      return;
    }

    if (video.readyState >= 2) {
      resolve();
      return;
    }

    const onLoaded = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      resolve();
    };

    video.addEventListener('loadedmetadata', onLoaded);
  });

const getCanvasSize = (screenVideo: HTMLVideoElement | null, cameraVideo: HTMLVideoElement | null, sourceMode: SourceMode) => {
  const fallbackWidth = 1280;
  const fallbackHeight = 720;

  if (sourceMode === 'screen' && screenVideo && screenVideo.videoWidth && screenVideo.videoHeight) {
    return {
      width: Math.min(screenVideo.videoWidth, 1280),
      height: Math.min(screenVideo.videoHeight, 720),
    };
  }

  if (sourceMode === 'camera' && cameraVideo && cameraVideo.videoWidth && cameraVideo.videoHeight) {
    return {
      width: Math.min(cameraVideo.videoWidth, 1280),
      height: Math.min(cameraVideo.videoHeight, 720),
    };
  }

  if (sourceMode === 'screen_camera' && screenVideo && screenVideo.videoWidth && screenVideo.videoHeight) {
    return {
      width: Math.min(screenVideo.videoWidth, 1280),
      height: Math.min(screenVideo.videoHeight, 720),
    };
  }

  return {
    width: fallbackWidth,
    height: fallbackHeight,
  };
};

const drawCanvasFrame = (
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  sourceMode: SourceMode,
  layout: CamLayout,
  screenVideo: HTMLVideoElement | null,
  cameraVideo: HTMLVideoElement | null,
) => {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const drawScreen = () => {
    if (screenVideo && screenVideo.readyState >= 2) {
      context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
    }
  };

  const drawCameraOverlay = () => {
    if (!cameraVideo || cameraVideo.readyState < 2) return;

    const cameraAspect = cameraVideo.videoWidth / Math.max(cameraVideo.videoHeight, 1);
    const cameraWidth = Math.round(canvas.width * (layout === 'split' ? 0.5 : 0.28));
    const cameraHeight = Math.round(cameraWidth / cameraAspect);

    if (layout === 'split') {
      const targetHeight = canvas.height;
      const targetWidth = Math.round(targetHeight * cameraAspect);
      context.drawImage(cameraVideo, canvas.width - targetWidth, 0, targetWidth, targetHeight);
      return;
    }

    const padding = 18;
    const width = cameraWidth;
    const height = Math.min(cameraHeight, canvas.height - padding * 2);
    let x = canvas.width - width - padding;
    let y = canvas.height - height - padding;

    if (layout === 'side') {
      x = canvas.width - width - padding;
      y = padding;
    }

    if (layout === 'floating') {
      x = padding;
      y = canvas.height - height - padding;
    }

    context.save();
    context.fillStyle = 'rgba(15, 23, 42, 0.45)';
    context.fillRect(x - 8, y - 8, width + 16, height + 16);
    context.strokeStyle = 'rgba(248, 113, 37, 0.85)';
    context.lineWidth = 2;
    context.strokeRect(x - 8, y - 8, width + 16, height + 16);
    context.restore();
    context.drawImage(cameraVideo, x, y, width, height);
  };

  if (sourceMode === 'camera') {
    if (cameraVideo && cameraVideo.readyState >= 2) {
      context.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    }
    return;
  }

  if (sourceMode === 'screen') {
    drawScreen();
    return;
  }

  drawScreen();
  drawCameraOverlay();
};

export default function ScreenCameraRecorder({ t, isRtl }: ToolComponentProps) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('screen');
  const [micEnabled, setMicEnabled] = useState(true);
  const [layout, setLayout] = useState<CamLayout>('floating');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [savedFileName, setSavedFileName] = useState('capture.webm');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const captureSessionRef = useRef<{
    screenStream?: MediaStream | null;
    cameraStream?: MediaStream | null;
    micStream?: MediaStream | null;
    canvasStream?: MediaStream | null;
  }>({});
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupStreams = () => {
    stopStreamTracks(captureSessionRef.current.screenStream);
    stopStreamTracks(captureSessionRef.current.cameraStream);
    stopStreamTracks(captureSessionRef.current.micStream);
    stopStreamTracks(captureSessionRef.current.canvasStream);
    captureSessionRef.current = {};
  };

  const stopRecording = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    cleanupStreams();
    setIsRecording(false);
    setStatusMessage('');
  };

  const renderFrame = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const screenVideo = screenVideoRef.current;
    const cameraVideo = cameraVideoRef.current;

    if (!canvas || !context) return;

    drawCanvasFrame(canvas, context, sourceMode, layout, screenVideo, cameraVideo);
    frameRef.current = requestAnimationFrame(renderFrame);
  };

  const startRecording = async () => {
    if (isRecording) {
      return;
    }

    setErrorMessage('');
    setStatusMessage('');
    setRecordedUrl('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof window.MediaRecorder === 'undefined') {
      setErrorMessage(t('recorder.error_permission'));
      return;
    }

    try {
      const screenStream = sourceMode !== 'camera'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
        : null;

      const cameraStream = sourceMode !== 'screen'
        ? await navigator.mediaDevices.getUserMedia({ video: true, audio: sourceMode === 'camera' && micEnabled })
        : null;

      const micStream = sourceMode === 'screen' || sourceMode === 'screen_camera'
        ? micEnabled
          ? await navigator.mediaDevices.getUserMedia({ audio: true })
          : null
        : null;

      if (screenStream && screenVideoRef.current) {
        screenVideoRef.current.srcObject = screenStream;
        screenVideoRef.current.play().catch(() => null);
      }

      if (cameraStream && cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = cameraStream;
        cameraVideoRef.current.play().catch(() => null);
      }

      await Promise.all([
        sourceMode !== 'camera' ? waitForVideoReady(screenVideoRef.current) : Promise.resolve(),
        sourceMode !== 'screen' ? waitForVideoReady(cameraVideoRef.current) : Promise.resolve(),
      ]);

      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const { width, height } = getCanvasSize(screenVideoRef.current, cameraVideoRef.current, sourceMode);
      canvas.width = width;
      canvas.height = height;

      renderFrame();

      const canvasStream = canvas.captureStream(30);
      const finalStream = new MediaStream();
      const canvasVideoTrack = canvasStream.getVideoTracks()[0];

      if (!canvasVideoTrack) {
        throw new Error('Failed to capture canvas video');
      }

      finalStream.addTrack(canvasVideoTrack);

      if (sourceMode === 'camera' && micEnabled && cameraStream) {
        cameraStream.getAudioTracks().forEach((track) => finalStream.addTrack(track));
      }

      if ((sourceMode === 'screen' || sourceMode === 'screen_camera') && micEnabled && micStream) {
        micStream.getAudioTracks().forEach((track) => finalStream.addTrack(track));
      }

      const mimeType = getSupportedMimeType();
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      setSavedFileName(`capture-${sourceMode}.${extension}`);

      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(finalStream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setStatusMessage(t('recorder.ready_download'));
        setIsRecording(false);
        cleanupStreams();
      };
      recorder.onerror = () => {
        setErrorMessage(t('recorder.error_processing'));
        setStatusMessage('');
        cleanupStreams();
      };

      captureSessionRef.current = {
        screenStream,
        cameraStream,
        micStream,
        canvasStream,
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setStatusMessage(t('recorder.recording'));
    } catch (error) {
      console.error(error);
      setErrorMessage(t('recorder.error_permission'));
      cleanupStreams();
    }
  };

  const selectedSourceLabel = t(`recorder.source_${sourceMode}`);
  const directionClass = isRtl ? 'rtl' : 'ltr';

  return (
    <div className="space-y-6" dir={directionClass}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-amber-500">
          <Video className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{t('tool_screen_camera_recorder_title')}</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">{t('tool_screen_camera_recorder_desc')}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('recorder.source_select')}</p>
            <div className="grid grid-cols-3 gap-3">
              {sourceOptions.map((option) => {
                const Icon = option.Icon;
                const isActive = sourceMode === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSourceMode(option.id)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-4 text-sm font-semibold transition ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs leading-tight">{t(`recorder.source_${option.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
            <label className="inline-flex w-full cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-gray-700 dark:text-slate-300">
              <span>{t('recorder.audio_mic')}</span>
              <button
                type="button"
                onClick={() => setMicEnabled((value) => !value)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${
                  micEnabled ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-100'
                }`}
              >
                {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {micEnabled ? t('recorder.audio_mic') : t('recorder.audio_mic')}
              </button>
            </label>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('recorder.cam_layout')}</p>
            <div className="grid grid-cols-3 gap-3">
              {layoutOptions.map((option) => {
                const Icon = option.Icon;
                const isActive = layout === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setLayout(option.id)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-4 text-sm font-semibold transition ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-500'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs leading-tight">{t(`recorder.layout_${option.id}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-amber-300 dark:border-amber-500/40 bg-slate-50 dark:bg-slate-950/80 p-5 text-center">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">{t('preview')}</p>
            <div className="w-full overflow-hidden rounded-3xl bg-slate-950">
              <canvas ref={canvasRef} className="w-full min-h-[240px] bg-slate-900" />
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{selectedSourceLabel}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={isRecording}
              onClick={startRecording}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {t('recorder.start_btn')}
            </button>
            <button
              type="button"
              disabled={!isRecording}
              onClick={stopRecording}
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-amber-300 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-amber-300"
            >
              <Square className="h-4 w-4" />
              {t('recorder.stop_btn')}
            </button>
          </div>

          {statusMessage && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
              {errorMessage}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-5">
          <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">{t('privacyBadge')}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {t('tool_screen_camera_recorder_desc')}
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
            <video
              ref={screenVideoRef}
              className="hidden"
              autoPlay
              muted
              playsInline
            />
            <video
              ref={cameraVideoRef}
              className="hidden"
              autoPlay
              muted
              playsInline
            />

            {recordedUrl ? (
              <div className="space-y-3">
                <div className="overflow-hidden rounded-3xl bg-slate-900">
                  <video className="w-full" src={recordedUrl} controls playsInline />
                </div>
                <a
                  href={recordedUrl}
                  download={savedFileName}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <Download className="h-4 w-4" />
                  {t('downloadBtn')}
                </a>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                {t('recorder.start_btn')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
