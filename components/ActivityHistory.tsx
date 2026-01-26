import React, { useState } from 'react';
import { History, User, Calendar, FileText, Layers, Filter, X, Search } from 'lucide-react';
import { Project, Language, Theme } from '../types';
import { translations } from '../translations';

interface ActivityHistoryProps {
  projects: Project[];
  lang: Language;
  theme: Theme;
}

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({ projects, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate history from all projects
  const allHistory = projects.flatMap(p => 
    (p.history || []).map(h => ({
      ...h,
      projectName: p.name,
      projectId: p.id
    }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter Logic
  const filteredHistory = allHistory.filter(entry => {
    const entryDate = new Date(entry.timestamp).getTime();
    
    // Date Filters
    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start).setHours(0, 0, 0, 0);
      if (entryDate < startDate) return false;
    }
    
    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end).setHours(23, 59, 59, 999);
      if (entryDate > endDate) return false;
    }

    // Text Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      const match = 
        entry.details.toLowerCase().includes(lowerSearch) ||
        entry.projectName.toLowerCase().includes(lowerSearch) ||
        entry.user.toLowerCase().includes(lowerSearch);
      if (!match) return false;
    }

    return true;
  });

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col">
        <h1 className={`text-4xl font-light mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t.activityLog}
        </h1>
        <p className="text-slate-500">{t.activitySubtitle}</p>
      </div>

      <div className={`backdrop-blur-xl border rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white border-slate-200'}`}>
        {/* Ambient Glow */}
        <div className={`absolute top-0 right-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />

        <div className="relative z-10 space-y-6">
            {/* Filter Controls */}
            <div className={`flex flex-col md:flex-row md:flex-wrap md:items-end gap-4 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 text-slate-500 mb-2 md:mb-0 mr-4">
                    <Filter size={18} />
                    <span className="text-sm font-bold uppercase tracking-wider">{t.dateRange}</span>
                </div>
                
                {/* Search Input */}
                <div className="relative flex-1 w-full md:w-auto md:min-w-[200px]">
                   <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Search</label>
                   <div className="relative">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                     <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t.searchHistory}
                        className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
                    />
                   </div>
                </div>

                <div className="w-full md:w-auto">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.startDate}</label>
                    <input 
                        type="date" 
                        value={dateFilter.start}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                        className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                </div>
                
                <div className="w-full md:w-auto">
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.endDate}</label>
                    <input 
                        type="date" 
                        value={dateFilter.end}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                        className={`w-full md:w-auto px-4 py-2 rounded-xl text-sm border focus:outline-none focus:border-emerald-500 transition-colors ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                    />
                </div>

                {(dateFilter.start || dateFilter.end || searchTerm) && (
                    <button 
                        onClick={() => { setDateFilter({ start: '', end: '' }); setSearchTerm(''); }}
                        className="md:ml-auto flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-400/10 transition-colors w-full md:w-auto"
                    >
                        <X size={14} />
                        {t.clearFilters}
                    </button>
                )}
            </div>

            {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <History size={48} className="mb-4 opacity-50" />
                <p>{allHistory.length === 0 ? t.noHistory : "No activities found for this filter."}</p>
            </div>
            ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/10">
                    <th className="pb-4 pl-4">{t.time}</th>
                    <th className="pb-4">{t.user}</th>
                    <th className="pb-4">{t.project}</th>
                    <th className="pb-4">{t.details}</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {filteredHistory.map((entry) => (
                    <tr key={`${entry.projectId}-${entry.id}`} className={`group transition-colors border-b last:border-0 ${isDark ? 'hover:bg-white/[0.02] border-white/5' : 'hover:bg-slate-50 border-slate-100'}`}>
                        <td className="py-5 pl-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-500" />
                            <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                {formatDate(entry.timestamp)}
                            </span>
                        </div>
                        </td>
                        <td className="py-5">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                <User size={14} />
                            </div>
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {entry.user}
                            </span>
                        </div>
                        </td>
                        <td className="py-5">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-emerald-500" />
                            <span className={`${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-medium`}>
                                {entry.projectName}
                            </span>
                        </div>
                        </td>
                        <td className="py-5 pr-4">
                        <div className="flex items-start gap-2 max-w-md">
                            <FileText size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
                            <div className="flex flex-col">
                                <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {entry.action === 'created' ? t.created : t.updated}
                                </span>
                                <span className="text-slate-500 text-xs leading-relaxed">
                                    {entry.details}
                                </span>
                            </div>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};