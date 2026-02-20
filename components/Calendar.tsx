import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, RefreshCw, X, ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Language, Theme } from '../types';
import { translations } from '../translations';

interface CalendarProps {
  lang: Language;
  theme: Theme;
}

interface LocalEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  color: string;
  source: 'local';
}

interface ExternalEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  source: 'google' | 'outlook';
}

type CalendarEvent = LocalEvent | ExternalEvent;

export const Calendar: React.FC<CalendarProps> = ({ lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Integration States
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [loadingIntegration, setLoadingIntegration] = useState<string | null>(null);

  // Local Events State
  const [localEvents, setLocalEvents] = useState<LocalEvent[]>(() => {
    const saved = localStorage.getItem('REFLEX_CALENDAR_EVENTS');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    color: '#3B82F6' // Default Blue
  });

  useEffect(() => {
    localStorage.setItem('REFLEX_CALENDAR_EVENTS', JSON.stringify(localEvents));
  }, [localEvents]);

  // --- INTEGRATION SIMULATION ---
  const simulateAuthWindow = (provider: 'Google' | 'Microsoft') => {
    return new Promise<void>((resolve) => {
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        const popup = window.open('', 'Auth', `width=${width},height=${height},top=${top},left=${left}`);
        if (popup) {
            const color = provider === 'Google' ? '#DB4437' : '#0078D4';
            popup.document.write(`
                <html><body style="background:#121212;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                    <h2 style="color:${color}">Connecting to ${provider}...</h2>
                </body></html>
            `);
            setTimeout(() => { popup.close(); resolve(); }, 1500);
        } else {
            setTimeout(resolve, 1500);
        }
    });
  };

  const handleConnect = async (provider: 'google' | 'outlook') => {
    const isConnected = provider === 'google' ? googleConnected : outlookConnected;
    if (isConnected) {
        if (provider === 'google') setGoogleConnected(false);
        if (provider === 'outlook') setOutlookConnected(false);
        return;
    }
    setLoadingIntegration(provider);
    await simulateAuthWindow(provider === 'google' ? 'Google' : 'Microsoft');
    if (provider === 'google') setGoogleConnected(true);
    if (provider === 'outlook') setOutlookConnected(true);
    setLoadingIntegration(null);
    setShowToast({ message: `${provider === 'google' ? 'Google' : 'Outlook'} Calendar Connected`, type: 'success' });
    setTimeout(() => setShowToast(null), 3000);
  };

  // --- EVENT MANAGEMENT ---
  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const event: LocalEvent = {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        time: newEvent.time,
        color: newEvent.color,
        source: 'local'
    };
    setLocalEvents([...localEvents, event]);
    setIsModalOpen(false);
    setNewEvent({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', color: '#3B82F6' });
  };

  const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalEvents(localEvents.filter(ev => ev.id !== id));
  };

  const handleDateClick = (day: number) => {
    // Construct date string YYYY-MM-DD padding zeros
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setNewEvent(prev => ({ ...prev, date: `${year}-${month}-${dayStr}` }));
    setIsModalOpen(true);
  };

  // --- CALENDAR UTILS ---
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const changeMonth = (offset: number) => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getMonthName = (date: Date) => date.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });

  // --- MOCK EXTERNAL EVENTS ---
  const getExternalEvents = (): ExternalEvent[] => {
    const evs: ExternalEvent[] = [];
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    if (googleConnected) {
        evs.push({ id: 'g1', title: 'Google Meet: Team Sync', date: `${year}-${month}-05`, time: '10:00', color: '#EA4335', source: 'google' });
        evs.push({ id: 'g2', title: 'Site Inspection', date: `${year}-${month}-15`, time: '14:00', color: '#EA4335', source: 'google' });
    }
    if (outlookConnected) {
        evs.push({ id: 'o1', title: 'Client Call', date: `${year}-${month}-10`, time: '09:00', color: '#0078D4', source: 'outlook' });
        evs.push({ id: 'o2', title: 'Deadline Review', date: `${year}-${month}-20`, time: '16:00', color: '#0078D4', source: 'outlook' });
    }
    return evs;
  };

  const allEvents = [...localEvents, ...getExternalEvents()];

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-140px)] gap-6 animate-fade-in relative pb-20">
      
      {/* Toast */}
      {showToast && createPortal(
        <div className={`fixed top-6 right-6 z-[150] animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${isDark ? 'bg-[#1A1F2C] border-slate-700' : 'bg-white border-slate-200'}`}>
           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${showToast.type === 'success' ? 'bg-[#FF5500]' : 'bg-blue-500'}`}>
              <Check size={18} />
           </div>
           <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{showToast.message}</p>
        </div>,
        document.body
      )}

      {/* --- SIDEBAR (Google Calendar Style) --- */}
      <div className="w-full md:w-64 flex flex-col gap-6 flex-shrink-0">
         
         {/* Create Button */}
         <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#FF5500] text-white font-bold shadow-lg shadow-[#FF5500]/20 hover:scale-[1.02] transition-transform"
         >
            <Plus size={20} />
            {t.createEvent}
         </button>

         {/* Mini Calendar / Date Picker */}
         <div className={`p-4 rounded-3xl border ${isDark ? 'bg-[#151A23] border-white/10' : 'bg-white border-slate-200'}`}>
             <div className="flex justify-between items-center mb-4">
                 <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentDate.toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'short', year: 'numeric' })}
                 </span>
                 <div className="flex gap-1">
                     <button onClick={() => changeMonth(-1)} className={`p-1 rounded hover:bg-slate-500/20`}><ChevronLeft size={16}/></button>
                     <button onClick={() => changeMonth(1)} className={`p-1 rounded hover:bg-slate-500/20`}><ChevronRight size={16}/></button>
                 </div>
             </div>
             {/* Simple mini grid visualization (just numbers) */}
             <div className="grid grid-cols-7 text-center gap-1 text-[10px]">
                 {['S','M','T','W','T','F','S'].map(d => <span key={d} className="text-slate-500 font-bold">{d}</span>)}
                 {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => <span key={`e-${i}`} />)}
                 {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => (
                     <span key={i} className={`p-1 rounded-full ${i + 1 === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'bg-[#FF5500] text-white font-bold' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                         {i + 1}
                     </span>
                 ))}
             </div>
         </div>

         {/* My Calendars Filter */}
         <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">{t.myCalendar}</h4>
            <div className="flex items-center gap-2">
                <input type="checkbox" checked readOnly className="accent-[#FF5500]" />
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Personal</span>
            </div>
         </div>

         {/* Integrations Section */}
         <div className="flex flex-col gap-3">
             <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-1">{t.integrations}</h4>
             
             {/* Google Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={googleConnected} onChange={() => handleConnect('google')} className="accent-red-500" />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.connectGoogle}</span>
                </div>
                {loadingIntegration === 'google' && <RefreshCw size={12} className="animate-spin text-slate-500" />}
             </div>

             {/* Outlook Toggle */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={outlookConnected} onChange={() => handleConnect('outlook')} className="accent-blue-500" />
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.connectOutlook}</span>
                </div>
                {loadingIntegration === 'outlook' && <RefreshCw size={12} className="animate-spin text-slate-500" />}
             </div>
         </div>
      </div>

      {/* --- MAIN CALENDAR GRID --- */}
      <div className={`flex-1 flex flex-col rounded-[2rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-[#151A23] border-white/10' : 'bg-white border-slate-200'}`}>
          
          {/* Header */}
          <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
             <div className="flex items-center gap-4">
                 <h2 className={`text-2xl font-bold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>{getMonthName(currentDate)}</h2>
                 <div className="flex items-center gap-1 bg-slate-500/10 rounded-lg p-1">
                     <button onClick={() => changeMonth(-1)} className={`p-1.5 rounded-md hover:bg-slate-500/20 transition-colors`}><ChevronLeft size={20}/></button>
                     <button onClick={() => changeMonth(1)} className={`p-1.5 rounded-md hover:bg-slate-500/20 transition-colors`}><ChevronRight size={20}/></button>
                 </div>
                 <button onClick={goToToday} className={`px-4 py-1.5 text-sm font-bold rounded-lg border ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}>
                     {t.today}
                 </button>
             </div>
          </div>

          {/* Days Header */}
          <div className={`grid grid-cols-7 border-b ${isDark ? 'border-white/10 bg-[#1A1F2C]' : 'border-slate-100 bg-slate-50'}`}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-bold uppercase text-slate-500 tracking-wider">
                      {day}
                  </div>
              ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6">
              {/* Previous Month Padding */}
              {Array.from({ length: firstDayOfMonth(currentDate) }).map((_, i) => (
                  <div key={`prev-${i}`} className={`border-b border-r min-h-[100px] ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`} />
              ))}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth(currentDate) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
                  
                  const daysEvents = allEvents.filter(e => e.date === dateStr);

                  return (
                      <div 
                        key={day} 
                        onClick={() => handleDateClick(day)}
                        className={`border-b border-r p-2 min-h-[100px] relative group transition-colors cursor-pointer
                            ${isDark ? 'border-white/10 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}
                        `}
                      >
                          <div className="flex justify-center mb-1">
                              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-[#FF5500] text-white' : 'text-slate-500'}`}>
                                  {day}
                              </span>
                          </div>

                          {/* Render Events */}
                          <div className="flex flex-col gap-1 overflow-hidden">
                              {daysEvents.map((ev, idx) => (
                                  <div 
                                    key={idx} 
                                    className="px-2 py-1 rounded-md text-[10px] font-bold truncate flex items-center justify-between group/event"
                                    style={{ backgroundColor: `${ev.color}20`, color: ev.color, borderLeft: `2px solid ${ev.color}` }}
                                    onClick={(e) => { e.stopPropagation(); /* Future: Open details */ }}
                                  >
                                      <span className="truncate">{ev.time} {ev.title}</span>
                                      {ev.source === 'local' && (
                                          <button 
                                            onClick={(e) => handleDeleteEvent(ev.id, e)}
                                            className="opacity-0 group-hover/event:opacity-100 hover:text-red-500"
                                          >
                                              <Trash2 size={10} />
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>

                          {/* Add Icon on Hover */}
                          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className={`p-1.5 rounded-full ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                  <Plus size={12} />
                              </div>
                          </div>
                      </div>
                  );
              })}
              
              {/* Next Month Padding (Fill grid) */}
              {Array.from({ length: 42 - (daysInMonth(currentDate) + firstDayOfMonth(currentDate)) }).map((_, i) => (
                   <div key={`next-${i}`} className={`border-b border-r min-h-[100px] ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/50'}`} />
              ))}
          </div>
      </div>

      {/* --- CREATE EVENT MODAL --- */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsModalOpen(false)}>
            <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl transform transition-all scale-100 ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.createEvent}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-red-500"><X size={24}/></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.eventTitle}</label>
                        <input 
                            type="text" 
                            value={newEvent.title}
                            onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                            className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-[#050505] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            placeholder="e.g. Project Review"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.date}</label>
                            <input 
                                type="date" 
                                value={newEvent.date}
                                onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                                className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-[#050505] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">{t.eventTime}</label>
                            <input 
                                type="time" 
                                value={newEvent.time}
                                onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                className={`w-full p-3 rounded-xl border outline-none ${isDark ? 'bg-[#050505] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-500 mb-2">{t.eventColor}</label>
                        <div className="flex gap-3">
                            {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setNewEvent({...newEvent, color})}
                                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${newEvent.color === color ? 'ring-2 ring-offset-2 ring-white dark:ring-offset-[#151A23]' : ''}`}
                                    style={{ backgroundColor: color }}
                                >
                                    {newEvent.color === color && <Check size={14} className="text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsModalOpen(false)} className={`px-4 py-2 rounded-xl font-bold text-sm ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>{t.cancel}</button>
                        <button onClick={handleSaveEvent} className="px-6 py-2 rounded-xl bg-[#FF5500] text-white font-bold text-sm shadow-lg hover:bg-[#e04b00]">
                            {t.createEvent}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};