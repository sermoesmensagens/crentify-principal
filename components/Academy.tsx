import React, { useState, useEffect } from 'react';
import { AcademyContent, AcademyCategory, AcademyReflection, AcademyProgress, AcademyCourse } from '../types';
import { Play, FileText, Search, GraduationCap, X, MessageCircle, Zap, Info, Loader2, Sparkles, Send, Lock, EyeOff, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Calendar, StopCircle, RefreshCw, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { useAcademy } from '../contexts/AcademyContext';

const Academy: React.FC = () => {
  const {
    courses, content, categories, reflections,
    setReflections, progress, setProgress
  } = useAcademy();
  const { session } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  
  const [selectedLesson, setSelectedLesson] = useState<AcademyContent | null>(null);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);

  const [reflectionText, setReflectionText] = useState('');

  // Estados Acordeão e Timer
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const userEmail = session?.user?.email;
  const isCurrentUserAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  // Auto-expandir a primeira semana ao abrir um curso
  useEffect(() => {
    if (selectedCourse) {
      const courseLessons = content.filter(l => l.courseId === selectedCourse.id).sort((a,b) => (a.week||'').localeCompare(b.week||''));
      if (courseLessons.length > 0 && courseLessons[0].week) {
        setExpandedWeeks([courseLessons[0].week]);
      } else {
        setExpandedWeeks(['Semana 1']);
      }
    }
  }, [selectedCourse, content]);

  // Hook do Timer
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

  const toggleWeek = (week: string) => {
    setExpandedWeeks(prev => prev.includes(week) ? prev.filter(w => w !== week) : [...prev, week]);
  };

  const getEmbedUrl = (url?: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` 
      : url;
  };

  const filteredCourses = courses.filter(course => {
    const matchesCategory = activeCategory === 'all' || course.categoryId === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          course.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSaveReflection = () => {
    const activeResource = selectedLesson?.resources?.find(r => r.id === activeResourceId);
    if (!selectedLesson || !activeResource || !reflectionText.trim()) return;
    
    const newRef: AcademyReflection = {
      id: Date.now().toString(),
      contentId: activeResource.id, // now points to the resource ID
      title: activeResource.title,
      text: reflectionText,
      date: new Date().toISOString()
    };
    
    setReflections([newRef, ...reflections]);
    setReflectionText('');
  };

  const getCourseThumbnail = (course: AcademyCourse) => {
    if (course.thumbnailUrl) return course.thumbnailUrl;
    return `https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000`;
  };

  const getCategoryTheme = (categoryId: string) => {
    const defaultTheme = {
      gradient: 'from-brand/20 to-transparent',
      border: 'border-brand/20',
      text: 'text-brand',
      bg: 'bg-brand/10'
    };

    if (!categories) return defaultTheme;

    const themes: Record<string, any> = {
      '1': { gradient: 'from-amber-500/20 to-amber-900/10', border: 'border-amber-500/20', text: 'text-amber-500', bg: 'bg-amber-500/10' },
      '2': { gradient: 'from-rose-500/20 to-rose-900/10', border: 'border-rose-500/20', text: 'text-rose-500', bg: 'bg-rose-500/10' },
      '3': { gradient: 'from-purple-500/20 to-purple-900/10', border: 'border-purple-500/20', text: 'text-purple-500', bg: 'bg-purple-500/10' }
    };

    return themes[categoryId] || defaultTheme;
  };

  const toggleResourceCompletion = (resourceId: string) => {
    const isCompleted = progress.completedLessons.includes(resourceId);
    let updated;
    if (isCompleted) {
      updated = progress.completedLessons.filter(id => id !== resourceId);
    } else {
      updated = [...progress.completedLessons, resourceId];
    }
    setProgress({ ...progress, completedLessons: updated });
  };

  const courseLessons = selectedCourse ? content.filter(l => l.courseId === selectedCourse.id) : [];
  
  // Calculate total resources and completed resources for progressBar
  const totalResources = courseLessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0);
  const completedResources = courseLessons.reduce((acc, l) => acc + (l.resources?.filter(r => progress.completedLessons.includes(r.id)).length || 0), 0);
  const progressPercent = totalResources === 0 ? 0 : Math.round((completedResources / totalResources) * 100);

  const activeResource = selectedLesson?.resources?.find(r => r.id === activeResourceId);

  return (
    <div className="h-full flex flex-col pt-24 md:pt-0">
      <div className="flex-1 flex overflow-hidden">
        
        {/* Course View (Active Course) */}
        {selectedCourse ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header da Visão de Curso */}
            <div className="bg-brand/5 p-6 rounded-[40px] border border-brand/10 mb-4 flex flex-col md:flex-row gap-6 items-center shrink-0">
              <button 
                onClick={() => { setSelectedCourse(null); setExpandedWeeks([]); }} 
                className="w-12 h-12 bg-[#0b0e14] border border-white/5 rounded-2xl flex items-center justify-center hover:bg-brand/20 hover:text-brand transition-all flex-shrink-0"
              >
                <X size={20} />
              </button>
              <img src={getCourseThumbnail(selectedCourse)} className="w-24 h-24 md:w-28 md:h-28 rounded-[32px] object-cover shadow-2xl border border-white/10" alt={selectedCourse.title} />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{selectedCourse.title}</h2>
                <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{selectedCourse.description}</p>
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-center min-w-[200px] shadow-inner">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Seu Progresso</p>
                  <p className="text-xl font-black text-brand tracking-tighter shadow-brand/20 drop-shadow-md">
                    {progressPercent}%
                  </p>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-brand to-[#9d5cff] shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2 hover:text-gray-400 transition-colors">
                  {completedResources} de {totalResources} Concluídas
                </p>
              </div>
            </div>

            {/* Lista Acordeão de Semanas e Dias */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10 space-y-6">
              {(() => {
                // Group by Week
                const groupedByWeek = courseLessons.reduce((acc, lesson) => {
                  const w = lesson.week || 'Semana 1';
                  if (!acc[w]) acc[w] = [];
                  acc[w].push(lesson);
                  return acc;
                }, {} as Record<string, AcademyContent[]>);

                const dayOrder = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo', 'Dom'];

                // Sort weeks numerically
                const sortedWeekNames = Object.keys(groupedByWeek).sort((a, b) => {
                  const numA = parseInt(a.replace(/\D/g, '')) || 0;
                  const numB = parseInt(b.replace(/\D/g, '')) || 0;
                  return numA - numB;
                });

                return sortedWeekNames.map(weekName => {
                  const lessons = groupedByWeek[weekName];
                  
                  // Sort lessons within the week by dayOrder
                  const sortedDayLessons = [...lessons].sort((a, b) => {
                    const indexA = dayOrder.findIndex(d => (a.day || '').includes(d));
                    const indexB = dayOrder.findIndex(d => (b.day || '').includes(d));
                    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
                  });

                  const isExpanded = expandedWeeks.includes(weekName);
                  const isWeekComplete = (lessons.reduce((acc, l) => acc + (l.resources?.filter(r => progress.completedLessons.includes(r.id)).length || 0), 0) === lessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0)) && lessons.length > 0;

                  return (
                  <div key={weekName} className={`border rounded-[32px] overflow-hidden mb-6 transition-all duration-300 shadow-2xl ${isExpanded ? 'bg-[#161b22] border-brand/20' : 'bg-[#0b0e14] border-white/5 hover:border-white/10'}`}>
                    <div onClick={() => toggleWeek(weekName)} className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg transition-colors ${isWeekComplete ? 'bg-emerald-500/10 text-emerald-500' : 'bg-brand/10 text-brand'}`}>
                          {isWeekComplete ? <CheckCircle2 size={24} /> : <GraduationCap size={20} />}
                        </div>
                        <div>
                          <h3 className={`text-xl font-black uppercase tracking-tighter transition-colors ${isExpanded ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{weekName}</h3>
                          {lessons.length > 0 && (
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
                              {lessons.length} dias • {lessons.reduce((a,b)=>a+(b.resources?.length||0),0)} tarefas
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`transition-all duration-300 ${isExpanded ? 'text-white rotate-180' : 'text-gray-500'}`}>
                        <ChevronDown size={24} />
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-6 pt-0 space-y-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        {lessons.map(dayBlock => (
                          <div key={dayBlock.id} className="bg-[#0b0e14]/50 border border-white/5 rounded-[32px] overflow-hidden p-6 hover:border-brand/10 transition-colors shadow-inner">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="p-2 bg-brand/10 rounded-xl shadow-inner border border-brand/20">
                                <Calendar className="text-brand" size={16} />
                              </div>
                              <h4 className="text-[14px] font-black text-white uppercase tracking-tighter">
                                {dayBlock.day ? `${dayBlock.day}${dayBlock.title ? ` • ${dayBlock.title}` : ''}` : (dayBlock.title || 'Dia de Estudo')}
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {(dayBlock.resources || []).map(resource => {
                                const isResComplete = progress.completedLessons.includes(resource.id);
                                return (
                                <div key={resource.id} className={`flex items-center justify-between p-4 rounded-[20px] transition-all group cursor-pointer ${isResComplete ? 'bg-white/5 border border-white/5' : 'bg-[#161b22] border border-white/10 hover:border-brand/50 hover:shadow-[0_0_15px_rgba(var(--brand-rgb),0.1)]'}`} onClick={() => toggleResourceCompletion(resource.id)}>
                                  <div className="flex items-center gap-4 flex-1 pr-4">
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isResComplete ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-gray-600 group-hover:border-brand'}`}>
                                      {isResComplete && <CheckCircle2 size={14} strokeWidth={4} />}
                                    </div>
                                    <span className={`text-[12px] md:text-[14px] font-black uppercase tracking-tight line-clamp-2 transition-colors ${isResComplete ? 'text-gray-600 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                      {resource.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    {resource.duration && (
                                      <span className="hidden md:flex text-[9px] font-black text-brand uppercase px-4 py-2 rounded-full border border-brand/20 bg-brand/5 whitespace-nowrap shadow-inner">
                                        {resource.duration}
                                      </span>
                                    )}
                                    <button 
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setActiveResourceId(resource.id); 
                                        setSelectedLesson(dayBlock); 
                                        setTimerSeconds(0); 
                                        setIsTimerRunning(false); 
                                      }} 
                                      className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 ${isResComplete ? 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10' : 'bg-brand text-white hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(var(--brand-rgb),0.3)]'}`}
                                    >
                                      <Eye size={14} /> VER
                                    </button>
                                  </div>
                                </div>
                              )})}
                              {(!dayBlock.resources || dayBlock.resources.length === 0) && (
                                <p className="text-[10px] text-gray-600 font-bold uppercase py-2 text-center bg-white/5 rounded-xl border border-white/5">Nenhuma tarefa cadastrada neste dia.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Cabecalho de Boas-vindas (Listagem de Cursos) */}
            <div className="bg-brand/5 p-8 rounded-[40px] border border-brand/10 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/20 rounded-full blur-3xl mix-blend-screen opacity-50 blur-anim" />
              <div className="relative z-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Desperte seu Chamado</h1>
                <p className="text-gray-400 font-medium">Cursos e treinamentos profundos para Crentify.</p>
              </div>
              <div className="relative z-10 w-full md:w-auto flex items-center bg-[#0b0e14] border border-white/10 rounded-[28px] px-6 py-4 shadow-xl">
                <Search size={20} className="text-gray-500 mr-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Explorar cursos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="bg-transparent text-white font-medium outline-none w-full md:w-64 placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Listagem Global de Categorias/Cursos */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-12 pb-10">
              {(categories || [{ id: '1', title: 'Fundamentos', color: '#ff5c5c' }, { id: '2', title: 'Liderança', color: '#5cff8a' }]).map(cat => {
                const catCourses = filteredCourses.filter(c => c.categoryId === cat.id);
                if (catCourses.length === 0) return null;
                const theme = getCategoryTheme(cat.id);

                return (
                  <div key={cat.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${theme.bg} ${theme.text} ${theme.border} shadow-lg`}>
                        <Sparkles size={20} />
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">{cat.title}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catCourses.map(course => (
                        <div 
                          key={course.id} 
                          onClick={() => setSelectedCourse(course)}
                          className={`bg-[#0b0e14]/80 border border-white/5 rounded-[32px] p-6 hover:bg-brand/5 hover:border-brand/30 transition-all cursor-pointer group flex flex-col h-full transform hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(var(--brand-rgb),0.15)] relative overflow-hidden`}
                        >
                          {course.visibility === 'privado' && !isCurrentUserAdmin && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col justify-center items-center rounded-[32px]">
                              <Lock size={32} className="text-gray-400 mb-2" />
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Em Breve</p>
                            </div>
                          )}

                          <div className="aspect-[4/3] rounded-[24px] overflow-hidden mb-6 relative shadow-lg">
                            <img src={getCourseThumbnail(course)} alt={course.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute bottom-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 text-white/90">
                              <Play size={16} fill="currentColor" />
                            </div>
                          </div>
                          
                          <div className="flex-1 flex flex-col p-2">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight mb-2 group-hover:text-brand transition-colors line-clamp-2">{course.title}</h4>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1">{course.description}</p>
                            
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                {content.filter(l => l.courseId === course.id).reduce((a, b) => a + (b.resources?.length || 0), 0)} Tarefas
                              </span>
                              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 group-hover:bg-brand group-hover:text-white group-hover:border-brand transition-all">
                                <ChevronDown size={16} className="-rotate-90" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-20 bg-black/20 rounded-[40px] border border-white/5">
                  <EyeOff size={48} className="text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Nenhum curso encontrado</h3>
                  <p className="text-gray-500">Tente buscar por um tema diferente ou remova o filtro.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE TAREFA / RECURSO ("VER") */}
      {selectedLesson && activeResource && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-6 bg-black/95 backdrop-blur-2xl animate-in zoom-in-95 fade-in duration-300">
          <div className="bg-[#161b22] w-full max-w-4xl h-full md:max-h-[90vh] rounded-[40px] md:rounded-[48px] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
            
            {/* Header com tipo de tarefa */}
            <div className="p-6 md:p-8 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-[#0b0e14] to-[#161b22] flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand border border-brand/20 shadow-xl shadow-brand/10">
                  {activeResource.type === 'leitura' ? <FileText size={24} /> : activeResource.type === 'video' ? <Play size={24} fill="currentColor" /> : <Zap size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter line-clamp-1">{activeResource.title}</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedLesson.week} • {selectedLesson.day || selectedLesson.title}</p>
                </div>
              </div>
              <button 
                onClick={() => { setActiveResourceId(null); setSelectedLesson(null); setIsTimerRunning(false); }} 
                className="w-12 h-12 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo Rolável da Tarefa */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 space-y-10">
              
              {/* Cronômetro */}
              <div className="bg-[#0b0e14]/80 border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-full translate-y-1/2 pointer-events-none opacity-50"></div>
                
                <div className={`text-6xl md:text-8xl font-black tracking-tighter tabular-nums leading-none mb-8 ${isTimerRunning ? 'text-brand drop-shadow-[0_0_15px_rgba(var(--brand-rgb),0.5)]' : 'text-gray-400'} transition-all`}>
                  {formatTime(timerSeconds)}
                </div>
                
                <div className="flex items-center gap-4 relative z-10">
                  {isTimerRunning ? (
                    <button onClick={() => setIsTimerRunning(false)} className="px-8 py-4 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20">
                      <StopCircle size={16} fill="currentColor"/> PAUSAR
                    </button>
                  ) : (
                    <button onClick={() => setIsTimerRunning(true)} className="px-8 py-4 bg-brand text-white shadow-[0_0_20px_rgba(var(--brand-rgb),0.4)] rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                      <Play size={16} fill="currentColor" /> {timerSeconds > 0 ? 'RETOMAR TEMPO' : 'INICIAR TEMPO'}
                    </button>
                  )}
                  <button onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} className="w-14 h-14 bg-white/5 text-gray-500 rounded-2xl flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors border border-white/5 group" title="Zerar Cronômetro">
                    <RefreshCw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
                  </button>
                </div>
              </div>

              {/* Instruções */}
              {activeResource.instruction && (
                <div className="bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 p-8 rounded-[32px] shadow-lg">
                  <h4 className="flex items-center gap-3 text-[11px] font-black text-brand uppercase tracking-[0.3em] mb-4">
                    <Info size={18} /> COMO FAZER
                  </h4>
                  <div className="text-gray-200 text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap">{activeResource.instruction}</div>
                </div>
              )}

              {/* Renderização de Mídia / Texto Dinâmico */}
              {activeResource.type === 'video' && activeResource.url && (
                <div className="w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/10 bg-black aspect-video relative group">
                  <div className="absolute inset-0 bg-brand/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  <iframe src={getEmbedUrl(activeResource.url)} className="w-full h-full relative z-10" frameBorder="0" allowFullScreen></iframe>
                </div>
              )}

              {(activeResource.type === 'text' || activeResource.type === 'leitura') && activeResource.content && (
                <div className="bg-[#0b0e14]/60 border border-white/10 rounded-[32px] px-8 py-10 shadow-inner max-w-full">
                  <div className="text-gray-100 text-lg md:text-xl leading-relaxed font-medium whitespace-pre-wrap">
                    {activeResource.content}
                  </div>
                </div>
              )}

              {activeResource.type === 'link' && activeResource.url && (
                <div className="py-10 flex flex-col items-center justify-center">
                  <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="bg-[#0b0e14] border border-white/10 text-white px-12 py-6 rounded-3xl font-black uppercase tracking-[0.3em] hover:bg-brand hover:border-brand hover:text-white transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(var(--brand-rgb),0.3)] flex items-center gap-3">
                    <Zap size={20} className="text-brand group-hover:text-white" />
                    ACESSAR LINK EXTERNO
                  </a>
                </div>
              )}

              {/* Área de Anotações ("Suas Anotações") */}
              <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                <label className="flex items-center gap-3 text-[11px] font-black text-gray-500 uppercase tracking-[0.3em]">
                  <MessageCircle size={18} className="text-brand" /> Suas Anotações e Respostas
                </label>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-b from-brand/20 to-transparent rounded-[32px] blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <textarea
                    value={reflectionText}
                    onChange={e => setReflectionText(e.target.value)}
                    placeholder="Escreva aqui tudo o que chamou sua atenção, anote suas respostas das tarefas ou insights do dia..."
                    className="w-full h-48 bg-[#0b0e14] border border-white/5 rounded-[32px] p-8 text-white font-medium text-sm md:text-base focus:ring-2 focus:ring-brand/30 outline-none resize-none placeholder:text-gray-800 italic font-serif leading-relaxed"
                  />
                </div>
              </div>

            </div>

            {/* Footer de Ação ("CONCLUIR TAREFA") */}
            <div className="p-6 md:p-8 border-t border-white/5 bg-[#0b0e14] flex-shrink-0 z-10 shadow-[0_-20px_30px_rgba(0,0,0,0.5)]">
              <button 
                onClick={() => {
                  if (reflectionText.trim()) handleSaveReflection();
                  if (!progress.completedLessons.includes(activeResource.id)) {
                    toggleResourceCompletion(activeResource.id);
                  }
                  setActiveResourceId(null);
                  setSelectedLesson(null);
                  setIsTimerRunning(false);
                }} 
                className={`w-full py-6 md:py-8 rounded-[32px] font-black uppercase flex items-center justify-center gap-4 text-xs md:text-sm tracking-[0.4em] transition-all transform hover:translate-y-[-2px] ${
                  progress.completedLessons.includes(activeResource.id) 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                    : 'bg-gradient-to-r from-brand to-[#9d5cff] text-white shadow-[0_15px_30px_rgba(var(--brand-rgb),0.4)] hover:shadow-[0_20px_40px_rgba(var(--brand-rgb),0.6)]'
                }`}
              >
                {progress.completedLessons.includes(activeResource.id) ? (
                  <><CheckCircle2 size={24} strokeWidth={3} /> TAREFA CONCLUÍDA</>
                ) : (
                  <><CheckCircle2 size={24} strokeWidth={3} /> CONCLUIR TAREFA E AVANÇAR</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Academy;
