import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Branding, Language, Theme } from '../types';
import { translations } from '../translations';

interface SettingsProps {
  branding: Branding;
  setBranding: (branding: Branding) => void;
  lang: Language;
  theme: Theme;
}

export const Settings: React.FC<SettingsProps> = ({ branding, setBranding, lang, theme }) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [localBranding, setLocalBranding] = useState<Branding>(branding);

  const handleSave = () => {
    setBranding(localBranding);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="text-center mb-10">
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.whiteLabelSettings}</h2>
        <p className="text-slate-400">Customize the look and feel of your CRM.</p>
      </div>

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
    </div>
  );
};