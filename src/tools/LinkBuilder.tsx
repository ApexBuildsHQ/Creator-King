import React, { useState, useTransition, useMemo, useEffect } from 'react';
import { 
  Link as LinkIcon, 
  Trash2, 
  Plus, 
  Download, 
  Check, 
  Sparkles, 
  Image as ImageIcon, 
  Smartphone, 
  Globe, 
  Github, 
  Twitter, 
  Linkedin, 
  Instagram, 
  ExternalLink,
  ChevronRight,
  User,
  Sliders,
  Palette,
  Eye,
  Settings,
  HelpCircle
} from 'lucide-react';
import { ToolInfo, ToolComponentProps } from '../types';
import { useAdManager } from '../context/AdContext';
import { motion, AnimatePresence } from 'motion/react';

export const toolInfo: ToolInfo = {
  id: 'link_builder',
  icon: 'Link',
  category: 'text',
  isFullyInteractive: true,
  titleKey: 'tool_link_builder_title',
  descKey: 'tool_link_builder_desc',
};

interface DynamicLink {
  id: string;
  title: string;
  url: string;
}

// Creative Premium Avatar presets so they don't have to seek URLs
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=350&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=350&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=350&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=350&q=80"
];

const INITIAL_LINKS: DynamicLink[] = [
  { id: '1', title: '🌱 Read My Latest Blog Articles', url: 'https://blog.myportfolio.io' },
  { id: '2', title: '💻 Download My Free Tailwind UI Kits', url: 'https://tailwindkits.com' },
  { id: '3', title: '🎙️ Listen to the Creator Podcast', url: 'https://spotify.com/creator-cast' }
];

export default function LinkBuilder({ t, isRtl }: ToolComponentProps) {
  const { triggerAd } = (() => {
    try {
      return useAdManager();
    } catch {
      return { triggerAd: (cb: () => void) => cb() };
    }
  })();

  // Core Bio Identity States
  const [bioName, setBioName] = useState<string>('Alex Rivera');
  const [bioTitle, setBioTitle] = useState<string>('Designing interfaces, writing code, and crafting micro-businesses.');
  const [bioAvatar, setBioAvatar] = useState<string>(AVATAR_PRESETS[0]);
  
  // Custom interactive links list
  const [links, setLinks] = useState<DynamicLink[]>(INITIAL_LINKS);
  
  // Custom Design & Layout preferences
  const [themeStyle, setThemeStyle] = useState<'flat' | 'gradient' | 'neon' | 'dark' | 'glass'>('gradient');
  const [buttonShape, setButtonShape] = useState<'rounded' | 'sharp' | 'pill'>('rounded');

  // Social handles
  const [githubUrl, setGithubUrl] = useState<string>('https://github.com/alexrivera');
  const [twitterUrl, setTwitterUrl] = useState<string>('https://twitter.com/alex_designs');
  const [linkedinUrl, setLinkedinUrl] = useState<string>('https://linkedin.com/in/alexrivera');
  const [instagramUrl, setInstagramUrl] = useState<string>('https://instagram.com/alex_creatives');

  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAddLink = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setLinks([...links, { id: newId, title: '', url: '' }]);
  };

  const handleUpdateLink = (id: string, updatedFields: Partial<DynamicLink>) => {
    setLinks(links.map(link => link.id === id ? { ...link, ...updatedFields } : link));
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const loadSample = () => {
    triggerAd(() => {
      startTransition(() => {
        setBioName('Dev Creative Designer');
        setBioTitle('Full Stack Architect crafting high-performance, beautiful software systems in 2026.');
        setBioAvatar(AVATAR_PRESETS[1]);
        setLinks([
          { id: '1', title: '⚡ Explore Developer Portfolio', url: 'https://github.com' },
          { id: '2', title: '📖 Technical Newsletter', url: 'https://substack.com' },
          { id: '3', title: '☕ Buy Me A Premium Espresso', url: 'https://buymeacoffee.com' }
        ]);
        setThemeStyle('glass');
        setButtonShape('pill');
        setGithubUrl('https://github.com');
        setTwitterUrl('https://twitter.com');
        setLinkedinUrl('https://linkedin.com');
        setInstagramUrl('https://instagram.com');
      });
    });
  };

  // Generate the highly optimized CSS styling rules for compile-time inclusion
  const generatedStyles = useMemo(() => {
    let bgStyle = '';
    let btnClass = '';
    let textClass = 'text-slate-900';
    let labelClass = 'text-slate-550';

    switch (themeStyle) {
      case 'flat':
        bgStyle = 'background: #f8fafc; color: #0f172a;';
        btnClass = 'background: #ffffff; color: #0f172a; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);';
        textClass = 'text-slate-800';
        labelClass = 'text-slate-500';
        break;
      case 'gradient':
        bgStyle = 'background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); color: #1e293b;';
        btnClass = 'background: rgba(255, 255, 255, 0.85); color: #1e293b; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.4); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);';
        textClass = 'text-slate-900';
        labelClass = 'text-slate-600';
        break;
      case 'neon':
        bgStyle = 'background: radial-gradient(circle at top, #1e1e38 0%, #0c0c14 100%); color: #38bdf8;';
        btnClass = 'background: #111122; color: #38bdf8; border: 1.5px solid #06b6d4; box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);';
        textClass = 'text-cyan-400';
        labelClass = 'text-cyan-200/70';
        break;
      case 'dark':
        bgStyle = 'background: #090d16; color: #f8fafc;';
        btnClass = 'background: #151e33; color: #f8fafc; border: 1px solid #1e294b;';
        textClass = 'text-slate-200';
        labelClass = 'text-slate-400';
        break;
      case 'glass':
        bgStyle = 'background: linear-gradient(225deg, #4f46e5 0%, #06b6d4 100%); color: #ffffff;';
        btnClass = 'background: rgba(255, 255, 255, 0.16); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.25); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);';
        textClass = 'text-white';
        labelClass = 'text-teal-100';
        break;
    }

    let borderStyle = 'border-radius: 12px;';
    if (buttonShape === 'sharp') {
      borderStyle = 'border-radius: 0px; box-shadow: 4px 4px 0px #000;';
    } else if (buttonShape === 'pill') {
      borderStyle = 'border-radius: 9999px;';
    }

    return { bgStyle, btnClass, borderStyle, textClass, labelClass };
  }, [themeStyle, buttonShape]);

  // Produce stand-alone optimized static site template payload
  const handleExportPageFile = () => {
    // Basic correctness warning
    const validLinks = links.filter(link => link.title.trim() && link.url.trim());
    if (validLinks.length === 0) {
      setCopiedNotification(t('link_builder.input_validation_err'));
      setTimeout(() => setCopiedNotification(null), 3500);
      return;
    }

    triggerAd(() => {
      // Build social icons conditionally
      let socialIconsHtml = '';
      if (githubUrl.trim()) {
        socialIconsHtml += `<a href="${githubUrl}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg></a>`;
      }
      if (twitterUrl.trim()) {
        socialIconsHtml += `<a href="${twitterUrl}" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></a>`;
      }
      if (linkedinUrl.trim()) {
        socialIconsHtml += `<a href="${linkedinUrl}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>`;
      }
      if (instagramUrl.trim()) {
        socialIconsHtml += `<a href="https://instagram.com/${instagramUrl.replace('@', '')}" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="social-icon"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>`;
      }

      // Generate buttons dynamically
      let buttonsHtml = '';
      validLinks.forEach(link => {
        buttonsHtml += `
    <a href="${link.url}" target="_blank" class="bio-btn">
      <span>${link.title}</span>
    </a>`;
      });

      const fullPagePayload = `<!DOCTYPE html>
<html lang="${isRtl ? 'ar' : 'en'}" dir="${isRtl ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bioName} - Personal Connections Hub</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet font-display">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      ${generatedStyles.bgStyle}
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 60px 20px;
    }
    .wrapper {
      width: 100%;
      max-width: 580px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .avatar-wrapper {
      position: relative;
      margin-bottom: 20px;
    }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    }
    .name {
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .title {
      font-size: 0.92rem;
      opacity: 0.85;
      margin-bottom: 32px;
      max-width: 420px;
      line-height: 1.5;
    }
    .links-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 15px;
      margin-bottom: 40px;
    }
    .bio-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 16px 24px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: transform 0.2s ease, filter 0.2s ease, box-shadow 0.2s ease;
      ${generatedStyles.btnClass}
      ${generatedStyles.borderStyle}
    }
    .bio-btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.04);
      ${buttonShape === 'sharp' ? 'box-shadow: 6px 6px 0px #000;' : 'box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);'}
    }
    .bio-btn:active {
      transform: translateY(0px);
    }
    .social-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 10px;
    }
    .social-links a {
      color: inherit;
      opacity: 0.75;
      transition: transform 0.2s ease, opacity 0.2s ease;
    }
    .social-links a:hover {
      opacity: 1;
      transform: scale(1.15);
    }
    .footer {
      margin-top: 60px;
      font-size: 0.75rem;
      opacity: 0.5;
    }
    .footer a {
      color: inherit;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    
    <div class="avatar-wrapper">
      <img src="${bioAvatar}" alt="Profile Avatar" class="avatar">
    </div>

    <h1 class="name">${bioName}</h1>
    <p class="title">${bioTitle}</p>

    <div class="links-container">
      ${buttonsHtml}
    </div>

    <div class="social-links">
      ${socialIconsHtml}
    </div>

    <div class="footer">
      <p>Created securely via <a href="#" target="_blank">${t('link_builder.title')}</a></p>
    </div>

  </div>
</body>
</html>`;

      const blob = new Blob([fullPagePayload], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'index.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setCopiedNotification(t('link_builder.copied_toast_msg'));
      setTimeout(() => setCopiedNotification(null), 2500);
    });
  };

  return (
    <div className="w-full space-y-7" id="link-tree-builder-root">
      
      {/* Informative Dashboard Jumbotron banner */}
      <div className="flex gap-4 p-5 bg-teal-50 dark:bg-emerald-955/15 border border-teal-100 dark:border-emerald-900/30 rounded-2xl shadow-xs">
        <Sparkles className="w-6 h-6 text-teal-650 shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1 text-slate-705 dark:text-slate-350 select-text">
          <h3 className="font-bold text-sm text-slate-850 dark:text-white">
            {t('link_builder.title')}
          </h3>
          <p className="text-xs">
            {t('link_builder.desc')}
          </p>
          <p className="text-[10px] font-mono font-semibold text-teal-650 dark:text-teal-400">
            {isRtl 
              ? '⚡ متطابق تماماً مع أجهزة التابلت واللمس: صمم، عاين حياً محلياً، وقم بالتصدير كعنوان ويب مكتمل وصديق للتصفح الخلوي بخصوصية كاملة.'
              : '⚡ Full device layout compatibility: Build seamlessly, view in-mockup instantly, and export beautiful standalone index.html documents.'
            }
          </p>
        </div>
      </div>

      {/* Grid: Columns for configurations vs previews */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-7">

        {/* CONTROLS (7 Columns) */}
        <div className="xl:col-span-7 space-y-6">

          {/* 1. IDENTITY & BIO SECTION */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-3xs">
            
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <User className="w-4 h-4 text-teal-500" />
              {t('link_builder.biography_section')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono block">
                  {t('link_builder.bio_name')}
                </label>
                <input
                  type="text"
                  value={bioName}
                  onChange={(e) => startTransition(() => setBioName(e.target.value))}
                  placeholder="e.g. Robin Hood"
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono block">
                  {t('link_builder.bio_avatar')}
                </label>
                <input
                  type="text"
                  value={bioAvatar}
                  onChange={(e) => startTransition(() => setBioAvatar(e.target.value))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-slate-400 font-mono block">
                {t('link_builder.bio_title')}
              </label>
              <textarea
                value={bioTitle}
                onChange={(e) => startTransition(() => setBioTitle(e.target.value))}
                rows={2}
                placeholder="A short punchy line introducing who you are..."
                className="w-full p-3 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-teal-500 transition resize-none"
              />
            </div>

            {/* Quick avatar preset selector */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-[10px] text-slate-400 font-mono mr-1">
                {t('link_builder.avatar_upload_btn')} :
              </span>
              <div className="flex items-center gap-2.5">
                {AVATAR_PRESETS.map((iconUrl, index) => (
                  <button
                    key={index}
                    onClick={() => startTransition(() => setBioAvatar(iconUrl))}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition hover:scale-110 cursor-pointer ${
                      bioAvatar === iconUrl ? 'border-teal-500 scale-105' : 'border-transparent'
                    }`}
                  >
                    <img src={iconUrl} alt="Preset visual" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 2. DYNAMIC LINKS CONFIGURATOR */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-3xs">
            
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
              <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <LinkIcon className="w-4 h-4 text-teal-500" />
                {t('link_builder.add_link')}
              </h4>

              <button
                onClick={handleAddLink}
                className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1.5 shadow-3xs cursor-pointer"
                id="btn-add-dynamic-link"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إضافة زر جديد' : 'Add Item'}</span>
              </button>
            </div>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {links.map((link, index) => (
                  <motion.div
                    key={link.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="p-4 bg-slate-55 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl relative group hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
                  >
                    
                    {/* Input labels & title delete index bubble */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-teal-650 bg-teal-50 dark:bg-emerald-950/40 dark:text-emerald-400 py-0.5 px-2 rounded-md">
                        {isRtl ? `الزر الرقم #${index + 1}` : `Link Button #${index + 1}`}
                      </span>

                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="opacity-80 hover:opacity-100 p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                        title="Delete this dynamic link button"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => handleUpdateLink(link.id, { title: e.target.value })}
                          placeholder={t('link_builder.link_title_placeholder')}
                          className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-155 focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => handleUpdateLink(link.id, { url: e.target.value })}
                          placeholder={t('link_builder.link_url_placeholder')}
                          className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-155 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500 transition"
                        />
                      </div>
                    </div>

                  </motion.div>
                ))}
              </AnimatePresence>

              {links.length === 0 && (
                <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs mb-2">
                    {isRtl ? 'لا توجد أزرار روابط مضافة حتى الآن.' : 'No active landing links added to Bio page yet.'}
                  </p>
                  <button
                    onClick={handleAddLink}
                    className="py-1 px-3 text-[11px] font-bold bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg transition"
                  >
                    {isRtl ? 'إنشاء الزر الأول الآن' : 'Create First Button'}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* 3. STYLING VARIATIONS & SHAPES */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-5 shadow-3xs">
            
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Palette className="w-4 h-4 text-teal-500" />
              {t('link_builder.theme_select')}
            </h4>

            {/* Background Style options */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-slate-400 font-mono block">
                {t('link_builder.theme_select')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { key: 'flat', label: t('link_builder.theme_flat'), color: 'bg-slate-100 border-slate-300' },
                  { key: 'gradient', label: t('link_builder.theme_gradient'), color: 'bg-gradient-to-r from-pink-300 to-rose-400 border-rose-300' },
                  { key: 'neon', label: t('link_builder.theme_neon'), color: 'bg-slate-950 border-cyan-500 text-cyan-400' },
                  { key: 'dark', label: t('link_builder.theme_dark'), color: 'bg-slate-900 border-slate-800' },
                  { key: 'glass', label: t('link_builder.theme_glass'), color: 'bg-gradient-to-r from-indigo-500 to-cyan-500 border-indigo-400' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setThemeStyle(item.key as any)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold flex flex-col gap-1.5 transition hover:scale-[1.02] cursor-pointer ${
                      themeStyle === item.key 
                        ? 'border-teal-500 ring-2 ring-teal-500/20' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className={`w-full h-8 rounded-lg ${item.color} flex items-center justify-center text-[9px] font-mono font-bold uppercase`}>
                      AA
                    </span>
                    <span className="text-[10px] text-slate-650 dark:text-slate-300 truncate w-full">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Button Shapes configurator options */}
            <div className="space-y-1.5 pt-1 border-t border-slate-50 dark:border-slate-800/60">
              <label className="text-[10.5px] font-bold text-slate-400 font-mono block">
                {t('link_builder.button_shape')}
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { key: 'rounded', label: t('link_builder.button_shape_rounded'), preview: 'rounded-lg' },
                  { key: 'sharp', label: t('link_builder.button_shape_sharp'), preview: 'rounded-none border-2 border-slate-800 shadow-[2px_2px_0px_rgba(0,0,0,0.8)]' },
                  { key: 'pill', label: t('link_builder.button_shape_pill'), preview: 'rounded-full' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setButtonShape(item.key as any)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition hover:scale-[1.02] cursor-pointer ${
                      buttonShape === item.key 
                        ? 'border-teal-500 bg-teal-50/10' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className={`w-14 h-5 bg-slate-200 dark:bg-slate-800 ${item.preview}`} />
                    <span className="text-[10px] text-slate-650 dark:text-slate-300">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* 4. SOCIAL MEDIA LOGS */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-850 rounded-2xl space-y-4 shadow-3xs">
            
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Settings className="w-4 h-4 text-teal-500" />
              {t('link_builder.social_links_section')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono flex items-center gap-1">
                  <Github className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('link_builder.social_github')}</span>
                </label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono flex items-center gap-1">
                  <Twitter className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t('link_builder.social_twitter')}</span>
                </label>
                <input
                  type="text"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t('link_builder.social_linkedin')}</span>
                </label>
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-400 font-mono flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-pink-500" />
                  <span>{t('link_builder.social_instagram')}</span>
                </label>
                <input
                  type="text"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="Username only (e.g. alexa)"
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-slate-800 rounded-xl bg-slate-55 dark:bg-slate-950/60 text-slate-850 dark:text-slate-150 font-mono focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* Quick populate & load triggers */}
          <div className="flex items-center justify-between">
            <button
              onClick={loadSample}
              className="py-2 px-4 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-850 text-slate-550 dark:text-slate-350 transition flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-teal-500" />
              <span>{t('link_builder.sample_links_btn')}</span>
            </button>

            <button
              onClick={handleExportPageFile}
              className="py-3 px-6 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white transition flex items-center gap-2 shadow-lg hover:scale-101 cursor-pointer"
              id="export-landing-page-html-file-btn"
            >
              <Download className="w-4 h-4" />
              <span>{t('link_builder.export_page')}</span>
            </button>
          </div>

        </div>

        {/* INTERACTIVE PREVIEW MOCKUP DEVICE (5 Columns, sticky) */}
        <div className="xl:col-span-5 space-y-4">
          
          <div className="sticky top-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Smartphone className="w-4.5 h-4.5 text-slate-400" />
                {t('link_builder.preview_header')}
              </span>
            </div>

            {/* Immersive Phone shell simulating mobile landscape */}
            <div className="relative mx-auto max-w-[340px] aspect-[9/18.5] bg-slate-950 dark:bg-black rounded-[40px] p-3.5 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-100/5 overflow-hidden">
              
              {/* Dynamic camera pill groove notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-20 flex justify-center items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-800" />
              </div>

              {/* Dynamic scrollable screen displaying live links */}
              <div 
                className="w-full h-full rounded-[28px] overflow-y-auto pb-8 pt-10 px-5 flex flex-col items-center text-center transition-all duration-300 relative select-none scrollbar-none"
                style={{
                  background: themeStyle === 'flat' ? '#f8fafc' 
                    : themeStyle === 'gradient' ? 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
                    : themeStyle === 'neon' ? 'radial-gradient(circle at top, #131326 0%, #08080c 100%)'
                    : themeStyle === 'dark' ? '#090d16'
                    : 'linear-gradient(225deg, #4f46e5 0%, #06b6d4 100%)',
                  color: (themeStyle === 'flat' || themeStyle === 'gradient') ? '#0f172a' : '#ffffff'
                }}
              >
                
                {/* Avatar preview block */}
                <div className="relative mb-4 mt-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/45 shadow-md mx-auto">
                    {bioAvatar ? (
                      <img src={bioAvatar} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Display names */}
                <h2 className="text-sm font-bold tracking-tight px-2 leading-tight mb-1">
                  {bioName || 'Anonymous'}
                </h2>

                <p 
                  className={`text-[10px] leading-relaxed max-w-[220px] mb-6 line-clamp-3 select-text`}
                  style={{
                    opacity: 0.82,
                    color: (themeStyle === 'flat' || themeStyle === 'gradient') ? '#475569' : '#e2e8f0'
                  }}
                >
                  {bioTitle || 'No profile description tag added yet.'}
                </p>

                {/* Rendered Actionable link tree inside the Mockup */}
                <div className="w-full space-y-3 flex-1">
                  {links.filter(l => l.title.trim()).map((link) => (
                    <a
                      key={link.id}
                      href={link.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block w-full py-3 px-4 text-[10.5px] font-bold text-center transition hover:scale-[1.01] active:scale-100 ${
                        buttonShape === 'rounded' ? 'rounded-xl' 
                          : buttonShape === 'sharp' ? 'rounded-none border-2 border-dashed shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                          : 'rounded-full'
                      }`}
                      style={{
                        background: themeStyle === 'flat' ? '#ffffff'
                          : themeStyle === 'gradient' ? 'rgba(255, 255, 255, 0.85)'
                          : themeStyle === 'neon' ? '#111122'
                          : themeStyle === 'dark' ? '#151e33'
                          : 'rgba(255, 255, 255, 0.16)',
                        border: themeStyle === 'flat' ? '1px solid #e2e8f0'
                          : themeStyle === 'gradient' ? '1px solid rgba(255,255,255,0.45)'
                          : themeStyle === 'neon' ? '1.5px solid #06b6d4'
                          : themeStyle === 'dark' ? '1px solid #1e294b'
                          : '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: buttonShape === 'sharp' ? '2px 2px 0px #000' : 'none',
                        color: themeStyle === 'neon' ? '#38bdf8' 
                          : (themeStyle === 'flat' || themeStyle === 'gradient') ? '#0f172a' : '#ffffff'
                      }}
                    >
                      <span className="truncate block">{link.title}</span>
                    </a>
                  ))}

                  {links.filter(l => l.title.trim()).length === 0 && (
                    <p className={`text-[10px] italic pt-4 ${generatedStyles.labelClass}`}>
                      {isRtl ? 'البطاقة فارغة.. تظهر الأزرار المكتملة هنا مباشرة.' : 'Leaf is empty.. Valid buttons show here.'}
                    </p>
                  )}
                </div>

                {/* Social links row */}
                <div className="flex items-center justify-center gap-3.5 pt-6 mt-auto">
                  {githubUrl.trim() && <Github className="w-4 h-4 opacity-75 hover:opacity-100" />}
                  {twitterUrl.trim() && <Twitter className="w-4 h-4 opacity-75 hover:opacity-100" />}
                  {linkedinUrl.trim() && <Linkedin className="w-4 h-4 opacity-75 hover:opacity-100" />}
                  {instagramUrl.trim() && <Instagram className="w-4 h-4 opacity-75 hover:opacity-100" />}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* Slide-out Copy/Export notification toast */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {copiedNotification && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="py-2.5 px-5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-2 border border-slate-700/10 pointer-events-auto"
              id="copied-notification-toast"
            >
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{copiedNotification}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
