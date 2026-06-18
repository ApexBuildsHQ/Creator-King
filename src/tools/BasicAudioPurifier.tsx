import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import { Sparkles, Upload, Volume2, Download, Play, Pause, AlertCircle, RefreshCw, AudioLines } from 'lucide-react';
import { Language, ToolInfo } from '../types';
import { useAdManager } from '../context/AdContext';

export const toolInfo: ToolInfo = {
  id: 'audio_purifier',
  icon: 'Sparkles',
  category: 'audio',
  isFullyInteractive: true,
  titleKey: 'tool_audio_purifier_title',
  descKey: 'tool_audio_purifier_desc',
};

interface BasicAudioPurifierProps {
  currentLang: Language;
  t: (key: string) => string;
  isRtl: boolean;
}

export default function BasicAudioPurifier({ t, isRtl }: BasicAudioPurifierProps) {
  const { triggerAd } = useAdManager();
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<'noise' | 'boost' | 'sharp'>('noise');
  const [intensity, setIntensity] = useState<number>(5);

  // Decoded audio buffers
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [purifiedBuffer, setPurifiedBuffer] = useState<AudioBuffer | null>(null);

  // Unified audio context for previewing
  const [playbackContext, setPlaybackContext] = useState<AudioContext | null>(null);
  
  // Players state
  const [playingOriginal, setPlayingOriginal] = useState(false);
  const [playingPurified, setPlayingPurified] = useState(false);
  
  // Active playing nodes
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean playbacks on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      loadAudioFile(file);
    } else {
      setErrorMessage(t('audio_cutter.error_format') || 'Please provide a valid audio file.');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadAudioFile(file);
    }
  };

  const loadAudioFile = async (file: File) => {
    stopPlayback();
    setAudioFile(file);
    setErrorMessage('');
    setStatusMessage('');
    setOriginalBuffer(null);
    setPurifiedBuffer(null);
    setIsProcessing(true);

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      setPlaybackContext(ctx);

      const arrayBuffer = await file.arrayBuffer();
      const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
      setOriginalBuffer(decodedBuffer);
      setStatusMessage(t('audio_cutter.file_loaded') || 'Audio file loaded successfully.');
    } catch (error) {
      console.error(error);
      setErrorMessage(t('audio_cutter.error_decode') || 'Failed to decode audio. Please try another format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Live client-side purification using OfflineAudioContext & BiquadFilters
  const processAudio = async () => {
    if (!originalBuffer || !playbackContext) {
      setErrorMessage(t('audio_purifier.upload_req'));
      return;
    }

    setIsProcessing(true);
    setStatusMessage(t('audio_purifier.processing'));
    setErrorMessage('');
    stopPlayback();

    try {
      // Create OfflineAudioContext to render the purified sound
      const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        originalBuffer.length,
        originalBuffer.sampleRate
      );

      // Create Buffer source
      const source = offlineCtx.createBufferSource();
      source.buffer = originalBuffer;

      // Pipeline of node filters depending on the chosen profile and strength
      let lastNode: AudioNode = source;

      if (selectedProfile === 'noise') {
        // High-pass filter for subrumble
        const hpFilter = offlineCtx.createBiquadFilter();
        hpFilter.type = 'highpass';
        // Scalar math: 75Hz to 180Hz depending on intensity
        hpFilter.frequency.setValueAtTime(75 + intensity * 10, offlineCtx.currentTime);
        hpFilter.Q.setValueAtTime(0.707, offlineCtx.currentTime);
        lastNode.connect(hpFilter);
        lastNode = hpFilter;

        // Custom narrow notched filters to remove 50Hz & 60Hz power hums
        const notch50 = offlineCtx.createBiquadFilter();
        notch50.type = 'notch';
        notch50.frequency.setValueAtTime(50, offlineCtx.currentTime);
        // Higher intensity increases notch sharpness (Q)
        notch50.Q.setValueAtTime(1.0 + intensity, offlineCtx.currentTime);
        lastNode.connect(notch50);
        lastNode = notch50;

        const notch60 = offlineCtx.createBiquadFilter();
        notch60.type = 'notch';
        notch60.frequency.setValueAtTime(60, offlineCtx.currentTime);
        notch60.Q.setValueAtTime(1.0 + intensity, offlineCtx.currentTime);
        lastNode.connect(notch60);
        lastNode = notch60;

        // Low-pass filter to terminate high-frequency hiss
        const lpFilter = offlineCtx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        // Scalar math: 16000Hz down to 5000Hz depending on intensity step
        lpFilter.frequency.setValueAtTime(16000 - intensity * 1100, offlineCtx.currentTime);
        lpFilter.Q.setValueAtTime(0.6, offlineCtx.currentTime);
        lastNode.connect(lpFilter);
        lastNode = lpFilter;

      } else if (selectedProfile === 'boost') {
        // Sub rumble cut
        const hpFilter = offlineCtx.createBiquadFilter();
        hpFilter.type = 'highpass';
        hpFilter.frequency.setValueAtTime(90, offlineCtx.currentTime);
        lastNode.connect(hpFilter);
        lastNode = hpFilter;

        // Presence Booster around 2.5kHz
        const peakingFilter = offlineCtx.createBiquadFilter();
        peakingFilter.type = 'peaking';
        peakingFilter.frequency.setValueAtTime(2500, offlineCtx.currentTime);
        peakingFilter.Q.setValueAtTime(1.0, offlineCtx.currentTime);
        // Boost gain up to 15dB
        peakingFilter.gain.setValueAtTime(intensity * 1.5, offlineCtx.currentTime);
        lastNode.connect(peakingFilter);
        lastNode = peakingFilter;

        // Warmth gain around 220Hz
        const warmFilter = offlineCtx.createBiquadFilter();
        warmFilter.type = 'peaking';
        warmFilter.frequency.setValueAtTime(220, offlineCtx.currentTime);
        warmFilter.Q.setValueAtTime(1.2, offlineCtx.currentTime);
        warmFilter.gain.setValueAtTime(intensity * 0.4, offlineCtx.currentTime);
        lastNode.connect(warmFilter);
        lastNode = warmFilter;

      } else if (selectedProfile === 'sharp') {
        // De-esser narrow band cut around 6.5kHz
        const essFilter = offlineCtx.createBiquadFilter();
        essFilter.type = 'peaking';
        essFilter.frequency.setValueAtTime(6500, offlineCtx.currentTime);
        essFilter.Q.setValueAtTime(2.2, offlineCtx.currentTime);
        // Subtract gain up to -14dB
        essFilter.gain.setValueAtTime(-intensity * 1.4, offlineCtx.currentTime);
        lastNode.connect(essFilter);
        lastNode = essFilter;

        // Low pass filter to soften overly sharp inputs
        const lpFilter = offlineCtx.createBiquadFilter();
        lpFilter.type = 'lowpass';
        lpFilter.frequency.setValueAtTime(12000 - intensity * 550, offlineCtx.currentTime);
        lastNode.connect(lpFilter);
        lastNode = lpFilter;
      }

      // Connect back to offline context output destination
      lastNode.connect(offlineCtx.destination);
      
      // Render
      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      
      setPurifiedBuffer(renderedBuffer);
      setStatusMessage(t('audio_purifier.ready_download'));
    } catch (e) {
      console.error(e);
      setErrorMessage(t('audio_cutter.error_processing') || 'Audio processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!purifiedBuffer) return;

    // Trigger central ad-network popup block before direct device save
    triggerAd(() => {
      try {
        const wavBlob = bufferToWav(purifiedBuffer);
        const originalName = audioFile?.name || 'audio_track';
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const outName = `${nameWithoutExt}_purified.wav`;

        const url = URL.createObjectURL(wavBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = outName;
        anchor.classList.add('ad-bypassed'); // Tell global interceptor to bypass
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error("WAV render error", err);
        setErrorMessage("Could not render download. Please check memory limits.");
      }
    });
  };

  const stopPlayback = () => {
    if (activeSourceRef.current) {
      try {
        activeSourceRef.current.stop();
      } catch(e) {}
      activeSourceRef.current = null;
    }
    setPlayingOriginal(false);
    setPlayingPurified(false);
  };

  const playBuffer = (buffer: AudioBuffer, isOriginal: boolean) => {
    stopPlayback();

    if (!playbackContext) return;

    // Resume context if suspended
    if (playbackContext.state === 'suspended') {
      playbackContext.resume();
    }

    const sourceNode = playbackContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connect(playbackContext.destination);
    
    sourceNode.onended = () => {
      if (isOriginal) setPlayingOriginal(false);
      else setPlayingPurified(false);
    };

    activeSourceRef.current = sourceNode;
    sourceNode.start();

    if (isOriginal) {
      setPlayingOriginal(true);
    } else {
      setPlayingPurified(true);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Helper local WAV compilation functions
  const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // raw 16-bit PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const bufferArray = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(bufferArray);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
    
    floatTo16BitPCM(view, 44, result);
    
    return new Blob([view], { type: 'audio/wav' });
  };

  const interleave = (inputL: Float32Array, inputR: Float32Array): Float32Array => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  };

  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full space-y-6" id="audio-purifier-workflow-wrapper">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Interactive Control Dashboard */}
        <div className="flex-1 space-y-6">
          
          {/* Audio Upload Zone with both Drag-and-Drop and Browsing capability */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerUploadClick}
            className={`group border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              dragActive 
                ? 'border-amber-500 bg-amber-50/10 dark:bg-amber-950/10' 
                : audioFile 
                  ? 'border-emerald-500/40 bg-emerald-50/5 dark:bg-emerald-950/5' 
                  : 'border-slate-300 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/35'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {audioFile ? (
              <div className="space-y-3 pointer-events-none">
                <div className="w-14 h-14 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
                  <AudioLines className="w-7 h-7 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white max-w-xs truncate mx-auto">
                    {audioFile.name}
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                    {formatFileSize(audioFile.size)}
                  </p>
                </div>
                {originalBuffer && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Volume2 className="w-3.5 h-3.5" />
                    {originalBuffer.sampleRate} Hz • {originalBuffer.numberOfChannels} ch
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-4 pointer-events-none">
                <div className="w-14 h-14 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 transition-all group-hover:scale-105">
                  <Upload className="w-7 h-7 text-amber-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {t('dragDropText')} <span className="text-amber-500 underline">{t('selectFileText')}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    WAV, MP3, M4A, OGG, or FLAC up to 100MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Profile Select and Intensity Slider options (Disabled if no file is present) */}
          <div className={`p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl space-y-6 transition-opacity ${
            !originalBuffer ? 'opacity-50 pointer-events-none' : ''
          }`}>
            {/* Purification Target Profiles Selection Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {t('audio_purifier.filter_type')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProfile('noise')}
                  className={`p-3 text-start rounded-2xl border text-xs font-semibold flex flex-col gap-1 transition ${
                    selectedProfile === 'noise'
                      ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs underline decoration-amber-500/30">
                    {t('audio_purifier.profile_noise')}
                  </span>
                  <span className="text-[10px] font-normal leading-normal text-slate-400 dark:text-slate-500">
                    Combats room hums, vents, fan winds, and power line sibilants.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProfile('boost')}
                  className={`p-3 text-start rounded-2xl border text-xs font-semibold flex flex-col gap-1 transition ${
                    selectedProfile === 'boost'
                      ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs underline decoration-amber-500/30">
                    {t('audio_purifier.profile_boost')}
                  </span>
                  <span className="text-[10px] font-normal leading-normal text-slate-400 dark:text-slate-500">
                    Heightens voiceover presence at 2.5kHz and instates warm frequencies.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProfile('sharp')}
                  className={`p-3 text-start rounded-2xl border text-xs font-semibold flex flex-col gap-1 transition ${
                    selectedProfile === 'sharp'
                      ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-xs underline decoration-amber-500/30">
                    {t('audio_purifier.profile_sharp')}
                  </span>
                  <span className="text-[10px] font-normal leading-normal text-slate-400 dark:text-slate-500">
                    Damps sharp "S" letters and high frequency microphone hiss safely.
                  </span>
                </button>
              </div>
            </div>

            {/* Intensity Level Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider">
                  {t('audio_purifier.intensity')}
                </span>
                <span className="font-mono font-black text-amber-500 text-sm">
                  {intensity} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-ew-resize py-2 bg-transparent"
              />
            </div>

            {/* Action purification trigger */}
            <button
              type="button"
              onClick={processAudio}
              disabled={isProcessing}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-amber-500/5 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t('audio_purifier.purify_btn')}
            </button>
          </div>

        </div>

        {/* Right Preview Compartment & Dynamic comparison widget */}
        <div className="w-full md:w-80 flex flex-col gap-6">
          
          {/* Status logs and notifications */}
          {(statusMessage || errorMessage || isProcessing) && (
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-3xl space-y-3">
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Serverless Processor State
              </span>
              
              {isProcessing && (
                <div className="flex items-center gap-3 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>{statusMessage || t('audio_purifier.processing')}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-start gap-2 text-xs text-rose-500 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!isProcessing && statusMessage && !errorMessage && (
                <div className="flex items-start gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 p-2 rounded-xl border border-emerald-500/10">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Player Deck */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/85 rounded-3xl p-5 space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-50 dark:border-slate-800 pb-2">
                {t('preview')}
              </h3>

              {/* Player 1: Original Audio Tracker */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t('audio_purifier.original')}
                </span>
                {originalBuffer ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (playingOriginal) stopPlayback();
                      else playBuffer(originalBuffer, true);
                    }}
                    className={`w-full py-3 px-4 rounded-2xl flex items-center gap-3 border transition text-xs font-bold ${
                      playingOriginal 
                        ? 'border-amber-500/50 bg-amber-500/5 text-amber-500' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {playingOriginal ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{playingOriginal ? 'Playing Original' : 'Play Original Audio'}</span>
                  </button>
                ) : (
                  <div className="py-3 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-slate-400 italic">
                    File not provided
                  </div>
                )}
              </div>

              {/* Player 2: Purified Enhanced Sound Tracker */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  {t('audio_purifier.purified')}
                </span>
                {purifiedBuffer ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (playingPurified) stopPlayback();
                      else playBuffer(purifiedBuffer, false);
                    }}
                    className={`w-full py-3 px-4 rounded-2xl flex items-center gap-3 border transition text-xs font-bold ${
                      playingPurified 
                        ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-500' 
                        : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {playingPurified ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{playingPurified ? 'Playing Purified Output' : 'Play Purified Audio'}</span>
                  </button>
                ) : (
                  <div className="py-3 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-xs text-slate-400 italic">
                    Render filter first
                  </div>
                )}
              </div>
            </div>

            {/* Premium Download Action Trigger */}
            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!purifiedBuffer}
                className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-650 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white dark:text-slate-950 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>{t('downloadBtn')}</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
