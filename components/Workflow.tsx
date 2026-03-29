
import React, { useState } from 'react';
import { WorkflowTask, WorkflowCategory, HabitFrequency } from '../types';
import { Plus, Check, Trash2, Calendar, Zap, Target, Clock, Edit2, X, Briefcase, Settings } from 'lucide-react';
import { useTarefas } from '../contexts/TarefasContext';
import { getLocalDateString, formatActivityDate } from '../utils';

const Workflow: React.FC = () => {
  const { tasks, setTasks, categories, setCategories } = useTarefas();
  const timeInputRef = React.useRef<HTMLInputElement>(null);
  const startDateRef = React.useRef<HTMLInputElement>(null);
  const endDateRef = React.useRef<HTMLInputElement>(null);
  const targetDateRef = React.useRef<HTMLInputElement>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('Reunião');
  const [description, setDescription] = useState('');
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


  const [today, setToday] = useState(getLocalDateString());
  const dayOfWeek = new Date().getDay();

  React.useEffect(() => {
    const timer = setInterval(() => {
      setToday(getLocalDateString());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const resetForm = () => {
    setEditingTaskId(null);
    setCategory(categories[0]?.name || 'Reunião');
    setDescription('');
    setFrequency('daily');
    setSelectedDays([]);
    setStartDate('');
    setEndDate('');
    setTargetDate('');
    setTime('09:00');
  };

  const handleCreateOrUpdate = () => {
    console.log('🔍 handleCreateOrUpdate called');
    console.log('📊 Current state:', {
      frequency,
      selectedDays,
      startDate,
      endDate,
      targetDate,
      description,
      editingTaskId
    });

    if (editingTaskId) {
      const updatedTasks = tasks.map(t => {
        if (t.id === editingTaskId) {
          return {
            ...t,
            category,
            description,
            frequency,
            time,
            selectedDays: frequency === 'weekly' ? selectedDays : undefined,
            startDate: frequency === 'period' ? startDate : undefined,
            endDate: frequency === 'period' ? endDate : undefined,
            date: (frequency === 'once' || frequency === 'annual') ? targetDate : undefined,
          };
        }
        return t;
      });
      console.log('✏️ Updating task:', updatedTasks);
      setTasks(updatedTasks);
    } else {
      const newTask: WorkflowTask = {
        id: Date.now().toString(),
        category,
        description,
        frequency,
        time,
        selectedDays: frequency === 'weekly' ? selectedDays : undefined,
        startDate: frequency === 'period' ? startDate : undefined,
        endDate: frequency === 'period' ? endDate : undefined,
        date: (frequency === 'once' || frequency === 'annual') ? targetDate : undefined,
        completions: {}
      };
      console.log('✅ Creating new task:', newTask);
      setTasks([...tasks, newTask]);
    }
    resetForm();
  };

  const startEdit = (task: WorkflowTask) => {
    setEditingTaskId(task.id);
    setCategory(task.category);
    setDescription(task.description);
    setFrequency(task.frequency);
    setTime(task.time || '09:00');
    setSelectedDays(task.selectedDays || []);
    setStartDate(task.startDate || '');
    setEndDate(task.endDate || '');
    setTargetDate(task.date || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = (taskId: string) => {
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const completions = { ...t.completions };
        completions[today] = !completions[today];
        return { ...t, completions };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    if (confirm('Deseja excluir esta tarefa?')) {
      setTasks(tasks.filter(t => t.id !== id));
      if (editingTaskId === id) resetForm();
    }
  };

  const filteredTasks = tasks.filter(task => {
    const isPastDue = () => {
      if (task.frequency === 'once' && task.date && task.date < today && !task.completions[task.date]) return true;
      if (task.frequency === 'period' && task.endDate && task.endDate < today && !task.completions[task.endDate]) return true;
      return false;
    };

    const isToday = () => {
      if (task.frequency === 'daily') return true;
      if (task.frequency === 'weekly' && task.selectedDays?.includes(dayOfWeek)) return true;
      if (task.frequency === 'period' && task.startDate && task.endDate) {
        return today >= task.startDate && today <= task.endDate;
      }
      if (task.frequency === 'once' && task.date === today) return true;
      if (task.frequency === 'annual' && task.date?.slice(5) === today.slice(5)) return true;
      if (task.frequency === 'monthly' && task.date?.slice(-2) === today.slice(-2)) return true;
      return false;
    };

    if (filter === 'hoje') return isToday();
    if (filter === 'pendentes') return isPastDue() || (isToday() && !task.completions[today]);
    if (filter === 'todas') return true;
    return false;
  }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: WorkflowCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim()
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
    setCategories(categories.map(c =>
      c.id === id ? { ...c, name: newName } : c
    ));
    setEditingCategoryId(null);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <Briefcase size={42} className="text-brand" />
            Tarefas
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Organize suas tarefas diárias e acompanhe seu progresso.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <div className="px-5 py-2.5 bg-brand/10 border border-brand/20 rounded-2xl text-brand font-black text-[10px] tracking-[0.2em] uppercase">
            {editingTaskId ? 'Editando Tarefa' : 'Produtividade Ativa'}
          </div>
        </div>
      </header>

      {/* Card de Criação Neon Style */}
      <div className={`bg-[#161b22] border transition-all duration-500 p-10 rounded-[48px] shadow-2xl relative overflow-hidden group ${editingTaskId ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'}`}>
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
          <Target size={180} className="text-brand" />
        </div>

        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex flex-wrap gap-2.5 justify-center md:justify-start">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.name)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-300 border ${category === cat.name
                    ? 'bg-brand text-white border-brand shadow-[0_0_15px_rgba(135,67,242,0.4)]'
                    : 'bg-white/5 text-gray-500 border-white/5 hover:border-brand/30 hover:text-brand'
                    }`}
                >
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() => setShowCategoryManager(!showCategoryManager)}
                className="px-4 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all duration-300 border bg-white/5 text-gray-500 border-white/5 hover:border-brand/30 hover:text-brand"
              >
                <Edit2 size={16} />
              </button>
            </div>
            {editingTaskId && (
              <button
                onClick={resetForm}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Category Manager */}
          {showCategoryManager && (
            <div className="bg-black/20 p-6 rounded-[28px] border border-white/5 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-brand uppercase tracking-widest">Gerenciar Categorias</h3>
                <button onClick={() => setShowCategoryManager(false)} className="text-gray-500 hover:text-white">
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
                  className="flex-1 bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-2 text-white text-xs font-bold placeholder:text-gray-700 outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-2 bg-brand text-white rounded-xl font-black text-[10px] hover:scale-105 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 bg-[#0b0e14] p-3 rounded-xl">
                    {editingCategoryId === cat.id ? (
                      <input
                        type="text"
                        defaultValue={cat.name}
                        onBlur={(e) => updateCategoryName(cat.id, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && updateCategoryName(cat.id, (e.target as HTMLInputElement).value)}
                        autoFocus
                        className="flex-1 bg-transparent border-b border-brand text-white text-xs font-bold outline-none"
                      />
                    ) : (
                      <span className="flex-1 text-white text-xs font-bold">{cat.name}</span>
                    )}
                    <button
                      onClick={() => setEditingCategoryId(cat.id)}
                      className="p-1 text-gray-500 hover:text-brand transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1 text-gray-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Detalhes da Tarefa</label>
            <input
              type="text"
              placeholder="Ex: Reunião com cliente, Apresentação de projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-bold placeholder:text-gray-700 focus:ring-2 focus:ring-brand/30 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Frequência</label>
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
                    className={`px-5 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${frequency === f.id
                      ? 'bg-brand/20 text-brand border border-brand/40 shadow-[0_0_10px_rgba(135,67,242,0.2)]'
                      : 'bg-white/5 text-gray-600 border border-transparent'
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Controles Dinâmicos */}
            <div className="bg-black/20 p-6 rounded-[28px] border border-white/5 min-h-[80px] flex items-center justify-center">
              {frequency === 'weekly' && (
                <div className="flex gap-1.5">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(day => day !== i) : [...prev, i])}
                      className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${selectedDays.includes(i) ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white/5 border-white/5 text-gray-600'
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                              {frequency === 'period' && (
                <div className="flex gap-4 items-center w-full">
                  <div className="relative group flex-1">
                    <input ref={startDateRef} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 p-4 pr-12 rounded-2xl text-[10px] font-black text-brand outline-none focus:ring-1 focus:ring-brand/30 transition-all" />
                    <button 
                      onClick={() => startDateRef.current?.showPicker()} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all shadow-sm z-10"
                      title="Data de Início"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-gray-600 font-black text-[10px] uppercase shrink-0">até</span>
                  <div className="relative group flex-1">
                    <input ref={endDateRef} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 p-4 pr-12 rounded-2xl text-[10px] font-black text-brand outline-none focus:ring-1 focus:ring-brand/30 transition-all" />
                    <button 
                      onClick={() => endDateRef.current?.showPicker()} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all shadow-sm z-10"
                      title="Data de Fim"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}   </div>
              )}
               {(frequency === 'once' || frequency === 'annual' || frequency === 'monthly') && (
                <div className="relative group w-full">
                  <input ref={targetDateRef} type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 p-4 pr-12 rounded-2xl text-[10px] font-black text-brand outline-none focus:ring-1 focus:ring-brand/30 transition-all" />
                  <button 
                    onClick={() => targetDateRef.current?.showPicker()} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all shadow-sm z-10"
                    title="Selecionar Data"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              )}
              {frequency === 'daily' && (
                <div className="flex items-center gap-2 text-brand/40">
                  <Clock size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Todos os dias sem falta</span>
                </div>
              )}
            </div>
          </div>

          {/* Time Selector - Standardized */}
          <div className="bg-black/20 p-6 rounded-[28px] border border-white/5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-4 block">Horário da Tarefa</label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center border border-brand/30 shadow-[0_0_15px_rgba(135,67,242,0.2)]">
                <Clock size={24} className="text-brand animate-pulse" />
              </div>
              <div className="flex-1 relative group">
                <input
                  ref={timeInputRef}
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-white/10 p-5 pr-16 rounded-2xl text-2xl font-black text-brand outline-none focus:ring-2 focus:ring-brand/30 transition-all cursor-pointer"
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
              <span className="hidden md:block text-[10px] font-black text-gray-600 uppercase tracking-widest">Definir Horário</span>
            </div>
          </div>

          <button
            onClick={handleCreateOrUpdate}

            className="w-full bg-gradient-to-r from-brand to-brand-light hover:scale-[1.01] active:scale-95 text-white font-black py-6 rounded-[28px] transition-all uppercase tracking-[0.2em] shadow-xl shadow-brand/30 flex items-center justify-center gap-3"
          >
            {editingTaskId ? <Check size={20} /> : <Plus size={20} />}
            {editingTaskId ? 'ATUALIZAR TAREFA' : 'ADICIONAR TAREFA'}
          </button>
        </div>
      </div>

      {/* Lista Hoje - TaskFlow Aesthetic */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div className="flex items-center gap-3 text-brand">
            <Zap size={20} className="fill-brand animate-pulse" />
            <span className="font-black text-xs uppercase tracking-[0.3em]">Tarefas ({filteredTasks.length})</span>
          </div>
          
          <div className="flex bg-[#0b0e14] p-1.5 rounded-2xl border border-white/5 shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
            {(['hoje', 'pendentes', 'todas'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
              >
                {f === 'hoje' ? 'Hoje' : f === 'pendentes' ? 'Pendentes' : 'Todas'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="py-24 text-center glass-card rounded-[48px] border-dashed border-white/5 opacity-30">
              <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="font-black text-sm uppercase tracking-widest">
                {filter === 'hoje' ? 'Nenhuma tarefa para hoje.' : 
                 filter === 'pendentes' ? 'Nenhuma tarefa pendente.' : 
                 'Nenhuma tarefa encontrada.'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`group flex items-center justify-between p-4 px-6 rounded-[28px] border transition-all duration-300 ${task.completions[today]
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : editingTaskId === task.id ? 'bg-brand/10 border-brand/40 shadow-[0_0_20px_rgba(135,67,242,0.1)]' : 'bg-[#161b22] border-white/5 hover:border-brand/30'
                  }`}
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${task.completions[today]
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-brand/10 text-brand border border-brand/20'
                    }`}>
                    {task.completions[today] ? <Check size={22} strokeWidth={3} /> : <Briefcase size={20} />}
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1 min-w-0">
                    <h3 className={`font-black text-sm tracking-tight uppercase shrink-0 flex items-center gap-2 ${task.completions[today] ? 'text-gray-700 line-through' : 'text-white'}`}>
                      {task.category}
                      <span className="px-2 py-0.5 bg-[#0b0e14] border border-white/5 rounded-full text-[8px] text-gray-500 tracking-widest no-underline">
                        {formatActivityDate(task)}
                      </span>
                    </h3>
                    <div className="hidden md:block w-1 h-4 border-l border-white/10 shrink-0"></div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest truncate flex-1 ${task.completions[today] ? 'text-gray-800' : 'text-gray-500'}`}>
                      {task.description || 'Padrão'}
                    </p>
                    <div className="flex items-center gap-2 shrink-0 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/20">
                      <Clock size={14} className="text-brand" />
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest">{task.time || '09:00'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Botões de Ação Secundária no Hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(task)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${editingTaskId === task.id ? 'bg-brand text-white' : 'bg-white/5 text-gray-500 hover:text-brand hover:bg-brand/10'
                        }`}
                      title="Editar Tarefa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="w-9 h-9 rounded-xl bg-white/5 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      title="Excluir Tarefa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleComplete(task.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${task.completions[today]
                        ? 'bg-white/5 text-emerald-500'
                        : 'bg-brand text-white shadow-lg shadow-brand/20 hover:scale-110 active:scale-90'
                      }`}
                  >
                    <Check size={22} strokeWidth={3} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(135, 67, 242, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Workflow;
