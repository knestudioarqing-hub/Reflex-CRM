import React, { useState } from 'react';
import { User, Plus, Trash2, Briefcase, Edit2, Check } from 'lucide-react';
import { Member, Project, Language, Theme, HistoryEntry } from '../types';
import { translations } from '../translations';

interface MembersProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  lang: Language;
  theme: Theme;
}

export const Members: React.FC<MembersProps> = ({ members, setMembers, projects, setProjects, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [isFormOpen, setIsFormOpen] = useState(false);
  // FormData stores the member details and a list of project IDs they are assigned to
  const [formData, setFormData] = useState<{
    id: string;
    name: string;
    role: string;
    projectIds: string[];
  }>({ id: '', name: '', role: '', projectIds: [] });

  const createHistoryEntry = (details: string): HistoryEntry => ({
    id: Date.now().toString(),
    action: 'updated',
    details,
    timestamp: new Date().toISOString(),
    user: 'Gianfranco'
  });

  const handleOpenAdd = () => {
    setFormData({ id: '', name: '', role: '', projectIds: [] });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    // Find all projects where this member is listed in teamMembers
    const memberProjectIds = projects
      .filter(p => p.teamMembers.includes(member.id))
      .map(p => p.id);
    
    setFormData({
      id: member.id,
      name: member.name,
      role: member.role,
      projectIds: memberProjectIds
    });
    setIsFormOpen(true);
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.role) return;
    
    const memberId = formData.id || Date.now().toString();
    const member: Member = {
      id: memberId,
      name: formData.name,
      role: formData.role,
    };

    // 1. Update Members List
    if (formData.id) {
      setMembers(members.map(m => m.id === memberId ? member : m));
    } else {
      setMembers([...members, member]);
    }

    // 2. Update Projects (Sync Bi-directionally) with History Logging
    const updatedProjects = projects.map(p => {
      const isSelected = formData.projectIds.includes(p.id);
      const isCurrentlyAssigned = p.teamMembers.includes(memberId);
      
      let newProjectData = { ...p };
      let changed = false;
      let logDetail = '';

      if (isSelected && !isCurrentlyAssigned) {
        // Add member to project
        newProjectData.teamMembers = [...p.teamMembers, memberId];
        logDetail = `Assigned ${member.name} (${member.role})`;
        changed = true;
      } else if (!isSelected && isCurrentlyAssigned) {
        // Remove member from project
        newProjectData.teamMembers = p.teamMembers.filter(id => id !== memberId);
        logDetail = `Removed ${member.name}`;
        changed = true;
      }

      if (changed) {
        const historyEntry = createHistoryEntry(logDetail);
        newProjectData.history = [historyEntry, ...(newProjectData.history || [])];
        return newProjectData;
      }
      return p;
    });

    setProjects(updatedProjects);
    
    setFormData({ id: '', name: '', role: '', projectIds: [] });
    setIsFormOpen(false);
  };

  const handleDeleteMember = (id: string) => {
    const memberName = members.find(m => m.id === id)?.name || 'Member';
    if (window.confirm('Are you sure? This will remove the member from all projects.')) {
        setMembers(members.filter(m => m.id !== id));
        // Cleanup project references and log
        setProjects(projects.map(p => {
            if (p.teamMembers.includes(id)) {
                const historyEntry = createHistoryEntry(`Member ${memberName} deleted and removed from team`);
                return {
                    ...p,
                    teamMembers: p.teamMembers.filter(mId => mId !== id),
                    history: [historyEntry, ...(p.history || [])]
                };
            }
            return p;
        }));
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setFormData(prev => {
        if (prev.projectIds.includes(projectId)) {
            return { ...prev, projectIds: prev.projectIds.filter(id => id !== projectId) };
        } else {
            return { ...prev, projectIds: [...prev.projectIds, projectId] };
        }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.members}</h2>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} />
          {t.addMember}
        </button>
      </div>

      {isFormOpen && (
        <div className={`backdrop-blur-md border rounded-3xl p-5 md:p-8 shadow-2xl mb-8 animate-fade-in max-w-2xl mx-auto ${isDark ? 'bg-[#151A23]/90 border-white/5' : 'bg-white/90 border-slate-200'}`}>
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.id ? t.edit : t.addMember}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">{t.name}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                placeholder="e.g. Sarah Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">{t.role}</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                placeholder="e.g. BIM Coordinator"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-400 mb-3">{t.assignedProjects}</label>
            {projects.length === 0 ? (
                <div className={`p-4 rounded-xl border border-dashed text-sm text-center ${isDark ? 'bg-[#0B0E14] border-slate-700 text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-500'}`}>
                    {t.noProjects}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {projects.map(project => (
                        <div 
                            key={project.id}
                            onClick={() => toggleProjectSelection(project.id)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                formData.projectIds.includes(project.id)
                                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600 dark:text-white'
                                : isDark ? 'bg-[#0B0E14] border-slate-700 text-slate-400 hover:border-slate-500' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                formData.projectIds.includes(project.id)
                                ? 'bg-emerald-500 border-emerald-500'
                                : isDark ? 'border-slate-600' : 'border-slate-300'
                            }`}>
                                {formData.projectIds.includes(project.id) && <Check size={14} className="text-white" />}
                            </div>
                            <span className="text-sm font-medium truncate">{project.name}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <div className={`flex justify-end gap-3 border-t pt-6 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
            <button
              onClick={() => setIsFormOpen(false)}
              className={`px-6 py-2.5 rounded-xl transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveMember}
              disabled={!formData.name || !formData.role}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 font-medium"
            >
              {t.saveMember}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.length === 0 ? (
          <div className={`col-span-full py-20 text-center rounded-3xl border flex flex-col items-center ${isDark ? 'bg-[#151A23]/50 border-white/5 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
            <User size={48} className="mb-4 opacity-50" />
            <p>{t.noMembers}</p>
          </div>
        ) : (
          members.map((member) => {
            const assignedCount = projects.filter(p => p.teamMembers.includes(member.id)).length;
            
            return (
                <div key={member.id} className={`backdrop-blur-md border rounded-2xl p-6 group transition-all shadow-lg ${isDark ? 'bg-[#151A23]/80 border-white/5 hover:border-emerald-500/30' : 'bg-white border-slate-200 hover:border-emerald-500'}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-inner ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                            {member.name.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{member.name}</h3>
                            <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                <Briefcase size={12} />
                                <span>{member.role}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`mb-6 pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">{t.assignedProjects}</p>
                    <div className="flex flex-wrap gap-2">
                        {assignedCount === 0 ? (
                            <span className="text-xs text-slate-600 italic">None</span>
                        ) : (
                            projects
                                .filter(p => p.teamMembers.includes(member.id))
                                .slice(0, 3)
                                .map(p => (
                                    <span key={p.id} className={`px-2 py-1 rounded text-xs border ${isDark ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {p.name}
                                    </span>
                                ))
                        )}
                        {assignedCount > 3 && (
                            <span className={`px-2 py-1 rounded text-xs text-slate-500 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                                +{assignedCount - 3}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => handleOpenEdit(member)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
                        title={t.edit}
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => handleDeleteMember(member.id)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
                        title={t.delete}
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                </div>
            );
          })
        )}
      </div>
    </div>
  );
};