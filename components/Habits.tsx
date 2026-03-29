
import React, { useState, useEffect, useRef } from 'react';
import { SpiritualHabit, HabitFrequency } from '../types';
import { Plus, Check, Trash2, Calendar, Zap, Target, Clock, Edit2, X } from 'lucide-react';
import { useHabits } from '../contexts/HabitsContext';
import { getLocalDateString, formatActivityDate } from '../utils';

const Habits: React.FC = () => {
  const { habits, setHabits, categories, setCategories } = useHabits();
  const timeInputRef = useRef<HTMLInputElement>(null);
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);
  const targetDateRef = useRef<HTMLInputElement>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(categories[0]?.name || 'ORAÇÃO');
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

  useEffect(() => {
    const timer = setInterval(() => {
      setToday(getLocalDateString());
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  const resetForm = () => {
    setEditingHabitId(null);
    setCategory(categories[0]?.name || 'ORAÇÃO');
    setDescription('');
    setFrequency('daily');
    setSelectedDays([]);
    setStartDate('');
    setEndDate('');
    setTargetDate('');
    setTime('09:00');
  };

  const handleCreateOrUpdate = () => {
    if (editingHabitId) {
      const updatedHabits = habits.map(h => {
        if (h.id === editingHabitId) {
          return {
            ...h,
            category,
            description,
            frequency,
            selectedDays: frequency === 'weekly' ? selectedDays : undefined,
            startDate: frequency === 'period' ? startDate : undefined,
            endDate: frequency === 'period' ? endDate : undefined,
            date: (frequency === 'once' || frequency === 'annual') ? targetDate : undefined,
            time,
          };
        }
        return h;
      });
      setHabits(updatedHabits);
    } else {
      const newHabit: SpiritualHabit = {
        id: Date.now().toString(),
        category,
        description,
        frequency,
        selectedDays: frequency === 'weekly' ? selectedDays : undefined,
        startDate: frequency === 'period' ? startDate : undefined,
        endDate: frequency === 'period' ? endDate : undefined,
        date: (frequency === 'once' || frequency === 'annual') ? targetDate : undefined,
        time,
        completions: {}
      };
      setHabits([...habits, newHabit]);
    }
    resetForm();
  };

  const startEdit = (habit: SpiritualHabit) => {
    setEditingHabitId(habit.id);
    setCategory(habit.category);
    setDescription(habit.description);
    setFrequency(habit.frequency);
    setSelectedDays(habit.selectedDays || []);
    setStartDate(habit.startDate || '');
    setEndDate(habit.endDate || '');
    setTargetDate(habit.date || '');
    setTime(habit.time || '09:00');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleComplete = (habitId: string) => {
    setHabits(habits.map(h => {
      if (h.id === habitId) {
        const completions = { ...h.completions };
        completions[today] = !completions[today];
        return { ...h, completions };
      }
      return h;
    }));
  };

  const deleteHabit = (id: string) => {
    if (confirm('Deseja excluir esta disciplina?')) {
      setHabits(habits.filter(h => h.id !== id));
      if (editingHabitId === id) resetForm();
    }
  };

  const filteredHabits = habits.filter(habit => {
    const isPastDue = () => {
      if (habit.frequency === 'once' && habit.date && habit.date < today && !habit.completions[habit.date]) return true;
      if (habit.frequency === 'period' && habit.endDate && habit.endDate < today && !habit.completions[habit.endDate]) return true;
      return false;
    };

    const isToday = () => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly' && habit.selectedDays?.includes(dayOfWeek)) return true;
      if (habit.frequency === 'period' && habit.startDate && habit.endDate) {
        return today >= habit.startDate && today <= habit.endDate;
      }
      if (habit.frequency === 'once' && habit.date === today) return true;
      if (habit.frequency === 'annual' && habit.date?.slice(5) === today.slice(5)) return true;
      if (habit.frequency === 'monthly' && habit.date?.slice(-2) === today.slice(-2)) return true;
      return false;
    };

    if (filter === 'hoje') return isToday();
    if (filter === 'pendentes') return isPastDue() || (isToday() && !habit.completions[today]);
    if (filter === 'todas') return true;
    return false;
  }).sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat = {
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
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text">Disciplinas</h1>
          <p className="text-gray-500 mt-2 font-medium">Santificação é uma escolha diária e intencional.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <div className="px-5 py-2.5 bg-brand/10 border border-brand/20 rounded-2xl text-brand font-black text-[10px] tracking-[0.2em] uppercase">
            {editingHabitId ? 'Editando Disciplina' : 'Espiritualidade Ativa'}
          </div>
        </div>
      </header>

      {/* Card de Criação Neon Style */}
      <div className={`bg-[#161b22] border transition-all duration-500 p-10 rounded-[48px] shadow-2xl relative overflow-hidden group ${editingHabitId ? 'border-brand/40 ring-1 ring-brand/20' : 'border-white/5'}`}>
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
            {editingHabitId && (
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
                        className="flex-1 bg-transparent border-b border-brand text-white text-xs font-bold outline-none uppercase"
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
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Detalhes da Disciplina</label>
            <input
              type="text"
              placeholder="Ex: Jejum de Daniel, Estudo de Romanos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-bold placeholder:text-gray-700 focus:ring-2 focus:ring-brand/30 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Frequência</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'daily', label: 'DIÁRIO' },
                  { id: 'weekly', label: 'SEMANAL' },
                  { id: 'period', label: 'PERÍODO' },
                  { id: 'once', label: 'EVENTO' },
                  { id: 'monthly', label: 'MENSAL' }
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
                </div>
              )}
              {frequency === 'period' && (
                <div className="flex gap-3 items-center">
                  <div className="relative group flex-1">
                    <input ref={startDateRef} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 p-3 pr-10 rounded-xl text-[10px] font-black text-brand outline-none" />
                    <button onClick={() => startDateRef.current?.showPicker()} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand/50 hover:text-brand transition-colors"><Plus size={14} /></button>
                  </div>
                  <span className="text-gray-600 font-black text-[10px] uppercase">até</span>
                  <div className="relative group flex-1">
                    <input ref={endDateRef} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 p-3 pr-10 rounded-xl text-[10px] font-black text-brand outline-none" />
                    <button onClick={() => endDateRef.current?.showPicker()} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand/50 hover:text-brand transition-colors"><Plus size={14} /></button>
                  </div>
                </div>
              )}
              {(frequency === 'once' || frequency === 'annual' || frequency === 'monthly') && (
                <div className="relative group w-full">
                  <input ref={targetDateRef} type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/10 p-3 pr-10 rounded-xl text-[10px] font-black text-brand outline-none" />
                  <button onClick={() => targetDateRef.current?.showPicker()} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand/50 hover:text-brand transition-colors"><Plus size={14} /></button>
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
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-4 block">Horário da Disciplina</label>
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
            disabled={!description}
            className="w-full bg-gradient-to-r from-brand to-brand-light hover:scale-[1.01] active:scale-95 text-white font-black py-6 rounded-[28px] transition-all uppercase tracking-[0.2em] shadow-xl shadow-brand/30 flex items-center justify-center gap-3 disabled:opacity-30"
          >
            {editingHabitId ? <Check size={20} /> : <Plus size={20} />}
            {editingHabitId ? 'ATUALIZAR MINHA CAMINHADA' : 'ADICIONAR À MINHA CAMINHADA'}
          </button>
        </div>
      </div>

      {/* Lista Hoje - TaskFlow Aesthetic */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
          <div className="flex items-center gap-3 text-brand">
            <Zap size={20} className="fill-brand animate-pulse" />
            <span className="font-black text-xs uppercase tracking-[0.3em]">Minhas Disciplinas ({filteredHabits.length})</span>
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
          {filteredHabits.length === 0 ? (
            <div className="py-24 text-center glass-card rounded-[48px] border-dashed border-white/5 opacity-30">
              <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
              <p className="font-black text-sm uppercase tracking-widest">
                {filter === 'hoje' ? 'Nenhuma disciplina para hoje.' : 
                 filter === 'pendentes' ? 'Nenhuma disciplina pendente.' : 
                 'Nenhuma disciplina encontrada.'}
              </p>
            </div>
          ) : (
            filteredHabits.map(habit => (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-4 px-6 rounded-[28px] border transition-all duration-300 ${habit.completions[today]
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : editingHabitId === habit.id ? 'bg-brand/10 border-brand/40 shadow-[0_0_20px_rgba(135,67,242,0.1)]' : 'bg-[#161b22] border-white/5 hover:border-brand/30'
                  }`}
              >
                <div className="flex items-center gap-6 flex-1 min-w-0">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${habit.completions[today]
                    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-brand/10 text-brand border border-brand/20'
                    }`}>
                    {habit.completions[today] ? <Check size={22} strokeWidth={3} /> : <span className="font-black text-[10px]">{habit.category?.slice(0, 2) || 'DI'}</span>}
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 flex-1 min-w-0">
                    <h3 className={`font-black text-sm tracking-tight uppercase shrink-0 ${habit.completions[today] ? 'text-gray-700 line-through' : 'text-white'}`}>
                      {habit.category}
                    </h3>
                    <div className="hidden md:block w-1 h-4 border-l border-white/10 shrink-0"></div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest truncate flex-1 ${habit.completions[today] ? 'text-gray-800' : 'text-gray-500'}`}>
                      {habit.description || 'Padrão'}
                    </p>
                    <div className="flex items-center gap-4 shrink-0 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Zap size={12} className="text-brand/50" />
                        <span className="text-[10px] font-black text-brand/50 uppercase tracking-widest">{formatActivityDate(habit)}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-brand/10 px-3 py-1.5 rounded-xl border border-brand/20">
                        <Clock size={14} className="text-brand" />
                        <span className="text-[10px] font-black text-brand uppercase tracking-widest">{habit.time || '09:00'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Botões de Ação Secundária no Hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(habit)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${editingHabitId === habit.id ? 'bg-brand text-white' : 'bg-white/5 text-gray-500 hover:text-brand hover:bg-brand/10'
                        }`}
                      title="Editar Disciplina"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="w-9 h-9 rounded-xl bg-white/5 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      title="Excluir Disciplina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => toggleComplete(habit.id)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${habit.completions[today]
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

export default Habits;
