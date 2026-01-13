import React from 'react';
import { LayoutDashboard, FolderKanban, History, Settings, LogOut, Users } from 'lucide-react';
import { translations } from '../translations';
import { Language, Branding } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  lang: Language;
  branding: Branding;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, lang, branding }) => {
  const t = translations[lang];

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'projects', icon: FolderKanban, label: t.projects },
    { id: 'members', icon: Users, label: t.members },
    { id: 'analytics', icon: History, label: t.analytics },
    { id: 'settings', icon: Settings, label: t.settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0B0E14]/95 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 transition-transform duration-300 ease-in-out">
      {/* Branding Header */}
      <div className="p-8 flex items-center gap-3">
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center font-bold text-white">
            {branding.companyName.substring(0, 1)}
          </div>
        )}
        <h1 className="text-xl font-bold text-white tracking-wide">{branding.companyName}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id
                ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/10 text-white border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon
              size={20}
              className={`${
                currentView === item.id 
                  ? 'text-emerald-400' 
                  : 'text-slate-500 group-hover:text-slate-300'
              }`}
            />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Profile / Logout */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
          <img
            src="https://picsum.photos/100/100"
            alt="User"
            className="w-8 h-8 rounded-full border border-white/20"
          />
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Gianfranco</p>
            <p className="text-xs text-slate-500 truncate">Projetista Elétrico</p>
          </div>
          <LogOut size={16} className="text-slate-500 cursor-pointer hover:text-white" />
        </div>
      </div>
    </aside>
  );
};