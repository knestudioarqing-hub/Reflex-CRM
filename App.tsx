import React, { useState, useEffect } from 'react';
import { Dock } from './components/Dock';
import { Dashboard } from './components/Dashboard';
import { Projects } from './components/Projects';
import { Members } from './components/Members';
import { Settings } from './components/Settings';
import { ActivityHistory } from './components/ActivityHistory';
import { SplashScreen } from './components/SplashScreen';
import { Search, Bell, Globe, LogOut, Sun, Moon, User } from 'lucide-react';
import { translations } from './translations';
import { Language, Branding, Project, Member, Theme } from './types';
import { getUserIP, loadUserData, saveUserData } from './services/storageService';

const DEFAULT_BRANDING: Branding = {
  companyName: 'REFLEX CRM',
  primaryColor: '#BEF264', // Neon Lime
  logoUrl: null
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [userIp, setUserIp] = useState<string>('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [lang, setLang] = useState<Language>('pt'); // Default to Portuguese
  const [theme, setTheme] = useState<Theme>('dark');
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  
  // Initialize with empty, but will populate from storage
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const t = translations[lang];

  // 1. Initialize: Fetch IP -> Load Data -> Hide Splash
  useEffect(() => {
    const initializeApp = async () => {
      // 1. Get User IP
      const ip = await getUserIP();
      setUserIp(ip);

      // 2. Load Data for this IP
      const savedData = loadUserData(ip);
      
      if (savedData) {
        setProjects(savedData.projects);
        setMembers(savedData.members);
        if (savedData.branding) setBranding(savedData.branding);
        setTheme(savedData.theme as Theme);
        setLang(savedData.lang as Language);
      }

      setIsDataLoaded(true);

      // 3. Handle Splash Screen Timer
      setTimeout(() => {
        setShowSplash(false);
      }, 3500);
    };

    initializeApp();
  }, []);

  // 2. Persistence: Save data whenever it changes (only if data has finished loading)
  useEffect(() => {
    if (isDataLoaded && userIp) {
      saveUserData(userIp, {
        projects,
        members,
        branding,
        theme,
        lang
      });
    }
  }, [projects, members, branding, theme, lang, userIp, isDataLoaded]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'pt' : 'en');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (showSplash) {
    return <SplashScreen branding={branding} lang={lang} />;
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
        <header className="flex justify-between items-center px-4 py-5 md:px-8 md:py-8 z-30 relative transition-all duration-300">
          
          {/* Left: Mobile Brand Name (Visible on Mobile & Tablet) */}
          <div className="lg:hidden z-20 flex-shrink-0 mr-4">
             <h1 className={`text-xl font-normal tracking-widest bg-clip-text text-transparent uppercase drop-shadow-sm select-none ${isDark ? 'bg-gradient-to-b from-white to-slate-400' : 'bg-gradient-to-b from-slate-900 to-slate-600'}`} style={{ fontFamily: "'Urbanist', sans-serif" }}>
               {branding.companyName}
             </h1>
          </div>

          {/* Left: Search (Desktop Only) */}
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

          {/* Center: Brand Name (Large Screens Only - Absolute Position) */}
          {/* Moved to Large screens only to prevent tablet overlap */}
          <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
             <h1 className={`text-3xl font-normal tracking-widest bg-clip-text text-transparent uppercase drop-shadow-sm select-none ${isDark ? 'bg-gradient-to-b from-white to-slate-400' : 'bg-gradient-to-b from-slate-900 to-slate-600'}`} style={{ fontFamily: "'Urbanist', sans-serif" }}>
               {branding.companyName}
             </h1>
          </div>

          {/* Right: Controls & Profile */}
          <div className="flex items-center gap-2 md:gap-3 z-20 ml-auto md:ml-0 flex-shrink-0">
             
             {/* IP Indicator (Subtle) */}
             <div className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${isDark ? 'bg-[#151A23]/50 border-white/5 text-slate-500' : 'bg-white/70 border-slate-200 text-slate-400'}`} title="Connected IP">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {userIp || 'Connecting...'}
             </div>

             <button 
              onClick={toggleTheme}
              className={`p-2.5 md:p-3 rounded-xl backdrop-blur-md border transition-all shadow-lg ${isDark ? 'bg-[#151A23]/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-900'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
              onClick={toggleLanguage}
              className={`p-2.5 md:p-3 rounded-xl backdrop-blur-md border transition-all shadow-lg ${isDark ? 'bg-[#151A23]/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-900'}`}
              title={t.switchLanguage}
            >
              <Globe size={20} />
            </button>

            <button className={`p-2.5 md:p-3 rounded-xl backdrop-blur-md border transition-all relative shadow-lg ${isDark ? 'bg-[#151A23]/50 border-white/10 text-slate-400 hover:text-white' : 'bg-white/70 border-slate-200 text-slate-500 hover:text-slate-900'}`} title="Notifications">
              <Bell size={20} />
              <span className={`absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border ${isDark ? 'border-[#151A23]' : 'border-white'}`} />
            </button>

            <div className={`h-10 w-[1px] mx-1 md:mx-2 hidden sm:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>

            <div className="flex items-center gap-3 pl-1 md:pl-2 cursor-pointer group">
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center border-2 transition-colors shadow-lg bg-[#BEF264] text-black ${isDark ? 'border-slate-700 group-hover:border-[#BEF264]' : 'border-slate-200 group-hover:border-[#BEF264]'}`}>
                    <User size={20} />
                </div>
                <div className="hidden sm:block text-right">
                    <p className={`text-sm font-bold leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Gianfranco</p>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Projetista Elétrico</p>
                </div>
                <LogOut size={18} className="text-slate-500 group-hover:text-red-400 transition-colors ml-1 md:ml-2 hidden md:block" />
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
          <div className="w-full">
            {currentView === 'dashboard' && <Dashboard projects={projects} setProjects={setProjects} members={members} lang={lang} theme={theme} />}
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