export type Language = string;

export interface TranslationSet {
  brand: string;
  heroTitlePre: string;
  heroTitleKings: string;
  heroSubtitle: string;
  themeToggle: string;
  languageSelect: string;
  toolsTitle: string;
  toolsSubtitle: string;
  searchPlaceholder: string;
  filterAll: string;
  filterMedia: string;
  filterText: string;
  filterUtility: string;
  compressorTitle: string;
  compressorDesc: string;
  cutterTitle: string;
  cutterDesc: string;
  extractorTitle: string;
  extractorDesc: string;
  privacyBadge: string;
  speedBadge: string;
  downloadBtn: string;
  uploadBtn: string;
  dragDropText: string;
  selectFileText: string;
  howToUse: string;
  preview: string;
  original: string;
  compressed: string;
  quality: string;
  width: string;
  height: string;
  characters: string;
  words: string;
  lines: string;
  textToCut: string;
  cutLimit: string;
  cutResult: string;
  copyBtn: string;
  copiedMsg: string;
  colorsFound: string;
  exifData: string;
  whyTrustTitle: string;
  whyTrustSubtitle: string;
  benefit1Title: string;
  benefit1Desc: string;
  benefit2Title: string;
  benefit2Desc: string;
  benefit3Title: string;
  benefit3Desc: string;
  footerText: string;

  // New translations extracted to JSON
  adUnitLabel: string;
  adUnitText: string;
  backToAllTools: string;
  onDeviceSecuredSandbox: string;
  interactive: string;
  onDevice: string;
  launchTool: string;
  noToolsFound: string;
  resizeScale: string;
  targetResolution: string;
  savedSpace: string;
  ofStorageSpace: string;
  clearBtn: string;
  originalDocumentSource: string;
  charactersStats: string;
  wordsStats: string;
  linesStats: string;
  trimmingStrategy: string;
  byCharacters: string;
  byWords: string;
  byLines: string;
  trimmedResultsPlaceholder: string;
  clickCopyHex: string;
  copiedToClipboard: string;
  filenameField: string;
  fileSizeField: string;
  fileMimeField: string;
  resolutionField: string;
  modifiedDateField: string;
  analyzeAnotherImage: string;
  loadingTool: string;
  langAr: string;
  langEn: string;
  langFr: string;
  langEs: string;

  // Dynamic tool title and description keys
  "tool_compressor_title": string;
  "tool_compressor_desc": string;
  "tool_cutter_title": string;
  "tool_cutter_desc": string;
  "tool_extractor_title": string;
  "tool_extractor_desc": string;

  video_cutter: {
    title: string;
    desc: string;
    upload_btn: string;
    start_time: string;
    end_time: string;
    preview: string;
    export: string;
    error_format: string;
  };
  video_merger: {
    title: string;
    desc: string;
    drop_zone: string;
    reorder: string;
    resolution_preset: string;
    merge_btn: string;
    processing: string;
  };
  video_compressor: {
    title: string;
    desc: string;
    preset_low: string;
    preset_mid: string;
    preset_high: string;
    custom_size: string;
    original_size: string;
    estimated_size: string;
    compress_btn: string;
  };
  audio_extractor: {
    title: string;
    desc: string;
    format: string;
    bitrate: string;
    extract_btn: string;
    success_msg: string;
    error_format: string;
    trim_option: string;
    start_time: string;
    end_time: string;
  };
  video_converter: {
    title: string;
    desc: string;
    target_format: string;
    fps_label: string;
    width_label: string;
    format_mp4: string;
    format_webm: string;
    format_gif: string;
    width_preset_320: string;
    width_preset_480: string;
    custom_width_placeholder: string;
    file_info: string;
    loading_ffmpeg: string;
    converting: string;
    ready_download: string;
    convert_btn: string;
    error_conversion: string;
    error_format: string;
  };
  video_reverser: {
    title: string;
    desc: string;
    upload_btn: string;
    processing: string;
    ready_download: string;
    error_conversion: string;
    error_format: string;
    audio_mode: string;
    audio_reverse: string;
    audio_mute: string;
    audio_keep: string;
    reverse_btn: string;
  };
  speed_changer: {
    title: string;
    desc: string;
    upload_btn: string;
    custom_speed: string;
    custom_speed_slider: string;
    pitch_lock: string;
    pitch_lock_desc: string;
    pitch_lock_help: string;
    preset_speeds: string;
    preset_desc: string;
    advanced_range: string;
    range_desc: string;
    process_btn: string;
    processing: string;
    ready_download: string;
    error_conversion: string;
    error_format: string;
    loading_ffmpeg: string;
  };
  "tool_video_cutter_title": string;
  "tool_video_cutter_desc": string;
  "tool_video_merger_title": string;
  "tool_video_merger_desc": string;
  "tool_video_compressor_title": string;
  "tool_video_compressor_desc": string;
  "tool_watermark_adder_title": string;
  "tool_watermark_adder_desc": string;
  "tool_video_converter_title": string;
  "tool_video_converter_desc": string;
  "tool_video_reverser_title": string;
  "tool_video_reverser_desc": string;
  "tool_speed_changer_title": string;
  "tool_speed_changer_desc": string;
  "tool_audio_extractor_title": string;
  "tool_audio_extractor_desc": string;
  watermark_adder: {
    title: string;
    desc: string;
    type_text: string;
    type_image: string;
    text_input_placeholder: string;
    position_grid: string;
    opacity: string;
    apply_btn: string;
    loading_ffmpeg: string;
    processing: string;
    ready_download: string;
    upload_image: string;
    select_font: string;
    color_picker: string;
    x_offset: string;
    y_offset: string;
    error_invalid_video: string;
    error_missing_video: string;
    error_missing_text: string;
    error_processing: string;
  };
    recorder: {
      title: string;
      desc: string;
      source_select: string;
      audio_mic: string;
      cam_layout: string;
      start_btn: string;
      stop_btn: string;
    };
}

export interface ToolInfo {
  id: string;
  icon: string;
  category: 'media' | 'text' | 'utility';
  isFullyInteractive: boolean;
  titleKey: keyof TranslationSet;
  descKey: keyof TranslationSet;
}

export interface ToolComponentProps {
  currentLang: Language;
  t: (key: string) => string;
  isRtl: boolean;
}

export interface Tool extends ToolInfo {
  title: string;
  desc: string;
}
