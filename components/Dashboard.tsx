import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Clock, TrendingUp, Layers, FileDown, Filter, X, Briefcase, Plus, CheckCircle, Package, Timer, CheckSquare, Trash2, MessageSquare, Search } from 'lucide-react';
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

// --- CHART COMPONENT ---
interface ChartProps {
  data: number[];
  labels: string[];
  color: 'green' | 'blue';
  title: string;
  totalValue: string | number;
  subtitle: string;
  isDark: boolean;
  unit?: string;
}

const InteractiveChart: React.FC<ChartProps> = ({ data, labels, color, title, totalValue, subtitle, isDark, unit = '' }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const height = 240; 
  const paddingY = 40;
  const paddingX = 10;

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            setWidth(entry.contentRect.width);
        }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const maxVal = Math.max(...data, 1) * 1.2;
  const minVal = 0; 

  const getCoordinates = (index: number) => {
      if (data.length <= 1) return [paddingX, height - paddingY];
      const x = paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((data[index] - minVal) / (maxVal - minVal)) * (height - paddingY * 2);
      return [x, y];
  };

  const points = data.map((_, i) => getCoordinates(i));

  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const cp1x = x0 + (x1 - x0) * 0.5;
    const cp1y = y0;
    const cp2x = x1 - (x1 - x0) * 0.5;
    const cp2y = y1;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x1},${y1}`;
  }
  
  const fillPath = `${d} L ${points[points.length-1][0]},${height} L ${points[0][0]},${height} Z`;
  const strokeColor = color === 'green' ? '#10B981' : '#3B82F6';
  const gradId = `grad-${color}-${title.replace(/\s/g, '')}`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - paddingX;
    const effectiveWidth = rect.width - paddingX * 2;
    const relX = Math.max(0, Math.min(1, x / effectiveWidth));
    const index = Math.round(relX * (data.length - 1));
    if (index >= 0 && index < data.length) setHoverIndex(index);
  };

  return (
    <div className={`relative flex flex-col h-full w-full rounded-[2rem] border p-6 transition-all shadow-lg group ${isDark ? 'bg-[#151A23] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalValue}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color === 'green' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {subtitle}
                    </span>
                </div>
            </div>
            <div className={`hidden sm:flex items-center gap-1 p-1 rounded-lg border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white' : 'bg-white text-black shadow-sm'}`}>6M</span>
            </div>
        </div>

        <div 
            ref={containerRef} 
            className="relative flex-1 w-full min-h-[200px] cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
        >
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-[40px] pl-[10px] pr-[10px]">
                {[1, 0.66, 0.33, 0].map((tick, i) => (
                    <div key={i} className="relative w-full border-b border-dashed border-slate-700/20 dark:border-white/5 h-0">
                        {i < 3 && <span className="absolute -top-3 -left-0 text-[9px] text-slate-500 font-mono">{Math.round(maxVal * tick)}</span>}
                    </div>
                ))}
            </div>

            {width > 0 && (
                <svg width={width} height={height} className="overflow-visible absolute top-0 left-0">
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={fillPath} fill={`url(#${gradId})`} stroke="none" />
                    <path d={d} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {hoverIndex !== null && (
                        <g>
                            <line x1={points[hoverIndex][0]} y1={0} x2={points[hoverIndex][0]} y2={height - paddingY} stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"} strokeWidth="1" strokeDasharray="4 4" />
                            <circle cx={points[hoverIndex][0]} cy={points[hoverIndex][1]} r="6" fill={isDark ? "#151A23" : "white"} stroke={strokeColor} strokeWidth="3" />
                        </g>
                    )}
                </svg>
            )}

            {hoverIndex !== null && width > 0 && (
                <div 
                    className="absolute top-0 pointer-events-none z-20"
                    style={{ left: points[hoverIndex][0], top: Math.max(0, points[hoverIndex][1] - 50) }}
                >
                    <div className={`transform -translate-x-1/2 -translate-y-2 px-3 py-2 rounded-xl shadow-xl border backdrop-blur-md flex flex-col items-center min-w-[80px] ${isDark ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/90 border-slate-200 text-slate-900'}`}>
                        <span className="text-[10px] font-bold uppercase text-slate-500 mb-0.5">{labels[hoverIndex]}</span>
                        <span className="text-lg font-bold font-mono leading-none">{data[hoverIndex]}{unit}</span>
                    </div>
                </div>
            )}
        </div>

        <div className="flex justify-between px-2 mt-[-20px] relative z-10">
            {labels.map((l, i) => (
                <span key={i} className={`text-[9px] font-bold uppercase font-mono transition-colors ${hoverIndex === i ? (isDark ? 'text-white' : 'text-black') : 'text-slate-500'}`}>
                    {l}
                </span>
            ))}
        </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ projects, setProjects, members, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
  const [taskForm, setTaskForm] = useState<{title: string, date: string, priority: 'low' | 'medium' | 'high' | 'urgent'}>({
      title: '', date: new Date().toISOString().split('T')[0], priority: 'medium'
  });
  const [noteForm, setNoteForm] = useState({ content: '' });
  const [showNotification, setShowNotification] = useState(false);
  const [taskProjectFilter, setTaskProjectFilter] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [newProjectForm, setNewProjectForm] = useState({ name: '', client: '', lod: 'LOD 200', deadline: '' });
  const [reportFilters, setReportFilters] = useState({ startDate: '', endDate: '', selectedProjectIds: [] as string[] });

  // Calculate Real Data for Charts
  const chartData = useMemo(() => {
      const monthNames = lang === 'pt' 
        ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const today = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          last6Months.push({ label: monthNames[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}` });
      }

      const hoursPerMonth = last6Months.map(m => {
          let total = 0;
          projects.forEach(p => {
              (p.workLogs || []).forEach(log => {
                  const logDate = new Date(log.date);
                  if (`${logDate.getFullYear()}-${logDate.getMonth()}` === m.key) total += log.hours;
              });
          });
          return total;
      });

      const deliveriesPerMonth = last6Months.map(m => {
          return projects.filter(p => {
              if (p.status !== 'completed') return false;
              const d = new Date(p.deadline);
              return `${d.getFullYear()}-${d.getMonth()}` === m.key;
          }).length;
      });

      return {
          labels: last6Months.map(m => m.label),
          hours: hoursPerMonth,
          deliveries: deliveriesPerMonth,
          totalHoursLast6M: hoursPerMonth.reduce((a,b) => a+b, 0),
          totalDeliveredLast6M: deliveriesPerMonth.reduce((a,b) => a+b, 0)
      };

  }, [projects, lang]);

  const activeProjectsList = projects.filter(p => p.isActive && p.status !== 'completed');
  const activeCount = activeProjectsList.length;
  const visibleProjects = projects.filter(p => {
    if (viewFilter === 'active') return p.isActive && p.status !== 'completed';
    if (viewFilter === 'completed') return p.status === 'completed';
    return true;
  });
  const allTasks = projects.filter(p => p.isActive && p.status !== 'completed').flatMap(p => (p.tasks || []).map(task => ({ ...task, projectId: p.id, projectName: p.name })));
  const filteredTasks = allTasks.filter(task => taskProjectFilter === 'all' || task.projectId === taskProjectFilter).sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
  const getProjectTotalHours = (project: Project) => (project.workLogs || []).reduce((acc, log) => acc + (Number(log.hours) || 0), 0);
  const totalAccumulatedHours = projects.reduce((acc, p) => acc + getProjectTotalHours(p), 0);

  // Handlers
  const handleCreateQuickProject = () => {
    if (!newProjectForm.name) return;
    const newProject: Project = {
      id: Date.now().toString(), name: newProjectForm.name, client: newProjectForm.client || 'Unknown Client',
      status: 'planning', isActive: true, deadline: newProjectForm.deadline || new Date().toISOString().split('T')[0],
      progress: 0, lod: newProjectForm.lod, teamMembers: [], description: '',
      history: [{ id: Date.now().toString() + '-init', action: 'created', details: 'Project initialized via Quick Add from Dashboard', timestamp: new Date().toISOString(), user: 'Gianfranco' }],
      workLogs: [], tasks: [], notes: []
    };
    setProjects(prev => [...prev, newProject]);
    setIsNewProjectModalOpen(false);
    setNewProjectForm({ name: '', client: '', lod: 'LOD 200', deadline: '' });
  };

  const handleDeliverProject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status: 'completed', progress: 100, isActive: false } : p));
  };

  const handleAddWorkLog = () => {
    if (!selectedProject || !logForm.hours || !logForm.date) return;
    const newLog: WorkLog = { id: Date.now().toString(), date: logForm.date, hours: parseFloat(logForm.hours), description: logForm.description, userId: 'currentUser' };
    const updatedProjects = projects.map(p => p.id === selectedProject.id ? { ...p, workLogs: [newLog, ...(p.workLogs || [])] } : p);
    setProjects(updatedProjects);
    setSelectedProject(updatedProjects.find(p => p.id === selectedProject.id) || null);
    setLogForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
  };

  const handleAddTask = () => {
    if (!selectedProject || !taskForm.title) return;
    const newTask: Task = { id: Date.now().toString(), title: taskForm.title, dueDate: taskForm.date, priority: taskForm.priority, completed: false };
    const updatedProjects = projects.map(p => p.id === selectedProject.id ? { ...p, tasks: [newTask, ...(p.tasks || [])] } : p);
    setProjects(updatedProjects);
    setSelectedProject(updatedProjects.find(p => p.id === selectedProject.id) || null);
    setTaskForm({ title: '', date: new Date().toISOString().split('T')[0], priority: 'medium' });
  };

  const toggleTaskCompletion = (pid: string, tid: string) => {
    const updatedProjects = projects.map(p => p.id === pid ? { ...p, tasks: p.tasks.map(t => t.id === tid ? { ...t, completed: !t.completed } : t) } : p);
    setProjects(updatedProjects);
    if (selectedProject?.id === pid) setSelectedProject(updatedProjects.find(p => p.id === pid) || null);
  };

  const deleteTask = (tid: string) => {
      if (!selectedProject) return;
      const updatedProjects = projects.map(p => p.id === selectedProject.id ? { ...p, tasks: (p.tasks || []).filter(t => t.id !== tid) } : p);
      setProjects(updatedProjects);
      setSelectedProject(updatedProjects.find(p => p.id === selectedProject.id) || null);
  };

  const handleAddNote = () => {
    if (!selectedProject || !noteForm.content) return;
    const newNote: ProjectNote = { id: Date.now().toString(), content: noteForm.content, timestamp: new Date().toISOString(), user: 'Gianfranco' };
    const updatedProjects = projects.map(p => p.id === selectedProject.id ? { ...p, notes: [newNote, ...(p.notes || [])] } : p);
    setProjects(updatedProjects);
    setSelectedProject(updatedProjects.find(p => p.id === selectedProject.id) || null);
    setNoteForm({ content: '' });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleDeleteNote = (id: string) => {
    if (!selectedProject) return;
    const updatedProjects = projects.map(p => p.id === selectedProject.id ? { ...p, notes: (p.notes || []).filter(n => n.id !== id) } : p);
    setProjects(updatedProjects);
    setSelectedProject(updatedProjects.find(p => p.id === selectedProject.id) || null);
  };
  
  const toggleProjectSelection = (id: string) => {
      setReportFilters(prev => {
        if (prev.selectedProjectIds.includes(id)) return { ...prev, selectedProjectIds: prev.selectedProjectIds.filter(pid => pid !== id) };
        else return { ...prev, selectedProjectIds: [...prev.selectedProjectIds, id] };
      });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let filteredProjects = projects;
    if (reportFilters.selectedProjectIds.length > 0) filteredProjects = projects.filter(p => reportFilters.selectedProjectIds.includes(p.id));
    
    doc.text('REFLEX CRM - Report', 14, 20);
    const tableData = filteredProjects.map(p => [p.name, p.client, p.status, p.progress + '%']);
    autoTable(doc, { startY: 40, head: [['Project', 'Client', 'Status', 'Progress']], body: tableData });
    doc.save('report.pdf');
    setIsReportModalOpen(false);
  };

  // Glassmorphism Card Style
  const getGlassCardStyle = (isActive: boolean) => `
    relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-300 group
    ${isDark 
        ? `bg-[#12141a]/60 backdrop-blur-xl border-white/10 shadow-2xl ${isActive ? 'ring-1 ring-white/10' : ''}` 
        : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
    }
  `;

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative max-w-8xl mx-auto">
      
      {showNotification && (
        <div className={`fixed top-6 right-6 z-[150] animate-slide-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border ${isDark ? 'bg-[#1A1F2C] border-emerald-500/30' : 'bg-white border-emerald-200'}`}>
           <CheckCircle size={18} className="text-emerald-500" />
           <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.noteAdded}</p>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-4xl font-light mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.dashboard}</h1>
          <p className="text-slate-500">{lang === 'pt' ? 'Visão geral do desempenho BIM' : 'Overview of your BIM performance'}</p>
        </div>
        <button onClick={() => setIsReportModalOpen(true)} className="bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold py-3 px-6 rounded-full transition-all flex items-center gap-2 shadow-[0_0_20px_-5px_rgba(190,242,100,0.4)]">
          <span className="text-sm">{t.generateReport}</span>
          <FileDown size={18} />
        </button>
      </div>

      {/* 2. METRICS ROW (KPIs) - GLASS DESIGN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Active Projects */}
          <div className={`${getGlassCardStyle(viewFilter === 'active')} cursor-pointer hover:-translate-y-1`} onClick={() => setViewFilter('active')}>
             {isDark && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-50" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80" />
                </>
             )}
             <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className={`text-4xl font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeCount}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.activeProjects}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-white/5 text-emerald-400 border border-white/5 shadow-inner' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Layers size={24} />
                </div>
             </div>
          </div>

          {/* Card 2: Total Hours */}
          <div className={`${getGlassCardStyle(false)} hover:-translate-y-1`}>
             {isDark && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-50" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80" />
                </>
             )}
             <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className={`text-4xl font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.round(totalAccumulatedHours)}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.totalHours}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-white/5 text-blue-400 border border-white/5 shadow-inner' : 'bg-blue-50 text-blue-600'}`}>
                    <Clock size={24} />
                </div>
             </div>
          </div>

          {/* Card 3: Progress */}
          <div className={`${getGlassCardStyle(false)} hover:-translate-y-1`}>
             {isDark && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-50" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80" />
                </>
             )}
             <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className={`text-4xl font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {activeCount > 0 ? Math.round(activeProjectsList.reduce((acc, p) => acc + p.progress, 0) / activeCount) : 0}%
                    </p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.progress}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-white/5 text-purple-400 border border-white/5 shadow-inner' : 'bg-purple-50 text-purple-600'}`}>
                    <TrendingUp size={24} />
                </div>
             </div>
          </div>

          {/* Card 4: Team */}
          <div className={`${getGlassCardStyle(false)} hover:-translate-y-1`}>
             {isDark && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none opacity-50" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-80" />
                </>
             )}
             <div className="flex items-center justify-between relative z-10">
                <div>
                    <p className={`text-4xl font-bold font-mono mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{members.length}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.team}</p>
                </div>
                <div className={`p-3.5 rounded-2xl ${isDark ? 'bg-white/5 text-orange-400 border border-white/5 shadow-inner' : 'bg-orange-50 text-orange-600'}`}>
                    <Briefcase size={24} />
                </div>
             </div>
          </div>
      </div>

      {/* 3. MAIN CONTENT ROW (Projects & Tasks) - MOVED TO MIDDLE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Projects Table */}
        <div className={`xl:col-span-2 border rounded-[2rem] p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col min-h-[500px] ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-10">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.ongoingProjects}</h2>
            <div className="flex gap-2">
                 <button onClick={() => setViewFilter('all')} className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${viewFilter === 'all' ? 'bg-[#BEF264] text-black border-[#BEF264]' : 'border-slate-500/20 text-slate-500'}`}>ALL</button>
                 <button onClick={() => setViewFilter('active')} className={`px-3 py-1 text-[10px] font-bold rounded-full border transition-all ${viewFilter === 'active' ? 'bg-[#BEF264] text-black border-[#BEF264]' : 'border-slate-500/20 text-slate-500'}`}>ACTIVE</button>
                 <button onClick={() => setIsNewProjectModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/10 ml-2"><Plus size={12} /> {t.addProject}</button>
            </div>
          </div>
          <div className="overflow-x-auto relative z-10 flex-1">
            {visibleProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 min-h-[200px]"><Package size={32} className="mb-2 opacity-50" /><p className="text-sm">{t.noProjects}</p></div>
            ) : (
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-500/10">
                    <th className="pb-4 pl-2">{t.project}</th>
                    <th className="pb-4">{t.status}</th>
                    <th className="pb-4 hidden sm:table-cell">{t.deadline}</th>
                    <th className="pb-4 w-1/4">{t.progress}</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {visibleProjects.slice(0, 6).map((project, i) => (
                    <tr key={project.id} onClick={() => setSelectedProject(project)} className={`group transition-colors border-b last:border-0 border-slate-500/5 cursor-pointer ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        <td className="py-5 pl-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${isDark ? 'bg-[#1A1F2C] border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{project.name.substring(0, 2).toUpperCase()}</div>
                                <div><p className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{project.name}</p><p className="text-[10px] text-slate-500 font-medium">{project.client}</p></div>
                            </div>
                        </td>
                        <td className="py-5"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : project.status === 'modeling' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{project.status.toUpperCase()}</span></td>
                        <td className="py-5 hidden sm:table-cell text-xs font-mono text-slate-500">{project.deadline}</td>
                        <td className="py-5 pr-2">
                             <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500"><span>{project.progress}%</span><span className="hidden sm:inline">{getProjectTotalHours(project)}h</span></div>
                             <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#1A1F2C]' : 'bg-slate-100'}`}><div className={`h-full rounded-full ${project.status === 'completed' ? 'bg-emerald-500' : 'bg-[#BEF264]'}`} style={{ width: `${project.progress}%` }} /></div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
          </div>
        </div>

        {/* Right Column: Task Widget */}
        <div className={`border rounded-[2rem] p-6 shadow-xl flex flex-col h-full relative overflow-hidden min-h-[500px] ${isDark ? 'bg-[#11141A] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6 z-10">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.todoList}</h2>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-500" />
                    <select value={taskProjectFilter} onChange={(e) => setTaskProjectFilter(e.target.value)} className={`text-[10px] p-1.5 rounded-lg outline-none border cursor-pointer ${isDark ? 'bg-[#1A1F2C] border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                        <option value="all">ALL</option>
                        {projects.filter(p => p.isActive).map(p => (<option key={p.id} value={p.id}>{p.name.substring(0, 10)}...</option>))}
                    </select>
                </div>
            </div>
            <div className="space-y-3 z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500"><CheckSquare size={32} className="mb-2 opacity-50" /><p className="text-xs">{t.noTasks}</p></div>
                ) : (
                    filteredTasks.map((task, i) => (
                    <div key={`${task.projectId}-${task.id}`} className={`p-4 rounded-xl border transition-all group cursor-pointer hover:translate-x-1 ${isDark ? 'bg-[#1A1F2C] border-white/5 hover:border-[#BEF264]/30' : 'bg-slate-50 border-slate-200 hover:border-[#BEF264]'}`} onClick={() => toggleTaskCompletion(task.projectId, task.id)}>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-red-500/10 text-red-400' : task.priority === 'high' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>{task.priority}</span>
                            <span className="text-[9px] font-bold truncate max-w-[80px] text-slate-500">{task.projectName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? 'bg-[#BEF264] border-[#BEF264]' : 'border-slate-500'}`}>{task.completed && <CheckCircle size={12} className="text-black" />}</div>
                            <div className="overflow-hidden"><h4 className={`text-sm font-bold mb-0.5 truncate transition-colors ${task.completed ? 'line-through text-slate-500' : isDark ? 'text-white group-hover:text-[#BEF264]' : 'text-slate-900 group-hover:text-black'}`}>{task.title}</h4><p className="text-[10px] text-slate-500">{task.dueDate}</p></div>
                        </div>
                    </div>
                    ))
                )}
            </div>
        </div>
      </div>

      {/* 4. CHARTS ROW (Visual Analysis) - MOVED TO BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[340px]">
              <InteractiveChart data={chartData.hours} labels={chartData.labels} color="green" title={t.teamPerformance} totalValue={`${chartData.totalHoursLast6M}`} subtitle="Hours" isDark={isDark} unit="h" />
          </div>
          <div className="h-[340px]">
              <InteractiveChart data={chartData.deliveries} labels={chartData.labels} color="blue" title={t.completedProjects} totalValue={chartData.totalDeliveredLast6M} subtitle="Units" isDark={isDark} />
          </div>
      </div>
      
      {/* --- MODALS (Copied from original to ensure functionality) --- */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsNewProjectModalOpen(false)}>
          <div className={`w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-scale-in ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`absolute top-0 right-0 w-[200px] h-[200px] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/10' : 'bg-[#BEF264]/20'}`} />
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6"><h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.addProject}</h3><button onClick={() => setIsNewProjectModalOpen(false)} className="text-slate-500 hover:text-red-400"><X size={24} /></button></div>
              <div className="space-y-4">
                <div><label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.projectName}</label><input type="text" value={newProjectForm.name} onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                <div><label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.clientName}</label><input type="text" value={newProjectForm.client} onChange={(e) => setNewProjectForm({...newProjectForm, client: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div>
                <div className="flex gap-4"><div className="flex-1"><label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.lodLevel}</label><input type="text" value={newProjectForm.lod} onChange={(e) => setNewProjectForm({...newProjectForm, lod: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div><div className="flex-1"><label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">{t.deadline}</label><input type="date" value={newProjectForm.deadline} onChange={(e) => setNewProjectForm({...newProjectForm, deadline: e.target.value})} className={`w-full p-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} /></div></div>
                <button onClick={handleCreateQuickProject} disabled={!newProjectForm.name} className="w-full mt-4 py-4 rounded-2xl bg-[#BEF264] hover:bg-[#a3d954] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg shadow-lg">{t.saveProject}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedProject(null)}>
          <div className={`w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2 ${isDark ? 'bg-[#BEF264]/10' : 'bg-[#BEF264]/20'}`} />
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1"><h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.name}</h2>{!selectedProject.isActive && <span className="px-2 py-1 rounded bg-slate-500/10 border border-slate-500/20 text-slate-500 text-xs font-bold uppercase tracking-wider">{t.inactiveState}</span>}</div>
                        <p className="text-slate-500 text-lg">{selectedProject.client}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedProject.status !== 'completed' && <button onClick={() => handleDeliverProject(selectedProject.id)} className="bg-[#BEF264] hover:bg-[#a3d954] text-black text-xs font-bold py-2 px-4 rounded-full flex items-center gap-2 shadow-lg"><Package size={14} />{lang === 'pt' ? 'Entregar' : 'Deliver'}</button>}
                        <button onClick={() => setSelectedProject(null)} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}><X size={24} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-4"><span className="text-slate-500 text-sm font-bold uppercase">{t.status}</span><span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedProject.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{selectedProject.status.toUpperCase()}</span></div>
                        <div className="flex justify-between items-center"><span className="text-slate-500 text-sm font-bold uppercase">{t.lodLevel}</span><span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.lod}</span></div>
                    </div>
                    <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0B0E14]/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                        <div className="flex justify-between items-center mb-4"><span className="text-slate-500 text-sm font-bold uppercase">{t.deadline}</span><span className={`font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProject.deadline}</span></div>
                        <div><div className="flex justify-between text-xs text-slate-500 mb-1"><span>{t.progress}</span><span>{selectedProject.progress}%</span></div><div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}><div className={`h-full rounded-full ${selectedProject.status === 'completed' ? 'bg-emerald-500' : 'bg-[#BEF264]'}`} style={{ width: `${selectedProject.progress}%` }} /></div></div>
                    </div>
                </div>
                
                {/* Time Tracking Section */}
                <div className="mb-8 border-b border-dashed border-slate-700 pb-8">
                   <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Timer size={18} />{t.workLog}</h3><span className="text-sm font-mono font-bold text-[#BEF264]">{getProjectTotalHours(selectedProject)}h {t.accumulatedHours}</span></div>
                   <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                         <div className="flex-1 w-full"><label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.date}</label><input type="date" value={logForm.date} onChange={(e) => setLogForm({...logForm, date: e.target.value})} className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`} /></div>
                         <div className="w-full sm:w-24"><label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.hours}</label><input type="number" min="0.5" step="0.5" placeholder="0.0" value={logForm.hours} onChange={(e) => setLogForm({...logForm, hours: e.target.value})} className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`} /></div>
                         <div className="w-full sm:w-auto"><button onClick={handleAddWorkLog} disabled={!logForm.hours || !logForm.date} className="w-full sm:w-auto h-[42px] px-4 rounded-lg bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={16} />{t.addTime}</button></div>
                      </div>
                   </div>
                   {selectedProject.workLogs && selectedProject.workLogs.length > 0 && <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">{selectedProject.workLogs.map(log => <div key={log.id} className={`flex justify-between items-center p-2 mb-1 rounded text-sm ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}><div><span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{log.date}</span><span className="text-xs text-slate-500 ml-2">{log.description}</span></div><span className="font-bold font-mono">{log.hours}h</span></div>)}</div>}
                </div>

                {/* Notes Section */}
                <div className="mb-8 border-b border-dashed border-slate-700 pb-8">
                   <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><MessageSquare size={18} />{t.observations}</h3></div>
                   <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex gap-3 items-start"><div className="flex-1 w-full"><textarea rows={2} placeholder={t.notePlaceholder} value={noteForm.content} onChange={(e) => setNoteForm({...noteForm, content: e.target.value})} className={`w-full p-2.5 rounded-lg border text-sm outline-none resize-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`} /></div><button onClick={handleAddNote} disabled={!noteForm.content} className="h-[42px] px-4 rounded-lg bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={16} /><span className="hidden sm:inline">{t.addNote}</span></button></div>
                   </div>
                   {selectedProject.notes && selectedProject.notes.length > 0 ? <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">{selectedProject.notes.map(note => <div key={note.id} className={`flex justify-between items-start p-3 rounded-lg border relative group ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-white border-slate-100'}`}><div className="w-full"><div className="flex justify-between items-center"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{new Date(note.timestamp).toLocaleString()}</span><button onClick={() => handleDeleteNote(note.id)} className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button></div><p className={`text-sm whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{note.content}</p></div></div>)}</div> : <p className="text-slate-500 text-sm italic">{t.noNotes}</p>}
                </div>
                
                {/* Tasks Section */}
                <div className="mb-8">
                   <div className="flex justify-between items-center mb-4"><h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><CheckSquare size={18} />{t.tasks}</h3></div>
                   <div className={`p-4 rounded-xl border mb-4 ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex flex-col sm:flex-row gap-3 items-end">
                         <div className="flex-1 w-full"><label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.taskTitle}</label><input type="text" value={taskForm.title} onChange={(e) => setTaskForm({...taskForm, title: e.target.value})} className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`} /></div>
                         <div className="w-full sm:w-32"><label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">{t.priority}</label><select value={taskForm.priority} onChange={(e) => setTaskForm({...taskForm, priority: e.target.value as any})} className={`w-full p-2.5 rounded-lg border text-sm outline-none ${isDark ? 'bg-[#151A23] border-slate-700 text-white' : 'bg-white border-slate-200'}`}><option value="low">{t.priorityLow}</option><option value="medium">{t.priorityMedium}</option><option value="high">{t.priorityHigh}</option><option value="urgent">{t.priorityUrgent}</option></select></div>
                         <div className="w-full sm:w-auto"><button onClick={handleAddTask} disabled={!taskForm.title} className="w-full sm:w-auto h-[42px] px-4 rounded-lg bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={16} />{t.addTask}</button></div>
                      </div>
                   </div>
                   {selectedProject.tasks && selectedProject.tasks.length > 0 ? <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-2">{selectedProject.tasks.map(task => <div key={task.id} className={`flex justify-between items-center p-3 rounded-lg border transition-all ${isDark ? 'bg-[#0B0E14]/30 border-white/5 hover:bg-white/5' : 'bg-white border-slate-100 hover:bg-slate-50'}`}><div className="flex items-center gap-3"><button onClick={() => toggleTaskCompletion(selectedProject.id, task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`}>{task.completed && <CheckCircle size={14} className="text-white" />}</button><div className="flex flex-col"><span className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : isDark ? 'text-white' : 'text-slate-900'}`}>{task.title}</span><span className="text-xs text-slate-500">{task.priority} - {task.dueDate}</span></div></div><button onClick={() => deleteTask(task.id)} className="text-slate-500 hover:text-red-400 p-1"><Trash2 size={16} /></button></div>)}</div> : <p className="text-slate-500 text-sm italic">{t.noTasks}</p>}
                </div>

                {/* Team Members */}
                <div>
                    <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}><Briefcase size={18} />{t.team}</h3>
                    {selectedProject.teamMembers.length === 0 ? <p className="text-slate-500 text-sm italic">No members assigned.</p> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{selectedProject.teamMembers.map(mid => { const m = members.find(x => x.id === mid); if (!m) return null; return <div key={mid} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-[#0B0E14]/30 border-white/5' : 'bg-white border-slate-100'}`}><div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-white text-slate-700'}`}>{m.name.substring(0, 1)}</div><div><p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{m.name}</p><p className="text-xs text-slate-500">{m.role}</p></div></div> })}</div>}
                </div>
            </div>
          </div>
        </div>
      )}

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-in ${isDark ? 'bg-[#151A23] border border-white/10' : 'bg-white border border-slate-200'}`}>
             <div className="flex justify-between items-center mb-6"><h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.reportSettings}</h3><button onClick={() => setIsReportModalOpen(false)} className="text-slate-500 hover:text-red-400"><X size={24} /></button></div>
             <div className="space-y-6">
                <div><label className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3"><Filter size={16} />{t.dateRange}</label><div className="flex gap-4"><div className="flex-1"><span className="text-xs text-slate-500 mb-1 block">{t.startDate}</span><input type="date" value={reportFilters.startDate} onChange={(e) => setReportFilters({...reportFilters, startDate: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div><div className="flex-1"><span className="text-xs text-slate-500 mb-1 block">{t.endDate}</span><input type="date" value={reportFilters.endDate} onChange={(e) => setReportFilters({...reportFilters, endDate: e.target.value})} className={`w-full p-3 rounded-xl outline-none border ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} /></div></div></div>
                <div><label className="flex items-center gap-2 text-sm font-bold text-slate-500 mb-3"><Filter size={16} />{t.selectProjects}</label><div className={`max-h-40 overflow-y-auto p-2 rounded-xl border ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>{projects.map(p => (<div key={p.id} onClick={() => toggleProjectSelection(p.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer mb-1 transition-colors ${reportFilters.selectedProjectIds.includes(p.id) ? 'bg-[#BEF264]/20 text-[#BEF264]' : 'hover:bg-white/5 text-slate-400'}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${reportFilters.selectedProjectIds.includes(p.id) ? 'bg-[#BEF264] border-[#BEF264]' : 'border-slate-500'}`}>{reportFilters.selectedProjectIds.includes(p.id) && <div className="w-2 h-2 bg-black rounded-sm" />}</div><span className="text-sm font-medium">{p.name}</span></div>))}</div></div>
                <button onClick={generatePDF} className="w-full py-4 rounded-xl bg-[#BEF264] hover:bg-[#a3d954] text-black font-bold text-lg shadow-lg flex items-center justify-center gap-2"><FileDown size={20} />{t.downloadPDF}</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};