export type Language = 'ar' | 'en' | 'fr' | 'es';

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

}

export interface Tool {
  id: string;
  title: string;
  desc: string;
  icon: string;
  category: 'media' | 'text' | 'utility';
  isFullyInteractive: boolean;
}
