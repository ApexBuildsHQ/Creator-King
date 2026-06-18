import { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { Tool, Language, TranslationSet } from '../types';
import { getToolsList } from '../utils/toolsRegistry';

interface ToolsGridProps {
  currentLang: Language;
  t: (key: keyof TranslationSet) => string;
  activeToolId: string;
  onSelectTool: (toolId: string) => void;
  searchQuery: string;
  activeCategory: 'all' | 'media' | 'video' | 'audio' | 'text' | 'utility';
}

export function ToolsGrid({ currentLang, t, activeToolId, onSelectTool, searchQuery, activeCategory }: ToolsGridProps) {
  
  const tools = useMemo(() => getToolsList(t), [t]);

  // Handle category/search filtering
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch = 
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.desc.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        activeCategory === 'all' || 
        tool.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [tools, searchQuery, activeCategory]);

  // Dynamically resolve lucide icons
  const renderIcon = (iconName: string, className: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent className={className} />;
  };

  const handleToolClick = (toolId: string) => {
    onSelectTool(toolId);
    // Smooth scroll to the tool workspace
    const workspaceElement = document.getElementById('tool-workspace');
    if (workspaceElement) {
      workspaceElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="tools-section" className="space-y-6">

      {/* Grid view layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        {filteredTools.map((tool) => {
          const isSelected = activeToolId === tool.id;
          return (
            <div
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`group relative flex flex-col justify-between p-6 rounded-3xl border transition duration-300 cursor-pointer ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-400/5 shadow-lg'
                  : 'border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/30 dark:hover:bg-slate-805 hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
               }`}
            >
              {/* Tool Card Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl transition ${
                    isSelected 
                      ? 'bg-amber-500/20 text-amber-500' 
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-300 group-hover:bg-amber-500/10 group-hover:text-amber-500'
                  }`}>
                    {renderIcon(tool.icon, 'w-5 h-5')}
                  </div>
                  
                  {tool.isFullyInteractive ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full leading-none shadow-sm animate-pulse">
                      {t('interactive')}
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-400 rounded-full leading-none">
                      {t('onDevice')}
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <h3 className={`font-bold text-sm tracking-tight ${
                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-950 dark:text-white'
                  }`}
                  style={{ direction: currentLang === 'ar' ? 'rtl' : 'ltr' }}
                  >
                    {tool.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed truncate"
                  title={tool.desc}
                  style={{ direction: currentLang === 'ar' ? 'rtl' : 'ltr' }}
                  >
                    {tool.desc}
                  </p>
                </div>
              </div>

              {/* Bottom active status bar */}
              <div className="mt-4 pt-4 border-t border-gray-100/40 dark:border-slate-700/45 flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-400 dark:text-slate-500 uppercase tracking-tighter">
                  {tool.category}
                </span>
                <span className="text-amber-500 dark:text-amber-400 group-hover:translate-x-1 transition flex items-center gap-1">
                  {t('launchTool')}
                </span>
              </div>

            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400 text-sm">
            ❌ {t('noToolsFound')}
          </div>
        )}
      </div>

    </div>
  );
}
