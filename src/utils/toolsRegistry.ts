import type { ComponentType } from 'react';
import type { Tool, ToolComponentProps, ToolInfo, TranslationSet } from '../types';

type ToolModule = {
  default: ComponentType<ToolComponentProps>;
  toolInfo: ToolInfo;
};

const importedTools = import.meta.glob<Record<string, unknown>>('../tools/*.tsx', { eager: true });

export const toolsRegistry = Object.values(importedTools)
  .map((module) => module as ToolModule)
  .filter((module): module is ToolModule => Boolean(module && module.toolInfo && module.default))
  .map((module) => ({
    ...module.toolInfo,
    Component: module.default,
  })) as Array<Tool & { Component: ComponentType<ToolComponentProps> }>;

export function getToolsList(t: (key: keyof TranslationSet) => string): Tool[] {
  return toolsRegistry.map((tool) => ({
    id: tool.id,
    icon: tool.icon,
    category: tool.category,
    isFullyInteractive: tool.isFullyInteractive,
    titleKey: tool.titleKey,
    descKey: tool.descKey,
    title: t(tool.titleKey),
    desc: t(tool.descKey),
  }));
}

export function getToolComponentById(id: string) {
  return toolsRegistry.find((tool) => tool.id === id)?.Component ?? null;
}
