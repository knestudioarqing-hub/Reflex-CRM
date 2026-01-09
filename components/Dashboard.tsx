import React, { useState } from 'react';
import { Clock, AlertCircle, MoreHorizontal, PlayCircle, ArrowUpRight, TrendingUp, Layers, FileDown, Calendar, Filter, X, Briefcase, User } from 'lucide-react';
import { Project, Language, Theme, Member } from '../types';
import { translations } from '../translations';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  projects: Project[];
  members: Member[]; // Added members prop to resolve team details
  lang: Language;
  theme: Theme;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, members, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    selectedProjectIds: [] as string[] // empty means all
  });
  
  // Dashboard Filter State
  const [viewFilter, setViewFilter] = useState<'all' | 'active'>('active');

  // Dynamic calculations
  const activeCount = projects.filter(p => p.isActive).length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const totalProgress = projects.reduce((acc, curr) => acc + curr.progress, 0);
  const efficiency = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

  // Filter projects based on viewFilter
  const visibleProjects = projects.filter(p => {
    if (viewFilter === 'active') return p.isActive;
    return true;
  });

  const toggleProjectSelection = (id: string) => {
    setReportFilters(prev => {
      if (prev.selectedProjectIds.includes(id)) {
        return { ...prev, selectedProjectIds: prev.selectedProjectIds.filter(pid => pid !== id) };
      } else {
        return { ...prev, selectedProjectIds: [...prev.selectedProjectIds, id] };
      }
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const primaryColor = [190, 242, 100]; // #BEF264 RGB
    const slateColor = [30, 41, 59];

    // Filter Logic
    let filteredProjects = projects;
    if (reportFilters.selectedProjectIds.length > 0) {
      filteredProjects = projects.filter(p => reportFilters.selectedProjectIds.includes(p.id));
    }

    // Header
    doc.setFontSize(22);
    doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
    doc.text('REFLEX CRM - Project Report', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    if (reportFilters.startDate || reportFilters.endDate) {
        doc.text(`Activity Filter: ${reportFilters.startDate || 'Start'} to ${reportFilters.endDate || 'Now'}`, 14, 34);
    }

    // Summary Stats
    doc.setFillColor(slateColor[0], slateColor[1], slateColor[2]);
    doc.roundedRect(14, 40, 180, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Projects Overview', 20, 50);
    
    doc.setFontSize(10);
    doc.text(`Total: ${filteredProjects.length}`, 20, 58);
    doc.text(`Active: ${filteredProjects.filter(p => p.isActive).length}`, 60, 58);
    doc.text(`Completed: ${filteredProjects.filter(p => p.status === 'completed').length}`, 100, 58);
    doc.text(`Avg Progress: ${Math.round(filteredProjects.reduce((acc, p) => acc + p.progress, 0) / (filteredProjects.length || 1))}%`, 140, 58);

    // Projects Table
    const tableData = filteredProjects.map(p => [
      p.name,
      p.client,
      p.status.toUpperCase(),
      p.isActive ? 'Active' : 'Inactive',
      p.deadline,
      `${p.progress}%`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Project Name', 'Client', 'Status', 'State', 'Deadline', 'Progress']],
      body: tableData,
      headStyles: { fillColor: slateColor as any },
      styles: { fontSize: 9 },
    });

    // History Log Table (Aggregated)
    let historyY = (doc as any).lastAutoTable.finalY + 15;
    
    // Filter history logs based on date range
    let allHistory = filteredProjects.flatMap(p => 
      (p.history || []).map(h => ({ ...h, projectName: p.name }))
    );

    if (reportFilters.startDate) {
      const start = new Date(reportFilters.startDate).getTime();
      allHistory = allHistory.filter(h => new Date(h.timestamp).getTime() >= start);
    }
    if (reportFilters.endDate) {
      const end = new Date(reportFilters.endDate).getTime();
      // Add one day to end date to include the day itself
      allHistory = allHistory.filter(h => new Date(h.timestamp).getTime() <= end + 86400000);
    }
    
    // Sort by newest
    allHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (allHistory.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
      doc.text('Recent Activity Logs', 14, historyY);

      const historyData = allHistory.map(h => [
        new Date(h.timestamp).toLocaleString(),
        h.projectName,
        h.action.toUpperCase(),
        h.details,
        h.user
      ]);

      autoTable(doc, {
        startY: historyY + 5,
        head: [['Timestamp', 'Project', 'Action', 'Details', 'User']],
        body: historyData,
        headStyles: { fillColor: [190, 242, 100], textColor: [0,0,0] }, // Neon header
        styles: { fontSize: 8 },
      });
    } else {
        doc.setFontSize(10);
        doc.text('No activity found for the selected range.', 14, historyY);
    }

    doc.save('reflex_crm_report.pdf');
    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-light mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t.dashboard}
          </h1>
          <p className="text-slate-500">Overview of your BIM performance</p>
        </div>
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(190,242,100,0.3)]"
        >
          <span className="text-sm">{t.generateReport}</span>
          <FileDown size={18} />
        </button>
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedProject(null)}
        >
          <div 
            className={`w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow inside modal */}
            <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/10' : 'bg-[#BEF264]/20'}`} />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                             <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.name}</h2>
                             {!selectedProject.isActive && (
                                <span className="px-2 py-1 rounded bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    {t.inactiveState}
                                </span>
                             )}
                        </div>
                        <p className="text-slate-500 text-lg">{selectedProject.client}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedProject(null)}
                        className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Status & LOD */}
                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 text-sm font-bold uppercase">{t.status}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                selectedProject.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                selectedProject.status === 'coordination' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            }`}>
                                {selectedProject.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                             <span className="text-slate-500 text-sm font-bold uppercase">{t.lodLevel}</span>
                             <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.lod}</span>
                        </div>
                    </div>

                    {/* Deadline & Progress */}
                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-slate-500 text-sm font-bold uppercase">{t.deadline}</span>
                            <span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.deadline}</span>
                        </div>
                        <div>
                             <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>{t.progress}</span>
                                <span>{selectedProject.progress}%</span>
                             </div>
                             <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                <div 
                                    className={`h-full rounded-full ${selectedProject.isActive ? 'bg-[#BEF264]' : 'bg-slate-500'}`}
                                    style={{ width: `${selectedProject.progress}%` }}
                                />
                             </div>
                        </div>
                    </div>
                </div>

                {/* Team Members */}
                <div className="mb-8">
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Briefcase size={18} />
                        {t.team}
                    </h3>
                    {selectedProject.teamMembers.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">No members assigned.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedProject.teamMembers.map(memberId => {
                                const member = members.find(m => m.id === memberId);
                                if (!member) return null;
                                return (
                                    <div key={memberId} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-white border-slate-100'}`}>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-white text-slate-700'}`}>
                                            {member.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{member.name}</p>
                                            <p className="text-xs text-slate-500">{member.role}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* History Log Snippet */}
                {selectedProject.history && selectedProject.history.length > 0 && (
                     <div>
                        <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <Clock size={18} />
                            {t.recentActivity}
                        </h3>
                        <div className={`relative border-l border-slate-700 ml-3 space-y-6`}>
                            {selectedProject.history.slice(0, 3).map((entry, idx) => (
                                <div key={entry.id} className="relative pl-6">
                                    <div className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${idx === 0 ? 'bg-[#BEF264] border-[#BEF264]' : 'bg-[#0B0E14] border-slate-500'}`}></div>
                                    <div className="flex flex-col gap-1">
                                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </span>
                                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                            {entry.details}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}>
             <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.reportSettings}</h3>
                <button onClick={() => setIsReportModalOpen(false)} className="text-slate-500 hover:text-red-400">
                  <X size={24} />
                </button>
             </div>

             <div className="space-y-6">
                {/* Date Range */}
                <div>
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3">
                     <Calendar size={16} />
                     {t.dateRange}
                   </label>
                   <div className="flex gap-4">
                      <div className="flex-1">
                        <span className="text-xs text-slate-500 mb-1 block">{t.startDate}</span>
                        <input 
                          type="date" 
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
                          className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-xs text-slate-500 mb-1 block">{t.endDate}</span>
                         <input 
                          type="date" 
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
                          className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                        />
                      </div>
                   </div>
                </div>

                {/* Project Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3">
                     <Filter size={16} />
                     {t.selectProjects}
                   </label>
                   <div className={`max-h-40 overflow-y-auto p-2 rounded-xl border ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      {projects.length === 0 ? (
                        <p className="text-xs text-slate-500 p-2 text-center">No projects available.</p>
                      ) : (
                        projects.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => toggleProjectSelection(p.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 transition-colors ${
                              reportFilters.selectedProjectIds.includes(p.id) 
                              ? 'bg-[#BEF264]/20 text-[#BEF264]' 
                              : 'hover:bg-white/5 text-slate-400'
                            }`}
                          >
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                               reportFilters.selectedProjectIds.includes(p.id) ? 'bg-[#BEF264] border-[#BEF264]' : 'border-slate-500'
                             }`}>
                                {reportFilters.selectedProjectIds.includes(p.id) && <div className="w-2 h-2 bg-black rounded-sm" />}
                             </div>
                             <span className="text-sm font-medium">{p.name}</span>
                          </div>
                        ))
                      )}
                   </div>
                   <div className="mt-2 text-xs text-slate-500 text-right">
                      {reportFilters.selectedProjectIds.length === 0 ? t.allProjects : `${reportFilters.selectedProjectIds.length} selected`}
                   </div>
                </div>

                <button 
                  onClick={generatePDF}
                  className="w-full py-4 rounded-xl bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-lg shadow-lg shadow-[#BEF264]/20 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <FileDown size={20} />
                  {t.downloadPDF}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: t.activeProjects, 
            value: activeCount.toString(), 
            icon: Layers,
            trend: "+2 this week"
          },
          { 
            label: t.completedProjects, 
            value: completedCount.toString(),
            icon: TrendingUp, 
            trend: "+12% vs last month"
          },
          { 
            label: t.teamPerformance, 
            value: `${efficiency}%`,
            icon: Clock,
            trend: "Optimal pace"
          },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            className={`p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 
              ${isDark 
                ? 'bg-[#11141A] border-white/5 hover:border-[#BEF264]/20' 
                : 'bg-white border-slate-200 hover:border-[#BEF264] shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start mb-8">
               <div className={`p-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'} text-[#BEF264]`}>
                 <stat.icon size={24} className="text-black" /> 
                 <style>{`.icon-color-${idx} { color: ${isDark ? '#BEF264' : '#65a30d'}; }`}</style>
               </div>
               <span className={`text-xs font-medium px-3 py-1 rounded-full ${isDark ? 'text-slate-500 bg-white/5' : 'text-slate-600 bg-slate-100'}`}>{stat.trend}</span>
            </div>
            <div>
              <p className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</p>
              <h3 className="text-slate-500 font-medium">{stat.label}</h3>
            </div>
            {/* Progress Bar Decoration */}
            <div className={`absolute bottom-0 left-0 w-full h-1 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
              <div 
                className="h-full bg-[#BEF264] transition-all duration-1000 ease-out" 
                style={{ width: `${Math.random() * 40 + 40}%` }} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Table */}
        <div className={`lg:col-span-2 border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
          {/* Decorative Glow */}
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/5' : 'bg-[#BEF264]/20'}`} />

          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.ongoingProjects}</h2>
            <div className="flex gap-2">
                <button 
                  onClick={() => setViewFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    viewFilter === 'all'
                      ? 'bg-slate-600 text-white font-bold'
                      : isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setViewFilter('active')}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-lg ${
                    viewFilter === 'active'
                     ? 'bg-[#BEF264] text-black shadow-[#BEF264]/10'
                     : isDark ? 'bg-white/5 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
            </div>
          </div>
          
          <div className="overflow-x-auto relative z-10">
            {visibleProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <p>{t.noProjects}</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-6 pl-4">{t.project}</th>
                    <th className="pb-6">{t.status}</th>
                    <th className="pb-6">{t.deadline}</th>
                    <th className="pb-6">{t.progress}</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {visibleProjects.slice(0, 5).map((project, i) => (
                    <tr 
                        key={project.id} 
                        onClick={() => setSelectedProject(project)}
                        className={`group transition-colors border-b last:border-0 cursor-pointer ${isDark ? 'hover:bg-white/[0.02] border-white/5' : 'hover:bg-slate-50 border-slate-100'} ${!project.isActive ? 'opacity-60' : ''}`}
                    >
                        <td className="py-5 pl-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${isDark ? 'bg-[#1A1F2C] border-white/10 text-white group-hover:border-[#BEF264]/50' : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:border-[#BEF264]'}`}>
                            {project.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                            <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {project.name}
                                {!project.isActive && <span className="ml-2 text-[10px] text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/20">Inactive</span>}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">{project.client}</p>
                            </div>
                        </div>
                        </td>
                        <td className="py-5">
                          {project.status === 'completed' || project.status === 'modeling' ? (
                            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#BEF264] text-black shadow-[0_0_10px_-3px_rgba(190,242,100,0.4)]">
                              {project.status === 'completed' ? t.statusCompleted : t.statusModeling}
                            </span>
                          ) : (
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${isDark ? 'bg-[#1A1F2C] text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {project.status === 'planning' ? t.statusPlanning : t.statusCoordination}
                            </span>
                          )}
                        </td>
                        <td className="py-5 text-slate-400 font-medium">{project.deadline}</td>
                        <td className="py-5 w-48 pr-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs">
                                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.progress}%</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1A1F2C]' : 'bg-slate-100'}`}>
                                <div 
                                    className="h-full bg-[#BEF264] rounded-full" 
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
          </div>
        </div>

        {/* Right Column: To-Do / Widgets */}
        <div className="space-y-6">
            <div className={`border rounded-[2.5rem] p-8 shadow-xl flex flex-col h-full relative overflow-hidden ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                <div className="flex justify-between items-center mb-6 z-10">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.todoList}</h2>
                    <button className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}>
                    <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="space-y-4 z-10">
                    {[
                    { title: "Review MEP Clash", due: "2h remaining", type: "Urgent" },
                    { title: "Client Handover", due: "Tomorrow", type: "Meeting" },
                    ].map((task, i) => (
                    <div key={i} className={`p-5 rounded-3xl border transition-all group cursor-pointer ${isDark ? 'bg-[#1A1F2C] border-white/5 hover:border-[#BEF264]/30' : 'bg-slate-50 border-slate-200 hover:border-[#BEF264]'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${task.type === 'Urgent' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                {task.type}
                            </span>
                            <Clock size={14} className="text-slate-500" />
                        </div>
                        <h4 className={`font-bold mb-1 transition-colors ${isDark ? 'text-white group-hover:text-[#BEF264]' : 'text-slate-900 group-hover:text-black'}`}>{task.title}</h4>
                        <p className="text-xs text-slate-500">{task.due}</p>
                    </div>
                    ))}
                </div>

                {/* Video Widget */}
                 <div className="mt-6 relative h-32 rounded-3xl overflow-hidden group cursor-pointer">
                    <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700" alt="Building" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#BEF264] flex items-center justify-center text-black shadow-[0_0_20px_rgba(190,242,100,0.5)] group-hover:scale-110 transition-transform">
                            <PlayCircle size={24} fill="black" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};