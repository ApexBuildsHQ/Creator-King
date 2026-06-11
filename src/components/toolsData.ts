import { Tool, TranslationSet } from '../types';

export const getToolsList = (t: (key: keyof TranslationSet) => string): Tool[] => {
  const toolsRaw = [
    { id: 'compressor', icon: 'Sliders', category: 'media', isFullyInteractive: true },
    { id: 'cutter', icon: 'Scissors', category: 'text', isFullyInteractive: true },
    { id: 'extractor', icon: 'Palette', category: 'media', isFullyInteractive: true }
  ];

  return toolsRaw.map(tool => ({
    ...tool,
    title: t(`tool_${tool.id}_title` as keyof TranslationSet),
    desc: t(`tool_${tool.id}_desc` as keyof TranslationSet)
  })) as Tool[];
};

