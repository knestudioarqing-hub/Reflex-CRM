import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, AlertCircle, MoreHorizontal, PlayCircle, ArrowUpRight, TrendingUp, Layers, FileDown, Calendar, Filter, X, Briefcase, User, Plus, CheckCircle, Package, Timer, CheckSquare, Trash2, MessageSquare, Bell, ChevronRight, Send, History } from 'lucide-react';
import { Project, Language, Theme, Member, WorkLog, Task, ProjectNote } from '../types';
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

  // Note/Observation State
  const [noteForm, setNoteForm] = useState({ content: '' });
  const [showNotification, setShowNotification] = useState(false);

  // Task Filter in Dashboard
  const [taskProjectFilter, setTaskProjectFilter] = useState<string>('all');

  // New Project Form State
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    client: '',
    startDate: new Date().toISOString().split('T')[0],
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
  const activeProjectsList = projects.filter(p => p.isActive && p.status !== 'completed');
  const activeCount = activeProjectsList.length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  
  // Efficiency Calculation Logic
  const allActiveTasks = activeProjectsList.flatMap(p => p.tasks || []);
  let efficiencyMetric = 0;
  let efficiencyTrend = "No data";

  if (allActiveTasks.length > 0) {
      // Logic A: Task Completion Rate
      const completedTasks = allActiveTasks.filter(t => t.completed).length;
      efficiencyMetric = Math.round((completedTasks / allActiveTasks.length) * 100);
      efficiencyTrend = `${completedTasks}/${allActiveTasks.length} tasks done`;
  } else {
      // Logic B: On-Time Project Rate (Fallback if no tasks)
      const now = new Date();
      // Count projects where deadline is in the future or today
      const onTimeProjects = activeProjectsList.filter(p => new Date(p.deadline) >= now).length;
      
      efficiencyMetric = activeCount > 0 
          ? Math.round((onTimeProjects / activeCount) * 100) 
          : 100; // Default to 100 if no active projects (nothing is late)
      
      efficiencyTrend = activeCount > 0 
          ? `${onTimeProjects} on schedule` 
          : "Ready to start";
  }

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
      startDate: newProjectForm.startDate,
      deadline: newProjectForm.deadline || new Date().toISOString().split('T')[0],
      progress: 0,
      teamMembers: [],
      description: '',
      history: [{
        id: Date.now().toString() + '-init',
        action: 'created',
        details: 'Project initialized via Quick Add from Dashboard',
        timestamp: new Date().toISOString(),
        user: 'Gianfranco'
      }],
      workLogs: [],
      tasks: [],
      notes: []
    };

    setProjects(prev => [...prev, newProject]);
    setIsNewProjectModalOpen(false);
    setNewProjectForm({ name: '', client: '', startDate: new Date().toISOString().split('T')[0], deadline: '' });
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
            user: 'Gianfranco'
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

  // --- NOTE MANAGEMENT LOGIC ---
  const handleAddNote = () => {
    if (!selectedProject || !noteForm.content) return;

    const newNote: ProjectNote = {
      id: Date.now().toString(),
      content: noteForm.content,
      timestamp: new Date().toISOString(),
      user: 'Gianfranco'
    };

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        // Initialize notes if undefined
        const currentNotes = p.notes || [];
        return { ...p, notes: [newNote, ...currentNotes] };
      }
      return p;
    });

    setProjects(updatedProjects);
    const updatedSelectedProject = updatedProjects.find(p => p.id === selectedProject.id);
    if (updatedSelectedProject) setSelectedProject(updatedSelectedProject);

    setNoteForm({ content: '' });
    
    // Trigger Notification
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!selectedProject) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, notes: (p.notes || []).filter(n => n.id !== noteId) };
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
    <div className="space-y-8 animate-fade-in pb-10 relative">
      
      {/* Toast Notification */}
      {showNotification && createPortal(
        <div className={`fixed top-6 right-6 z-[150] animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${isDark ? 'bg-[#1A1F2C] border-emerald-500/30' : 'bg-white border-emerald-200'}`}>
           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black">
              <CheckCircle size={18} />
           </div>
           <div>
              <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.noteAdded}</h4>
              <p className="text-xs text-slate-500">{new Date().toLocaleTimeString()}</p>
           </div>
        </div>,
        document.body
      )}

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
          className="bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(190,242,100,0.3)] w-full md:w-auto justify-center"
        >
          <span className="text-sm">{t.generateReport}</span>
          <FileDown size={18} />
        </button>
      </div>

      {/* STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { 
            label: t.activeProjects, 
            value: activeCount.toString(), 
            icon: Layers,
            trend: "+2 this week",
            onClick: () => setViewFilter('active'),
            progress: 85 // Cosmetic High
          },
          { 
            label: t.completedProjects, 
            value: completedCount.toString(),
            icon: Package, 
            trend: "+12% vs last month",
            onClick: () => setViewFilter('completed'),
            progress: 60 // Cosmetic Medium
          },
          { 
            label: t.teamPerformance, 
            value: `${efficiencyMetric}%`,
            icon: Clock,
            trend: efficiencyTrend,
            onClick: () => setViewFilter('all'),
            progress: efficiencyMetric // Real data
          },
        ].map((stat, idx) => (
          <div 
            key={idx} 
            onClick={stat.onClick}
            className={`
                relative p-5 md:p-6 rounded-3xl h-[180px] md:h-[200px] flex flex-col justify-between cursor-pointer transition-transform duration-300 hover:scale-[1.02]
                ${isDark ? 'bg-[#0E1116] border border-white/5' : 'bg-white border border-slate-200 shadow-xl'}
            `}
          >
            {/* Top Row: Icon and Badge */}
            <div className="flex justify-between items-start">
               {/* Icon Container */}
               <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isDark ? 'bg-white/5 border-white/5 text-[#BEF264]' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
                 <stat.icon size={18} />
               </div>
               
               {/* Badge */}
               <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${isDark ? 'bg-[#151A23] border-white/5 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                 {stat.trend}
               </div>
            </div>

            {/* Middle: Number and Label */}
            <div>
               <h3 className={`text-4xl md:text-5xl font-medium tracking-tight mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 {stat.value}
               </h3>
               <p className="text-sm text-slate-500 font-medium tracking-wide">
                 {stat.label}
               </p>
            </div>

            {/* Bottom: Progress Bar */}
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-[#BEF264] shadow-[0_0_10px_rgba(190,242,100,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: `${stat.progress}%` }} 
                />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content (Projects Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Projects Table */}
        <div className={`lg:col-span-2 border rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
          {/* Decorative Glow */}
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/5' : 'bg-[#BEF264]/20'}`} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 relative z-10">
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.ongoingProjects}</h2>
            
            <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                {/* Quick Add Project Button */}
                <button 
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="w-full sm:w-auto mr-0 sm:mr-2 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-[#BEF264] text-black shadow-lg shadow-[#BEF264]/10 transition-transform hover:scale-105"
                >
                  <Plus size={16} />
                  {t.addProject}
                </button>

                <div className={`flex p-1 rounded-full w-full sm:w-auto justify-between sm:justify-start ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <button 
                    onClick={() => setViewFilter('all')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs transition-all ${
                      viewFilter === 'all'
                        ? isDark ? 'bg-white/10 text-white font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {lang === 'pt' ? 'Todos' : 'All'}
                  </button>
                  <button 
                    onClick={() => setViewFilter('active')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs transition-all ${
                      viewFilter === 'active'
                      ? isDark ? 'bg-white/10 text-white font-bold' : 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    {lang === 'pt' ? 'Ativos' : 'Active'}
                  </button>
                  <button 
                    onClick={() => setViewFilter('completed')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs transition-all ${
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
                    <th className="pb-6 pl-2 md:pl-4">{t.project}</th>
                    <th className="pb-6 px-2">{t.status}</th>
                    <th className="pb-6 text-center px-2">{t.totalHours}</th>
                    <th className="pb-6 px-2">{t.deadline}</th>
                    <th className="pb-6 px-2">{t.progress}</th>
                    <th className="pb-6 text-center px-2">{lang === 'pt' ? 'Ações' : 'Actions'}</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {visibleProjects.slice(0, 5).map((project, i) => (
                    <tr 
                        key={project.id} 
                        onClick={() => setSelectedProject(project)}
                        className={`group transition-colors border-b last:border-0 cursor-pointer ${isDark ? 'hover:bg-white/[0.02] border-white/5' : 'hover:bg-slate-50 border-slate-100'} ${!project.isActive ? 'opacity-60' : ''}`}
                    >
                        <td className="py-4 md:py-5 pl-2 md:pl-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${isDark ? 'bg-[#1A1F2C] border-white/10 text-white group-hover:border-[#BEF264]/50' : 'bg-slate-100 border-slate-200 text-slate-700 group-hover:border-[#BEF264]'}`}>
                            {project.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                            <p className={`font-bold text-base whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {project.name}
                                {!project.isActive && <span className="ml-2 text-[10px] text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/20">Inactive</span>}
                            </p>
                            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">{project.client}</p>
                            </div>
                        </div>
                        </td>
                        <td className="py-4 md:py-5 px-2">
                          {project.status === 'completed' || project.status === 'modeling' ? (
                            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#BEF264] text-black shadow-[0_0_10px_-3px_rgba(190,242,100,0.4)] whitespace-nowrap">
                              {project.status === 'completed' ? t.statusCompleted : t.statusModeling}
                            </span>
                          ) : (
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap ${isDark ? 'bg-[#1A1F2C] text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {project.status === 'planning' ? t.statusPlanning : t.statusCoordination}
                            </span>
                          )}
                        </td>
                        <td className="py-4 md:py-5 text-center font-mono font-bold text-slate-500 px-2 whitespace-nowrap">
                           {getProjectTotalHours(project)}h
                        </td>
                        <td className="py-4 md:py-5 text-slate-400 font-medium px-2 whitespace-nowrap">{project.deadline}</td>
                        <td className="py-4 md:py-5 min-w-[120px] w-48 pr-4 px-2">
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
                        <td className="py-4 md:py-5 text-center px-2">
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
            <div className={`border rounded-[2.5rem] p-5 md:p-8 shadow-xl flex flex-col h-full relative overflow-hidden ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                <div className="flex justify-between items-center mb-6 z-10">
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.todoList}</h2>
                    {/* Project Filter for Tasks */}
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-500" />
                        <select 
                            value={taskProjectFilter}
                            onChange={(e) => setTaskProjectFilter(e.target.value)}
                            className={`text-xs p-1 rounded-lg outline-none border max-w-[120px] md:max-w-none ${isDark ? 'bg-[#1A1F2C] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}
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
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 ${task.completed ? 'bg-[#BEF264] border-[#BEF264]' : 'border-slate-500'}`}>
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

      {/* Quick New Project Modal via Portal */}
      {isNewProjectModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <div 
            className={`w-full max-w-lg rounded-[2.5rem] p-5 md:p-8 shadow-2xl relative overflow-hidden animate-scale-in ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}
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
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.startDate}</label>
                    <input 
                      type="date" 
                      value={newProjectForm.startDate}
                      onChange={(e) => setNewProjectForm({...newProjectForm, startDate: e.target.value})}
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
        </div>,
        document.body
      )}

      {/* Project Details Modal - OPTIMIZED FOR RESPONSIVE HEIGHT */}
      {selectedProject && createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedProject(null)}
        >
          <div 
            className={`w-full max-w-[95vw] h-[92vh] min-h-[600px] rounded-[2rem] shadow-2xl relative overflow-hidden animate-scale-in flex flex-col ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow inside modal */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/5' : 'bg-[#BEF264]/10'}`} />

            {/* HEADER (Fixed) */}
            <div className={`p-6 md:p-8 border-b ${isDark ? 'border-white/5 bg-[#151A23]' : 'border-slate-100 bg-white'} flex-shrink-0 relative z-20`}>
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mb-2">
                             <h2 className={`text-2xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.name}</h2>
                             {!selectedProject.isActive && (
                                <span className="inline-block px-3 py-1 rounded bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs font-bold uppercase tracking-wider w-fit">
                                    {t.inactiveState}
                                </span>
                             )}
                        </div>
                        <p className="text-slate-500 text-xl font-light">{selectedProject.client}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedProject.status !== 'completed' && (
                          <button 
                            onClick={() => handleDeliverProject(selectedProject.id)}
                            className="bg-[#BEF264] hover:bg-[#a3d954] text-black text-sm font-bold py-3 px-6 rounded-full flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(190,242,100,0.4)] transition-transform hover:scale-105"
                            title={lang === 'pt' ? 'Entregar Modelo' : 'Deliver Model'}
                          >
                            <Package size={18} />
                            <span className="hidden sm:inline">{lang === 'pt' ? 'Entregar' : 'Deliver'}</span>
                          </button>
                        )}
                        <button 
                            onClick={() => setSelectedProject(null)}
                            className={`p-3 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                        >
                            <X size={28} />
                        </button>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA (Hybrid Scroll - Smart layout) */}
            <div className="flex-1 p-6 md:p-8 relative z-10 flex flex-col overflow-hidden">
                
                {/* 3-COLUMN LAYOUT - The wrapper handles mobile scroll, but locks on desktop to allow columns to scroll independently IF there is enough height */}
                <div className="flex-1 overflow-y-auto xl:overflow-hidden">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 xl:h-full min-h-[500px]">
                        
                        {/* COLUMN 1: VITAL INFO & WORK LOG (Scrolls fully as a column) */}
                        <div className="space-y-8 overflow-y-auto custom-scrollbar pr-2 xl:h-full">
                            
                            {/* Status/Progress Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Status Box */}
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.status}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            selectedProject.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            selectedProject.status === 'coordination' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                        }`}>
                                            {selectedProject.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <span className="text-slate-500 text-xs block mb-1">{t.startDate}</span>
                                            <span className={`font-mono font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.startDate || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Deadline Box */}
                                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{t.deadline}</span>
                                        <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.deadline}</span>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-500 mb-2">
                                            <span>{t.progress}</span>
                                            <span className="font-bold text-white">{selectedProject.progress}%</span>
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

                            {/* Work Log Section */}
                            <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#12151b] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                        <Timer size={20} />
                                    </div>
                                    {t.workLog}
                                </h3>
                                <span className="text-xl font-mono font-bold text-[#BEF264]">
                                    {getProjectTotalHours(selectedProject)}h
                                </span>
                            </div>
                            
                            <div className={`p-4 rounded-2xl border mb-6 ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="space-y-3">
                                    <div className="flex gap-3">
                                        <input 
                                        type="date" 
                                        value={logForm.date}
                                        onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                                        className={`flex-1 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                        />
                                        <input 
                                        type="number" 
                                        min="0.5"
                                        step="0.5"
                                        placeholder="Hrs"
                                        value={logForm.hours}
                                        onChange={(e) => setLogForm({...logForm, hours: e.target.value})}
                                        className={`w-24 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder={t.logDescription}
                                        value={logForm.description}
                                        onChange={(e) => setLogForm({...logForm, description: e.target.value})}
                                        className={`w-full p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                    />
                                    <button 
                                        onClick={handleAddWorkLog}
                                        disabled={!logForm.hours || !logForm.date}
                                        className="w-full py-3 rounded-xl bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95"
                                    >
                                        <Plus size={16} />
                                        {t.addTime}
                                    </button>
                                </div>
                            </div>

                            {selectedProject.workLogs && selectedProject.workLogs.length > 0 && (
                                <div className={`space-y-2`}>
                                    {selectedProject.workLogs.map((log) => (
                                        <div key={log.id} className={`flex justify-between items-center p-3 rounded-xl text-sm border transition-colors ${isDark ? 'bg-white/[0.02] border-white/5 hover:bg-white/5' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                                            <div className="flex flex-col">
                                            <span className={`font-mono text-xs mb-1 opacity-50 ${isDark ? 'text-white' : 'text-slate-900'}`}>{log.date}</span>
                                            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{log.description || 'No description'}</span>
                                            </div>
                                            <span className="font-bold font-mono text-[#BEF264]">{log.hours}h</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            </div>
                        </div>

                        {/* COLUMN 2: TASK MANAGEMENT (Fixed Header, Scrollable List) */}
                        <div className={`rounded-[2rem] border flex flex-col xl:h-full xl:overflow-hidden ${isDark ? 'bg-[#12151b] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                            {/* Fixed Header with solid background to prevent transparency overlap */}
                            <div className={`p-6 border-b flex-shrink-0 relative z-20 ${isDark ? 'border-white/5 bg-[#12151b] rounded-t-[2rem]' : 'border-slate-100 bg-white rounded-t-[2rem]'}`}>
                                <h3 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                    <CheckSquare size={20} />
                                    </div>
                                    {t.tasks}
                                </h3>
                            </div>
                            
                            {/* Fixed Input Area with solid background */}
                            <div className={`p-6 border-b border-dashed border-slate-700/50 flex-shrink-0 relative z-10 ${isDark ? 'bg-[#12151b]' : 'bg-white'}`}>
                                <div className="space-y-3">
                                    <input 
                                    type="text" 
                                    placeholder={t.taskTitle}
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                                    className={`w-full p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                    />
                                    <div className="flex gap-3">
                                        <input 
                                        type="date" 
                                        value={taskForm.date}
                                        onChange={(e) => setTaskForm({...taskForm, date: e.target.value})}
                                        className={`flex-1 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                        />
                                        <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})}
                                        className={`p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                        >
                                            <option value="low">{t.priorityLow}</option>
                                            <option value="medium">{t.priorityMedium}</option>
                                            <option value="high">{t.priorityHigh}</option>
                                            <option value="urgent">{t.priorityUrgent}</option>
                                        </select>
                                    </div>
                                    <button 
                                    onClick={handleAddTask}
                                    disabled={!taskForm.title}
                                    className="w-full py-3 rounded-xl bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                    <Plus size={16} />
                                    {t.addTask}
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Task List with min-h-0 to enable flex shrinking properly */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3 min-h-0 relative z-0">
                                {(!selectedProject.tasks || selectedProject.tasks.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 min-h-[100px]">
                                        <CheckSquare size={48} className="mb-4" />
                                        <p>{t.noTasks}</p>
                                    </div>
                                ) : (
                                    selectedProject.tasks.map(task => (
                                        <div 
                                            key={task.id}
                                            className={`group p-4 rounded-xl border transition-all cursor-pointer relative ${
                                                task.completed 
                                                ? isDark ? 'bg-white/5 border-transparent opacity-60' : 'bg-slate-50 border-slate-100 opacity-60'
                                                : isDark ? 'bg-[#0B0E14] border-white/5 hover:border-[#BEF264]/30' : 'bg-white border-slate-200 hover:border-[#BEF264]'
                                            }`}
                                            onClick={() => toggleTaskCompletion(selectedProject.id, task.id)}
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
                                                <button 
                                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${task.completed ? 'bg-[#BEF264] border-[#BEF264]' : 'border-slate-500'}`}>
                                                    {task.completed && <CheckCircle size={14} className="text-black" />}
                                                </div>
                                                <h4 className={`font-bold text-sm ${task.completed ? 'line-through' : ''} ${isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2 pl-8">{task.dueDate}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* COLUMN 3: NOTES & TEAM */}
                        <div className="flex flex-col gap-6 xl:h-full xl:overflow-hidden min-h-0">
                            {/* Notes Section - Grows to fill space, independent scroll */}
                            <div className={`flex-1 rounded-[2rem] border flex flex-col overflow-hidden min-h-[200px] ${isDark ? 'bg-[#12151b] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className={`p-6 border-b flex-shrink-0 relative z-20 ${isDark ? 'border-white/5 bg-[#12151b] rounded-t-[2rem]' : 'border-slate-100 bg-white rounded-t-[2rem]'}`}>
                                    <h3 className={`text-xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <MessageSquare size={20} />
                                        </div>
                                        {t.observations}
                                    </h3>
                                </div>

                                <div className={`p-4 border-b border-dashed border-slate-700/50 flex-shrink-0 relative z-10 ${isDark ? 'bg-[#12151b]' : 'bg-white'}`}>
                                    <div className="flex gap-2">
                                        <input 
                                        type="text" 
                                        value={noteForm.content}
                                        onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                        placeholder={t.notePlaceholder}
                                        className={`flex-1 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                                        />
                                        <button 
                                        onClick={handleAddNote}
                                        disabled={!noteForm.content}
                                        className="px-4 rounded-xl bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold disabled:opacity-50"
                                        >
                                        <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 min-h-0 relative z-0">
                                    {(!selectedProject.notes || selectedProject.notes.length === 0) ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50 min-h-[100px]">
                                            <MessageSquare size={32} className="mb-2" />
                                            <p className="text-sm">{t.noNotes}</p>
                                        </div>
                                    ) : (
                                        selectedProject.notes.map(note => (
                                            <div key={note.id} className={`p-4 rounded-2xl rounded-tl-none border text-sm relative group ${isDark ? 'bg-[#0B0E14] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                                <p className={`mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{note.content}</p>
                                                <div className="flex justify-between items-center text-xs text-slate-500">
                                                    <span>{new Date(note.timestamp).toLocaleString()}</span>
                                                    <button 
                                                    onClick={() => handleDeleteNote(note.id)}
                                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                    <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Team Section - Fixed height at bottom of column */}
                            <div className={`p-6 rounded-[2rem] border flex-shrink-0 ${isDark ? 'bg-[#12151b] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <h3 className={`text-xl font-bold flex items-center gap-3 mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                    <User size={20} />
                                    </div>
                                    {t.team}
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProject.teamMembers.length === 0 ? (
                                        <p className="text-slate-500 text-sm italic">No team members assigned.</p>
                                    ) : (
                                        selectedProject.teamMembers.map(mid => {
                                            const m = members.find(mem => mem.id === mid);
                                            if(!m) return null;
                                            return (
                                                <div key={mid} className={`flex items-center gap-3 p-2 pr-4 rounded-full border ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                                                        {m.name.substring(0,1)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.name}</span>
                                                        <span className="text-[10px] text-slate-500 uppercase">{m.role}</span>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Generate Report Modal */}
      {isReportModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsReportModalOpen(false)}
        >
           <div 
            className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-scale-in ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}
            onClick={(e) => e.stopPropagation()}
           >
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.reportSettings}</h2>
              
              <div className="space-y-4 mb-6">
                 <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">{t.dateRange}</label>
                    <div className="flex gap-4">
                       <input 
                          type="date" 
                          value={reportFilters.startDate}
                          onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})}
                          className={`flex-1 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                       />
                       <input 
                          type="date" 
                          value={reportFilters.endDate}
                          onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})}
                          className={`flex-1 p-3 rounded-xl border text-sm outline-none ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                       />
                    </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">{t.selectProjects}</label>
                    <div className={`max-h-40 overflow-y-auto border rounded-xl p-2 custom-scrollbar ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        {projects.map(p => (
                           <div 
                              key={p.id} 
                              onClick={() => toggleProjectSelection(p.id)}
                              className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors`}
                           >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                 reportFilters.selectedProjectIds.includes(p.id) 
                                 ? 'bg-emerald-500 border-emerald-500' 
                                 : 'border-slate-500'
                              }`}>
                                 {reportFilters.selectedProjectIds.includes(p.id) && <CheckSquare size={10} className="text-black" />}
                              </div>
                              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{p.name}</span>
                           </div>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-right">
                       {reportFilters.selectedProjectIds.length === 0 ? t.allProjects : `${reportFilters.selectedProjectIds.length} projects selected`}
                    </p>
                 </div>
              </div>

              <div className="flex justify-end gap-3">
                 <button 
                    onClick={() => setIsReportModalOpen(false)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
                 >
                    {t.cancel}
                 </button>
                 <button 
                    onClick={generatePDF}
                    className="bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold py-2 px-6 rounded-xl shadow-lg flex items-center gap-2"
                 >
                    <FileDown size={18} />
                    {t.downloadPDF}
                 </button>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};