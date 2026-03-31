import React from 'react';
import { Book, MessageSquare, Briefcase, CalendarCheck, Check, Flame, Trophy, Zap, GraduationCap, Target, Clock } from 'lucide-react';
import { useBible } from '../contexts/BibleContext';
import { useDiary } from '../contexts/DiaryContext';
import { useTarefas } from '../contexts/TarefasContext';
import { useHabits } from '../contexts/HabitsContext';
import { useAcademy } from '../contexts/AcademyContext';
import { useStudies } from '../contexts/StudyContext';
import { getLocalDateString, formatActivityDate } from '../utils';
import { useState, useEffect } from 'react';
import { SpiritualHabit, WorkflowTask, StudyItem, DiaryEntry } from '../types';

const Dashboard: React.FC = () => {
  const { progress: bibleProgress } = useBible();
  const { entries: diaryEntries } = useDiary();
  const { tasks } = useTarefas();
  const { habits } = useHabits();
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

  const filteredHabits = filterList(habits || [], habitsFilter);
  const filteredTasks = filterList(tasks || [], tasksFilter);
  const filteredStudies = filterList(studies || [], studiesFilter);
  const filteredProjectReminders = filterList(projectReminders || [], projectRemindersFilter);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">


      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text">Dashboard</h1>
          <p className="text-gray-500 mt-2 font-medium">Shalom! Sua jornada espiritual e produtiva num só lugar.</p>
        </div>
        <div className="flex items-center gap-4 glass-card p-3 rounded-[32px] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-2.5 px-6 py-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
            <Flame size={20} className="text-orange-500 animate-pulse" />
            <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest">7 Dias de Fogo</span>
          </div>
          <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand border border-brand/20 neon-glow">
            <Zap size={28} />
          </div>
        </div>
      </header>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Disciplinas Ativas', val: filteredHabits.length, icon: <CalendarCheck />, bg: 'bg-brand/10', text: 'text-brand' },
          { label: 'Tarefas Hoje', val: filteredTasks.length, icon: <Briefcase />, bg: 'bg-blue-500/10', text: 'text-blue-500' },
          { label: 'Estudos Hoje', val: filteredStudies.length, icon: <Target />, bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
        ].map((card, i) => (
          <div key={i} className="bg-[#161b22] p-8 rounded-[40px] border border-white/5 flex items-center gap-6 group hover:border-brand/30 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-black/40">
            <div className={`w-16 h-16 ${card.bg} ${card.text} rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6`}>
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{card.label}</p>
              <p className="text-4xl font-black text-white tracking-tighter uppercase">{card.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bible Progress Bar Segment */}
      <div className="bg-[#161b22] p-8 rounded-[40px] border border-brand/20 shadow-xl shadow-black/40 group hover:border-brand/40 transition-all duration-300 min-h-[140px] flex flex-col justify-center">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6 min-w-max">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
              <Book size={32} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Jornada de Leitura Bíblica</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-white tracking-tighter uppercase">{totalCompletedChapters}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">/ {TOTAL_BIBLE_CHAPTERS} Capítulos</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="flex justify-between w-full mb-3">
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">Progresso Total</span>
              <span className="text-sm font-black text-brand uppercase tracking-tighter">{bibleProgressPercent}% Concluído</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-10 overflow-hidden border border-white/5 p-2 shadow-inner shadow-black/60 relative">
              <div 
                className="h-full bg-gradient-to-r from-brand to-brand-light rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(135,67,242,0.4)]"
                style={{ width: `${bibleProgressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Academy Progress Bar Segment */}
      <div className="bg-[#161b22] p-8 rounded-[40px] border border-blue-500/20 shadow-xl shadow-black/40 group hover:border-blue-500/40 transition-all duration-300 min-h-[140px] flex flex-col justify-center">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6 min-w-max">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
              <GraduationCap size={32} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Jornada de Estudo Academia</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black text-white tracking-tighter uppercase">{completedAcademyRes}</p>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">/ {totalAcademyResources} Tarefas</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full relative">
            <div className="flex justify-between w-full mb-3">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Progresso Total</span>
              <span className="text-sm font-black text-blue-500 uppercase tracking-tighter">{academyProgressPercent}% Concluído</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-10 overflow-hidden border border-white/5 p-2 shadow-inner shadow-black/60 relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                style={{ width: `${academyProgressPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 2x2 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bloco 1: Disciplinas (Espiritual) */}
        <section className="bg-[#161b22] p-10 rounded-[56px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Zap size={150} className="text-brand" />
          </div>
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Zap className="text-brand" size={24} />
              Disciplinas Espirituais
            </h2>
            <div className="flex bg-[#0b0e14] p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setHabitsFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${habitsFilter === f ? 'bg-brand text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {filteredHabits.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic font-bold">Nenhuma disciplina na lista.</div>
            ) : (
              filteredHabits.map((habit: SpiritualHabit) => (
                <div key={habit.id} className="flex items-center justify-between p-6 bg-[#0b0e14]/50 rounded-[32px] border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] ${habit.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-brand/20 text-brand border border-brand/20'}`}>
                      {habit.completions[today] ? <Check size={24} /> : (habit.category?.slice(0, 2) || 'DI')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-black uppercase text-xs tracking-tighter truncate ${habit.completions[today] ? 'text-gray-700 line-through' : 'text-white'}`}>{habit.category}</h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[7px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(habit)}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{habit.description || 'Fidelidade Diária'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${habit.completions[today] ? 'bg-emerald-500 neon-glow shadow-emerald-500' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bloco 2: Tarefas (Produção) */}
        <section className="bg-[#161b22] p-10 rounded-[56px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Briefcase size={150} className="text-blue-500" />
          </div>
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Briefcase className="text-blue-500" size={24} />
              Lista de Tarefas
            </h2>
            <div className="flex bg-[#0b0e14] p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTasksFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${tasksFilter === f ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {filteredTasks.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic font-bold">Nenhuma tarefa na lista.</div>
            ) : (
              filteredTasks.map((task: WorkflowTask) => (
                <div key={task.id} className="flex items-center justify-between p-6 bg-[#0b0e14]/50 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] ${task.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-blue-500/20 text-blue-500 border border-blue-500/20'}`}>
                      {task.completions[today] ? <Check size={24} /> : (task.category?.slice(0, 2) || 'TA')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-black uppercase text-xs tracking-tighter truncate ${task.completions[today] ? 'text-gray-700 line-through' : 'text-white'}`}>{task.category}</h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[7px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(task)}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{task.description || 'Execução Fiel'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${task.completions[today] ? 'bg-emerald-500 neon-glow shadow-emerald-500' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Bloco 3: Estudos (Crescimento) */}
        <section className="bg-[#161b22] p-10 rounded-[56px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Target size={150} className="text-emerald-500" />
          </div>
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Target className="text-emerald-500" size={24} />
              Meus Estudos
            </h2>
            <div className="flex bg-[#0b0e14] p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStudiesFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${studiesFilter === f ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {filteredStudies.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic font-bold">Nenhum estudo na lista.</div>
            ) : (
              filteredStudies.map((study: StudyItem) => (
                <div key={study.id} className="flex items-center justify-between p-6 bg-[#0b0e14]/50 rounded-[32px] border border-white/5 hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] ${study.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/20'}`}>
                      {study.completions[today] ? <Check size={24} /> : (study.category?.slice(0, 2) || 'ES')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-black uppercase text-xs tracking-tighter truncate ${study.completions[today] ? 'text-gray-700 line-through' : 'text-white'}`}>{study.category}</h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[7px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(study)}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{study.description || 'Crescimento Contínuo'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${study.completions[today] ? 'bg-emerald-500 neon-glow shadow-emerald-500' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>



        {/* Bloco 6: Lembretes de Projetos */}
        <section className="bg-[#161b22] p-10 rounded-[56px] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col h-[500px]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
            <Briefcase size={150} className="text-brand" />
          </div>
          <div className="flex justify-between items-center mb-10 relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              <Briefcase className="text-brand" size={24} />
              Lembretes de Projetos
            </h2>
            <div className="flex bg-[#0b0e14] p-1 rounded-xl border border-white/5">
              {(['hoje', 'pendentes', 'todas'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setProjectRemindersFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${projectRemindersFilter === f ? 'bg-brand text-white shadow-md' : 'text-gray-500 hover:text-white'}`}
                >
                  {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pend' : 'Todas'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {filteredProjectReminders.length === 0 ? (
              <div className="py-20 text-center opacity-30 italic font-bold">Nenhum lembrete na lista.</div>
            ) : (
              filteredProjectReminders.map((reminder: any) => (
                <div key={reminder.id} className="flex items-center justify-between p-6 bg-[#0b0e14]/50 rounded-[32px] border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[10px] ${reminder.completions[today] ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-brand/20 text-brand border border-brand/20'}`}>
                      {reminder.completions[today] ? <Check size={24} /> : (reminder.title?.slice(0, 2) || 'PR')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-black uppercase text-[10px] tracking-tighter truncate ${reminder.completions[today] ? 'text-gray-700 line-through' : 'text-gray-400'}`}>
                          {reminder.projectName}
                        </h4>
                        <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[7px] text-gray-400 font-black uppercase tracking-widest whitespace-nowrap">
                          {formatActivityDate(reminder)}
                        </span>
                      </div>
                      <h5 className={`font-black uppercase text-xs tracking-tighter truncate ${reminder.completions[today] ? 'text-gray-700 line-through' : 'text-white'}`}>{reminder.title}</h5>
                      {reminder.description && <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70 truncate max-w-[150px]">{reminder.description}</p>}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${reminder.completions[today] ? 'bg-emerald-500 neon-glow shadow-emerald-500' : 'bg-white/5 border border-white/10'}`}></div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Mentor IA - Largura Total */}
      <section className="bg-gradient-to-br from-brand to-brand-dark p-12 rounded-[56px] text-white shadow-2xl shadow-brand/20 relative overflow-hidden group w-full">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6 w-full">
            <h2 className="text-4xl font-black uppercase tracking-tighter">Mentor IA</h2>
            <div className="bg-black/20 backdrop-blur-md p-10 rounded-[40px] border border-white/10 shadow-inner">
              <p className="text-brand-light text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                <Zap size={12} className="fill-brand-light" /> Meditação do Dia
              </p>
              <p className="text-2xl font-medium leading-snug italic font-serif">"Pois Deus não nos deu espírito de covardia, mas de poder, de amor e de equilíbrio."</p>
              <p className="text-right text-[12px] font-black uppercase text-white/40 mt-6 tracking-widest">— 2 Timóteo 1:7</p>
            </div>
          </div>
          <div className="shrink-0">
            <button className="bg-white text-brand px-12 py-7 rounded-[28px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all">Acessar Mentor</button>
          </div>
        </div>
      </section>

      {/* Memórias Recentes - Histórico de Atividades */}
      <section className="bg-[#161b22] p-12 rounded-[56px] border border-white/5 shadow-2xl overflow-hidden w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 text-white">
              <div className="p-3 bg-brand/10 rounded-2xl border border-brand/20">
                <MessageSquare size={28} className="text-brand" />
              </div>
              Memórias Recentes
            </h3>
            <p className="text-gray-500 text-sm mt-2 font-medium">Sua jornada de fidelidade registrada no tempo.</p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acompanhamento Ativo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Timeline de Atividades */}
          <div className="lg:col-span-8 space-y-8">
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

              // 3. Hábitos (Últimos 7 dias)
              const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
              });

              habits.forEach(h => {
                last7Days.forEach(d => {
                  if (h.completions[d]) addToLog(d, 'habit', h.category);
                });
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
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
                    <Zap size={48} className="mx-auto mb-4 text-gray-500" />
                    <p className="text-sm font-black uppercase tracking-widest italic">Inicie sua jornada hoje para ver seu histórico aqui...</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {sortedDates.map(date => {
                    const activities = activityLog[date];
                    const isToday = date === today;
                    return (
                      <div key={date} className="relative pl-10 group">
                        {/* Linha da Timeline */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-white/5 group-last:bg-transparent"></div>
                        <div className={`absolute left-2 top-2 w-4 h-4 rounded-full border-4 border-[#161b22] z-10 transition-all ${isToday ? 'bg-brand scale-125 shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)]' : 'bg-gray-700'}`}></div>
                        
                        <div className="bg-[#0b0e14]/40 p-6 rounded-[32px] border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <h4 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                              {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                              {isToday && <span className="bg-brand/20 text-brand text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest">HOJE</span>}
                            </h4>
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                              {activities.length} {activities.length === 1 ? 'Atividade' : 'Atividades'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {activities.slice(0, 6).map((act, i) => (
                              <div key={i} className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                                act.type === 'bible' ? 'bg-brand/10 text-brand border-brand/20' :
                                act.type === 'academy' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                act.type === 'habit' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                                'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  act.type === 'bible' ? 'bg-brand' :
                                  act.type === 'academy' ? 'bg-blue-500' :
                                  act.type === 'habit' ? 'bg-orange-500' :
                                  'bg-emerald-500'
                                }`}></div>
                                {act.label}
                              </div>
                            ))}
                            {activities.length > 6 && <span className="text-[8px] font-black text-gray-700 self-center">+ {activities.length - 6} mais</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Últimos Registros do Diário (Agora como Notas Laterais) */}
          <div className="lg:col-span-4 space-y-6">
            <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] pl-2 flex items-center gap-2">
              <Book size={14} className="text-brand" /> Notas do Diário
            </h5>
            <div className="space-y-4">
              {(diaryEntries || []).slice(0, 3).map((entry: DiaryEntry) => (
                <div key={entry.id} className="bg-[#0b0e14]/80 p-6 rounded-[28px] border border-white/5 hover:border-brand/30 transition-all group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand/5 rounded-xl flex items-center justify-center text-brand border border-brand/10 group-hover:bg-brand group-hover:text-white transition-all">
                      <MessageSquare size={18} />
                    </div>
                    <div className="min-w-0">
                      <h6 className="font-black text-white text-xs uppercase tracking-tight truncate">{entry.title}</h6>
                      <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">
                        {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 font-medium italic">"{entry.content.slice(0, 100)}..."</p>
                </div>
              ))}
              {diaryEntries.length === 0 && (
                <div className="p-8 text-center bg-black/20 rounded-[32px] border border-dashed border-white/5 opacity-30">
                  <p className="text-[8px] font-black uppercase tracking-widest">Nenhuma nota registrada</p>
                </div>
              )}
              <button className="w-full py-4 text-[9px] font-black uppercase tracking-[0.2em] text-brand hover:text-white transition-colors">
                Ver Todo o Diário
              </button>
            </div>
          </div>
        </div>
      </section>


      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(135, 67, 242, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;
