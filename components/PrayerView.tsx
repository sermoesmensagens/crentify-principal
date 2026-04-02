import React, { useState, useEffect } from 'react';
import { PrayerTheme, PrayerContent, PrayerCategory, PersonalPrayer, PrayerProgress, AcademyResource, AcademyVisibility, AcademyReflection } from '../types';
import { 
  Play, FileText, Search, GraduationCap, X, MessageCircle, Zap, Info, 
  Sparkles, Eye, CheckCircle2, ChevronDown, Calendar, StopCircle, RefreshCw,
  Plus, Trash2, Heart, Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { usePrayer } from '../contexts/PrayerContext';

const PrayerView: React.FC = () => {
  const {
    themes, content, categories, personalPrayers, setPersonalPrayers,
    progress, setProgress
  } = usePrayer();
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'themes' | 'personal'>('themes');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<PrayerTheme | null>(null);
  const [selectedContent, setSelectedContent] = useState<PrayerContent | null>(null);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');

  // Personal Prayer States
  const [newPrayerTitle, setNewPrayerTitle] = useState('');
  const [editingPrayerId, setEditingPrayerId] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState('');

  // Acordeão e Timer
  const [expandedWeeks, setExpandedWeeks] = useState<string[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const userEmail = session?.user?.email;
  const isCurrentUserAdmin = userEmail && ADMIN_EMAILS.includes(session.user.email.toLowerCase());

  // Auto-expandir a primeira semana ao abrir um tema
  useEffect(() => {
    if (selectedTheme) {
      const themeContents = content.filter(l => l.themeId === selectedTheme.id).sort((a,b) => (a.week||'').localeCompare(b.week||''));
      if (themeContents.length > 0 && themeContents[0].week) {
        setExpandedWeeks([themeContents[0].week]);
      } else {
        setExpandedWeeks(['Semana 1']);
      }
    }
  }, [selectedTheme, content]);

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

  const filteredThemes = themes.filter(theme => {
    const matchesCategory = activeCategory === 'all' || theme.categoryId === activeCategory;
    const matchesSearch = theme.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          theme.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getThemeThumbnail = (theme: PrayerTheme) => {
    if (theme.thumbnailUrl) return theme.thumbnailUrl;
    return `https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&q=80&w=1000`;
  };

  const toggleResourceCompletion = (resourceId: string, seconds?: number) => {
    const isCompleted = progress.completedResources.includes(resourceId);
    let updatedList;
    if (isCompleted) {
      updatedList = progress.completedResources.filter(id => id !== resourceId);
    } else {
      updatedList = [...progress.completedResources, resourceId];
    }
    
    const updatedRecords = { ...(progress.records || {}) };
    const currentRecord = updatedRecords[resourceId] || { completed: false, timeSpent: 0 };
    
    updatedRecords[resourceId] = {
      completed: !isCompleted,
      timeSpent: (currentRecord.timeSpent || 0) + (seconds || 0),
      completedAt: !isCompleted ? new Date().toISOString() : undefined
    };
    
    setProgress({ ...progress, completedResources: updatedList, records: updatedRecords });
  };

  // Personal Prayer Handlers
  const addPersonalPrayer = () => {
    if (!newPrayerTitle.trim()) return;
    const newPrayer: PersonalPrayer = {
      id: Date.now().toString(),
      title: newPrayerTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };
    setPersonalPrayers([newPrayer, ...personalPrayers]);
    setNewPrayerTitle('');
  };

  const togglePersonalPrayer = (id: string) => {
    setPersonalPrayers(personalPrayers.map(p => 
      p.id === id ? { ...p, completed: !p.completed } : p
    ));
  };

  const savePrayerResponse = (id: string, response: string) => {
    setPersonalPrayers(personalPrayers.map(p => 
      p.id === id ? { ...p, response, isAnswered: !!response.trim(), answeredAt: response.trim() ? new Date().toISOString() : undefined } : p
    ));
    setEditingPrayerId(null);
  };

  const deletePersonalPrayer = (id: string) => {
    if (confirm('Deseja excluir esta oração?')) {
      setPersonalPrayers(personalPrayers.filter(p => p.id !== id));
    }
  };

  const themeContents = selectedTheme ? content.filter(l => l.themeId === selectedTheme.id) : [];
  const totalResources = themeContents.reduce((acc, l) => acc + (l.resources?.length || 0), 0);
  const completedResourcesCount = themeContents.reduce((acc, l) => acc + (l.resources?.filter(r => progress.completedResources.includes(r.id)).length || 0), 0);
  const progressPercent = totalResources === 0 ? 0 : Math.round((completedResourcesCount / totalResources) * 100);

  const activeResource = selectedContent?.resources?.find(r => r.id === activeResourceId);

  return (
    <div className="flex flex-col pt-24 md:pt-0 pb-20 animate-in fade-in duration-700">
      
      {/* Header com Tabs */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-brand/10 rounded-3xl flex items-center justify-center border border-brand/20 shadow-xl shadow-brand/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand">
              <path d="M12 3L9 11v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7l-3-8Z" />
              <path d="M12 3v17" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase neon-text">Oração</h1>
            <p className="text-gray-500 mt-1 font-medium italic">"Orai sem cessar." - 1 Tes. 5:17</p>
          </div>
        </div>

        <div className="flex bg-[#161b22] p-1.5 rounded-2xl border border-white/5 shadow-2xl shrink-0">
          <button
            onClick={() => setActiveTab('themes')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'themes' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-white'}`}
          >
            Temas Guiados
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'personal' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-white'}`}
          >
            Lista Pessoal
          </button>
        </div>
      </header>

      {activeTab === 'themes' ? (
        <div className="flex flex-col">
          {selectedTheme ? (
            <div className="animate-in slide-in-from-right duration-500">
              {/* Header do Tema Selecionado */}
              <div className="bg-brand/5 p-8 rounded-[48px] border border-brand/10 mb-8 flex flex-col md:flex-row gap-8 items-center">
                <button 
                  onClick={() => { setSelectedTheme(null); setExpandedWeeks([]); }} 
                  className="w-14 h-14 bg-[#0b0e14] border border-white/5 rounded-2xl flex items-center justify-center hover:bg-brand/20 hover:text-brand transition-all flex-shrink-0 shadow-lg"
                >
                  <X size={24} />
                </button>
                <img src={getThemeThumbnail(selectedTheme)} className="w-28 h-28 md:w-32 md:h-32 rounded-[40px] object-cover shadow-2xl border border-white/10" alt={selectedTheme.title} />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{selectedTheme.title}</h2>
                  <p className="text-gray-500 text-sm max-w-2xl leading-relaxed italic">{selectedTheme.description}</p>
                </div>
                <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 text-center min-w-[220px] shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Progresso</p>
                    <p className="text-2xl font-black text-brand tracking-tighter">{progressPercent}%</p>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-brand to-[#9d5cff] shadow-[0_0_15px_rgba(var(--brand-rgb),0.5)] transition-all duration-1000 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mt-3">
                    {completedResourcesCount} de {totalResources} Concluídas
                  </p>
                </div>
              </div>

              {/* Lista Acordeão */}
              <div className="space-y-6">
                {(() => {
                  const groupedByWeek = themeContents.reduce((acc, content) => {
                    const w = content.week || 'Início';
                    if (!acc[w]) acc[w] = [];
                    acc[w].push(content);
                    return acc;
                  }, {} as Record<string, PrayerContent[]>);

                  const sortedWeekNames = Object.keys(groupedByWeek).sort((a, b) => {
                    const numA = parseInt(a.replace(/\D/g, '')) || 0;
                    const numB = parseInt(b.replace(/\D/g, '')) || 0;
                    return numA - numB;
                  });

                  return sortedWeekNames.map(weekName => {
                    const lessons = groupedByWeek[weekName];
                    const isExpanded = expandedWeeks.includes(weekName);
                    const isWeekComplete = (lessons.reduce((acc, l) => acc + (l.resources?.filter(r => progress.completedResources.includes(r.id)).length || 0), 0) === lessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0)) && lessons.length > 0;

                    return (
                      <div key={weekName} className={`border rounded-[40px] overflow-hidden transition-all duration-300 shadow-2xl ${isExpanded ? 'bg-[#161b22] border-brand/20' : 'bg-[#0b0e14] border-white/5 hover:border-white/10'}`}>
                        <div onClick={() => toggleWeek(weekName)} className="flex items-center justify-between p-8 cursor-pointer hover:bg-white/5 transition-colors group">
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-lg transition-colors ${isWeekComplete ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
                              {isWeekComplete ? <CheckCircle2 size={28} /> : (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 3L9 11v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7l-3-8Z" />
                                  <path d="M12 3v17" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${isExpanded ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{weekName}</h3>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-black">
                                {lessons.length} blocos • {lessons.reduce((a,b)=>a+(b.resources?.length||0),0)} tópicos
                              </p>
                            </div>
                          </div>
                          <ChevronDown size={28} className={`transition-all duration-300 ${isExpanded ? 'text-white rotate-180' : 'text-gray-500'}`} />
                        </div>
                        
                        {isExpanded && (
                          <div className="p-8 pt-0 space-y-6 animate-in slide-in-from-top-4 duration-300">
                            {lessons.map(block => (
                              <div key={block.id} className="bg-[#0b0e14]/50 border border-white/5 rounded-[32px] p-8 hover:border-brand/10 transition-colors">
                                <div className="flex items-center gap-4 mb-6">
                                  <div className="p-2.5 bg-brand/10 rounded-xl border border-brand/20">
                                    <Target className="text-brand" size={18} />
                                  </div>
                                  <h4 className="text-lg font-black text-white uppercase tracking-tighter">
                                    {block.day ? `${block.day} • ` : ''}{block.title}
                                  </h4>
                                </div>
                                <div className="space-y-4">
                                  {(block.resources || []).map(resource => {
                                    const isResComplete = progress.completedResources.includes(resource.id);
                                    return (
                                      <div key={resource.id} className={`flex items-center justify-between p-5 rounded-2xl transition-all group cursor-pointer ${isResComplete ? 'bg-white/5 border border-white/5' : 'bg-[#161b22] border border-white/10 hover:border-brand/40 shadow-xl'}`} onClick={() => toggleResourceCompletion(resource.id)}>
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                          <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${isResComplete ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-gray-700 group-hover:border-brand'}`}>
                                            {isResComplete && <CheckCircle2 size={16} strokeWidth={4} />}
                                          </div>
                                          <span className={`text-[15px] font-black uppercase tracking-tight truncate transition-colors ${isResComplete ? 'text-gray-600 line-through' : 'text-gray-200 group-hover:text-white'}`}>
                                            {resource.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              setActiveResourceId(resource.id); 
                                              setSelectedContent(block); 
                                              setTimerSeconds(0); 
                                              setIsTimerRunning(false); 
                                            }} 
                                            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 ${isResComplete ? 'bg-white/5 text-gray-500' : 'bg-brand text-white hover:scale-105'}`}
                                          >
                                            <Eye size={14} /> ORAR
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
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {/* Seletor de Categorias e Busca */}
              <div className="bg-brand/5 p-10 rounded-[48px] border border-brand/10 mb-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand/20 rounded-full blur-3xl opacity-30" />
                <div className="relative z-10 text-center md:text-left">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Conecte-se com o Pai</h2>
                  <p className="text-gray-400 font-medium">Encontre temas guiados para aprofundar sua vida de oração.</p>
                </div>
                <div className="relative z-10 w-full md:w-auto flex items-center bg-[#0b0e14] border border-white/10 rounded-3xl px-6 py-4 shadow-2xl">
                  <Search size={22} className="text-gray-600 mr-4" />
                  <input
                    type="text"
                    placeholder="Soberania, Perdão, Cura..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent text-white font-bold outline-none w-full md:w-64 placeholder:text-gray-700"
                  />
                </div>
              </div>

              {/* Grid de Temas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredThemes.map(theme => (
                  <div 
                    key={theme.id} 
                    onClick={() => setSelectedTheme(theme)}
                    className="bg-[#161b22] border border-white/5 rounded-[40px] p-6 hover:border-brand/40 transition-all cursor-pointer group flex flex-col h-full transform hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(var(--brand-rgb),0.15)] relative overflow-hidden"
                  >
                    <div className="aspect-video rounded-[32px] overflow-hidden mb-6 relative shadow-2xl border border-white/10">
                      <img src={getThemeThumbnail(theme)} alt={theme.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 text-white/90">
                        <Heart size={18} fill="currentColor" className="text-rose-500" />
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 group-hover:text-brand transition-colors line-clamp-1">{theme.title}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-6 italic leading-relaxed">{theme.description}</p>
                      
                      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                         <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">
                           {content.filter(l => l.themeId === theme.id).length} Blocos
                         </span>
                         <div className="w-10 h-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all shadow-lg">
                           <ChevronDown size={18} className="-rotate-90" />
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ABA LISTA PESSOAL */
        <div className="space-y-10 animate-in slide-in-from-left duration-500">
          
          <div className="bg-[#161b22] border border-white/5 p-10 rounded-[48px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 text-brand">
              <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L9 11v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7l-3-8Z" />
                <path d="M12 3v17" />
              </svg>
            </div>

            <div className="relative z-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-brand uppercase tracking-[0.3em] ml-1">Pelo que vamos orar hoje?</label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Ex: Minha família, novo emprego, cura de um amigo..."
                    value={newPrayerTitle}
                    onChange={(e) => setNewPrayerTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPersonalPrayer()}
                    className="flex-1 bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-6 text-white font-bold placeholder:text-gray-700 focus:ring-2 focus:ring-brand/30 outline-none transition-all shadow-inner"
                  />
                  <button
                    onClick={addPersonalPrayer}
                    className="px-10 py-6 bg-brand text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    <Plus size={20} /> ADICIONAR
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {personalPrayers.length === 0 ? (
              <div className="py-24 text-center bg-black/20 rounded-[48px] border border-dashed border-white/10">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-6 opacity-20 text-gray-500">
                  <path d="M12 3L9 11v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-7l-3-8Z" />
                  <path d="M12 3v17" />
                </svg>
                <p className="font-black text-sm uppercase tracking-[0.2em] text-gray-600">Sua lista de orações está vazia.</p>
              </div>
            ) : (
              personalPrayers.map(prayer => (
                <div key={prayer.id} className={`group bg-[#161b22] border rounded-[32px] p-6 transition-all duration-300 ${prayer.completed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/5'}`}>
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6 flex-1">
                      <button 
                        onClick={() => togglePersonalPrayer(prayer.id)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${prayer.completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[#0b0e14] text-gray-600 border border-white/5 hover:border-emerald-500 hover:text-emerald-500 shadow-inner'}`}
                      >
                        <CheckCircle2 size={24} />
                      </button>
                      <div className="flex-1">
                        <h3 className={`text-lg font-black tracking-tight transition-all ${prayer.completed ? 'text-emerald-500 line-through' : 'text-white'}`}>
                          {prayer.title}
                        </h3>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                          Criada em: {new Date(prayer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setEditingPrayerId(prayer.id);
                          setEditingResponse(prayer.response || '');
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${prayer.response ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white border border-transparent'}`}
                        title={prayer.response ? 'Ver Resposta' : 'Anotar Resposta'}
                      >
                        <MessageCircle size={16} /> {prayer.response ? 'RESPOSTA' : 'NOTAS'}
                      </button>
                      <button 
                        onClick={() => deletePersonalPrayer(prayer.id)}
                        className="w-12 h-12 rounded-2xl bg-white/5 text-gray-700 flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent shadow-inner"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Campo de Resposta / Testemunho */}
                  {(editingPrayerId === prayer.id || prayer.response) && (
                    <div className="mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                      {editingPrayerId === prayer.id ? (
                        <div className="space-y-4">
                          <label className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                             <Sparkles size={14} /> Anote a resposta ou observações sobre esta oração
                          </label>
                          <textarea
                            autoFocus
                            value={editingResponse}
                            onChange={(e) => setEditingResponse(e.target.value)}
                            placeholder="Deus falou com você? A oração foi respondida? Anote aqui o seu testemunho..."
                            className="w-full h-32 bg-[#0b0e14] border border-amber-500/20 rounded-[20px] p-6 text-white font-medium text-sm focus:ring-1 focus:ring-amber-500 outline-none resize-none placeholder:text-gray-800 shadow-inner"
                          />
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingPrayerId(null)} className="px-6 py-3 text-[10px] font-black text-gray-600 uppercase hover:text-white">CANCELAR</button>
                            <button onClick={() => savePrayerResponse(prayer.id, editingResponse)} className="px-8 py-3 bg-amber-500 text-[#0b0e14] border border-amber-400 rounded-xl font-black text-[10px] uppercase shadow-xl shadow-amber-500/20 hover:scale-105 transition-all">SALVAR TESTEMUNHO</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[24px] p-6 relative">
                          <div className="absolute top-4 right-6 text-amber-500/10"><Sparkles size={40} /></div>
                          <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
                             <CheckCircle2 size={14} /> TESTEMUNHO / RESPOSTA
                          </h4>
                          <p className="text-gray-300 text-sm italic font-serif leading-relaxed line-clamp-6">"{prayer.response}"</p>
                          {prayer.answeredAt && (
                            <p className="text-[8px] text-amber-500/40 font-black uppercase tracking-[0.2em] mt-4">
                               Respondida em: {new Date(prayer.answeredAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL DE ORAÇÃO GUIADA */}
      {selectedContent && activeResource && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
           <div className="bg-[#161b22] w-full max-w-5xl h-full md:max-h-[92vh] rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(var(--brand-rgb),0.1)] flex flex-col overflow-hidden relative">
              
              <div className="p-8 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-[#0b0e14] to-[#161b22] flex-shrink-0">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center text-brand shadow-xl">
                      <Zap size={28} />
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{activeResource.title}</h3>
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">{selectedContent.title}</p>
                   </div>
                </div>
                <button onClick={() => { setActiveResourceId(null); setSelectedContent(null); setIsTimerRunning(false); }} className="w-14 h-14 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-90">
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12">
                
                {/* Timer Section */}
                <div className="bg-[#0b0e14]/90 border border-white/5 rounded-[48px] p-10 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                   <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-full opacity-30 transform translate-y-1/2" />
                   
                   <div className={`text-7xl md:text-9xl font-black tracking-tighter tabular-nums leading-none mb-10 ${isTimerRunning ? 'text-brand drop-shadow-[0_0_20px_rgba(var(--brand-rgb),0.4)]' : 'text-gray-400'}`}>
                     {formatTime(timerSeconds)}
                   </div>
                   
                   <div className="flex gap-6 relative z-10">
                     {isTimerRunning ? (
                       <button onClick={() => setIsTimerRunning(false)} className="px-10 py-5 bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-rose-500/10">
                         PAUSAR
                       </button>
                     ) : (
                       <button onClick={() => setIsTimerRunning(true)} className="px-12 py-5 bg-brand text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-brand/20 hover:scale-105 transition-all">
                         {timerSeconds > 0 ? 'RETOMAR ORAÇÃO' : 'INICIAR ORAÇÃO'}
                       </button>
                     )}
                     <button onClick={() => { setIsTimerRunning(false); setTimerSeconds(0); }} className="w-16 h-16 bg-white/5 text-gray-600 rounded-2xl flex items-center justify-center hover:text-white transition-all">
                        <RefreshCw size={24} />
                     </button>
                   </div>
                </div>

                {/* Video / Content Rendering */}
                {activeResource.url && (
                   <div className="aspect-video w-full rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-black">
                      <iframe 
                        src={getEmbedUrl(activeResource.url)} 
                        className="w-full h-full" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      />
                   </div>
                )}

                {activeResource.instruction && (
                   <div className="bg-[#0b0e14]/60 border border-white/5 rounded-[40px] p-10 shadow-inner">
                      <h4 className="text-[11px] font-black text-brand uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                         <Info size={18} /> COMO ORAR ESTE TEMA
                      </h4>
                      <div className="text-gray-200 text-lg md:text-xl font-medium leading-relaxed italic whitespace-pre-wrap">
                        {activeResource.instruction}
                      </div>
                   </div>
                )}

                {activeResource.content && (
                  <div className="prose prose-invert max-w-none bg-white/[0.02] p-10 rounded-[40px] border border-white/5 shadow-inner">
                     <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{activeResource.content}</p>
                  </div>
                )}

                {/* Reflections Area */}
                <div className="pt-10 border-t border-white/5">
                   <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6">
                      Suas Anotações e Revelações durante esta Oração
                   </label>
                   <textarea
                     value={reflectionText}
                     onChange={(e) => setReflectionText(e.target.value)}
                     placeholder="O que Deus falou ao seu coração? Algum versículo ou palavra específica?"
                     className="w-full h-48 bg-[#0b0e14] border border-white/5 rounded-[32px] p-8 text-white font-serif italic text-lg leading-relaxed outline-none focus:ring-2 focus:ring-brand/20 transition-all placeholder:text-gray-800"
                   />
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-[#0b0e14] flex-shrink-0 z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                 <button 
                   onClick={() => {
                     if (!progress.completedResources.includes(activeResource.id)) {
                       toggleResourceCompletion(activeResource.id, timerSeconds);
                     }
                     setActiveResourceId(null);
                     setSelectedContent(null);
                     setIsTimerRunning(false);
                     setReflectionText('');
                   }}
                   className={`w-full py-8 rounded-[32px] font-black uppercase text-sm tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-4 ${
                     progress.completedResources.includes(activeResource.id)
                     ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                     : 'bg-gradient-to-r from-brand to-[#9d5cff] text-white shadow-brand/20'
                   }`}
                 >
                   {progress.completedResources.includes(activeResource.id) ? (
                     <><CheckCircle2 size={24} /> ORAÇÃO CONCLUÍDA</>
                   ) : (
                     <><CheckCircle2 size={24} /> CONCLUIR ORAÇÃO</>
                   )}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PrayerView;
