import React from 'react';
import { Branding, Language } from '../types';

interface SplashScreenProps {
  branding: Branding;
  lang: Language;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ branding, lang }) => {
  const t = {
    en: {
      available: "4.0 is now available",
      headline: "All-in-one Platform to Simplify",
      headlineHighlight: "Your BIM Workflow",
      subtitle: "Harness the power of AI and advanced modeling data for seamless project coordination.",
      poweredBy: "Powered by Reflex Engine"
    },
    pt: {
      available: "4.0 já está disponível",
      headline: "Plataforma Tudo-em-um para Simplificar",
      headlineHighlight: "Seu Fluxo de Trabalho BIM",
      subtitle: "Gestor de projetos BIM",
      poweredBy: "Desenvolvido por Reflex Engine"
    }
  };

  const text = t[lang] || t.pt; // Default fallback to PT if needed, though lang prop drives it.

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050608] text-white overflow-hidden">
      
      {/* Ambient Background Effects */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-500" />
      
      {/* Grid Pattern Overlay - White Lines */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        
        {/* Pill Badge */}
        <div className="animate-slide-up mb-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
            {branding.companyName} {text.available}
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="animate-slide-up delay-100 text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          {text.headline} <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
            {text.headlineHighlight}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-slide-up delay-200 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 font-light">
          {text.subtitle}
        </p>

        {/* Loading Indicator */}
        <div className="animate-slide-up delay-300 w-full max-w-xs h-1 bg-white/5 rounded-full overflow-hidden mt-8">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 animate-[loading_3s_ease-in-out_forwards] w-0" style={{ animationName: 'widthGrow' }} />
        </div>
        
        {/* Inline style for the specific width animation */}
        <style>{`
          @keyframes widthGrow {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>

      </div>
      
      {/* Footer Branding */}
      <div className="animate-slide-up delay-500 absolute bottom-10 text-center">
        <p className="text-xs text-slate-600 tracking-[0.2em] uppercase font-semibold">{text.poweredBy}</p>
      </div>
    </div>
  );
};