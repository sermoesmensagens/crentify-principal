
import React, { useState } from 'react';
import { AcademyContent, AcademyCategory, AcademyReflection, AcademyProgress, AcademyCourse } from '../types';
import { Play, FileText, Search, GraduationCap, X, MessageCircle, Zap, Info, Loader2, Sparkles, Send, Lock, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
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

  const userEmail = session?.user?.email;
  const isCurrentUserAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

  const filteredCourses = courses.filter(c => {
    if (!isCurrentUserAdmin) {
      if (c.visibility === 'privado') return false;
      if (c.visibility === 'não listado') return false;
    }
    const matchesCategory = activeCategory === 'all' || c.categoryId === activeCategory;
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const courseLessons = selectedCourse ? content.filter(l => l.courseId === selectedCourse.id).sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || '')) : [];

  const getYoutubeId = (url: string) => {
    // Regex aprimorada para suportar shorts, mobile, e parâmetros extras
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getEmbedUrl = (url: string) => {
    const yid = getYoutubeId(url);
    if (yid) return `https://www.youtube.com/embed/${yid}?autoplay=0&rel=0`;
    return url;
  };

  const getCourseThumbnail = (course: AcademyCourse) => {
    if (course.thumbnailUrl) return course.thumbnailUrl;
    return 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800';
  };

  const activeResource = selectedLesson?.resources.find(r => r.id === activeResourceId) || selectedLesson?.resources[0];

  const handleSaveReflection = () => {
    if (!selectedLesson || !reflectionText.trim()) return;
    const newRef: AcademyReflection = {
      id: Date.now().toString(),
      contentId: selectedLesson.id,
      title: selectedLesson.title,
      text: reflectionText,
      date: new Date().toISOString()
    };
    setReflections([newRef, ...reflections]);
    setReflectionText('');
    alert('Revelação salva com sucesso!');
  };

  const toggleLessonCompletion = (lessonId: string) => {
    const isCompleted = progress.completedLessons.includes(lessonId);
    let updated;
    if (isCompleted) {
      updated = progress.completedLessons.filter(id => id !== lessonId);
    } else {
      updated = [...progress.completedLessons, lessonId];
    }
    setProgress({ ...progress, completedLessons: updated });
  };

  const currentReflections = selectedLesson ? reflections.filter(r => r.contentId === selectedLesson.id) : [];

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-700 pb-4 h-screen max-h-screen overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8 flex-shrink-0">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <GraduationCap size={42} className="text-brand" />
            Academy
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Capacitação ministerial e crescimento intelectual.</p>
        </div>

        {!selectedCourse && (
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand transition-colors" size={20} />
            <input
              type="text"
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#161b22] border border-white/5 rounded-[24px] py-5 pl-16 pr-6 text-white outline-none focus:ring-2 focus:ring-brand/30 font-bold placeholder:text-gray-800 shadow-2xl transition-all"
            />
          </div>
        )}

        {selectedCourse && (
          <button onClick={() => setSelectedCourse(null)} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl flex items-center gap-3 font-black text-[10px] tracking-widest transition-all">
            <X size={16} /> VOLTAR PARA CURSOS
          </button>
        )}
      </header>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {!selectedCourse ? (
          <>
            <div className="flex gap-2.5 overflow-x-auto pb-4 custom-scrollbar flex-shrink-0">
              <button onClick={() => setActiveCategory('all')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${activeCategory === 'all' ? 'bg-brand text-white border-brand shadow-lg outline-none' : 'bg-white/5 text-gray-500 border-white/5'}`}>TODOS</button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all ${activeCategory === cat.id ? 'bg-brand text-white border-brand shadow-lg outline-none' : 'bg-white/5 text-gray-500 border-white/5'}`}>{cat.name}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 content-start pb-10">
              {filteredCourses.map(course => (
                <div key={course.id} onClick={() => setSelectedCourse(course)} className="group cursor-pointer bg-[#161b22] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl transition-all flex flex-col hover:border-brand/40">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img src={getCourseThumbnail(course)} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] via-transparent to-transparent opacity-90"></div>
                    <div className="absolute top-4 right-4">
                      {course.visibility === 'privado' && <div className="p-2 bg-rose-500/20 backdrop-blur-md rounded-lg border border-rose-500/20 text-rose-500"><Lock size={12} /></div>}
                    </div>
                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                      <div className="w-12 h-12 bg-brand/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand border border-brand/20"><GraduationCap size={20} /></div>
                      <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                        {categories.find(c => c.id === course.categoryId)?.name}
                      </span>
                    </div>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <h3 className="text-xl font-black text-white leading-tight mb-3 uppercase tracking-tight line-clamp-2">{course.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-6">{course.description}</p>
                    
                    {/* Course Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Progresso</span>
                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                          {(() => {
                            const courseLessons = content.filter(l => l.courseId === course.id);
                            const completedCount = courseLessons.filter(l => progress.completedLessons.includes(l.id)).length;
                            return Math.round((completedCount / (courseLessons.length || 1)) * 100);
                          })()}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand transition-all duration-500" 
                          style={{ 
                            width: `${(() => {
                              const courseLessons = content.filter(l => l.courseId === course.id);
                              const completedCount = courseLessons.filter(l => progress.completedLessons.includes(l.id)).length;
                              return Math.round((completedCount / (courseLessons.length || 1)) * 100);
                            })()}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                        {content.filter(l => l.courseId === course.id).length} AULAS
                      </span>
                      <span className="text-[9px] font-black text-gray-800 uppercase tracking-widest group-hover:text-white transition-colors">ACESSAR CURSO</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="bg-brand/5 p-6 rounded-[40px] border border-brand/10 mb-4 flex flex-col md:flex-row gap-6 items-center">
              <img src={getCourseThumbnail(selectedCourse)} className="w-28 h-28 rounded-[32px] object-cover shadow-2xl border border-white/10" alt={selectedCourse.title} />
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{selectedCourse.title}</h2>
                <p className="text-gray-500 text-sm max-w-2xl leading-relaxed">{selectedCourse.description}</p>
              </div>
              <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-center min-w-[200px]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Seu Progresso</p>
                  <p className="text-xl font-black text-brand tracking-tighter">
                    {Math.round((courseLessons.filter(l => progress.completedLessons.includes(l.id)).length / (courseLessons.length || 1)) * 100)}%
                  </p>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand transition-all duration-700"
                      style={{ width: `${Math.round((courseLessons.filter(l => progress.completedLessons.includes(l.id)).length / (courseLessons.length || 1)) * 100)}%` }}
                    />
                </div>
                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2">
                    {courseLessons.filter(l => progress.completedLessons.includes(l.id)).length} de {courseLessons.length} aulas concluídas
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-10">
              {courseLessons.map((lesson, idx) => {
                const isCompleted = progress.completedLessons.includes(lesson.id);
                return (
                  <div key={lesson.id} onClick={() => {
                    console.log('🎓 ACADEMY DEBUG - Aula selecionada:', lesson);
                    console.log('📦 ACADEMY DEBUG - Recursos da aula:', lesson.resources);
                    console.log('📦 ACADEMY DEBUG - Quantidade de recursos:', lesson.resources?.length || 0);
                    setSelectedLesson(lesson);
                  }} className={`flex items-center justify-between p-8 rounded-[32px] border transition-all cursor-pointer group ${isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#161b22] border-white/5 hover:border-brand/40'}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isCompleted ? 'bg-emerald-500 text-white' : 'bg-brand/10 text-brand border border-brand/20'}`}>
                        {isCompleted ? <CheckCircle2 size={24} /> : idx + 1}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{lesson.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          {(lesson.resources || []).slice(0, 3).map(r => (
                            <span key={r.id} className="text-[8px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-1">
                              {r.type === 'video' ? <Play size={8} fill="currentColor" /> : r.type === 'text' ? <FileText size={8} /> : <Info size={8} />}
                              {r.title}
                            </span>
                          ))}
                          {lesson.resources.length > 3 && <span className="text-[8px] font-black text-gray-700">+{lesson.resources.length - 3}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLessonCompletion(lesson.id);
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/5 text-gray-600 hover:text-brand hover:bg-brand/10'}`}
                        title={isCompleted ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                      >
                        <CheckCircle2 size={20} />
                      </button>
                      <button className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isCompleted ? 'text-emerald-500' : 'bg-brand text-white opacity-0 group-hover:opacity-100 shadow-lg shadow-brand/20'}`}>
                        {isCompleted ? 'REVISAR' : 'INICIAR AULA'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedLesson && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-[#161b22] w-full max-w-7xl h-full max-h-[95vh] rounded-[56px] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 flex justify-between items-center border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl"><GraduationCap size={28} /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedLesson.title}</h3>
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest">AULA {courseLessons.findIndex(l => l.id === selectedLesson.id) + 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLessonCompletion(selectedLesson.id)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${progress.completedLessons.includes(selectedLesson.id) ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white/5 text-gray-400 hover:text-brand hover:bg-brand/10'}`}
                >
                  {progress.completedLessons.includes(selectedLesson.id) ? <CheckCircle2 size={16} /> : <Zap size={16} />}
                  {progress.completedLessons.includes(selectedLesson.id) ? 'CONCLUÍDO' : 'CONCLUIR AULA'}
                </button>
                <button onClick={() => { setSelectedLesson(null); setActiveResourceId(null); }} className="w-14 h-14 bg-white/5 text-gray-500 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><X size={32} /></button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Sidebar de Recursos */}
              <div className="w-full lg:w-56 bg-black/40 border-r border-white/5 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Recursos Disponíveis</p>
                  <div className="space-y-2 overflow-y-auto max-h-[300px] lg:max-h-none custom-scrollbar pb-10">
                    {selectedLesson.resources && selectedLesson.resources.length > 0 ? (
                      selectedLesson.resources.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setActiveResourceId(r.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeResource?.id === r.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          {r.type === 'video' ? <Play size={14} fill="currentColor" /> : r.type === 'text' ? <FileText size={14} /> : <Info size={14} />}
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-black uppercase tracking-tight truncate">{r.title}</p>
                            <p className="text-[8px] opacity-60 font-black uppercase">{r.type}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <AlertTriangle size={24} className="text-rose-500 mb-2" />
                        <p className="text-[9px] font-black text-rose-400 uppercase leading-relaxed">Nenhum recurso adicionado.</p>
                        <p className="text-[8px] text-gray-600 mt-2">Adicione recursos no painel Admin.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Revelações Sidebar (Scrollable) */}
                <div className="flex-1 p-6 flex flex-col overflow-hidden">
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Minhas Revelações</p>
                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-4">
                    {currentReflections.map(r => (
                      <div key={r.id} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[11px] text-gray-400 leading-relaxed font-serif">"{r.text}"</p>
                        <p className="text-[7px] font-black text-brand uppercase mt-2">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    ))}
                    {currentReflections.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <Sparkles size={24} className="text-gray-800 mb-2" />
                        <p className="text-[9px] font-black text-gray-700 uppercase leading-relaxed">Nenhuma revelação anotada ainda.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Visualizador de Recurso Principal */}
              <div className="flex-1 bg-[#0b0e14] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                  {activeResource?.type === 'video' && activeResource.url && (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                      <div className="aspect-video w-full rounded-[40px] overflow-hidden shadow-2xl border border-white/10 bg-black">
                        <iframe src={getEmbedUrl(activeResource.url)} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                      </div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight">{activeResource.title}</h2>
                    </div>
                  )}

                  {activeResource?.type === 'text' && (
                    <div className="w-full space-y-10 animate-in slide-in-from-bottom duration-500">
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter border-b border-brand/20 pb-8">{activeResource.title}</h2>
                      <div className="bg-white/5 rounded-[32px] border border-white/10 px-16 py-12 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="text-gray-300 text-lg leading-relaxed font-medium space-y-6 whitespace-pre-wrap">
                          {(() => {
                            console.log('🔍 DEBUG - Active Resource:', activeResource);
                            console.log('📝 DEBUG - Content:', activeResource.content);
                            console.log('📏 DEBUG - Content Length:', activeResource.content?.length);
                            return activeResource.content || '⚠️ CONTEÚDO VAZIO OU INDEFINIDO';
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeResource?.type === 'link' && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
                      <div className="w-24 h-24 bg-brand/10 text-brand rounded-[32px] flex items-center justify-center border border-brand/20 shadow-2xl">
                        <Info size={48} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">{activeResource.title}</h2>
                        <p className="text-gray-500 max-w-sm font-medium">Este é um recurso externo. Clique no botão abaixo para abrir em uma nova guia.</p>
                      </div>
                      <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="bg-brand text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-105 transition-all">
                        ABRIR LINK EXTERNO
                      </a>
                    </div>
                  )}

                  {/* Área de Revelação */}
                  <div className="mt-20 pt-20 border-t border-white/5">
                    <div className="max-w-4xl mx-auto bg-black/40 p-10 rounded-[48px] border border-white/5">
                      <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-4"><MessageCircle size={24} className="text-brand" /> O que Deus te falou através desta aula?</h4>
                      <textarea
                        value={reflectionText}
                        onChange={e => setReflectionText(e.target.value)}
                        placeholder="Anote aqui as pérolas de sabedoria..."
                        className="w-full bg-[#0b0e14] border border-white/5 rounded-[32px] p-8 text-white font-medium outline-none h-40 resize-none mb-6 focus:ring-2 focus:ring-brand/30 transition-all"
                      />
                      <button onClick={handleSaveReflection} className="w-full bg-brand text-white py-5 rounded-[22px] font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-95 transition-all">
                        <Send size={16} /> GUARDAR REVELAÇÃO NO CORAÇÃO
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(135, 67, 242, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(135, 67, 242, 0.6); }
      `}</style>
    </div>
  );
};

export default Academy;
