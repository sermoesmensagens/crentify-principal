import React from 'react';
import { Book, MessageSquare, Briefcase, CalendarCheck, Check, Flame, Trophy, Zap, GraduationCap, Target, Clock } from 'lucide-react';
import { useBible } from '../contexts/BibleContext';
import { useDiary } from '../contexts/DiaryContext';
import { useTarefas } from '../contexts/TarefasContext';
import { useServices } from '../contexts/ServiceContext';
import { useAcademy } from '../contexts/AcademyContext';
import { useStudies } from '../contexts/StudyContext';
import { getLocalDateString, formatActivityDate } from '../utils';
import { useState, useEffect } from 'react';
import { SpiritualHabit, WorkflowTask, StudyItem, DiaryEntry } from '../types';

const Dashboard: React.FC = () => {
  const { progress: bibleProgress } = useBible();
  const { entries: diaryEntries } = useDiary();
  const { tasks } = useTarefas();
  const { details: serviceDetails, events } = useServices();
  const { progress: academyProgress, content } = useAcademy();
  const { studies } = useStudies();
  
  // Fetch Project Reminders
  const [projectReminders, setProjectReminders] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('crentify_projects');
    if (saved) {
      try {
        const projects = JSON.parse(saved);
        const allProjectReminders = projects.flatMap((p: any) => 
          (p.reminders || []).map((r: any) => ({ ...r, projectName: p.title, isProject: true }))
        );
        setProjectReminders(allProjectReminders);
      } catch (e) {
        console.error("Error parsing projects for dashboard:", e);
      }
    }
  }, []);

  const completedChaptersMap = bibleProgress?.completedChapters || {};
  const totalCompletedChapters = (Object.values(completedChaptersMap) as number[][]).reduce(
    (acc, chapters) => acc + (chapters?.length || 0),
    0
  );

  const TOTAL_BIBLE_CHAPTERS = 1189;
  const bibleProgressPercent = Math.round((totalCompletedChapters / TOTAL_BIBLE_CHAPTERS) * 100);
  const readingPercentage = ((totalCompletedChapters / TOTAL_BIBLE_CHAPTERS) * 100).toFixed(1);

  // Academy Progress Calculation
  const totalAcademyResources = content.reduce((acc, l) => acc + (l.resources?.length || 0), 0);
  const completedAcademyRes = content.reduce((acc, l) => acc + (l.resources?.filter(r => academyProgress.completedLessons.includes(r.id)).length || 0), 0);
  const academyProgressPercent = totalAcademyResources === 0 ? 0 : Math.round((completedAcademyRes / totalAcademyResources) * 100);



  const [today, setToday] = useState(getLocalDateString());
  const dayOfWeek = new Date().getDay();

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(getLocalDateString());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const [habitsFilter, setHabitsFilter] = useState<'hoje' | 'pendentes' | 'todas'>('hoje');
  const [tasksFilter, setTasksFilter] = useState<'hoje' | 'pendentes' | 'todas'>('hoje');
  const [studiesFilter, setStudiesFilter] = useState<'hoje' | 'pendentes' | 'todas'>('hoje');
  const [projectRemindersFilter, setProjectRemindersFilter] = useState<'hoje' | 'pendentes' | 'todas'>('hoje');

  const filterList = (list: any[], filterType: string) => {
    return list.filter(item => {
      const isPastDue = () => {
        if (item.frequency === 'once' && item.date && item.date < today && !item.completions[item.date]) return true;
        if (item.frequency === 'period' && item.endDate && item.endDate < today && !item.completions[item.endDate]) return true;
        return false;
      };

      const isToday = () => {
        if (item.frequency === 'daily') return true;
        if (item.frequency === 'weekly' && item.selectedDays?.includes(dayOfWeek)) return true;
        if (item.frequency === 'period' && item.startDate && item.endDate) {
          return today >= item.startDate && today <= item.endDate;
        }
        if (item.frequency === 'once' && item.date === today) return true;
        if (item.frequency === 'annual' && item.date?.slice(5) === today?.slice(5)) return true;
        if (item.frequency === 'monthly' && item.date?.slice(-2) === today?.slice(-2)) return true;
        return false;
      };

      if (filterType === 'hoje') return isToday();
      if (filterType === 'pendentes') return isPastDue() || (isToday() && !item.completions[today]);
      if (filterType === 'todas') return true;
      return false;
    }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));
  };

  const filteredTasks = filterList(tasks || [], tasksFilter);
  const filteredStudies = filterList(studies || [], studiesFilter);
  const filteredProjectReminders = filterList(projectReminders || [], projectRemindersFilter);

  const getUpcomingServices = () => {
    const todayNum = new Date().getDay();
    const todayDate = getLocalDateString();
    
    return serviceDetails.filter(detail => {
        return detail.frequencies.some(f => {
            if (f.type === 'weekly') return f.daysOfWeek?.includes(todayNum);
            if (f.type === 'once') return f.date === todayDate;
            if (f.type === 'period') return todayDate >= (f.startDate || '') && todayDate <= (f.endDate || '');
            return false;
        });
    }).sort((a, b) => (a.frequencies[0]?.time || '00:00').localeCompare(b.frequencies[0]?.time || '00:00'));
  };

  const upcomingServices = getUpcomingServices();

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">

      {/* ========== HERO SECTION ========== */}
      <section className="relative bg-gradient-to-br from-brand-card to-brand-bg rounded-3xl p-10 md:p-12 overflow-hidden min-h-[280px] flex flex-col justify-center">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-brand-accent/5 rounded-full -ml-10 -mb-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 space-y-5">
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand/10 border border-brand/20 rounded-full">
              <Zap size={12} className="text-brand-light fill-brand-light" />
              <span className="text-brand-light text-[12px] font-semibold uppercase tracking-[1px]">Novidade: Mentor Espiritual</span>
            </div>
            
            {/* Title - Sora Bold 42px */}
            <h1 className="text-3xl md:text-[42px] font-bold text-white leading-[1.1] tracking-tight">
              O que o seu coração <br className="hidden md:block" />
              <span className="text-brand-light">busca hoje?</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-c-text-secondary text-base md:text-[16px] max-w-lg">
              Shalom! Sua jornada espiritual e produtiva num só lugar.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak badge */}
            <div className="flex items-center gap-2.5 px-5 py-3 bg-brand-accent/10 border border-brand-accent/20 rounded-2xl">
              <Flame size={20} className="text-brand-accent animate-pulse" />
              <span className="text-brand-accent font-bold text-[11px] uppercase tracking-widest">7 Dias de Fogo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MÉTRICAS GRID ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Próximos Cultos', val: upcomingServices.length, icon: <CalendarCheck />, bg: 'bg-brand/10', text: 'text-brand', border: 'border-brand/20' },
          { label: 'Tarefas Hoje', val: filteredTasks.length, icon: <Briefcase />, bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
          { label: 'Estudos Hoje', val: filteredStudies.length, icon: <Target />, bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        ].map((card, i) => (
          <div key={i} className={`bg-brand-card p-7 rounded-3xl border ${card.border} flex items-center gap-5 group hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-black/20`}>
            <div className={`w-14 h-14 ${card.bg} ${card.text} rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6`}>
              {card.icon}
            </div>
            <div>
              <p className="text-[11px] text-c-text-muted uppercase font-bold tracking-widest mb-1">{card.label}</p>
              <p className="text-3xl font-extrabold text-white tracking-tight">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ========== BARRA DE PROGRESSO BÍBLIA ========== */}
      <div className="bg-brand-card p-7 rounded-3xl border border-brand/20 shadow-xl shadow-black/20 group hover:border-brand/40 transition-all duration-300 min-h-[120px] flex flex-col justify-center">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5 min-w-max">
            <div className="w-14 h-14 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
              <Book size={28} />
            </div>
            <div>
              <p className="text-[11px] text-c-text-muted uppercase font-bold tracking-widest mb-1">Jornada de Leitura Bíblica</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-white tracking-tight">{totalCompletedChapters}</p>
                <p className="text-xs text-c-text-muted font-semibold uppercase tracking-widest">/ {TOTAL_BIBLE_CHAPTERS} Capítulos</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="flex justify-between w-full mb-3">
              <span className="text-[11px] font-bold text-brand uppercase tracking-widest">Progresso Total</span>
              <span className="text-sm font-bold text-brand uppercase tracking-tight">{bibleProgressPercent}% Concluído</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-8 overflow-hidden border border-white/5 p-1.5 shadow-inner shadow-black/40 relative">
              <div 
                className="h-full accent-gradient rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(255,122,24,0.3)]"
                style={{ width: `${bibleProgressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== BARRA DE PROGRESSO ACADEMIA ========== */}
      <div className="bg-brand-card p-7 rounded-3xl border border-blue-500/20 shadow-xl shadow-black/20 group hover:border-blue-500/40 transition-all duration-300 min-h-[120px] flex flex-col justify-center">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-5 min-w-max">
            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
              <GraduationCap size={28} />
            </div>
            <div>
              <p className="text-[11px] text-c-text-muted uppercase font-bold tracking-widest mb-1">Jornada de Estudo Academia</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-white tracking-tight">{completedAcademyRes}</p>
                <p className="text-xs text-c-text-muted font-semibold uppercase tracking-widest">/ {totalAcademyResources} Tarefas</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="flex justify-between w-full mb-3">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-widest">Progresso Total</span>
              <span className="text-sm font-bold text-blue-500 uppercase tracking-tight">{academyProgressPercent}% Concluído</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-8 overflow-hidden border border-white/5 p-1.5 shadow-inner shadow-black/40 relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                style={{ width: `${academyProgressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN GRID: 2x2 LAYOUT ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bloco 1: Próximos Cultos & Eventos */}
        <section className="bg-brand-card p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
            <Zap size={120} className="text-brand" />
          </div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Zap className="text-brand" size={22} />
              Próximos Cultos
            </h2>
            <div className="flex bg-brand-bg p-1 rounded-xl border border-white/5">
                <span className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-brand text-white shadow-md">Hoje</span>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {upcomingServices.length === 0 ? (
              <div className="py-16 text-center opacity-30 italic font-semibold text-c-text-muted">Nenhum evento para hoje em sua lista.</div>
            ) : (
              upcomingServices.map((detail) => (
                <div key={detail.id} className="flex items-center justify-between p-5 bg-brand-bg/50 rounded-2xl border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-brand bg-brand/10 border border-brand/20">
                      <Clock size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold uppercase text-xs tracking-tight truncate text-white">{detail.title || (events.find(e => e.id === detail.eventId)?.title)}</h4>
                        <span className="px-1.5 py-0.5 bg-brand/10 border border-brand/20 rounded-full text-[8px] text-brand font-bold uppercase tracking-widest whitespace-nowrap">
                          {detail.frequencies.find(f => {
                              const d = new Date().getDay();
                              return f.type === 'weekly' && f.daysOfWeek?.includes(d) || f.type === 'once' || f.type === 'period';
                          })?.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-c-text-muted font-semibold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[200px]">{detail.churchNameOrId}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${detail.completions?.[today] ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg' : 'bg-brand neon-glow shadow-brand'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bloco 2: Tarefas (Produção) */}
        <section className="bg-brand-card p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
            <Briefcase size={120} className="text-blue-500" />
          </div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Briefcase className="text-blue-500" size={22} />
              Lista de Tarefas
            </h2>
            <div className="flex bg-brand-bg p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTasksFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${tasksFilter === f ? 'bg-blue-500 text-white shadow-md' : 'text-c-text-muted hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {filteredTasks.length === 0 ? (
              <div className="py-16 text-center opacity-30 italic font-semibold text-c-text-muted">Nenhuma tarefa na lista.</div>
            ) : (
              filteredTasks.map((task: WorkflowTask) => (
                <div key={task.id} className="flex items-center justify-between p-5 bg-brand-bg/50 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[10px] ${task.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/20'}`}>
                      {task.completions[today] ? <Check size={22} /> : (task.category?.slice(0, 2) || 'TA')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold uppercase text-xs tracking-tight truncate ${task.completions[today] ? 'text-c-text-muted line-through' : 'text-white'}`}>{task.category}</h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[8px] text-c-text-muted font-bold uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(task)}
                        </span>
                      </div>
                      <p className="text-[10px] text-c-text-muted font-semibold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{task.description || 'Execução Fiel'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${task.completions[today] ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bloco 3: Estudos (Crescimento) */}
        <section className="bg-brand-card p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
            <Target size={120} className="text-emerald-500" />
          </div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Target className="text-emerald-500" size={22} />
              Meus Estudos
            </h2>
            <div className="flex bg-brand-bg p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStudiesFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${studiesFilter === f ? 'bg-emerald-500 text-white shadow-md' : 'text-c-text-muted hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {filteredStudies.length === 0 ? (
              <div className="py-16 text-center opacity-30 italic font-semibold text-c-text-muted">Nenhum estudo na lista.</div>
            ) : (
              filteredStudies.map((study: StudyItem) => (
                <div key={study.id} className="flex items-center justify-between p-5 bg-brand-bg/50 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[10px] ${study.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}>
                      {study.completions[today] ? <Check size={22} /> : (study.category?.slice(0, 2) || 'ES')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold uppercase text-xs tracking-tight truncate ${study.completions[today] ? 'text-c-text-muted line-through' : 'text-white'}`}>{study.category}</h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[8px] text-c-text-muted font-bold uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(study)}
                        </span>
                      </div>
                      <p className="text-[10px] text-c-text-muted font-semibold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{study.description || 'Crescimento Contínuo'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${study.completions[today] ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bloco 4: Lembretes de Projetos */}
        <section className="bg-brand-card p-8 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
            <Briefcase size={120} className="text-brand" />
          </div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
              <Briefcase className="text-brand" size={22} />
              Lembretes de Projetos
            </h2>
            <div className="flex bg-brand-bg p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setProjectRemindersFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${projectRemindersFilter === f ? 'bg-brand text-white shadow-md' : 'text-c-text-muted hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            {filteredProjectReminders.length === 0 ? (
              <div className="py-16 text-center opacity-30 italic font-semibold text-c-text-muted">Nenhum lembrete na lista.</div>
            ) : (
              filteredProjectReminders.map((reminder: any) => (
                <div key={reminder.id} className="flex items-center justify-between p-5 bg-brand-bg/50 rounded-2xl border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-[10px] ${reminder.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-brand/20 text-brand border border-brand/20'}`}>
                      {reminder.completions[today] ? <Check size={22} /> : (reminder.title?.slice(0, 2) || 'PR')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold uppercase text-[10px] tracking-tight truncate ${reminder.completions[today] ? 'text-c-text-muted line-through' : 'text-c-text-secondary'}`}>
                          {reminder.projectName}
                        </h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[8px] text-c-text-muted font-bold uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(reminder)}
                        </span>
                      </div>
                      <h5 className={`font-bold uppercase text-xs tracking-tight truncate ${reminder.completions[today] ? 'text-c-text-muted line-through' : 'text-white'}`}>{reminder.title}</h5>
                      {reminder.description && <p className="text-[10px] text-c-text-muted font-semibold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{reminder.description}</p>}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${reminder.completions[today] ? 'bg-emerald-500 shadow-emerald-500/50 shadow-lg' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* ========== MENTOR IA - LARGURA TOTAL ========== */}
      <section className="bg-gradient-to-br from-brand to-brand-dark p-10 md:p-12 rounded-3xl text-white shadow-xl shadow-brand/10 relative overflow-hidden group w-full">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-5 w-full">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Mentor IA</h2>
            <div className="bg-black/20 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-inner">
              <p className="text-brand-light text-[11px] font-bold uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Zap size={12} className="fill-brand-light" /> Meditação do Dia
              </p>
              <p className="text-xl md:text-2xl font-medium leading-snug italic font-serif">"Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio."</p>
              <p className="text-right text-[12px] font-bold uppercase text-white/40 mt-5 tracking-widest">— 2 Timóteo 1:7</p>
            </div>
          </div>
          <div className="shrink-0">
            <button className="accent-gradient text-white px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.15em] text-sm shadow-xl hover:scale-105 active:scale-95 transition-all accent-gradient-hover">Acessar Mentor</button>
          </div>
        </div>
      </section>

      {/* ========== MEMÓRIAS RECENTES ========== */}
      <section className="bg-brand-card p-10 md:p-12 rounded-3xl border border-white/5 shadow-xl overflow-hidden w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-5">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight flex items-center gap-4 text-white">
              <div className="p-2.5 bg-brand/10 rounded-xl border border-brand/20">
                <MessageSquare size={24} className="text-brand" />
              </div>
              Memórias Recentes
            </h3>
            <p className="text-c-text-secondary text-sm mt-2 font-medium">Sua jornada de fidelidade registrada no tempo.</p>
          </div>
          <div className="flex items-center gap-3 bg-brand-bg/60 px-5 py-2.5 rounded-xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-bold text-c-text-muted uppercase tracking-widest">Acompanhamento Ativo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Timeline de Atividades */}
          <div className="lg:col-span-8 space-y-6">
            {(() => {
              // Agregação de atividades por data
              const activityLog: Record<string, any[]> = {};
              const addToLog = (date: string, type: string, label: string) => {
                const d = date.split('T')[0];
                if (!activityLog[d]) activityLog[d] = [];
                activityLog[d].push({ type, label });
              };

              // 1. Bíblia
              if (bibleProgress?.completionDates) {
                Object.keys(bibleProgress.completionDates).forEach(book => {
                  Object.keys(bibleProgress.completionDates![book]).forEach(ch => {
                    addToLog(bibleProgress.completionDates![book][Number(ch)], 'bible', `Capítulo ${ch} de ${book}`);
                  });
                });
              }

              // 2. Academia
              if (academyProgress?.records) {
                Object.keys(academyProgress.records).forEach(resId => {
                  const rec = academyProgress.records![resId];
                  if (rec.completed && rec.completedAt) {
                    addToLog(rec.completedAt, 'academy', 'Tarefa concluída');
                  }
                });
              }

              // 3. Atividades (Últimos 7 dias)
              const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
              });

              tasks.forEach(t => {
                last7Days.forEach(d => {
                  if (t.completions[d]) addToLog(d, 'task', t.category);
                });
              });

              studies.forEach(s => {
                last7Days.forEach(d => {
                  if (s.completions[d]) addToLog(d, 'study', s.category);
                });
              });

              // Ordenar datas
              const sortedDates = Object.keys(activityLog).sort((a, b) => b.localeCompare(a)).slice(0, 5);

              if (sortedDates.length === 0) {
                return (
                  <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-3xl opacity-20">
                    <Zap size={40} className="mx-auto mb-4 text-c-text-muted" />
                    <p className="text-sm font-bold uppercase tracking-widest italic">Inicie sua jornada hoje para ver seu histórico aqui...</p>
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {sortedDates.map(date => {
                    const activities = activityLog[date];
                    const isToday = date === today;
                    return (
                      <div key={date} className="relative pl-8 group">
                        {/* Linha da Timeline */}
                        <div className="absolute left-3 top-0 bottom-0 w-px bg-white/5 group-last:bg-transparent"></div>
                        <div className={`absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full border-4 border-brand-card z-10 transition-all ${isToday ? 'bg-brand-accent scale-125 shadow-[0_0_10px_rgba(255,122,24,0.5)]' : 'bg-c-text-muted'}`}></div>
                        
                        <div className="bg-brand-bg/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                            <h4 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-3">
                              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              {isToday && <span className="bg-brand-accent/20 text-brand-accent text-[8px] px-2 py-0.5 rounded-full font-bold tracking-widest">HOJE</span>}
                            </h4>
                            <span className="text-[10px] font-bold text-c-text-muted uppercase tracking-widest bg-brand-bg/60 px-3 py-1 rounded-lg border border-white/5">
                              {activities.length} {activities.length === 1 ? 'Atividade' : 'Atividades'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {activities.slice(0, 6).map((act, i) => (
                              <div key={i} className={`text-[8px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                                act.type === 'bible' ? 'bg-brand/10 text-brand border-brand/20' :
                                act.type === 'academy' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                act.type === 'habit' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' :
                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  act.type === 'bible' ? 'bg-brand' :
                                  act.type === 'academy' ? 'bg-blue-500' :
                                  act.type === 'habit' ? 'bg-brand-accent' :
                                  'bg-emerald-500'
                                }`}></div>
                                {act.label}
                              </div>
                            ))}
                            {activities.length > 6 && <span className="text-[8px] font-bold text-c-text-muted self-center">+ {activities.length - 6} mais</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Últimos Registros do Diário */}
          <div className="lg:col-span-4 space-y-5">
            <h5 className="text-[11px] font-bold text-c-text-muted uppercase tracking-[0.2em] pl-2 flex items-center gap-2">
              <Book size={14} className="text-brand" /> Notas do Diário
            </h5>
            <div className="space-y-3">
              {(diaryEntries || []).slice(0, 3).map((entry: DiaryEntry) => (
                <div key={entry.id} className="bg-brand-bg/60 p-5 rounded-2xl border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-brand/5 rounded-xl flex items-center justify-center text-brand border border-brand/10 group-hover:bg-brand group-hover:text-white transition-all">
                      <MessageSquare size={16} />
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-bold text-white text-xs uppercase tracking-tight truncate">{entry.title}</h6>
                      <p className="text-[8px] text-c-text-muted font-semibold uppercase tracking-widest mt-0.5">
                        {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-c-text-muted text-[11px] leading-relaxed line-clamp-2 font-medium italic">"{entry.content.slice(0, 100)}..."</p>
                </div>
              ))}
              {diaryEntries.length === 0 && (
                <div className="p-6 text-center bg-brand-bg/40 rounded-2xl border border-dashed border-white/5 opacity-30">
                  <p className="text-[9px] font-bold uppercase tracking-widest">Nenhuma nota registrada</p>
                </div>
              )}
              <button className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-brand hover:text-white transition-colors">
                Ver Todo o Diário
              </button>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(108, 59, 255, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
