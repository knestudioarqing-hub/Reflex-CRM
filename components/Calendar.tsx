import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, RefreshCw, X, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Language, Theme } from '../types';
import { translations } from '../translations';

interface CalendarProps {
  lang: Language;
  theme: Theme;
}

interface CalendarEvent {
  day: number;
  monthOffset: number; // 0 for current month, 1 for next, etc.
  title: string;
  type: 'google' | 'outlook';
  time: string;
}

export const Calendar: React.FC<CalendarProps> = ({ lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Dynamic Mock Events generator based on current date
  const generateMockEvents = (): CalendarEvent[] => {
    return [
      { day: 5, monthOffset: 0, title: 'BIM Clash Detection', type: 'google', time: '10:00 AM' },
      { day: 12, monthOffset: 0, title: 'Client Meeting', type: 'outlook', time: '2:00 PM' },
      { day: 15, monthOffset: 0, title: 'Project Delivery', type: 'google', time: '5:00 PM' },
      { day: 22, monthOffset: 0, title: 'Team Sync', type: 'outlook', time: '9:00 AM' },
      { day: 28, monthOffset: 0, title: 'Site Visit', type: 'google', time: '11:30 AM' },
      { day: 2, monthOffset: 1, title: 'Planning Phase 2', type: 'google', time: '09:00 AM' },
    ];
  };

  const [events] = useState<CalendarEvent[]>(generateMockEvents());

  // Helper to open a fake auth window
  const simulateAuthWindow = (provider: 'Google' | 'Microsoft') => {
    return new Promise<void>((resolve) => {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
            '', 
            'Auth', 
            `width=${width},height=${height},top=${top},left=${left}`
        );

        if (popup) {
            const color = provider === 'Google' ? '#DB4437' : '#0078D4';
            popup.document.write(`
                <html>
                <head>
                    <title>Sign in with ${provider}</title>
                    <style>
                        body { background-color: #121212; color: white; font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                        .loader { border: 3px solid #333; border-top: 3px solid ${color}; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                        h2 { font-weight: 500; margin-bottom: 10px; }
                        p { color: #888; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="loader"></div>
                    <h2>Connecting to ${provider}...</h2>
                    <p>Verifying credentials securely.</p>
                </body>
                </html>
            `);
            
            setTimeout(() => {
                popup.close();
                resolve();
            }, 2500);
        } else {
            // If popup blocked
            setTimeout(resolve, 2000);
        }
    });
  };

  const handleConnect = async (provider: 'google' | 'outlook') => {
    const isConnected = provider === 'google' ? googleConnected : outlookConnected;

    if (isConnected) {
        if (confirm(t.disconnect + '?')) {
            if (provider === 'google') setGoogleConnected(false);
            if (provider === 'outlook') setOutlookConnected(false);
            setShowToast({ message: 'Account disconnected successfully', type: 'info' });
            setTimeout(() => setShowToast(null), 3000);
        }
        return;
    }

    setLoading(provider);
    
    // Simulate real OAuth flow
    await simulateAuthWindow(provider === 'google' ? 'Google' : 'Microsoft');

    if (provider === 'google') setGoogleConnected(true);
    if (provider === 'outlook') setOutlookConnected(true);
    
    setLoading(null);
    setShowToast({ message: 'Calendar synced successfully (Demo Mode)', type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto relative">
      
      {/* Toast Notification */}
      {showToast && createPortal(
        <div className={`fixed top-6 right-6 z-[150] animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${isDark ? 'bg-[#1A1F2C] border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${showToast.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
              <Check size={18} />
           </div>
           <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{showToast.type === 'success' ? 'Success' : 'Info'}</h4>
              <p className="text-xs text-slate-500">{showToast.message}</p>
           </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col">
        <h1 className={`text-4xl font-light mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.calendar}
        </h1>
        <p className="text-slate-500">{t.calendarSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Integrations */}
          <div className="space-y-6">
              <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white border-slate-200'}`}>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>Integrations</h3>
                  
                  {/* Google Calendar */}
                  <div className={`p-4 rounded-2xl border mb-4 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm p-2">
                               <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1">
                              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Google Calendar</h4>
                              <p className="text-xs text-slate-500">{googleConnected ? t.connected : 'Not connected'}</p>
                          </div>
                          {googleConnected && <Check size={16} className="text-emerald-500" />}
                      </div>
                      <button 
                        onClick={() => handleConnect('google')}
                        disabled={loading === 'google'}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            googleConnected 
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                        }`}
                      >
                          {loading === 'google' ? <RefreshCw size={14} className="animate-spin" /> : googleConnected ? t.disconnect : t.connectGoogle}
                      </button>
                  </div>

                  {/* Outlook Calendar */}
                  <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 rounded-full bg-[#0078D4] flex items-center justify-center shadow-sm text-white font-bold text-lg">
                              O
                          </div>
                          <div className="flex-1">
                              <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Outlook Calendar</h4>
                              <p className="text-xs text-slate-500">{outlookConnected ? t.connected : 'Not connected'}</p>
                          </div>
                          {outlookConnected && <Check size={16} className="text-emerald-500" />}
                      </div>
                      <button 
                         onClick={() => handleConnect('outlook')}
                         disabled={loading === 'outlook'}
                         className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            outlookConnected 
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                            : 'bg-[#0078D4] text-white hover:bg-[#006cbd] shadow-lg shadow-blue-500/20'
                        }`}
                      >
                         {loading === 'outlook' ? <RefreshCw size={14} className="animate-spin" /> : outlookConnected ? t.disconnect : t.connectOutlook}
                      </button>
                  </div>

                  {/* Demo Mode Disclaimer */}
                  <div className={`mt-4 p-3 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-200'}`}>
                      <AlertTriangle size={16} className="text-orange-500 mt-0.5 flex-shrink-0" />
                      <p className={`text-[10px] ${isDark ? 'text-orange-200' : 'text-orange-800'}`}>
                          <strong>Demo Mode:</strong> Actual integration requires backend API keys (Google Console / Azure AD). This demo simulates the OAuth flow and displays mock events.
                      </p>
                  </div>
              </div>

              {/* Upcoming Events List */}
              {(googleConnected || outlookConnected) && (
                  <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl animate-fade-in ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white border-slate-200'}`}>
                      <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <Clock size={18} className="text-emerald-500" />
                          {t.upcomingEvents}
                      </h3>
                      <div className="space-y-3">
                          {events
                            .filter(e => (e.type === 'google' && googleConnected) || (e.type === 'outlook' && outlookConnected))
                            // Only show events for current month in the list or near future
                            .filter(e => e.monthOffset === 0)
                            .slice(0, 3)
                            .map((event, idx) => (
                              <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className={`w-1 h-8 rounded-full ${event.type === 'google' ? 'bg-blue-500' : 'bg-[#0078D4]'}`} />
                                  <div className="flex-1">
                                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title}</p>
                                      <p className="text-xs text-slate-500">{event.time} • Day {event.day}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          {/* Right Column: Calendar Grid */}
          <div className={`lg:col-span-2 p-6 md:p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white border-slate-200'}`}>
              
              {/* Controls */}
              <div className="flex justify-between items-center mb-8">
                  <h2 className={`text-2xl font-bold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{getMonthName(currentDate)}</h2>
                  <div className="flex gap-2">
                      <button onClick={() => changeMonth(-1)} className={`p-2 rounded-xl border ${isDark ? 'border-slate-700 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>
                          <ChevronLeft size={20} />
                      </button>
                      <button onClick={() => changeMonth(1)} className={`p-2 rounded-xl border ${isDark ? 'border-slate-700 hover:bg-white/5 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'}`}>
                          <ChevronRight size={20} />
                      </button>
                  </div>
              </div>

              {/* Grid Header */}
              <div className="grid grid-cols-7 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-xs font-bold uppercase text-slate-500 tracking-wider">
                          {day}
                      </div>
                  ))}
              </div>

              {/* Grid Body */}
              <div className="grid grid-cols-7 gap-2 md:gap-4">
                  {/* Empty slots for previous month */}
                  {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                      const day = i + 1;
                      
                      // Calculate the month difference between the calendar view and the "now" date
                      const today = new Date();
                      const viewMonthIndex = currentDate.getMonth();
                      const currentMonthIndex = today.getMonth();
                      // Simple logic: mock events are set with a "monthOffset". 
                      // 0 = current real month. 
                      // We need to check if the viewMonthIndex matches the (realMonth + offset)
                      
                      const offsetNeeded = viewMonthIndex - currentMonthIndex;

                      const eventsToday = events.filter(e => 
                        e.day === day && 
                        e.monthOffset === offsetNeeded &&
                        ((e.type === 'google' && googleConnected) || (e.type === 'outlook' && outlookConnected))
                      );

                      const isToday = day === today.getDate() && viewMonthIndex === currentMonthIndex && currentDate.getFullYear() === today.getFullYear();

                      return (
                          <div 
                            key={day} 
                            className={`aspect-square rounded-2xl border p-2 flex flex-col justify-between transition-all group hover:scale-[1.05] cursor-pointer
                                ${isToday 
                                    ? 'bg-emerald-500/10 border-emerald-500' 
                                    : isDark ? 'bg-[#0B0E14] border-white/5 hover:bg-white/5' : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md'
                                }
                            `}
                          >
                              <span className={`text-sm font-bold ${isToday ? 'text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-700'}`}>
                                  {day}
                              </span>
                              
                              <div className="flex flex-col gap-1">
                                  {eventsToday.map((ev, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`h-1.5 w-full rounded-full ${ev.type === 'google' ? 'bg-blue-500' : 'bg-[#0078D4]'}`} 
                                        title={ev.title}
                                      />
                                  ))}
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* Legend */}
              {(googleConnected || outlookConnected) && (
                 <div className="mt-8 flex gap-4 text-xs font-medium justify-center border-t pt-4 border-slate-500/10">
                    {googleConnected && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="text-slate-500">Google</span>
                        </div>
                    )}
                    {outlookConnected && (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#0078D4]" />
                            <span className="text-slate-500">Outlook</span>
                        </div>
                    )}
                 </div>
              )}
          </div>
      </div>
    </div>
  );
};