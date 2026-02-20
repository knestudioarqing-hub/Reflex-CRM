import React from 'react';
import { LayoutDashboard, FolderKanban, History, Settings, Users, Calendar } from 'lucide-react';
import { translations } from '../translations';
import { Language, Theme } from '../types';

interface DockProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  lang: Language;
  theme: Theme;
}

export const Dock: React.FC<DockProps> = ({ currentView, setCurrentView, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'projects', icon: FolderKanban, label: t.projects },
    { id: 'calendar', icon: Calendar, label: t.calendar },
    { id: 'members', icon: Users, label: t.members },
    { id: 'analytics', icon: History, label: t.analytics },
    { id: 'settings', icon: Settings, label: t.settings },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
      {/* Main Pill Container - Keeps the dynamic island look but adapts border in light mode */}
      <div className={`relative flex items-center gap-1 p-1.5 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] ring-1 transition-all duration-500
          ${isDark 
            ? 'bg-[#050505] border border-white/10 ring-white/10' 
            : 'bg-white border border-slate-200 ring-slate-200/50 shadow-slate-300/50'
          }`}>
        
        {/* Top Gloss Reflection - Only for Dark Mode */}
        {isDark && <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-70" />}
        
        {/* Bottom Ambient Glow */}
        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-8 blur-xl rounded-full pointer-events-none opacity-50 ${isDark ? 'bg-white/5' : 'bg-slate-400/20'}`} />

        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`
                relative flex items-center justify-center h-11 rounded-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
                ${isActive 
                  ? isDark 
                    ? 'w-auto pl-3 pr-5 bg-[#FF5500] text-white shadow-[0_0_20px_-5px_rgba(255,85,0,0.4)] border border-[#FF5500]/20' 
                    : 'w-auto pl-3 pr-5 bg-[#FF5500] text-white shadow-lg shadow-orange-500/20 border border-orange-400'
                  : isDark
                    ? 'w-11 text-zinc-500 hover:text-white hover:bg-white/10'
                    : 'w-11 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                }
              `}
              title={item.label}
            >
              {/* Icon */}
              <div className={`relative z-10 flex items-center justify-center ${isActive ? 'mr-2' : ''}`}>
                <item.icon
                  size={isActive ? 18 : 20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform duration-300"
                />
              </div>

              {/* Text Label (Only visible when active) */}
              <div 
                className={`
                  text-sm font-medium whitespace-nowrap transition-all duration-500
                  ${isActive ? 'opacity-100 max-w-[100px] translate-x-0' : 'opacity-0 max-w-0 -translate-x-4'}
                `}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.label}
              </div>

              {/* Active Inner Highlight (Dark Mode only) */}
              {isActive && isDark && (
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};