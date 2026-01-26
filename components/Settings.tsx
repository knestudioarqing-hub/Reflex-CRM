import React, { useState } from 'react';
import { Save, Download, Upload, Copy, CheckCircle } from 'lucide-react';
import { Branding, Language, Theme, Project, Member, BackupData } from '../types';
import { translations } from '../translations';

interface SettingsProps {
  branding: Branding;
  setBranding: (branding: Branding) => void;
  lang: Language;
  theme: Theme;
  // Added props for export/import
  projects?: Project[];
  members?: Member[];
  setProjects?: React.Dispatch<React.SetStateAction<Project[]>>;
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
}

export const Settings: React.FC<SettingsProps> = ({ 
  branding, setBranding, lang, theme, 
  projects = [], members = [], setProjects, setMembers 
}) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [localBranding, setLocalBranding] = useState<Branding>(branding);
  
  // Data Export/Import States
  const [importString, setImportString] = useState('');
  const [exportString, setExportString] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = () => {
    setBranding(localBranding);
  };

  const handleExport = () => {
    const data: BackupData = {
      projects,
      members,
      branding: localBranding,
      theme,
      lang,
      timestamp: Date.now()
    };
    const jsonString = JSON.stringify(data);
    setExportString(jsonString);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportString).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleImport = () => {
    try {
      if (!importString) return;
      const data: BackupData = JSON.parse(importString);
      
      // Basic validation
      if (data.projects && Array.isArray(data.projects) && setProjects) {
        setProjects(data.projects);
      }
      if (data.members && Array.isArray(data.members) && setMembers) {
        setMembers(data.members);
      }
      if (data.branding) {
        setBranding(data.branding);
        setLocalBranding(data.branding);
      }
      
      setImportStatus('success');
      setImportString(''); // Clear after success
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch (error) {
      console.error("Import Error:", error);
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center mb-10">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.whiteLabelSettings}</h2>
        <p className="text-slate-400">Customize the look and feel of your CRM.</p>
      </div>

      {/* Visual Settings */}
      <div className={`backdrop-blur-md border rounded-3xl p-5 md:p-8 shadow-xl space-y-6 ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.brandName}</label>
          <input
            type="text"
            value={localBranding.companyName}
            onChange={(e) => setLocalBranding({ ...localBranding, companyName: e.target.value })}
            className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.brandColor}</label>
          <div className="flex gap-4 items-center">
            <input
              type="color"
              value={localBranding.primaryColor}
              onChange={(e) => setLocalBranding({ ...localBranding, primaryColor: e.target.value })}
              className="h-12 w-24 bg-transparent cursor-pointer rounded-lg border-none"
            />
            <input
              type="text"
              value={localBranding.primaryColor}
              onChange={(e) => setLocalBranding({ ...localBranding, primaryColor: e.target.value })}
              className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 font-mono ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.uploadLogo}</label>
          <input
            type="text"
            placeholder="https://example.com/logo.png"
            value={localBranding.logoUrl || ''}
            onChange={(e) => setLocalBranding({ ...localBranding, logoUrl: e.target.value })}
            className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-all ${isDark ? 'bg-[#0B0E14] border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'}`}
          />
          <p className="mt-2 text-xs text-slate-500">Paste a direct image URL for the sidebar logo.</p>
        </div>

        <div className="pt-6">
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
          >
            <Save size={20} />
            {t.saveSettings}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className={`backdrop-blur-md border rounded-3xl p-8 text-center opacity-75 ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
        <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Preview</h3>
        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg border ${isDark ? 'bg-[#0B0E14] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            {localBranding.logoUrl && <img src={localBranding.logoUrl} className="w-6 h-6 object-contain" />}
            <span style={{ color: localBranding.primaryColor }} className="font-bold">{localBranding.companyName}</span>
        </div>
      </div>

      {/* Data Management Section (Export/Import) */}
      <div className={`backdrop-blur-md border rounded-3xl p-5 md:p-8 shadow-xl space-y-6 mt-10 ${isDark ? 'bg-[#151A23]/80 border-white/5' : 'bg-white/80 border-slate-200'}`}>
         <div>
            <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
               <Download size={20} /> {t.dataManagement}
            </h3>
            <p className="text-slate-400 text-sm mb-6">Sync your data between devices manually.</p>
         </div>

         {/* Export */}
         <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className={`font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.exportData}</h4>
            <p className="text-xs text-slate-500 mb-4">{t.exportDescription}</p>
            
            {!exportString ? (
               <button 
                  onClick={handleExport}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${isDark ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
               >
                  Generate Data Code
               </button>
            ) : (
               <div className="space-y-2">
                  <textarea 
                     readOnly
                     value={exportString}
                     className={`w-full h-24 p-3 rounded-lg text-xs font-mono resize-none outline-none border ${isDark ? 'bg-[#151A23] border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600'}`}
                  />
                  <button 
                     onClick={handleCopy}
                     className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                     {copySuccess ? <CheckCircle size={14} /> : <Copy size={14} />}
                     {copySuccess ? 'Copied!' : t.copyToClipboard}
                  </button>
               </div>
            )}
         </div>

         {/* Import */}
         <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0B0E14] border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <h4 className={`font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.importData}</h4>
            <p className="text-xs text-slate-500 mb-4">{t.importDescription}</p>
            
            <textarea 
               value={importString}
               onChange={(e) => setImportString(e.target.value)}
               placeholder="Paste data code here..."
               className={`w-full h-24 p-3 rounded-lg text-xs font-mono resize-none outline-none border mb-4 ${isDark ? 'bg-[#151A23] border-slate-700 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400'}`}
            />
            
            <div className="flex items-center justify-between">
               <button 
                  onClick={handleImport}
                  disabled={!importString}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
               >
                  <Upload size={16} />
                  {t.loadData}
               </button>
               
               {importStatus === 'success' && <span className="text-emerald-500 text-xs font-bold animate-pulse">{t.importSuccess}</span>}
               {importStatus === 'error' && <span className="text-red-500 text-xs font-bold">{t.importError}</span>}
            </div>
         </div>
      </div>
    </div>
  );
};