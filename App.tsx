import React, { useState, useEffect } from 'react';
import { Dock } from './components/Dock';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Members } from './components/Members';
import { Settings } from './components/Settings';
import { ActivityHistory } from './components/ActivityHistory';
import { SplashScreen } from './components/SplashScreen';
import { Search, Bell, Globe, LogOut, Sun, Moon } from 'lucide-react';
import { translations } from './translations';
import { Language, Branding, Project, Member, Theme } from './types';

const DEFAULT_BRANDING: Branding = {
  companyName: 'REFLEX CRM',
  primaryColor: '#BEF264', // Neon Lime
  logoUrl: null
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  
  // Initialize with 0 projects and empty members as requested
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const t = translations[lang];

  useEffect(() => {
    // Show splash screen for 3.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'pt' : 'en');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (showSplash) {
    return <SplashScreen branding={branding} />;
  }

  const isDark = theme === 'dark';
  
  return (
    <div className={`flex min-h-screen font-sans animate-fade-in transition-colors duration-500 ${isDark ? 'bg-[#0B0E14] text-white selection:bg-[#BEF264]/30 selection:text-[#BEF264]' : 'bg-[#F8FAFC] text-slate-900 selection:bg-[#BEF264] selection:text-black'}`}>
      
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-700 ${isDark ? 'bg-[#BEF264]/5' : 'bg-[#BEF264]/20'}`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-700 ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
      </div>

      <main className="w-full relative z-10 flex flex-col h-screen overflow-hidden">
        {/* Header - Transparent Background with Floating Elements */}
        <header className="flex justify-between items-center px-8 py-8 z-30 relative">
          
          {/* Left: Search (Moved from Center to Left) */}
          <div className="hidden md:block w-full max-w-xs z-20">
            <div className="relative group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-[#BEF264]' : 'text-slate-400 group-focus-within:text-black'}`} size={18} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder}
                className={`w-full backdrop-blur-md border rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all shadow-lg
                  ${isDark 
                    ? 'bg-[#151A23]/50 border-white/10 text-white focus:border-[#BEF264]/50 hover:bg-white/5' 
                    : 'bg-white/70 border-slate-200 text-slate-800 focus:border-[#BEF264] hover:bg-white'
                  }`}
              />
            </div>
          </div>

          {/* Center: Brand Name Only (Absolute Position) - Urbanist Regular */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
             <h1 className={`text-3xl font-normal tracking-widest bg-clip-text text-transparent uppercase drop-shadow-sm select-none ${isDark ? 'bg-gradient-to-b from-white to-slate-400' : 'bg-gradient-to-b from-slate-900 to-slate-600'}`} style={{ fontFamily: "'Urbanist', sans-serif" }}>
               {branding.companyName}
             </h1>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center gap-3 z-20 ml-auto md:ml-0">
             <button 
              onClick={toggleTheme}
              className={`p-3 rounded-xl backdrop-blur-md border transition-all shadow-lg ${isDark ? 'bg-[#151A23]/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-900'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={toggleLanguage}
              className={`p-3 rounded-xl backdrop-blur-md border transition-all shadow-lg ${isDark ? 'bg-[#151A23]/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-900'}`}
              title={t.switchLanguage}
            >
              <Globe size={20} />
            </button>

            <button className={`p-3 rounded-xl backdrop-blur-md border transition-all relative shadow-lg ${isDark ? 'bg-[#151A23]/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-900'}`}>
              <Bell size={20} />
              <span className={`absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border ${isDark ? 'border-[#151A23]' : 'border-white'}`} />
            </button>

            <div className={`h-10 w-[1px] mx-2 hidden sm:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>

            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                <img
                    src="https://picsum.photos/100/100"
                    alt="User"
                    className={`w-11 h-11 rounded-full border-2 transition-colors shadow-lg ${isDark ? 'border-slate-700 group-hover:border-[#BEF264]' : 'border-slate-200 group-hover:border-[#BEF264]'}`}
                />
                <div className="hidden sm:block text-right">
                    <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Alex Designer</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">BIM Manager</p>
                </div>
                <LogOut size={18} className="text-slate-500 group-hover:text-red-400 transition-colors ml-2" />
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8 pb-32 custom-scrollbar">
          <div className="w-full">
            {currentView === 'dashboard' && <Dashboard projects={projects} members={members} lang={lang} theme={theme} />}
            {currentView === 'projects' && (
               <Projects projects={projects} setProjects={setProjects} members={members} lang={lang} theme={theme} />
            )}
            {currentView === 'members' && (
              <Members members={members} setMembers={setMembers} projects={projects} setProjects={setProjects} lang={lang} theme={theme} />
            )}
            {currentView === 'analytics' && (
               <ActivityHistory projects={projects} lang={lang} theme={theme} />
            )}
            {currentView === 'settings' && <Settings branding={branding} setBranding={setBranding} lang={lang} theme={theme} />}
          </div>
        </div>

        {/* Floating Dock */}
        <Dock 
          currentView={currentView} 
          setCurrentView={setCurrentView} 
          lang={lang} 
          theme={theme}
        />
      </main>
    </div>
  );
};

export default App;