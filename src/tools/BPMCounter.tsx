import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Music, Zap, RotateCcw, Upload } from 'lucide-react';
import { Language, TranslationSet, ToolInfo } from '../types';

export const toolInfo: ToolInfo = {
  id: 'bpm_counter',
  icon: 'Music',
  category: 'utility',
  isFullyInteractive: true,
  titleKey: 'tool_bpm_counter_title',
  descKey: 'tool_bpm_counter_desc',
};

export default function BPMCounter({ t, isRtl }: { currentLang: Language; t: (key: string) => string; isRtl: boolean }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'auto'>('manual');
  const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
  const [bpmResult, setBpmResult] = useState<number | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analysisResult, setAnalysisResult] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastTapTime, setLastTapTime] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize AudioContext
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };
    initAudioContext();

    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  // Manual Tap Mode - Calculate BPM from tap intervals
  const handleTap = () => {
    const now = Date.now();
    const newTimestamps = [...tapTimestamps, now];

    // Keep only the last 16 taps for reasonable calculation
    if (newTimestamps.length > 16) {
      newTimestamps.shift();
    }

    setTapTimestamps(newTimestamps);

    // Calculate BPM if we have at least 2 taps
    if (newTimestamps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTimestamps.length; i++) {
        intervals.push(newTimestamps[i] - newTimestamps[i - 1]);
      }

      const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);

      // Only set BPM if it's within reasonable range (40-240 BPM)
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpmResult(calculatedBpm);
      }
    }

    setLastTapTime(now);
  };

  // Auto Mode - Analyze audio file for BPM
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setAnalysisResult(null);
    }
  };

  const analyzeAudioFile = async () => {
    if (!audioFile || !audioContext) return;

    setIsAnalyzing(true);
    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const bpm = await detectBPM(audioBuffer);
      setAnalysisResult(Math.round(bpm));
    } catch (error) {
      console.error('Audio analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // BPM Detection Algorithm - Peak detection on energy
  const detectBPM = async (audioBuffer: AudioBuffer): Promise<number> => {
    const rawData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Process audio in chunks to find energy peaks
    const chunkSize = Math.floor(sampleRate * 0.01); // 10ms chunks
    const energyArray: number[] = [];

    for (let i = 0; i < rawData.length; i += chunkSize) {
      const chunk = rawData.slice(i, i + chunkSize);
      let energy = 0;
      for (let j = 0; j < chunk.length; j++) {
        energy += chunk[j] * chunk[j];
      }
      energyArray.push(Math.sqrt(energy / chunkSize));
    }

    // Smooth energy array
    const smoothed = smoothArray(energyArray, 5);

    // Find peaks (beat candidates)
    const threshold = (Math.max(...smoothed) + Math.min(...smoothed)) / 2;
    const peaks: number[] = [];

    for (let i = 1; i < smoothed.length - 1; i++) {
      if (smoothed[i] > threshold && smoothed[i] > smoothed[i - 1] && smoothed[i] > smoothed[i + 1]) {
        peaks.push(i);
      }
    }

    // Calculate intervals between peaks
    if (peaks.length < 2) return 120; // Default BPM if no clear beat detected

    const intervals: number[] = [];
    for (let i = 1; i < Math.min(peaks.length, 50); i++) {
      const interval = (peaks[i] - peaks[i - 1]) * chunkSize;
      if (interval > 0) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) return 120;

    // Calculate BPM from intervals
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpmValue = 60 * sampleRate / avgInterval;

    // Clamp to reasonable range
    return Math.max(40, Math.min(240, bpmValue));
  };

  // Simple moving average smoothing
  const smoothArray = (array: number[], windowSize: number): number[] => {
    const result: number[] = [];
    for (let i = 0; i < array.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j <= Math.min(array.length - 1, i + windowSize); j++) {
        sum += array[j];
        count++;
      }
      result.push(sum / count);
    }
    return result;
  };

  const resetManualMode = () => {
    setTapTimestamps([]);
    setBpmResult(null);
    setLastTapTime(null);
  };

  const resetAutoMode = () => {
    setAudioFile(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Music className="w-8 h-8 text-amber-500" />
          <h1 className={`text-3xl font-bold ${isRtl ? 'text-right' : ''}`}>
            {t('bpm_counter.title')}
          </h1>
        </div>
        <p className={`text-gray-600 dark:text-gray-400 ${isRtl ? 'text-right' : ''}`}>
          {t('bpm_counter.desc')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 flex-wrap justify-center">
        <button
          onClick={() => {
            setActiveTab('manual');
            resetAutoMode();
          }}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'manual'
              ? 'bg-amber-500 text-white shadow-lg scale-105'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span>{t('bpm_counter.manual_mode')}</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('auto');
            resetManualMode();
          }}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
            activeTab === 'auto'
              ? 'bg-amber-500 text-white shadow-lg scale-105'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <Upload className="w-5 h-5" />
          <span>{t('bpm_counter.auto_mode')}</span>
        </button>
      </div>

      {/* Manual Tap Mode */}
      {activeTab === 'manual' && (
        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="text-center space-y-4">
            <h2 className={`text-2xl font-bold ${isRtl ? 'text-right' : ''}`}>
              {t('bpm_counter.tap_mode_title')}
            </h2>
            <p className={`text-gray-600 dark:text-gray-400 ${isRtl ? 'text-right' : ''}`}>
              {t('bpm_counter.tap_instruction')}
            </p>
          </div>

          {/* Large Tap Button */}
          <div className="flex justify-center py-8">
            <button
              onClick={handleTap}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-bold text-2xl shadow-2xl active:scale-95 transition-transform duration-100 flex items-center justify-center cursor-pointer touch-none select-none"
              style={{
                boxShadow: '0 0 30px rgba(217, 119, 6, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.3)',
              }}
            >
              <span className="text-center">{t('bpm_counter.tap_btn')}</span>
            </button>
          </div>

          {/* Tap Counter and BPM Display */}
          <div className="grid grid-cols-2 gap-6 my-8">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{t('bpm_counter.tap_count')}</p>
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">{tapTimestamps.length}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900 dark:to-amber-800 rounded-xl p-6 text-center">
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{t('bpm_counter.result_label')}</p>
              <p className="text-4xl font-bold text-amber-600 dark:text-amber-300">
                {bpmResult ? `${bpmResult} BPM` : '— —'}
              </p>
            </div>
          </div>

          {/* Recent Taps Display */}
          {tapTimestamps.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
              <h3 className={`font-semibold mb-4 ${isRtl ? 'text-right' : ''}`}>
                {t('bpm_counter.recent_taps')}
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {tapTimestamps.map((_, index) => (
                  <div
                    key={index}
                    className="bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    #{index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {tapTimestamps.length > 0 && (
            <button
              onClick={resetManualMode}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {t('bpm_counter.reset_btn')}
            </button>
          )}
        </div>
      )}

      {/* Auto Analysis Mode */}
      {activeTab === 'auto' && (
        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <div className="text-center space-y-4">
            <h2 className={`text-2xl font-bold ${isRtl ? 'text-right' : ''}`}>
              {t('bpm_counter.auto_mode_title')}
            </h2>
            <p className={`text-gray-600 dark:text-gray-400 ${isRtl ? 'text-right' : ''}`}>
              {t('bpm_counter.auto_instruction')}
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Audio file input"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {t('bpm_counter.upload_audio')}
            </button>

            {audioFile && (
              <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-4">
                <p className={`text-sm text-blue-700 dark:text-blue-300 ${isRtl ? 'text-right' : ''}`}>
                  <span className="font-semibold">{t('bpm_counter.selected_file')}:</span> {audioFile.name}
                </p>
              </div>
            )}
          </div>

          {/* Analysis Button */}
          {audioFile && !isAnalyzing && (
            <button
              onClick={analyzeAudioFile}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {t('bpm_counter.analyze_btn')}
            </button>
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="bg-blue-50 dark:bg-blue-900 rounded-xl p-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full animate-bounce"></div>
                <p className="text-blue-700 dark:text-blue-300 font-semibold">
                  {t('bpm_counter.analyzing')}
                </p>
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900 dark:to-green-800 rounded-xl p-8 text-center space-y-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm">{t('bpm_counter.result_label')}</p>
              <p className="text-5xl font-bold text-green-600 dark:text-green-300">{analysisResult} BPM</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('bpm_counter.analysis_complete')}
              </p>
            </div>
          )}

          {/* Reset Button */}
          {audioFile && (
            <button
              onClick={resetAutoMode}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-semibold transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              {t('bpm_counter.reset_btn')}
            </button>
          )}
        </div>
      )}

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900 rounded-lg px-4 py-3">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
          {t('onDeviceSecuredSandbox')}
        </p>
      </div>
    </div>
  );
}
