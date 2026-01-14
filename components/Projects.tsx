import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Layout, Users, History, Clock, Power, Search, Filter, X } from 'lucide-react';
import { Project, Member, Language, Theme, HistoryEntry } from '../types';
import { translations } from '../translations';

interface ProjectsProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  members: Member[];
  lang: Language;
  theme: Theme;
}

const DEFAULT_PROJECT: Project = {
  id: '',
  name: '',
  client: '',
  status: 'planning',
  isActive: true, // Default to active
  deadline: '',
  progress: 0,
  lod: 'LOD 200',
  teamMembers: [],
  description: '',
  history: [],
  workLogs: [],
  tasks: [],
  notes: []
};

export const Projects: React.FC<ProjectsProps> = ({ projects, setProjects, members, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project>(DEFAULT_PROJECT);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [historyFilters, setHistoryFilters] = useState({ search: '', start: '', end: '' });

  const createHistoryEntry = (action: string, details: string): HistoryEntry => ({
    id: Date.now().toString(),
    action,
    details,
    timestamp: new Date().toISOString(),
    user: 'Gianfranco' // Hardcoded current user
  });

  const getProjectTotalHours = (project: Project) => {
    return (project.workLogs || []).reduce((acc, log) => acc + (Number(log.hours) || 0), 0);
  };

  const handleSave = () => {
    if (!currentProject.name) return;

    if (currentProject.id) {
      // Edit Mode
      const originalProject = projects.find(p => p.id === currentProject.id);
      const changes: string[] = [];
      
      if (originalProject) {
        if (originalProject.name !== currentProject.name) changes.push(`Name changed to "${currentProject.name}"`);
        if (originalProject.status !== currentProject.status) changes.push(`Status changed to ${currentProject.status}`);
        if (originalProject.isActive !== currentProject.isActive) changes.push(`Project marked as ${currentProject.isActive ? 'Active' : 'Inactive'}`);
        if (originalProject.progress !== currentProject.progress) changes.push(`Progress updated to ${currentProject.progress}%`);
        if (originalProject.lod !== currentProject.lod) changes.push(`LOD updated to ${currentProject.lod}`);
        if (originalProject.deadline !== currentProject.deadline) changes.push(`Deadline changed to ${currentProject.deadline}`);
        
        // Members check
        const addedMembers = currentProject.teamMembers.filter(id => !originalProject.teamMembers.includes(id));
        const removedMembers = originalProject.teamMembers.filter(id => !currentProject.teamMembers.includes(id));
        
        if (addedMembers.length > 0) changes.push(`Added ${addedMembers.length} member(s)`);
        if (removedMembers.length > 0) changes.push(`Removed ${removedMembers.length} member(s)`);
      }

      let updatedProject = { ...currentProject };
      
      if (changes.length > 0) {
        const historyEntry = createHistoryEntry('updated', changes.join('; '));
        updatedProject.history = [historyEntry, ...(updatedProject.history || [])];
      }

      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    } else {
      // Create Mode
      const newId = Date.now().toString();
      const historyEntry = createHistoryEntry('created', 'Project initialized');
      // Ensure tasks and notes array is initialized
      setProjects([...projects, { ...currentProject, id: newId, history: [historyEntry], tasks: [], notes: [] }]);
    }
    
    setIsEditing(false);
    setCurrentProject(DEFAULT_PROJECT);
    setActiveTab('details');
    setHistoryFilters({ search: '', start: '', end: '' });
  };

  const handleEdit = (project: Project) => {
    setCurrentProject(project);
    setIsEditing(true);
    setActiveTab('details');
    setHistoryFilters({ search: '', start: '', end: '' });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const toggleMember = (memberId: string) => {
    const currentMembers = currentProject.teamMembers;
    if (currentMembers.includes(memberId)) {
      setCurrentProject({ ...currentProject, teamMembers: currentMembers.filter(id => id !== memberId) });
    } else {
      setCurrentProject({ ...currentProject, teamMembers: [...currentMembers, memberId] });
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString(lang === 'pt' ? 'pt-BR' : 'en-US');
  };

  // Filter Logic for History Tab
  const filteredProjectHistory = (currentProject.history || []).filter(entry => {
    const matchesSearch = 
        entry.details.toLowerCase().includes(historyFilters.search.toLowerCase()) || 
        entry.user.toLowerCase().includes(historyFilters.search.toLowerCase());
    
    const entryDate = new Date(entry.timestamp).getTime();
    const matchesStart = historyFilters.start ? entryDate >= new Date(historyFilters.start).setHours(0,0,0,0) : true;
    const matchesEnd = historyFilters.end ? entryDate <= new Date(historyFilters.end).setHours(23,59,59,999) : true;
    
    return matchesSearch && matchesStart && matchesEnd;
  });

  if (isEditing) {
    return (
      <div className={`max-w-4xl mx-auto backdrop-blur-xl border rounded-3xl p-8 shadow-2xl animate-fade-in ${isDark ? 'bg-[#151A23]/90 border-white/5' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {currentProject.id ? t.editProject : t.addProject}
          </h2>
          {currentProject.id && (
            <div className="flex bg-black/10 dark:bg-white/10 p-1 rounded-xl">
               <button 
                  onClick={() => setActiveTab('details')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'details' ? 'bg-[#BEF264] text-black shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
               >
                 {t.details || "Details"}
               </button>
               <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-[#BEF264] text-black shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}
               >
                 <History size={16} />
                 {t.history}
               </button>
            </div>
          )}
        </div>
        
        {activeTab === 'details' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                {/* Active/Inactive Switch */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${currentProject.isActive ? 'bg-[#BEF264]/20 text-[#BEF264]' : 'bg-slate-500/20 text-slate-500'}`}>
                         <Power size={18} />
                      </div>
                      <div>
                         <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.projectState}</p>
                         <p className="text-xs text-slate-500">{currentProject.isActive ? t.activeState : t.inactiveState}</p>
                      </div>
                   </div>
                   <button 
                      type="button"
                      onClick={() => setCurrentProject(prev => ({...prev, isActive: !prev.isActive}))}
                      className={`w-12 h-6 rounded-full p-1 transition-colors relative ${currentProject.isActive ? 'bg-[#BEF264]' : 'bg-slate-600'}`}
                   >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${currentProject.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                   </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.projectName}</label>
                  <input 
                    type="text" 
                    value={currentProject.name}
                    onChange={(e) => setCurrentProject({...currentProject, name: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.clientName}</label>
                  <input 
                    type="text" 
                    value={currentProject.client}
                    onChange={(e) => setCurrentProject({...currentProject, client: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.status}</label>
                  <select 
                    value={currentProject.status}
                    onChange={(e) => setCurrentProject({...currentProject, status: e.target.value as any})}
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  >
                    <option value="planning">{t.statusPlanning}</option>
                    <option value="modeling">{t.statusModeling}</option>
                    <option value="coordination">{t.statusCoordination}</option>
                    <option value="completed">{t.statusCompleted}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.deadline}</label>
                  <input 
                    type="date" 
                    value={currentProject.deadline}
                    onChange={(e) => setCurrentProject({...currentProject, deadline: e.target.value})}
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.lodLevel}</label>
                  <input 
                    type="text" 
                    value={currentProject.lod}
                    onChange={(e) => setCurrentProject({...currentProject, lod: e.target.value})}
                    placeholder="e.g. LOD 350"
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">{t.progress} ({currentProject.progress}%)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={currentProject.progress}
                    onChange={(e) => setCurrentProject({...currentProject, progress: parseInt(e.target.value)})}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                  />
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-400 mb-3">{t.selectMembers}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {members.length > 0 ? members.map(member => (
                  <div 
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                      currentProject.teamMembers.includes(member.id) 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-white' 
                      : isDark ? 'bg-[#0B0E14] border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentProject.teamMembers.includes(member.id) ? 'bg-emerald-500 text-white' : isDark ? 'bg-slate-700' : 'bg-slate-300 text-slate-600'
                    }`}>
                      {member.name.substring(0, 1)}
                    </div>
                    <span className="text-sm truncate">{member.name}</span>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 col-span-4 italic">No members available. Add them in the Members section.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="mb-8">
             {/* Filter Bar */}
             <div className={`flex flex-wrap items-center gap-2 p-3 mb-4 rounded-xl border ${isDark ? 'bg-white/5 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-1.5 flex-1 min-w-[150px] bg-black/10 dark:bg-black/30 rounded-lg px-2 py-1.5">
                    <Search size={14} className="text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Search..."
                      value={historyFilters.search}
                      onChange={(e) => setHistoryFilters({...historyFilters, search: e.target.value})}
                      className="bg-transparent border-none outline-none text-xs w-full text-slate-700 dark:text-slate-300 placeholder-slate-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                   <input 
                      type="date" 
                      value={historyFilters.start}
                      onChange={(e) => setHistoryFilters({...historyFilters, start: e.target.value})}
                      className={`text-xs p-1.5 rounded-lg border outline-none ${isDark ? 'bg-black/30 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                   />
                   <span className="text-slate-500 text-xs">-</span>
                   <input 
                      type="date" 
                      value={historyFilters.end}
                      onChange={(e) => setHistoryFilters({...historyFilters, end: e.target.value})}
                      className={`text-xs p-1.5 rounded-lg border outline-none ${isDark ? 'bg-black/30 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                   />
                </div>
                {(historyFilters.search || historyFilters.start || historyFilters.end) && (
                   <button 
                      onClick={() => setHistoryFilters({search: '', start: '', end: ''})}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"
                   >
                     <X size={14} />
                   </button>
                )}
             </div>

             <div className="h-96 overflow-y-auto custom-scrollbar pr-2">
                {!filteredProjectHistory || filteredProjectHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                    <History size={48} className="mb-4"/>
                    <p>{!currentProject.history || currentProject.history.length === 0 ? t.noHistory : "No matching records found."}</p>
                  </div>
                ) : (
                  <div className="relative border-l border-slate-700 ml-4 space-y-8">
                    {filteredProjectHistory.map((entry, idx) => (
                      <div key={entry.id} className="relative pl-6">
                        <div className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 ${idx === 0 ? 'bg-[#BEF264] border-[#BEF264]' : 'bg-[#0B0E14] border-slate-500'}`}></div>
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {formatDate(entry.timestamp)}
                          </span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {entry.action === 'created' ? t.created : t.updated} by {entry.user}
                          </span>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {entry.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        <div className={`flex justify-end gap-4 border-t pt-6 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          <button 
            onClick={() => setIsEditing(false)}
            className={`px-6 py-3 rounded-xl transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
          >
            {t.saveProject}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.projects}</h2>
        <button
          onClick={() => { setCurrentProject(DEFAULT_PROJECT); setIsEditing(true); setActiveTab('details'); }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          {t.addProject}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
           <div className={`col-span-full py-20 text-center rounded-3xl border flex flex-col items-center justify-center ${isDark ? 'bg-[#151A23]/50 border-white/5 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
             <Layout size={48} className="mb-4 opacity-50" />
             <p>{t.noProjects}</p>
           </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className={`group backdrop-blur-md border rounded-3xl p-6 shadow-xl transition-all ${isDark ? 'bg-[#151A23]/80 border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500'} ${!project.isActive ? 'opacity-75 grayscale-[0.5]' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                   <h3 className={`text-lg font-bold transition-colors ${isDark ? 'text-white group-hover:text-emerald-400' : 'text-slate-900 group-hover:text-emerald-600'}`}>
                     {project.name}
                     {!project.isActive && <span className="ml-2 text-xs bg-slate-500/20 text-slate-500 px-2 py-0.5 rounded-full border border-slate-500/30">Inactive</span>}
                   </h3>
                   <p className="text-sm text-slate-500">{project.client}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    project.status === 'coordination' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {project.status === 'planning' ? t.statusPlanning :
                      project.status === 'modeling' ? t.statusModeling :
                      project.status === 'coordination' ? t.statusCoordination : t.statusCompleted}
                </span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>{t.deadline}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{project.deadline}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>{t.lodLevel}</span>
                  <span className={isDark ? 'text-white' : 'text-slate-900'}>{project.lod}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400 font-bold">
                   <span className="flex items-center gap-1.5">
                     <Clock size={14} className="text-[#BEF264]" />
                     {t.accumulatedHours}
                   </span>
                   <span className={isDark ? 'text-white' : 'text-slate-900'}>{getProjectTotalHours(project)}h</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{t.progress}</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <div 
                      className={`h-full ${project.isActive ? 'bg-gradient-to-r from-emerald-400 to-blue-500' : 'bg-slate-500'}`} 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                {/* Mini History Snippet */}
                {project.history && project.history.length > 0 && (
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-700">
                      <Clock size={10} />
                      <span className="truncate max-w-[200px]">Last: {project.history[0].details}</span>
                   </div>
                )}
              </div>

              <div className={`flex justify-between items-center border-t pt-4 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                 <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map((memberId) => {
                       const member = members.find(m => m.id === memberId);
                       if (!member) return null;
                       return (
                         <div key={memberId} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${isDark ? 'bg-slate-700 border-[#151A23] text-white' : 'bg-slate-200 border-white text-slate-700'}`} title={member.name}>
                           {member.name.substring(0, 1)}
                         </div>
                       );
                    })}
                    {project.teamMembers.length > 3 && (
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${isDark ? 'bg-slate-800 border-[#151A23] text-white' : 'bg-slate-100 border-white text-slate-600'}`}>
                        +{project.teamMembers.length - 3}
                      </div>
                    )}
                 </div>
                 
                 <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(project)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(project.id)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};