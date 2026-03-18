import React from 'react';
import { LayoutDashboard, FolderKanban, History, Settings, LogOut, Users, Calendar } from 'lucide-react';
import { translations } from '../translations';
import { Language, Branding, Theme } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  lang: Language;
  branding: Branding;
  theme: Theme;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, lang, branding, theme }) => {
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
    <aside className={`fixed left-0 top-0 h-full w-64 flex flex-col z-20 transition-all duration-300 ease-in-out border-r ${isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'}`}>
      
      {/* Branding Header */}
      <div className="p-8 pb-4 flex items-center gap-3">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF5500] to-orange-600 flex items-center justify-center font-bold text-white shadow-lg shadow-[#FF5500]/20">
            {branding.companyName.substring(0, 1)}
          </div>
        )}
        <h1 className={`text-xl font-bold tracking-wide truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{branding.companyName}</h1>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? isDark 
                    ? 'bg-gradient-to-r from-[#FF5500]/10 to-[#FF5500]/5 text-white border border-[#FF5500]/20 shadow-[0_0_15px_-3px_rgba(255,85,0,0.15)]'
                    : 'bg-[#FF5500]/10 text-slate-900 border border-[#FF5500]/20 shadow-sm'
                  : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <item.icon
                size={20}
                className={`transition-colors duration-200 ${
                  isActive 
                    ? 'text-[#FF5500]' 
                    : 'text-slate-400 group-hover:text-[#FF5500]'
                }`}
              />
              <span className={`font-semibold text-[14px] ${isActive ? (isDark ? 'text-white' : 'text-[#FF5500]') : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile / Logout Segment */}
      <div className={`p-4 border-t mt-auto ${isDark ? 'border-white/5 bg-[#050505]' : 'border-slate-100 bg-slate-50/50'}`}>
        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors cursor-pointer group ${isDark ? 'bg-white/5 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-[#FF5500]/30 shadow-sm'}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF5500] to-orange-400 flex items-center justify-center text-white font-bold shadow-md">
            G
          </div>
          <div className="flex-1 overflow-hidden">
            <p className={`text-sm font-bold truncate leading-tight ${isDark ? 'text-white' : 'text-slate-900 group-hover:text-[#FF5500] transition-colors'}`}>Gianfranco</p>
            <p className="text-[11px] font-medium text-slate-500 truncate uppercase tracking-wider">{t.electricalDesigner}</p>
          </div>
          <LogOut size={16} className={`transition-colors ${isDark ? 'text-slate-500 group-hover:text-red-400' : 'text-slate-400 group-hover:text-red-500'}`} />
        </div>
      </div>
    </aside>
  );
};
