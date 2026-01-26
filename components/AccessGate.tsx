import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Globe, CheckCircle, Wifi, Lock } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { getPublicIP } from '../services/storageService';

interface AccessGateProps {
  onAccessGranted: (key: string) => void;
  lang: Language;
}

export const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted, lang }) => {
  const t = translations[lang];
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'detecting' | 'linking' | 'success'>('input');
  const [detectedIP, setDetectedIP] = useState('');

  const handleConnect = async () => {
    if (!key.trim()) return;
    
    setLoading(true);
    setStep('detecting');

    // Simulate Network Operations
    try {
        const ip = await getPublicIP();
        setDetectedIP(ip);
        
        // Artificial delays to simulate the "Linking" process described by the user
        setTimeout(() => {
            setStep('linking');
            setTimeout(() => {
                setStep('success');
                setTimeout(() => {
                    onAccessGranted(key);
                }, 1000);
            }, 1500);
        }, 1500);

    } catch (e) {
        setDetectedIP('Offline Mode');
        setStep('success');
        setTimeout(() => onAccessGranted(key), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050608] text-white overflow-hidden font-sans">
      
      {/* Background Cyberpunk Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-500" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 animate-scale-in">
         {/* Logo/Icon */}
         <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#0B0E14] border border-white/10 flex items-center justify-center shadow-2xl shadow-emerald-500/20 relative group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield size={40} className={`text-white transition-all duration-500 ${loading ? 'scale-90 opacity-50' : 'scale-100'}`} />
                {loading && (
                    <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-2xl animate-ping" />
                )}
            </div>
         </div>

         {/* Content Container */}
         <div className="bg-[#151A23]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
            
            {step === 'input' && (
                <div className="animate-fade-in space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-2">{t.accessRequired}</h2>
                        <p className="text-slate-400 text-sm">{t.enterAccessKey}</p>
                    </div>

                    <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input 
                            type="number"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                            placeholder={t.accessKeyPlaceholder}
                            className="w-full bg-[#0B0E14] border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
                            autoFocus
                        />
                    </div>

                    <button 
                        onClick={handleConnect}
                        disabled={!key}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Lock size={18} />
                        {t.initializeSystem}
                    </button>
                </div>
            )}

            {step === 'detecting' && (
                <div className="flex flex-col items-center justify-center py-8 animate-fade-in text-center space-y-4">
                    <div className="relative">
                        <Globe size={48} className="text-blue-500 animate-pulse" />
                        <div className="absolute inset-0 border-t-2 border-blue-400 rounded-full animate-spin" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t.detectingIP}</h3>
                        <p className="text-xs text-slate-500 font-mono mt-1">Scanning network interfaces...</p>
                    </div>
                </div>
            )}

            {step === 'linking' && (
                <div className="flex flex-col items-center justify-center py-8 animate-fade-in text-center space-y-4">
                    <div className="relative">
                        <Wifi size={48} className="text-emerald-500" />
                        <div className="absolute -top-2 -right-2 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">{t.secureConnection}</h3>
                        <p className="text-xs text-emerald-400 font-mono mt-1">IP: {detectedIP}</p>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 animate-fade-in text-center space-y-4">
                     <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                        <CheckCircle size={32} className="text-emerald-400" />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white">{t.accessGranted}</h3>
                        <p className="text-sm text-slate-400">{t.connectionEstablished}</p>
                    </div>
                </div>
            )}

         </div>
         
         <div className="text-center mt-6">
             <p className="text-[10px] text-slate-600 uppercase tracking-[0.2em]">Reflex Secure Gate v4.0</p>
         </div>
      </div>
    </div>
  );
};