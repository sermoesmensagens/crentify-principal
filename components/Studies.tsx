
import React, { useState, useEffect, useRef } from 'react';
import { StudyItem, StudyCategory, HabitFrequency, UserCourse, UserLesson, AcademyResource } from '../types';
import { Plus, Check, Trash2, Calendar, Zap, Target, Clock, Edit2, X, BookOpen, GraduationCap } from 'lucide-react';
import { useStudies } from '../contexts/StudyContext';
import { useAcademy } from '../contexts/AcademyContext';
import { getLocalDateString, formatActivityDate } from '../utils';

const Studies: React.FC = () => {
  const { 
    studies, setStudies, categories, setCategories, 
    userCourses, setUserCourses, userLessons, setUserLessons,
    studyProgress, setStudyProgress
  } = useStudies();
  const { courses: academyCourses } = useAcademy();
  const timeInputRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const targetDateRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'tracker' | 'courses'>('tracker');
  const [editingStudyId, setEditingStudyId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(categories[0]?.name || 'ESTUDO');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'hoje' | 'pendentes' | 'todas'>('hoje');

  // Builder States
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCat, setCourseCat] = useState('st_1');

  const [selectedCourseForLessons, setSelectedCourseForLessons] = useState<string | null>(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDesc, setLessonDesc] = useState('');

  // Resource States
  const [lessonResources, setLessonResources] = useState<AcademyResource[]>([]);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'video' | 'link' | 'text'>('video');
  const [resUrl, setResUrl] = useState('');
  const [resContent, setResContent] = useState('');

  // Viewer States
  const [viewingLesson, setViewingLesson] = useState<UserLesson | null>(null);
  const [activeResourceId, setActiveResourceId] = useState<string | null>(null);


  const [today, setToday] = useState(getLocalDateString());
  const dayOfWeek = new Date().getDay();

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(getLocalDateString());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getEmbedUrl = (url: string) => {
    const yid = getYoutubeId(url);
    if (yid) return `https://www.youtube.com/embed/${yid}?autoplay=0&rel=0`;
    return url;
  };

  const activeResource = viewingLesson?.resources.find(r => r.id === activeResourceId) || viewingLesson?.resources[0];

  const resetForm = () => {
    setEditingStudyId(null);
    setCategory(categories[0]?.name || 'ESTUDO');
    setDescription('');
    setSelectedCourseId('');
    setFrequency('daily');
    setSelectedDays([]);
    setStartDate('');
    setEndDate('');
    setTargetDate('');
    setTime('09:00');
  };

  const resetBuilderForm = () => {
    setEditingCourseId(null);
    setCourseTitle('');
    setCourseDesc('');
    setCourseCat(categories[0]?.id || 'st_1');
    setShowCourseForm(false);
  };

  const handleCreateOrUpdate = () => {
    if (editingStudyId) {
      const updatedStudies = studies.map(s => {
        if (s.id === editingStudyId) {
          return {
            ...s,
            category,
            description,
            courseId: selectedCourseId || undefined,
            frequency,
            time,
            selectedDays: frequency === 'weekly' ? selectedDays : undefined,
            startDate: frequency === 'period' ? startDate : undefined,
            endDate: frequency === 'period' ? endDate : undefined,
            date: (frequency === 'once' || frequency === 'annual') ? targetDate : undefined,
          };
        }
        return s;
      });
      setStudies(updatedStudies);
    } else {
      const newStudy: StudyItem = {
        id: Date.now().toString(),
        category,
        description,
        courseId: selectedCourseId || undefined,
        frequency,
        time,
        selectedDays: frequency === 'weekly' ? selectedDays : undefined,
        startDate: frequency === 'period' ? startDate : undefined,
        endDate: frequency === 'period' ? endDate : undefined,
        date: (frequency === 'once' || frequency === 'annual') ? targetDate : undefined,
        completions: {}
      };
      setStudies([...studies, newStudy]);
    }
    resetForm();
  };

  const startEdit = (study: StudyItem) => {
    setEditingStudyId(study.id);
    setCategory(study.category);
    setDescription(study.description);
    setSelectedCourseId(study.courseId || '');
    setFrequency(study.frequency);
    setTime(study.time || '09:00');
    setSelectedDays(study.selectedDays || []);
    setStartDate(study.startDate || '');
    setEndDate(study.endDate || '');
    setTargetDate(study.date || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = (studyId: string) => {
    setStudies(studies.map(s => {
      if (s.id === studyId) {
        const completions = { ...s.completions };
        completions[today] = !completions[today];
        return { ...s, completions };
      }
      return s;
    }));
  };

  const deleteStudy = (id: string) => {
    if (confirm('Deseja excluir este planejamento de estudo?')) {
      setStudies(studies.filter(s => s.id !== id));
      if (editingStudyId === id) resetForm();
    }
  };

  const toggleLessonCompletion = (lessonId: string) => {
    const isCompleted = studyProgress.completedLessons.includes(lessonId);
    let updated;
    if (isCompleted) {
      updated = studyProgress.completedLessons.filter(id => id !== lessonId);
    } else {
      updated = [...studyProgress.completedLessons, lessonId];
    }
    setStudyProgress({ ...studyProgress, completedLessons: updated });
  };

  const filteredStudies = studies.filter(study => {
    const isPastDue = () => {
      if (study.frequency === 'once' && study.date && study.date < today && !study.completions[study.date]) return true;
      if (study.frequency === 'period' && study.endDate && study.endDate < today && !study.completions[study.endDate]) return true;
      return false;
    };

    const isToday = () => {
      if (study.frequency === 'daily') return true;
      if (study.frequency === 'weekly' && study.selectedDays?.includes(dayOfWeek)) return true;
      if (study.frequency === 'period' && study.startDate && study.endDate) {
        return today >= study.startDate && today <= study.endDate;
      }
      if (study.frequency === 'once' && study.date === today) return true;
      if (study.frequency === 'annual' && study.date?.slice(5) === today.slice(5)) return true;
      if (study.frequency === 'monthly' && study.date?.slice(-2) === today.slice(-2)) return true;
      return false;
    };

    if (filter === 'hoje') return isToday();
    if (filter === 'pendentes') return isPastDue() || (isToday() && !study.completions[today]);
    if (filter === 'todas') return true;
    return false;
  }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: StudyCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim().toUpperCase()
    };
    setCategories([...categories, newCat]);
    setNewCategoryName('');
  };

  const deleteCategory = (id: string) => {
    if (categories.length <= 1) {
      alert('Você precisa ter pelo menos uma categoria!');
      return;
    }
    if (confirm('Deseja excluir esta categoria?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const updateCategoryName = (id: string, newName: string) => {
    if (!newName.trim()) return;
    setCategories(categories.map(c =>
      c.id === id ? { ...c, name: newName.trim().toUpperCase() } : c
    ));
    setEditingCategoryId(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-extrabold text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <BookOpen size={42} className="text-brand" />
            Meus Estudos
          </h1>
          <p className="text-c-text-secondary mt-2 font-medium">Dedique tempo ao conhecimento e crescimento espiritual.</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-brand-card p-1.5 rounded-2xl border border-white/5 shadow-2xl shrink-0">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 ${activeTab === 'tracker' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-c-text-secondary hover:text-white'}`}
          >
            Registro
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all duration-300 ${activeTab === 'courses' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-c-text-secondary hover:text-white'}`}
          >
            Pessoais
          </button>
        </div>
      </header>

      {activeTab === 'tracker' ? (
        <div className="space-y-10 animate-in fade-in duration-500">
          {/* Card de Criação Neon Style */}
          <div className={`bg-brand-card border transition-all duration-500 p-10 rounded-[48px] shadow-2xl relative overflow-hidden group ${editingStudyId ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'}`}>
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <Target size={180} className="text-brand" />
            </div>

            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-center text-center md:text-left">
                <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.name)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-extrabold tracking-widest transition-all duration-300 border ${category === cat.name
                        ? 'bg-brand text-white border-brand shadow-[0_0_15px_rgba(108,59,255,0.4)]'
                        : 'bg-white/5 text-c-text-secondary border-white/5 hover:border-brand/30 hover:text-brand'
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCategoryManager(!showCategoryManager)}
                    className="px-4 py-3 rounded-2xl text-[10px] font-extrabold tracking-widest transition-all duration-300 border bg-white/5 text-c-text-secondary border-white/5 hover:border-brand/30 hover:text-brand"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
                {editingStudyId && (
                  <button
                    onClick={resetForm}
                    className="text-c-text-secondary hover:text-white transition-colors p-2"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Category Manager */}
              {showCategoryManager && (
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-extrabold text-brand uppercase tracking-widest">Gerenciar Categorias</h3>
                    <button onClick={() => setShowCategoryManager(false)} className="text-c-text-secondary hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nova categoria..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                      className="flex-1 bg-brand-bg border border-white/5 rounded-xl px-4 py-2 text-white text-xs font-bold placeholder:text-c-text-muted outline-none focus:ring-2 focus:ring-brand/30"
                    />
                    <button
                      onClick={addCategory}
                      className="px-4 py-2 bg-brand text-white rounded-xl font-extrabold text-[10px] hover:scale-105 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {categories.map(cat => (
                      <div key={cat.id} className="flex items-center gap-2 bg-brand-bg p-3 rounded-xl">
                        {editingCategoryId === cat.id ? (
                          <input
                            type="text"
                            defaultValue={cat.name}
                            onBlur={(e) => updateCategoryName(cat.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateCategoryName(cat.id, (e.target as HTMLInputElement).value)}
                            autoFocus
                            className="flex-1 bg-transparent border-b border-brand text-white text-xs font-bold outline-none uppercase"
                          />
                        ) : (
                          <span className="flex-1 text-white text-xs font-bold">{cat.name}</span>
                        )}
                        <button
                          onClick={() => setEditingCategoryId(cat.id)}
                          className="p-1 text-c-text-secondary hover:text-brand transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          className="p-1 text-c-text-secondary hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Vincular a um Curso</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-brand-bg border border-white/5 rounded-2xl px-8 py-5 text-white font-bold focus:ring-2 focus:ring-brand/30 outline-none transition-all appearance-none"
                  >
                    <option value="">NÃO VINCULADO A CURSO</option>
                    <optgroup label="PLATAFORMA">
                      {academyCourses.map(course => (
                        <option key={course.id} value={course.id}>{course.title.toUpperCase()}</option>
                      ))}
                    </optgroup>
                    {userCourses.length > 0 && (
                      <optgroup label="OS MEUS CURSOS">
                        {userCourses.map(course => (
                          <option key={course.id} value={course.id}>{course.title.toUpperCase()}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">O que você vai estudar?</label>
                  <input
                    type="text"
                    placeholder="Ex: Escatologia Bíblica..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-brand-bg border border-white/5 rounded-2xl px-8 py-5 text-white font-bold placeholder:text-c-text-muted focus:ring-2 focus:ring-brand/30 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Frequência</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'daily', label: 'DIÁRIO' },
                      { id: 'weekly', label: 'SEMANAL' },
                      { id: 'period', label: 'PERÍODO' },
                      { id: 'once', label: 'EVENTO' },
                      { id: 'monthly', label: 'MENSAL' },
                      { id: 'annual', label: 'ANUAL' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFrequency(f.id as any)}
                        className={`px-5 py-2.5 rounded-xl text-[9px] font-extrabold tracking-widest transition-all ${frequency === f.id
                          ? 'bg-brand/20 text-brand border border-brand/40 shadow-[0_0_10px_rgba(108,59,255,0.2)]'
                          : 'bg-white/5 text-c-text-muted border border-transparent hover:text-c-text-secondary'
                          }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 min-h-[80px] flex items-center justify-center">
                  {frequency === 'weekly' && (
                    <div className="flex gap-1.5">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(day => day !== i) : [...prev, i])}
                          className={`w-9 h-9 rounded-xl text-[10px] font-extrabold transition-all border ${selectedDays.includes(i) ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white/5 border-white/5 text-c-text-muted'
                            }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                  {frequency === 'period' && (
                    <div className="flex gap-3 items-center">
                      <div className="relative group flex-1">
                        <input ref={startDateRef} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-brand-bg border border-white/10 p-4 pr-12 rounded-2xl text-xs font-extrabold text-brand outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer" />
                        <button onClick={() => startDateRef.current?.showPicker()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all z-10"><Plus size={16} /></button>
                      </div>
                      <span className="text-c-text-muted font-extrabold text-[10px] uppercase">até</span>
                      <div className="relative group flex-1">
                        <input ref={endDateRef} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-brand-bg border border-white/10 p-4 pr-12 rounded-2xl text-xs font-extrabold text-brand outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer" />
                        <button onClick={() => endDateRef.current?.showPicker()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all z-10"><Plus size={16} /></button>
                      </div>
                    </div>
                  )}
                  {(frequency === 'once' || frequency === 'annual' || frequency === 'monthly') && (
                    <div className="relative group w-full">
                      <input ref={targetDateRef} type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-brand-bg border border-white/10 p-4 pr-12 rounded-2xl text-xs font-extrabold text-brand outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer" />
                      <button onClick={() => targetDateRef.current?.showPicker()} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all z-10"><Plus size={16} /></button>
                    </div>
                  )}
                  {frequency === 'daily' && (
                    <div className="flex items-center gap-2 text-brand/40">
                      <Clock size={16} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest">Estudar todos os dias</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1 mb-4 block">Horário do Estudo</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center border border-brand/30 shadow-[0_0_15px_rgba(108,59,255,0.2)]">
                    <Clock size={24} className="text-brand animate-pulse" />
                  </div>
                  <div className="flex-1 relative group">
                    <input
                      ref={timeInputRef}
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-brand-bg border border-white/10 p-5 pr-16 rounded-2xl text-2xl font-extrabold text-brand outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer"
                    />
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        if (timeInputRef.current && 'showPicker' in timeInputRef.current) {
                          (timeInputRef.current as any).showPicker();
                        }
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all shadow-lg shadow-brand/20 z-10"
                      title="Selecionar Horário"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateOrUpdate}
                className="w-full bg-gradient-to-r from-brand to-brand-light hover:scale-[1.01] active:scale-95 text-white font-extrabold py-6 rounded-2xl transition-all uppercase tracking-[0.2em] shadow-xl shadow-brand/30 flex items-center justify-center gap-3"
              >
                {editingStudyId ? <Check size={20} /> : <Plus size={20} />}
                {editingStudyId ? 'ATUALIZAR ESTUDO' : 'ADICIONAR ESTUDO'}
              </button>
            </div>
          </div>

          {/* Lista Hoje */}
          <section className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
              <div className="flex items-center gap-3 text-brand">
                <Zap size={20} className="fill-brand animate-pulse" />
                <span className="font-extrabold text-xs uppercase tracking-[0.3em]">Meus Estudos ({filteredStudies.length})</span>
              </div>
              
              <div className="flex bg-brand-bg p-1.5 rounded-2xl border border-white/5 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${filter === f ? 'bg-brand text-white shadow-lg' : 'text-c-text-secondary hover:text-white'}`}
                  >
                    {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pendentes' : 'Todas'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredStudies.length === 0 ? (
                <div className="py-24 text-center glass-card rounded-[48px] border-dashed border-white/5 opacity-30">
                  <Calendar size={48} className="mx-auto mb-4 text-c-text-secondary" />
                  <p className="font-extrabold text-sm uppercase tracking-widest">
                    {filter === 'hoje' ? 'Nenhum estudo planejado para hoje.' : 
                     filter === 'pendentes' ? 'Nenhum estudo pendente.' : 
                     'Nenhum estudo encontrado.'}
                  </p>
                </div>
              ) : (
                filteredStudies.map(study => (
                  <div
                    key={study.id}
                    className={`group flex items-center justify-between p-4 px-6 rounded-2xl border transition-all duration-300 ${study.completions[today]
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : editingStudyId === study.id ? 'bg-brand/10 border-brand/40 shadow-[0_0_20px_rgba(108,59,255,0.1)]' : 'bg-brand-card border-white/5 hover:border-brand/30'
                      }`}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${study.completions[today]
                        ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'bg-brand/10 text-brand border border-brand/20'
                        }`}>
                        {study.completions[today] ? <Check size={22} strokeWidth={3} /> : <GraduationCap size={20} />}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1 min-w-0">
                        <div className="flex flex-col">
                          <h3 className={`font-extrabold text-sm tracking-tight uppercase shrink-0 flex items-center gap-2 ${study.completions[today] ? 'text-c-text-muted line-through' : 'text-white'}`}>
                            {study.category}
                            <span className="px-2 py-0.5 bg-brand-bg border border-white/5 rounded-full text-[8px] text-c-text-secondary tracking-widest no-underline">
                              {formatActivityDate(study)}
                            </span>
                          </h3>
                          {study.courseId && (
                            <span className="text-[8px] font-extrabold text-brand/60 uppercase tracking-widest">
                              Curso: {academyCourses.find(c => c.id === study.courseId)?.title || userCourses.find(c => c.id === study.courseId)?.title || 'Externo'}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest truncate flex-1 ${study.completions[today] ? 'text-gray-800' : 'text-c-text-secondary'}`}>
                          {study.description || 'Sessão de Estudo'}
                        </p>
                        <div className="flex items-center gap-2 shrink-0 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/20">
                          <Clock size={14} className="text-brand" />
                          <span className="text-[10px] font-extrabold text-brand uppercase tracking-widest">{study.time || '09:00'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(study)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 text-c-text-secondary hover:text-brand hover:bg-brand/10"><Edit2 size={16} /></button>
                        <button onClick={() => deleteStudy(study.id)} className="w-9 h-9 rounded-xl bg-white/5 text-c-text-muted hover:text-rose-500 hover:bg-rose-500/10"><Trash2 size={16} /></button>
                      </div>
                      <button onClick={() => toggleComplete(study.id)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${study.completions[today] ? 'bg-white/5 text-emerald-500' : 'bg-brand text-white shadow-lg shadow-brand/20'}`}><Check size={22} strokeWidth={3} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-right duration-500">
          <div className="flex justify-between items-center bg-brand-card border border-white/5 p-8 rounded-[38px] shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20">
                <BookOpen className="text-brand" size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white uppercase tracking-tighter">Gerenciar Meus Cursos</h2>
                <p className="text-c-text-secondary text-xs font-bold uppercase tracking-widest mt-1">Crie sua própria trilha de conhecimento</p>
              </div>
            </div>
            <button
              onClick={() => { resetBuilderForm(); setShowCourseForm(true); }}
              className="bg-brand hover:scale-105 active:scale-95 text-white font-extrabold px-8 py-4 rounded-2xl flex items-center gap-3 shadow-lg shadow-brand/20 transition-all text-xs tracking-widest uppercase"
            >
              <Plus size={18} /> Criar Curso
            </button>
          </div>

          {showCourseForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto" onClick={() => setShowCourseForm(false)}></div>
              <div className="bg-brand-card border border-brand/30 w-full max-w-2xl rounded-[48px] shadow-2xl relative z-60 overflow-hidden pointer-events-auto animate-in zoom-in duration-300">
                <div className="p-10 space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-3xl font-extrabold text-white tracking-tighter uppercase">{editingCourseId ? 'Editar Curso' : 'Novo Curso'}</h3>
                    <button onClick={() => setShowCourseForm(false)} className="text-c-text-secondary hover:text-white transition-colors p-2"><X size={24} /></button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Título do Curso</label>
                      <input
                        type="text"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        placeholder="Ex: Teologia Sistemática"
                        className="w-full bg-brand-bg border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-brand/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Descrição</label>
                      <textarea
                        value={courseDesc}
                        onChange={(e) => setCourseDesc(e.target.value)}
                        placeholder="O que você vai aprender neste curso?"
                        className="w-full bg-brand-bg border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-brand/30 h-32"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Categoria Principal</label>
                      <select
                        value={courseCat}
                        onChange={(e) => setCourseCat(e.target.value)}
                        className="w-full bg-brand-bg border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-brand/30"
                      >
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!courseTitle.trim()) return;
                      const newCourse: UserCourse = {
                        id: editingCourseId || Date.now().toString(),
                        title: courseTitle,
                        description: courseDesc,
                        categoryId: courseCat,
                        createdAt: new Date().toISOString()
                      };
                      if (editingCourseId) {
                        setUserCourses(userCourses.map(c => c.id === editingCourseId ? newCourse : c));
                      } else {
                        setUserCourses([newCourse, ...userCourses]);
                      }
                      resetBuilderForm();
                    }}
                    className="w-full bg-brand text-white font-extrabold py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.01] transition-all"
                  >
                    {editingCourseId ? 'Salvar Alterações' : 'Salvar Curso'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCourses.length === 0 ? (
              <div className="col-span-2 py-20 text-center glass-card rounded-[48px] opacity-30 border-dashed border-white/5">
                <BookOpen size={64} className="mx-auto mb-4 text-c-text-secondary" />
                <p className="font-extrabold text-lg uppercase tracking-widest text-c-text-secondary">Você ainda não criou cursos.</p>
                <p className="text-c-text-muted font-bold text-xs uppercase mt-2">Clique no botão acima para começar.</p>
              </div>
            ) : !selectedCourseForLessons ? (
              userCourses.map(course => (
                <div key={course.id} className="bg-brand-card border border-white/5 p-8 rounded-[42px] hover:border-brand/40 transition-all group relative overflow-hidden">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <span className="text-[8px] font-extrabold text-brand bg-brand/10 px-3 py-1 rounded-full uppercase tracking-widest">
                          {categories.find(c => c.id === course.categoryId)?.name || 'ESTUDO'}
                        </span>
                        <h3 className="text-2xl font-extrabold text-white uppercase tracking-tighter mt-2 group-hover:text-brand transition-colors">{course.title}</h3>
                        <p className="text-c-text-secondary text-xs font-medium mt-2 line-clamp-2">{course.description || 'Nenhuma descrição.'}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCourseId(course.id); setCourseTitle(course.title); setCourseDesc(course.description); setCourseCat(course.categoryId); setShowCourseForm(true); }} className="text-c-text-muted hover:text-brand transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => { 
                          if(confirm('Excluir curso e todas as suas aulas?')) {
                            const courseId = course.id;
                            setUserCourses(userCourses.filter(c => c.id !== courseId)); 
                            setUserLessons(userLessons.filter(l => l.courseId !== courseId));
                          }
                        }} className="text-c-text-muted hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                   </div>
                   
                       <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <Zap size={14} className="text-brand" />
                                <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">{userLessons.filter(l => l.courseId === course.id).length} Aulas</span>
                              </div>
                              <span className="text-[9px] font-extrabold text-brand uppercase tracking-widest">
                                {(() => {
                                  const courseLessons = userLessons.filter(l => l.courseId === course.id);
                                  const completedCount = courseLessons.filter(l => studyProgress.completedLessons.includes(l.id)).length;
                                  return Math.round((completedCount / (courseLessons.length || 1)) * 100);
                                })()}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand transition-all duration-500"
                                style={{
                                  width: `${(() => {
                                    const courseLessons = userLessons.filter(l => l.courseId === course.id);
                                    const completedCount = courseLessons.filter(l => studyProgress.completedLessons.includes(l.id)).length;
                                    return Math.round((completedCount / (courseLessons.length || 1)) * 100);
                                  })()}%`
                                }}
                              />
                            </div>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSelectedCourseForLessons(course.id)}
                         className="w-full mt-4 text-[10px] font-extrabold text-brand uppercase tracking-widest hover:underline flex items-center justify-center gap-2 bg-brand/5 py-3 rounded-xl border border-brand/10"
                       >
                         Ver Conteúdo <Plus size={14} />
                       </button>
                </div>
              ))
            ) : (
              /* Lessons View for Selected Course */
              <div className="col-span-2 space-y-8 animate-in slide-in-from-bottom duration-500">
                <div className="bg-brand/5 p-8 rounded-3xl border border-brand/10 mb-8 flex flex-col md:flex-row gap-8 items-center">
                  <div className="w-20 h-20 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20">
                    <BookOpen size={32} className="text-brand" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-extrabold text-white uppercase tracking-tighter mb-2">
                      {userCourses.find(c => c.id === selectedCourseForLessons)?.title}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <span className="text-brand text-[10px] font-extrabold uppercase tracking-[0.2em]">Gerenciar Aulas e Conteúdo</span>
                      <button 
                        onClick={() => {
                          const course = userCourses.find(c => c.id === selectedCourseForLessons);
                          if (course) {
                            setEditingCourseId(course.id);
                            setCourseTitle(course.title);
                            setCourseDesc(course.description);
                            setCourseCat(course.categoryId);
                            setShowCourseForm(true);
                          }
                        }}
                        className="p-2 text-c-text-secondary hover:text-brand transition-all bg-white/5 rounded-xl border border-white/5 hover:border-brand/20"
                        title="Editar Curso"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-center min-w-[200px]">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-extrabold text-c-text-secondary uppercase tracking-widest">Progresso</p>
                      <p className="text-xl font-extrabold text-brand tracking-tighter">
                        {(() => {
                          const courseLessons = userLessons.filter(l => l.courseId === selectedCourseForLessons);
                          const completedCount = courseLessons.filter(l => studyProgress.completedLessons.includes(l.id)).length;
                          return Math.round((completedCount / (courseLessons.length || 1)) * 100);
                        })()}%
                      </p>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand transition-all duration-500"
                        style={{
                          width: `${(() => {
                            const courseLessons = userLessons.filter(l => l.courseId === selectedCourseForLessons);
                            const completedCount = courseLessons.filter(l => studyProgress.completedLessons.includes(l.id)).length;
                            return Math.round((completedCount / (courseLessons.length || 1)) * 100);
                          })()}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <button 
                    onClick={() => { 
                      setEditingLessonId(null); 
                      setLessonTitle(''); 
                      setLessonDesc(''); 
                      setLessonResources([]);
                      setShowLessonForm(true); 
                    }}
                    className="aspect-video bg-brand/10 border-2 border-dashed border-brand/30 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-brand/20 transition-all group"
                   >
                     <Plus size={32} className="text-brand group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-extrabold text-brand uppercase tracking-widest">Adicionar Nova Aula</span>
                   </button>

                   {userLessons.filter(l => l.courseId === selectedCourseForLessons).map((lesson, idx) => (
                       <div 
                        key={lesson.id} 
                        onClick={() => {
                          setViewingLesson(lesson);
                          setActiveResourceId(null);
                        }}
                        className={`bg-brand-card border p-6 rounded-2xl relative group transition-all cursor-pointer ${studyProgress.completedLessons.includes(lesson.id) ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-white/5 hover:border-brand/40'}`}
                      >
                        <span className="absolute top-6 right-6 text-[40px] font-extrabold text-white/5 tabular-nums leading-none">{(idx + 1).toString().padStart(2, '0')}</span>
                        <div className="flex items-center gap-3 pr-10">
                          {studyProgress.completedLessons.includes(lesson.id) && <div className="p-1 bg-emerald-500 rounded-full text-white"><Check size={10} strokeWidth={4} /></div>}
                          <h4 className="text-lg font-extrabold text-white uppercase tracking-tight">{lesson.title}</h4>
                        </div>
                        <p className="text-c-text-secondary text-[10px] font-bold mt-2 uppercase tracking-wide line-clamp-2">{lesson.description || 'Sem descrição.'}</p>
                        
                        <div className="flex justify-between items-center mt-6">
                           <div className="flex gap-1">
                              {lesson.resources.map((r, i) => (
                                <div key={i} className="w-2.5 h-2.5 rounded-full bg-brand/40" title={r.type}></div>
                              ))}
                           </div>
                            <div className="flex gap-2 relative z-10" onClick={e => e.stopPropagation()}>
                             <button onClick={() => { 
                               setEditingLessonId(lesson.id); 
                               setLessonTitle(lesson.title); 
                               setLessonDesc(lesson.description); 
                               setLessonResources(lesson.resources || []);
                               setShowLessonForm(true); 
                             }} className="p-2 text-c-text-muted hover:text-brand transition-colors"><Edit2 size={16} /></button>
                             <button onClick={() => setUserLessons(userLessons.filter(l => l.id !== lesson.id))} className="p-2 text-c-text-muted hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                {showLessonForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl pointer-events-auto" onClick={() => setShowLessonForm(false)}></div>
                    <div className="bg-brand-card border border-brand/30 w-full max-w-2xl rounded-[48px] shadow-2xl relative z-60 overflow-hidden pointer-events-auto animate-in zoom-in duration-300">
                      <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center">
                          <h3 className="text-3xl font-extrabold text-white tracking-tighter uppercase">{editingLessonId ? 'Editar Aula' : 'Nova Aula'}</h3>
                          <button onClick={() => setShowLessonForm(false)} className="text-c-text-secondary hover:text-white transition-colors p-2"><X size={24} /></button>
                        </div>

                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Título da Aula</label>
                            <input 
                              type="text" 
                              value={lessonTitle} 
                              onChange={(e) => setLessonTitle(e.target.value)}
                              placeholder="Fase 1: Introdução"
                              className="w-full bg-brand-bg border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-brand/30"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-c-text-secondary uppercase tracking-widest ml-1">Descrição/Texto da Aula</label>
                            <textarea 
                              value={lessonDesc} 
                              onChange={(e) => setLessonDesc(e.target.value)}
                              placeholder="Explique o conteúdo da aula ou cole links importantes..."
                              className="w-full bg-brand-bg border border-white/5 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-brand/30 h-48"
                            />
                          </div>

                           {/* Resource Manager */}
                           <div className="p-8 bg-black/20 border border-white/5 rounded-2xl space-y-6">
                              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                               <Zap size={18} className="text-brand" />
                               <span className="text-[10px] font-extrabold text-white uppercase tracking-widest">Gerenciar Conteúdo e Recursos</span>
                              </div>

                              {/* Resource Form */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[8px] font-extrabold text-c-text-secondary uppercase tracking-[0.2em] ml-1">Tipo</label>
                                  <select 
                                    value={resType}
                                    onChange={(e) => setResType(e.target.value as any)}
                                    className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none"
                                  >
                                    <option value="video">VÍDEO (YOUTUBE)</option>
                                    <option value="link">LINK EXTERNO</option>
                                    <option value="text">TEXTO / NOTA</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[8px] font-extrabold text-c-text-secondary uppercase tracking-[0.2em] ml-1">Título do Recurso</label>
                                  <input 
                                    type="text"
                                    value={resTitle}
                                    onChange={(e) => setResTitle(e.target.value)}
                                    placeholder="Ex: Aula Prática, PDF Complementar..."
                                    className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <label className="text-[8px] font-extrabold text-c-text-secondary uppercase tracking-[0.2em] ml-1">{resType === 'text' ? 'Conteúdo da Nota' : 'URL (VÍDEO OU LINK)'}</label>
                                  {resType === 'text' ? (
                                    <textarea 
                                      value={resContent}
                                      onChange={(e) => setResContent(e.target.value)}
                                      placeholder="Insira o texto aqui... (Suporta rolagem se for longo)"
                                      className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none h-40 resize-none custom-scrollbar"
                                    />
                                  ) : (
                                    <input 
                                      type="text"
                                      value={resUrl}
                                      onChange={(e) => setResUrl(e.target.value)}
                                      placeholder="https://..."
                                      className="w-full bg-brand-bg border border-white/5 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none"
                                    />
                                  )}
                                  {resType === 'text' && (
                                    <p className="text-[8px] text-c-text-muted font-bold uppercase tracking-widest text-right mt-1">Limite sugerido: ~3000 caracteres por recurso</p>
                                  )}
                                </div>
                              </div>

                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (!resTitle.trim()) return;
                                  const newRes: AcademyResource = {
                                    id: Date.now().toString(),
                                    title: resTitle.toUpperCase(),
                                    type: resType,
                                    url: resType !== 'text' ? resUrl : undefined,
                                    content: resType === 'text' ? resContent : undefined
                                  };
                                  setLessonResources([...lessonResources, newRes]);
                                  setResTitle('');
                                  setResUrl('');
                                  setResContent('');
                                }}
                                className="w-full bg-white/5 hover:bg-white/10 text-white font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-widest border border-white/5 transition-all"
                              >
                                + Adicionar este Recurso
                              </button>

                              {/* Resource List */}
                              {lessonResources.length > 0 && (
                                <div className="space-y-2 pt-4 border-t border-white/5">
                                  {lessonResources.map(res => (
                                    <div key={res.id} className="flex items-center justify-between bg-brand-bg p-3 rounded-xl border border-white/5">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                          res.type === 'video' ? 'bg-rose-500/10 text-rose-500' :
                                          res.type === 'link' ? 'bg-sky-500/10 text-sky-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                          <Zap size={14} />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-extrabold text-white uppercase">{res.title}</p>
                                          <p className="text-[8px] font-bold text-c-text-secondary uppercase tracking-widest">{res.type}</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => setLessonResources(lessonResources.filter(r => r.id !== res.id))}
                                        className="text-c-text-muted hover:text-rose-500 p-2"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                           </div>
                        </div>

                        <button 
                          onClick={() => {
                            if (!lessonTitle.trim() && lessonResources.length === 0) return;
                            const newLesson: UserLesson = {
                              id: editingLessonId || Date.now().toString(),
                              courseId: selectedCourseForLessons!,
                              title: lessonTitle.toUpperCase() || 'AULA SEM TÍTULO',
                              description: lessonDesc,
                              resources: lessonResources,
                              createdAt: new Date().toISOString()
                            };
                            if (editingLessonId) {
                              setUserLessons(userLessons.map(l => l.id === editingLessonId ? newLesson : l));
                            } else {
                              setUserLessons([...userLessons, newLesson]);
                            }
                            setShowLessonForm(false);
                          }}
                          className="w-full bg-brand text-white font-extrabold py-5 rounded-2xl uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.01] transition-all"
                        >
                          {editingLessonId ? 'Salvar Aula' : 'Criar Aula'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Content Viewer Modal */}
      {viewingLesson && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-brand-card w-full max-w-7xl h-full max-h-[95vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 flex justify-between items-center border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl"><GraduationCap size={28} /></div>
                <div>
                  <h3 className="text-2xl font-extrabold text-white uppercase tracking-tighter">{viewingLesson.title}</h3>
                  <p className="text-[10px] font-extrabold text-brand uppercase tracking-widest">AULA {userLessons.filter(l => l.courseId === viewingLesson.courseId).findIndex(l => l.id === viewingLesson.id) + 1}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleLessonCompletion(viewingLesson.id)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${studyProgress.completedLessons.includes(viewingLesson.id) ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white/5 text-c-text-secondary hover:text-brand hover:bg-brand/10'}`}
                >
                  {studyProgress.completedLessons.includes(viewingLesson.id) ? <Check size={16} strokeWidth={3} /> : <Zap size={16} />}
                  {studyProgress.completedLessons.includes(viewingLesson.id) ? 'CONCLUÍDO' : 'CONCLUIR AULA'}
                </button>
                <button 
                  onClick={() => { setViewingLesson(null); setActiveResourceId(null); }} 
                  className="w-14 h-14 bg-white/5 text-c-text-secondary rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                >
                  <X size={32} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Sidebar de Recursos */}
              <div className="w-full lg:w-64 bg-black/40 border-r border-white/5 flex flex-col overflow-hidden">
                <div className="p-6">
                  <p className="text-[9px] font-extrabold text-c-text-secondary uppercase tracking-widest mb-4">Recursos Disponíveis</p>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar">
                    {viewingLesson.resources.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setActiveResourceId(r.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${activeResource?.id === r.id ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'bg-white/5 text-c-text-secondary hover:bg-white/10'}`}
                      >
                        {r.type === 'video' ? <Zap size={14} className="text-rose-500" /> : r.type === 'text' ? <Zap size={14} className="text-emerald-500" /> : <Zap size={14} className="text-sky-500" />}
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-extrabold uppercase tracking-tight truncate">{r.title}</p>
                          <p className="text-[8px] opacity-60 font-extrabold uppercase">{r.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Visualizer */}
              <div className="flex-1 bg-brand-bg flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
                  {activeResource?.type === 'video' && activeResource.url && (
                    <div className="space-y-8 animate-in zoom-in duration-500">
                      <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                        <iframe 
                          src={getEmbedUrl(activeResource.url)} 
                          className="w-full h-full" 
                          frameBorder="0" 
                          allowFullScreen
                          title={activeResource.title}
                        ></iframe>
                      </div>
                      <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">{activeResource.title}</h2>
                    </div>
                  )}

                  {activeResource?.type === 'text' && (
                    <div className="w-full space-y-10 animate-in slide-in-from-bottom duration-500">
                      <h2 className="text-4xl font-extrabold text-white uppercase tracking-tighter border-b border-brand/20 pb-8">{activeResource.title}</h2>
                      <div className="bg-white/5 rounded-2xl border border-white/10 px-16 py-12">
                        <div className="text-gray-300 text-lg leading-relaxed font-medium space-y-6 whitespace-pre-wrap">
                          {activeResource.content || 'Sem conteúdo disponível.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeResource?.type === 'link' && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
                      <div className="w-24 h-24 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border border-brand/20 shadow-2xl">
                        <Plus size={48} className="rotate-45" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-extrabold text-white uppercase tracking-tighter mb-4">{activeResource.title}</h2>
                        <p className="text-c-text-secondary max-w-sm font-medium">Este é um recurso externo. Clique no botão abaixo para abrir em uma nova guia.</p>
                      </div>
                      <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="bg-brand text-white px-10 py-5 rounded-2xl font-extrabold uppercase tracking-[0.2em] shadow-xl shadow-brand/20 hover:scale-105 transition-all">
                        ABRIR LINK EXTERNO
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(108, 59, 255, 0.2); border-radius: 10px; }
        .neon-text { text-shadow: 0 0 20px rgba(108, 59, 255, 0.3); }
        .glass-card { background: rgba(22, 27, 34, 0.4); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        input[type="time"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>
    </div>
  );
};

export default Studies;
