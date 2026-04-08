
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { getMentorResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MentorAI: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Shalom! Sou seu Mentor IA. Como posso guiar sua jornada espiritual ou profissional hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await getMentorResponse(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: response || 'Houve uma interrupção na conexão celestial. Tente novamente.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com o Mentor. Verifique sua conexão.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-in fade-in duration-700 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <Bot size={42} className="text-brand" />
            Mentor IA
          </h1>
          <p className="text-c-text-secondary mt-2 font-medium">Conselhamento teológico e estratégico com base bíblica.</p>
        </div>
      </header>

      <div className="flex-1 bg-brand-card rounded-[48px] border border-white/5 shadow-2xl flex flex-col overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none">
          <Sparkles size={200} className="text-brand" />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar relative z-10">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex gap-5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border transition-all ${
                  m.role === 'user' ? 'bg-brand border-brand text-white' : 'bg-brand-bg border-white/10 text-brand'
                }`}>
                  {m.role === 'user' ? <User size={20} strokeWidth={3} /> : <Bot size={20} strokeWidth={3} />}
                </div>
                <div className={`p-7 rounded-2xl text-base leading-relaxed shadow-xl border ${
                  m.role === 'user' 
                    ? 'bg-brand/20 border-brand/30 text-white rounded-tr-none' 
                    : 'bg-brand-bg/50 border-white/5 text-gray-300 rounded-tl-none font-medium'
                }`}>
                  {m.content.split('\n').map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-4' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-brand/5 border border-brand/20 p-5 rounded-3xl flex items-center gap-3 text-brand">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-[10px] font-extrabold uppercase tracking-widest">Buscando sabedoria nas escrituras...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-black/20 border-t border-white/5 flex gap-4 backdrop-blur-md">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida teológica ou profissional..."
            className="flex-1 bg-brand-bg border border-white/5 text-white rounded-2xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-brand/30 font-bold placeholder:text-c-text-muted transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="accent-gradient text-white w-16 h-16 rounded-2xl accent-gradient-hover flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-xl shadow-brand/30"
          >
            <Send size={24} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorAI;
