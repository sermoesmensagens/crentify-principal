
import React, { useState, useEffect } from 'react';
import { ReadingPlan, ReadingPlanCategory, AcademyResource, ReadingPlanContent } from '../types';
import { 
  Sparkles, 
  Search, 
  Send, 
  X, 
  BookOpen, 
  ChevronDown, 
  CheckCircle2, 
  Calendar, 
  Eye, 
  Zap, 
  ChevronRight,
  Target,
  Clock,
  Layout,
  MessageCircle
} from 'lucide-react';
import { useReadingPlans } from '../contexts/ReadingPlanContext';
import { useBible } from '../contexts/BibleContext';
import { useDataContext } from '../contexts/DataContext';
import { Section } from '../types';
import { useRef } from 'react';
import { StopCircle, Play, RefreshCw, Check } from 'lucide-react';

interface ReadingPlansProps {
  setActiveSection: (section: Section) => void;
}

const ReadingPlanIcon = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M4 22v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    <path d="M10 14h4v8h-4z" />
    <path d="M12 14v8" />
  </svg>
);

const ReadingPlans: React.FC<ReadingPlansProps> = ({ setActiveSection }) => {
  const { plans, setPlans, planContent, setPlanContent, categories, progress, setProgress } = useReadingPlans();
  const { setSelectedBookName, setSelectedChapterIndex } = useBible();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Embedded Reader states
  const { bibleData } = useDataContext();
  const [readingResource, setReadingResource] = useState<{
    resource: AcademyResource,
    planId: string,
    bookName: string,
    chapterIndex: number
  } | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const modalScrollRef = useRef<HTMLDivElement>(null);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const filteredPlans = plans.filter(plan => {
    const matchesCategory = activeCategory === 'all' || plan.categoryId === activeCategory;
    const matchesSearch = plan.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBibleNavigation = (resource: AcademyResource, planId: string) => {
    const text = resource.title;
    const match = text.match(/^((?:\d\s)?[^\d:]+)\s(\d+)/i);
    
    if (match) {
      const bookName = match[1].trim();
      const chapter = parseInt(match[2]);
      
      if (!isNaN(chapter)) {
        setReadingResource({
             resource,
             planId,
             bookName,
             chapterIndex: chapter - 1
        });
        setTimerSeconds(0);
        setIsTimerRunning(true);

        // Scroll to top of modal if it was open
        if (modalScrollRef.current) {
          modalScrollRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
      }
    }
  };

  const toggleWeek = (week: string) => {
    setExpandedWeeks(prev => prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]);
  };

  const getPlanProgress = (planId: string) => {
    const planDays = planContent.filter(c => c.planId === planId);
    const totalRes = planDays.reduce((acc, d) => acc + (d.resources?.length || 0), 0);
    if (totalRes === 0) return 0;
    
    const completedResCount = (progress[planId]?.completedResources || []).length;
    return Math.round((completedResCount / totalRes) * 100);
  };

  const toggleResourceCompletion = (planId: string, resourceId: string) => {
    const currentProgress = progress[planId] || { completedResources: [] };
    const isCompleted = currentProgress.completedResources.includes(resourceId);
    
    let updatedResources;
    if (isCompleted) {
      updatedResources = currentProgress.completedResources.filter(id => id !== resourceId);
    } else {
      updatedResources = [...currentProgress.completedResources, resourceId];
    }
    
    setProgress({
      ...progress,
      [planId]: { ...currentProgress, completedResources: updatedResources }
    });
  };

  if (showQuiz) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-[#161b22] w-full max-w-2xl border border-white/5 rounded-[48px] p-10 md:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Sparkles size={120} className="text-brand" />
          </div>
          
          <button onClick={() => setShowQuiz(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>

          {quizStep === 0 && (
            <div className="space-y-8 text-center animate-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-brand/10 border border-brand/20 rounded-[32px] flex items-center justify-center text-brand mx-auto shadow-xl shadow-brand/10">
                    <Sparkles size={40} />
                </div>
                <div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Seu Mentor Espiritual</h2>
                    <p className="text-gray-400 font-medium text-lg leading-relaxed">Shalom! Deixe-me preparar uma jornada sob medida para o seu momento atual. O que o seu coração busca hoje?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Disciplina e Oração', 'Superando Ansiedade', 'Vencendo Vícios', 'Sabedoria Profissional', 'Relacionamentos', 'Conhecendo a Deus'].map(topic => (
                        <button 
                            key={topic}
                            onClick={() => { setQuizAnswers({ ...quizAnswers, focus: topic }); setQuizStep(1); }}
                            className="bg-[#0b0e14] border border-white/10 hover:border-brand/40 hover:bg-brand/5 p-6 rounded-3xl text-sm font-black text-white uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 text-left flex justify-between items-center group"
                        >
                            {topic}
                            <ChevronRight size={18} className="text-gray-700 group-hover:text-brand" />
                        </button>
                    ))}
                </div>
            </div>
          )}

          {quizStep === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand">
                        <Clock size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Disponibilidade</h3>
                </div>
                <p className="text-gray-400 font-medium">Quanto tempo você deseja dedicar por dia à sua leitura?</p>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        { label: 'Rápido (5-10 min)', value: 'fast' },
                        { label: 'Médio (20-30 min)', value: 'medium' },
                        { label: 'Imersivo (45+ min)', value: 'deep' }
                    ].map(opt => (
                        <button 
                            key={opt.value}
                            onClick={() => { setQuizAnswers({ ...quizAnswers, time: opt.value }); setQuizStep(2); }}
                            className="bg-[#0b0e14] border border-white/10 hover:border-brand/40 hover:bg-brand/5 p-6 rounded-3xl text-sm font-black text-white uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 text-left"
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>
          )}

          {quizStep === 2 && (
            <div className="space-y-10 text-center animate-in zoom-in duration-700">
                {isGenerating ? (
                    <div className="py-20 flex flex-col items-center gap-6">
                        <div className="w-24 h-24 relative">
                            <div className="absolute inset-0 border-4 border-brand/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                            <Sparkles size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Consultando as Escrituras...</h3>
                            <p className="text-gray-500 font-medium uppercase text-[10px] tracking-[0.3em] animate-pulse">O Espírito sopra onde quer.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] flex items-center justify-center text-emerald-500 mx-auto shadow-xl shadow-emerald-500/10">
                            <Target size={40} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Tudo Pronto!</h2>
                            <p className="text-gray-400 font-medium">Seu plano focado em <span className="text-brand">"{quizAnswers.focus}"</span> está pronto para ser gerado.</p>
                        </div>
                        <button 
                            onClick={async () => {
                                setIsGenerating(true);
                                // Simulação de delay da IA
                                await new Promise(r => setTimeout(r, 3000));
                                
                                const newId = `ai-plan-${Date.now()}`;
                                const focus = quizAnswers.focus || 'Conhecendo a Deus';
                                
                                // Criar o Plano
                                const newAiPlan: ReadingPlan = {
                                    id: newId,
                                    title: `Jornada: ${focus}`,
                                    description: `Um plano personalizado gerado pelo Mentor IA para ajudar você em seu momento de "${focus}".`,
                                    durationDays: 7,
                                    categoryId: "3", // IA Personalizado
                                    isAiGenerated: true,
                                    visibility: 'público',
                                    thumbnailUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop',
                                    createdAt: new Date().toISOString()
                                };

                                // Criar o Conteúdo do Plano (7 dias baseados no tema)
                                const topics: Record<string, string[]> = {
                                    'Superando Ansiedade': ['Filipenses 4', 'Mateus 6', 'Salmos 23', 'João 14', 'Salmos 34', '1 Pedro 5', 'Salmos 121'],
                                    'Vencendo Vícios': ['Romanos 6', 'Gálatas 5', '1 Coríntios 6', 'Tiago 4', 'Salmos 51', 'Romanos 12', 'Colossenses 3'],
                                    'Disciplina e Oração': ['Mateus 26', 'Lucas 11', '1 Tessalonicenses 5', 'Daniel 6', 'Efésios 6', 'Mateus 7', 'Marcos 1'],
                                    'default': ['Gênesis 1', 'João 1', 'Salmos 1', 'Provérbios 1', 'Mateus 5', 'Romanos 8', 'Apocalipse 21']
                                };

                                const selectedVerses = topics[focus] || topics['default'];
                                
                                const newAiPlanContent: ReadingPlanContent[] = selectedVerses.map((verse, idx) => ({
                                    id: `content-${newId}-${idx}`,
                                    planId: newId,
                                    week: 'Semana 1',
                                    day: `Dia ${idx + 1}`,
                                    title: `Meditando em ${verse}`,
                                    resources: [
                                        { id: `res-${newId}-${idx}-1`, type: 'leitura', title: `${verse} (${idx === 0 ? '5-10 min' : '1 cap'})`, duration: '1 cap', instruction: 'Leia com calma e ore sobre este capítulo.' }
                                    ]
                                }));

                                setPlans([newAiPlan, ...plans]);
                                setPlanContent([...planContent, ...newAiPlanContent]);
                                
                                setIsGenerating(false);
                                setShowQuiz(false);
                                setQuizStep(0);
                                setSelectedPlan(newAiPlan); // Abre o plano gerado imediatamente
                            }}
                            className="w-full bg-brand text-white py-6 rounded-[32px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(var(--brand-rgb),0.3)] hover:scale-[1.02] active:scale-95 transition-all text-sm"
                        >
                            Gerar Meu Plano Agora
                        </button>
                    </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    const planDays = planContent.filter(c => c.planId === selectedPlan.id);
    const groupedByWeek = planDays.reduce((acc, content) => {
        const w = content.week || 'Semana 1';
        if (!acc[w]) acc[w] = [];
        acc[w].push(content);
        return acc;
    }, {} as Record<string, ReadingPlanContent[]>);

    // Sort days within each week
    Object.keys(groupedByWeek).forEach(week => {
        groupedByWeek[week].sort((a, b) => {
            const numA = parseInt(a.day.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.day.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
    });

    const sortedWeeks = Object.keys(groupedByWeek).sort((a,b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    const progressPct = getPlanProgress(selectedPlan.id);

    return (
      <div className="flex flex-col pt-24 md:pt-0 animate-in fade-in duration-500 pb-20">
        {/* Header do Plano */}
        <div className="bg-brand/5 p-6 rounded-[40px] border border-brand/10 mb-8 flex flex-col md:flex-row gap-6 items-center shrink-0">
          <button 
            onClick={() => { setSelectedPlan(null); setExpandedWeeks([]); }} 
            className="w-12 h-12 bg-[#0b0e14] border border-white/5 rounded-2xl flex items-center justify-center hover:bg-brand/20 hover:text-brand transition-all flex-shrink-0"
          >
            <X size={20} />
          </button>
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-[32px] bg-[#0b0e14] border border-white/5 overflow-hidden shadow-2xl relative flex items-center justify-center">
            {selectedPlan.thumbnailUrl ? (
                <img src={selectedPlan.thumbnailUrl} className="w-full h-full object-cover" alt="" />
            ) : (
                <ReadingPlanIcon size={40} className="text-gray-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{selectedPlan.title}</h2>
            <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{selectedPlan.description}</p>
          </div>
          <div className="bg-black/40 p-6 rounded-[32px] border border-white/5 text-center min-w-[200px] shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Sua Jornada</p>
              <p className="text-xl font-black text-brand tracking-tighter">{progressPct}%</p>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2">
              {progress[selectedPlan.id]?.completedResources.length || 0} de {planDays.reduce((a,b)=>a+(b.resources?.length||0),0)} Concluídas
            </p>
          </div>
        </div>

        {/* Lista Acordeão */}
        <div className="space-y-4 pb-20">
            {sortedWeeks.map(weekName => {
                const isExpanded = expandedWeeks.includes(weekName);
                const weekContent = groupedByWeek[weekName];
                
                return (
                    <div key={weekName} className={`border rounded-[32px] overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-[#161b22] border-brand/20' : 'bg-[#0b0e14] border-white/5 hover:border-white/10'}`}>
                        <div onClick={() => toggleWeek(weekName)} className="p-6 flex items-center justify-between cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter">{weekName}</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{weekContent.length} Dias de Leitura</p>
                                </div>
                            </div>
                            <ChevronDown size={24} className={`text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                        </div>

                        {isExpanded && (
                            <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-top-2 duration-300">
                                {weekContent.map(day => (
                                    <div key={day.id} className="bg-black/20 border border-white/5 rounded-[24px] p-6">
                                        <h4 className="text-[12px] font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-brand"></div>
                                            {day.day} • {day.title}
                                        </h4>
                                        <div className="space-y-3">
                                            {day.resources.map(res => {
                                                const isDone = (progress[selectedPlan.id]?.completedResources || []).includes(res.id);
                                                return (
                                                    <div key={res.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all ${isDone ? 'bg-white/5 border-emerald-500/10' : 'bg-[#161b22] border-white/5 hover:border-brand/30'}`}>
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <button 
                                                                onClick={() => toggleResourceCompletion(selectedPlan.id, res.id)}
                                                                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-700 hover:border-brand'}`}
                                                            >
                                                                {isDone && <CheckCircle2 size={14} strokeWidth={4}/>}
                                                            </button>
                                                            <div>
                                                                <span className={`text-sm font-black uppercase tracking-tight ${isDone ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                                                                    {res.title}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-4 md:mt-0">
                                                            <button 
                                                                onClick={() => handleBibleNavigation(res, selectedPlan.id)}
                                                                className="flex-1 md:flex-none px-6 py-2.5 bg-brand/10 text-brand border border-brand/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all flex items-center justify-center gap-2 font-noto"
                                                            >
                                                                <BookOpen size={14} /> LER NO PLANO
                                                            </button>
                                                            <button className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pt-24 md:pt-0 animate-in fade-in duration-500 pb-20">
      {/* Header com IA */}
      <div className="bg-gradient-to-br from-brand/20 via-brand/5 to-transparent p-10 md:p-14 rounded-[48px] border border-brand/10 mb-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 blur-xl group-hover:scale-110 transition-transform duration-1000">
            <Sparkles size={200} className="text-brand" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 text-brand font-black uppercase text-[10px] tracking-[0.4em] mb-6 animate-pulse">
                <Sparkles size={16} /> NOVIDADE: MENTOR ESPIRITUAL
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-4 leading-none">O que o seu coração <span className="text-brand accent-text">busca hoje?</span></h1>
            <p className="text-gray-400 text-lg font-medium mb-8 leading-relaxed">Crie uma jornada personalizada de leitura e oração baseada nas suas necessidades atuais com o auxílio da nossa Inteligência Artificial.</p>
            <button 
                onClick={() => setShowQuiz(true)}
                className="bg-brand text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-[0.3em] text-xs shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
                GERAR PLANO COM IA <ChevronRight size={18} />
            </button>
        </div>
      </div>

      {/* Listagem de Planos */}
      <div className="flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <ReadingPlanIcon size={24} className="text-brand" /> Planos de Leitura
            </h2>
            <div className="flex w-full md:w-auto items-center bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-3 shadow-inner">
                <Search size={18} className="text-gray-600 mr-4" />
                <input 
                    type="text" 
                    placeholder="Buscar plano..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none outline-none text-white font-black text-sm uppercase tracking-tighter w-full md:w-48 placeholder:text-gray-800"
                />
            </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-none">
            <button 
                onClick={() => setActiveCategory('all')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === 'all' ? 'bg-brand text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
                Todos
            </button>
            {categories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-brand text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                    {cat.name}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredPlans.map(plan => {
                const progressPct = getPlanProgress(plan.id);
                const isCompleted = progressPct === 100;

                return (
                    <div 
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className="bg-[#0b0e14] border border-white/5 rounded-[40px] p-6 hover:border-brand/40 hover:bg-brand/5 transition-all cursor-pointer group relative overflow-hidden"
                    >
                        <div className="aspect-[16/10] bg-[#161b22] rounded-[32px] mb-6 overflow-hidden relative border border-white/5">
                            {plan.thumbnailUrl ? (
                                <img src={plan.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-800">
                                    <ReadingPlanIcon size={64} />
                                </div>
                            )}
                            <div className="absolute top-4 left-4">
                                <span className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest text-white border border-white/10">
                                    {plan.durationDays} DIAS
                                </span>
                            </div>
                            {plan.isAiGenerated && (
                                <div className="absolute top-4 right-4">
                                    <div className="bg-brand/20 backdrop-blur-md p-2 rounded-xl border border-brand/30 text-brand">
                                        <Sparkles size={16} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-brand transition-colors line-clamp-1">{plan.title}</h3>
                            <p className="text-xs text-gray-500 font-medium line-clamp-2 h-8">{plan.description}</p>
                            
                            {/* Progress info */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Progresso</span>
                                    <span className="text-[10px] font-black text-brand tracking-tighter">{progressPct}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-brand shadow-[0_0_10px_rgba(var(--brand-rgb),0.3)]'}`}
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[8px] font-black text-gray-700 uppercase tracking-widest mt-2">
                                <span>{categories.find(c => c.id === plan.categoryId)?.name}</span>
                                <div className="flex items-center gap-1 group-hover:text-brand transition-colors">
                                    CONTINUAR <ChevronRight size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}

            {filteredPlans.length === 0 && (
                <div className="col-span-full py-20 bg-black/20 rounded-[48px] border border-dashed border-white/5 text-center flex flex-col items-center gap-4">
                    <ReadingPlanIcon size={48} className="text-gray-800" />
                    <div className="text-gray-600 uppercase text-[10px] font-black tracking-widest">Nenhum plano encontrado</div>
                    <button onClick={() => { setActiveCategory('all'); setSearchTerm(''); }} className="text-brand text-xs font-black uppercase hover:underline">Limpar filtros</button>
                </div>
            )}
        </div>
      </div>
      {/* Leitor Embutido Modal */}
      {readingResource && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0b0e14]/95 backdrop-blur-3xl" onClick={() => { setReadingResource(null); setIsTimerRunning(false); }}></div>
          
          <div className="bg-[#161b22] w-full max-w-4xl h-full md:max-h-[90vh] rounded-[40px] md:rounded-[48px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
            <div className="p-6 md:p-10 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                    {readingResource.bookName} {readingResource.chapterIndex + 1}
                  </h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Leitura do Plano</p>
                </div>
              </div>
              <button 
                onClick={() => { setReadingResource(null); setIsTimerRunning(false); }}
                className="w-12 h-12 bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all group"
              >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div 
              ref={modalScrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-14 space-y-10"
            >
              {/* Timer Block */}
              <div className="bg-[#0b0e14]/80 border border-white/5 rounded-[32px] p-6 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden max-w-sm mx-auto">
                <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-full translate-y-1/2 pointer-events-none opacity-50"></div>
                <div className={`text-4xl font-black tracking-tighter tabular-nums leading-none mb-4 ${isTimerRunning ? 'text-brand' : 'text-gray-600'} transition-all`}>
                  {formatTime(timerSeconds)}
                </div>
                <div className="flex items-center gap-3 relative z-10">
                  <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`px-5 py-2.5 rounded-xl font-black text-[9px] tracking-[0.2em] uppercase transition-all flex items-center gap-2 ${isTimerRunning ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                    {isTimerRunning ? <><StopCircle size={14} /> PAUSAR</> : <><Play size={14} fill="currentColor" /> RETOMAR</>}
                  </button>
                  <button onClick={() => setTimerSeconds(0)} className="w-10 h-10 bg-white/5 text-gray-500 rounded-xl flex items-center justify-center hover:text-white transition-colors border border-white/5">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Bible Content */}
              <div className="max-w-2xl mx-auto space-y-8 pb-20">
                {(() => {
                  const book = bibleData?.books.find(b => b.name.toLowerCase() === readingResource.bookName.toLowerCase());
                  const chapter = book?.chapters[readingResource.chapterIndex];
                  
                  if (!chapter) return (
                    <div className="text-center py-20 bg-black/20 rounded-[32px] border border-white/5">
                      <p className="text-gray-500 font-black uppercase tracking-widest text-xs">Capítulo não encontrado ou carregando...</p>
                    </div>
                  );

                  return chapter.verses.map((v, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <span className="text-brand font-black text-xs pt-1 opacity-40 group-hover:opacity-100 transition-opacity">{v.number}</span>
                      <p className="text-lg md:text-xl text-gray-300 font-serif leading-relaxed tracking-wide">
                        {v.text}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="p-6 md:p-8 bg-black/40 backdrop-blur-2xl border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="hidden md:flex items-center gap-3 text-gray-500">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Tempo sugerido: {readingResource.resource.duration || '1 cap'}</span>
              </div>
              <button 
                onClick={() => {
                  toggleResourceCompletion(readingResource.planId, readingResource.resource.id);
                  setReadingResource(null);
                  setIsTimerRunning(false);
                }}
                className="w-full md:w-auto px-12 py-5 bg-brand text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                CONCLUIR LEITURA <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingPlans;
