import React, { useState } from 'react';
import { Clock, AlertCircle, MoreHorizontal, PlayCircle, ArrowUpRight, TrendingUp, Layers, FileDown, Calendar, Filter, X, Briefcase, User, Plus, CheckCircle, Package, Timer, CheckSquare, Trash2 } from 'lucide-react';
import { Project, Language, Theme, Member, WorkLog, Task } from '../types';
import { translations } from '../translations';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  members: Member[];
  lang: Language;
  theme: Theme;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, setProjects, members, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  
  // Work Log State
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });

  // Task Form State
  const [taskForm, setTaskForm] = useState<{title: string, date: string, priority: 'low' | 'medium' | 'high' | 'urgent'}>({
      title: '',
      date: new Date().toISOString().split('T')[0],
      priority: 'medium'
  });

  // Task Filter in Dashboard
  const [taskProjectFilter, setTaskProjectFilter] = useState<string>('all');

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    client: '',
    lod: 'LOD 200',
    deadline: ''
  });

  const [reportFilters, setReportFilters] = useState({
    startDate: '',
    endDate: '',
    selectedProjectIds: [] as string[] // empty means all
  });
  
  // Dashboard Filter State: 'all', 'active', or 'completed'
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Dynamic calculations
  const activeCount = projects.filter(p => p.isActive && p.status !== 'completed').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const totalProgress = projects.reduce((acc, curr) => acc + curr.progress, 0);
  const efficiency = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

  // Filter projects based on viewFilter
  const visibleProjects = projects.filter(p => {
    if (viewFilter === 'active') return p.isActive && p.status !== 'completed';
    if (viewFilter === 'completed') return p.status === 'completed';
    return true;
  });

  // Flatten tasks for global dashboard view
  const allTasks = projects
    .filter(p => p.isActive && p.status !== 'completed') // Only active projects tasks in dashboard
    .flatMap(p => (p.tasks || []).map(task => ({
        ...task,
        projectId: p.id,
        projectName: p.name
    })));

  const filteredTasks = allTasks
    .filter(task => taskProjectFilter === 'all' || task.projectId === taskProjectFilter)
    .sort((a, b) => {
        // Sort by completed (false first), then priority weight
        if (a.completed === b.completed) {
             const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };
             return priorityWeight[b.priority] - priorityWeight[a.priority];
        }
        return a.completed ? 1 : -1;
    });

  const getProjectTotalHours = (project: Project) => {
    return (project.workLogs || []).reduce((acc, log) => acc + (Number(log.hours) || 0), 0);
  };

  const handleCreateQuickProject = () => {
    if (!newProjectForm.name) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectForm.name,
      client: newProjectForm.client || 'Unknown Client',
      status: 'planning',
      isActive: true,
      deadline: newProjectForm.deadline || new Date().toISOString().split('T')[0],
      progress: 0,
      lod: newProjectForm.lod,
      teamMembers: [],
      description: '',
      history: [{
        id: Date.now().toString() + '-init',
        action: 'created',
        details: 'Project initialized via Quick Add from Dashboard',
        timestamp: new Date().toISOString(),
        user: 'Alex Designer'
      }],
      workLogs: [],
      tasks: []
    };

    setProjects(prev => [...prev, newProject]);
    setIsNewProjectModalOpen(false);
    setNewProjectForm({ name: '', client: '', lod: 'LOD 200', deadline: '' });
  };

  const handleDeliverProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: 'completed',
          progress: 100,
          isActive: false, // Optional: mark as inactive once delivered
          history: [{
            id: Date.now().toString() + '-delivered',
            action: 'updated',
            details: 'Model delivered and project finalized.',
            timestamp: new Date().toISOString(),
            user: 'Alex Designer'
          }, ...(p.history || [])]
        };
      }
      return p;
    }));

    if (selectedProject?.id === id) {
      setSelectedProject(null);
    }
  };

  const handleAddWorkLog = () => {
    if (!selectedProject || !logForm.hours || !logForm.date) return;
    
    const newLog: WorkLog = {
      id: Date.now().toString(),
      date: logForm.date,
      hours: parseFloat(logForm.hours),
      description: logForm.description,
      userId: 'currentUser'
    };

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          workLogs: [newLog, ...(p.workLogs || [])]
        };
      }
      return p;
    });

    setProjects(updatedProjects);
    
    const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
    if (updatedSelectedProject) {
      setSelectedProject(updatedSelectedProject);
    }
    setLogForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
  };

  // --- TASK MANAGEMENT LOGIC ---

  const handleAddTask = () => {
    if (!selectedProject || !taskForm.title) return;

    const newTask: Task = {
        id: Date.now().toString(),
        title: taskForm.title,
        dueDate: taskForm.date,
        priority: taskForm.priority,
        completed: false
    };

    const updatedProjects = projects.map(p => {
        if (p.id === selectedProject.id) {
            return { ...p, tasks: [newTask, ...(p.tasks || [])] };
        }
        return p;
    });

    setProjects(updatedProjects);
    const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
    if (updatedSelectedProject) setSelectedProject(updatedSelectedProject);
    
    setTaskForm({ title: '', date: new Date().toISOString().split('T')[0], priority: 'medium' });
  };

  const toggleTaskCompletion = (projectId: string, taskId: string) => {
     const updatedProjects = projects.map(p => {
         if (p.id === projectId) {
             return {
                 ...p,
                 tasks: (p.tasks || []).map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
             };
         }
         return p;
     });
     setProjects(updatedProjects);
     
     if (selectedProject && selectedProject.id === projectId) {
         const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
         if (updatedSelectedProject) setSelectedProject(updatedSelectedProject);
     }
  };

  const deleteTask = (taskId: string) => {
      if (!selectedProject) return;
      
      const updatedProjects = projects.map(p => {
          if (p.id === selectedProject.id) {
              return { ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId) };
          }
          return p;
      });
      setProjects(updatedProjects);
      
      const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
      if (updatedSelectedProject) setSelectedProject(updatedSelectedProject);
  };

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
      `${p.progress}%`,
      `${getProjectTotalHours(p)}h`
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Project Name', 'Client', 'Status', 'State', 'Deadline', 'Progress', 'Hours']],
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
          <p className="text-slate-500">{lang === 'pt' ? 'Visão geral do desempenho BIM' : 'Overview of your BIM performance'}</p>
        </div>
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(190,242,100,0.3)]"
        >
          <span className="text-sm">{t.generateReport}</span>
          <FileDown size={18} />
        </button>
      </div>

      {/* Quick New Project Modal */}
      {isNewProjectModalOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <div 
            className={`w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-scale-in ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/10' : 'bg-[#BEF264]/20'}`} />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.addProject}</h3>
                <button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-500 hover:text-red-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.projectName}</label>
                  <input 
                    type="text" 
                    value={newProjectForm.name}
                    onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})}
                    placeholder="Project Title"
                    className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white focus:border-[#BEF264]/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#BEF264]'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.clientName}</label>
                  <input 
                    type="text" 
                    value={newProjectForm.client}
                    onChange={(e) => setNewProjectForm({...newProjectForm, client: e.target.value})}
                    placeholder="Client Name"
                    className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white focus:border-[#BEF264]/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#BEF264]'}`}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.lodLevel}</label>
                    <input 
                      type="text" 
                      value={newProjectForm.lod}
                      onChange={(e) => setNewProjectForm({...newProjectForm, lod: e.target.value})}
                      className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white focus:border-[#BEF264]/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#BEF264]'}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.deadline}</label>
                    <input 
                      type="date" 
                      value={newProjectForm.deadline}
                      onChange={(e) => setNewProjectForm({...newProjectForm, deadline: e.target.value})}
                      className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white focus:border-[#BEF264]/50' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#BEF264]'}`}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCreateQuickProject}
                  disabled={!newProjectForm.name}
                  className="w-full mt-4 py-4 rounded-2xl bg-[#BEF264] hover:bg-[#a3d954] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg shadow-lg shadow-[#BEF264]/20 transition-all hover:scale-[1.02]"
                >
                  {t.saveProject}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <div className="flex items-center gap-2">
                        {selectedProject.status !== 'completed' && (
                          <button 
                            onClick={() => handleDeliverProject(selectedProject.id)}
                            className="bg-[#BEF264] hover:bg-[#a3d954] text-black text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow-lg"
                            title={lang === 'pt' ? 'Entregar Modelo' : 'Deliver Model'}
                          >
                            <Package size={14} />
                            {lang === 'pt' ? 'Entregar' : 'Deliver'}
                          </button>
                        )}
                        <button 
                            onClick={() => setSelectedProject(null)}
                            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                        >
                            <X size={24} />
                        </button>
                    </div>
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
                                    className={`h-full rounded-full ${selectedProject.status === 'completed' ? 'bg-emerald-500' : selectedProject.isActive ? 'bg-[#BEF264]' : 'bg-slate-500'}`}
                                    style={{ width: `${selectedProject.progress}%` }}
                                />
                             </div>
                        </div>
                    </div>
                </div>
                
                {/* Time Tracking Section */}
                <div className="mb-8 border-b border-dashed border-slate-700 pb-8">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <Timer size={18} />
                          {t.workLog}
                       </h3>
                       <span className="text-sm font-mono font-bold text-[#BEF264]">
                          {getProjectTotalHours(selectedProject)}h {t.accumulatedHours}
                       </span>
                   </div>
                   
                   <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                         <div className="flex-1 w-full">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.date}</label>
                            <input 
                               type="date" 
                               value={logForm.date}
                               onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                               className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                         </div>
                         <div className="w-full sm:w-24">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.hours}</label>
                            <input 
                               type="number" 
                               min="0.5"
                               step="0.5"
                               placeholder="0.0"
                               value={logForm.hours}
                               onChange={(e) => setLogForm({...logForm, hours: e.target.value})}
                               className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                         </div>
                         <div className="w-full sm:w-auto">
                            <button 
                               onClick={handleAddWorkLog}
                               disabled={!logForm.hours || !logForm.date}
                               className="w-full sm:w-auto h-[42px] px-4 rounded-lg bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                               <Plus size={16} />
                               {t.addTime}
                            </button>
                         </div>
                      </div>
                      <div className="mt-3">
                         <input 
                            type="text" 
                            placeholder={t.logDescription}
                            value={logForm.description}
                            onChange={(e) => setLogForm({...logForm, description: e.target.value})}
                            className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                         />
                      </div>
                   </div>

                   {selectedProject.workLogs && selectedProject.workLogs.length > 0 && (
                      <div className={`max-h-32 overflow-y-auto pr-2 custom-scrollbar`}>
                          {selectedProject.workLogs.map((log) => (
                             <div key={log.id} className={`flex justify-between items-center p-2 mb-1 rounded text-sm ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                                <div className="flex flex-col">
                                   <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{log.date}</span>
                                   {log.description && <span className="text-xs text-slate-500">{log.description}</span>}
                                </div>
                                <span className="font-bold font-mono">{log.hours}h</span>
                             </div>
                          ))}
                      </div>
                   )}
                </div>
                
                {/* Task Management Section - NEW */}
                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <CheckSquare size={18} />
                          {t.tasks}
                       </h3>
                   </div>

                   <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                         <div className="flex-1 w-full">
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.taskTitle}</label>
                            <input 
                               type="text" 
                               value={taskForm.title}
                               onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                               className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                            />
                         </div>
                         <div className="w-full sm:w-32">
                             <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.priority}</label>
                             <select
                                value={taskForm.priority}
                                onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                                className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                             >
                                 <option value="low">{t.priorityLow}</option>
                                 <option value="medium">{t.priorityMedium}</option>
                                 <option value="high">{t.priorityHigh}</option>
                                 <option value="urgent">{t.priorityUrgent}</option>
                             </select>
                         </div>
                         <div className="w-full sm:w-auto">
                            <button 
                               onClick={handleAddTask}
                               disabled={!taskForm.title}
                               className="w-full sm:w-auto h-[42px] px-4 rounded-lg bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                               <Plus size={16} />
                               {t.addTask}
                            </button>
                         </div>
                      </div>
                   </div>

                   {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                          {selectedProject.tasks.map((task) => (
                             <div key={task.id} className={`flex justify-between items-center p-3 rounded-lg border transition-all ${isDark ? 'bg-[#0B0E14]/30 border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-3">
                                   <button 
                                      onClick={() => toggleTaskCompletion(selectedProject.id, task.id)}
                                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : isDark ? 'border-slate-600' : 'border-slate-300'}`}
                                   >
                                      {task.completed && <CheckCircle size={14} className="text-white" />}
                                   </button>
                                   <div className="flex flex-col">
                                       <span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                                           {task.title}
                                       </span>
                                       <div className="flex items-center gap-2">
                                           <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                               task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 
                                               task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                               task.priority === 'medium' ? 'bg-blue-500/20 text-blue-400' :
                                               'bg-slate-500/20 text-slate-400'
                                           }`}>
                                               {task.priority}
                                           </span>
                                           <span className="text-xs text-slate-500">{task.dueDate}</span>
                                       </div>
                                   </div>
                                </div>
                                <button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-400 p-1">
                                    <Trash2 size={16} />
                                </button>
                             </div>
                          ))}
                      </div>
                   ) : (
                       <p className="text-slate-500 text-sm italic">{t.noTasks}</p>
                   )}
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

      {/* Main Content (Projects Grid) - MOVED UP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Table */}
        <div className={`lg:col-span-2 border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
          {/* Decorative Glow */}
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/5' : 'bg-[#BEF264]/20'}`} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.ongoingProjects}</h2>
            
            <div className="flex flex-wrap gap-2 items-center">
                {/* Quick Add Project Button */}
                <button 
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="mr-2 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-[#BEF264] text-black shadow-lg shadow-[#BEF264]/10 transition-transform hover:scale-105"
                >
                  <Plus size={16} />
                  {t.addProject}
                </button>

                <div className={`flex p-1 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <button 
                    onClick={() => setViewFilter('all')}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                      viewFilter === 'all'
                        ? isDark ? 'bg-white/10 text-white font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {lang === 'pt' ? 'Todos' : 'All'}
                  </button>
                  <button 
                    onClick={() => setViewFilter('active')}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                      viewFilter === 'active'
                      ? isDark ? 'bg-white/10 text-white font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {lang === 'pt' ? 'Ativos' : 'Active'}
                  </button>
                  <button 
                    onClick={() => setViewFilter('completed')}
                    className={`px-4 py-1.5 rounded-full text-xs transition-all ${
                      viewFilter === 'completed'
                      ? isDark ? 'bg-white/10 text-white font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {lang === 'pt' ? 'Entregues' : 'Delivered'}
                  </button>
                </div>
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
                    <th className="pb-6 text-center">{t.totalHours}</th>
                    <th className="pb-6">{t.deadline}</th>
                    <th className="pb-6">{t.progress}</th>
                    <th className="pb-6 text-center">{lang === 'pt' ? 'Ações' : 'Actions'}</th>
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
                        <td className="py-5 text-center font-mono font-bold text-slate-500">
                           {getProjectTotalHours(project)}h
                        </td>
                        <td className="py-5 text-slate-400 font-medium">{project.deadline}</td>
                        <td className="py-5 w-48 pr-4">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs">
                                <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.progress}%</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#1A1F2C]' : 'bg-slate-100'}`}>
                                <div 
                                    className={`h-full rounded-full ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-[#BEF264]'}`} 
                                    style={{ width: `${project.progress}%` }}
                                />
                            </div>
                        </div>
                        </td>
                        <td className="py-5 text-center">
                           {project.status !== 'completed' && (
                             <button 
                                onClick={(e) => handleDeliverProject(project.id, e)}
                                className={`p-2 rounded-full transition-all hover:scale-110 ${isDark ? 'hover:bg-[#BEF264]/20 text-slate-400 hover:text-[#BEF264]' : 'hover:bg-[#BEF264]/10 text-slate-400 hover:text-emerald-600'}`}
                                title={lang === 'pt' ? 'Entregar' : 'Deliver'}
                             >
                               <CheckCircle size={20} />
                             </button>
                           )}
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
                    {/* Project Filter for Tasks */}
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-500" />
                        <select 
                            value={taskProjectFilter}
                            onChange={(e) => setTaskProjectFilter(e.target.value)}
                            className={`text-xs p-1 rounded-lg outline-none border ${isDark ? 'bg-[#1A1F2C] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
                        >
                            <option value="all">{t.filterByProject}</option>
                            {projects.filter(p => p.isActive).map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-4 z-10 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredTasks.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm italic py-4">{t.noTasks}</p>
                    ) : (
                        filteredTasks.map((task, i) => (
                        <div 
                            key={`${task.projectId}-${task.id}`} 
                            className={`p-5 rounded-3xl border transition-all group cursor-pointer ${isDark ? 'bg-[#1A1F2C] border-white/5 hover:border-[#BEF264]/30' : 'bg-slate-50 border-slate-200 hover:border-[#BEF264]'}`}
                            onClick={() => toggleTaskCompletion(task.projectId, task.id)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                                    task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' : 
                                    task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' :
                                    task.priority === 'medium' ? 'bg-blue-500/10 text-blue-400' :
                                    'bg-slate-500/10 text-slate-400'
                                }`}>
                                    {task.priority.toUpperCase()}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{task.projectName}</span>
                                    <Clock size={14} className="text-slate-500" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.completed ? 'bg-[#BEF264] border-[#BEF264]' : 'border-slate-500'}`}>
                                    {task.completed && <CheckCircle size={14} className="text-black" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold mb-0.5 transition-colors ${task.completed ? 'line-through text-slate-500' : isDark ? 'text-white group-hover:text-[#BEF264]' : 'text-slate-900 group-hover:text-black'}`}>
                                        {task.title}
                                    </h4>
                                    <p className="text-xs text-slate-500">{task.dueDate}</p>
                                </div>
                            </div>
                        </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Stats Row - MOVED DOWN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: t.activeProjects, 
            value: activeCount.toString(), 
            icon: Layers,
            trend: "+2 this week",
            onClick: () => setViewFilter('active')
          },
          { 
            label: t.completedProjects, 
            value: completedCount.toString(),
            icon: Package, 
            trend: "+12% vs last month",
            onClick: () => setViewFilter('completed')
          },
          { 
            label: t.teamPerformance, 
            value: `${efficiency}%`,
            icon: Clock,
            trend: "Optimal pace",
            onClick: () => setViewFilter('all') // Reset to default or do nothing
          },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            onClick={stat.onClick}
            className={`p-8 rounded-[2rem] border relative overflow-hidden group transition-all duration-500 cursor-pointer
              ${isDark 
                ? 'bg-[#11141A] border-white/5 hover:border-[#BEF264]/20' 
                : 'bg-white border-slate-200 hover:border-[#BEF264] shadow-sm'
              }`}
          >
            <div className="flex justify-between items-start mb-8">
               <div className={`p-3 rounded-full ${isDark ? 'bg-white/5' : 'bg-slate-100'} text-black`}>
                 <stat.icon size={24} className={isDark ? 'text-[#BEF264]' : 'text-slate-600'} /> 
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
    </div>
  );
};