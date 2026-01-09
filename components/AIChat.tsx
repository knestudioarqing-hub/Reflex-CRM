import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { generateAIResponse } from '../services/geminiService';
import { Language, Project } from '../types';
import { translations } from '../translations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  lang: Language;
  projects: Project[];
}

export const AIChat: React.FC<AIChatProps> = ({ lang, projects }) => {
  const t = translations[lang];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: lang === 'pt' ? 'Olá! Eu sou o Reflex AI. Como posso ajudar com seus projetos BIM hoje?' : 'Hello! I am Reflex AI. How can I assist with your BIM projects today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const projectContext = projects.map(p => `${p.name} (${p.status}, ${p.progress}%)`).join(', ');
    const context = `Current Projects: ${projectContext}. Language Preference: ${lang}`;

    const response = await generateAIResponse(userMsg, context);

    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-[#151A23]/80 backdrop-blur-md border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-[#151A23]/90">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">{t.aiAssistant}</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online - Gemini 1.5 Pro
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-purple-600 to-blue-600'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-slate-700 text-white rounded-tr-none' 
                : 'bg-[#0B0E14] border border-white/10 text-slate-300 rounded-tl-none shadow-lg'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
               <Bot size={16} className="text-white" />
            </div>
            <div className="bg-[#0B0E14] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none text-xs text-purple-400 animate-pulse">
              {t.aiThinking}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-[#0B0E14]/50 border-t border-white/5">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.aiPromptPlaceholder}
            className="w-full bg-[#151A23] border border-slate-700 rounded-xl pl-4 pr-12 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 w-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white shadow-lg disabled:opacity-50 hover:scale-105 transition-transform"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
