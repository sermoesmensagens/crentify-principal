import React, { useState, useRef } from 'react';
import {
  Users, Plus, Trash2, Calendar, Clock, Edit2, X, Link as LinkIcon,
  MapPin, Youtube, MessageSquare, ChevronDown, ChevronRight,
  Search, Info, Check, Image as ImageIcon, Eye, Play, FileText,
  CheckCircle2, GraduationCap, ChevronLeft, EyeOff, Zap
} from 'lucide-react';
import { getLocalDateString } from '../utils';
import { useServices } from '../contexts/ServiceContext';
import {
  ServiceEvent, ServiceDetail, ServiceFrequency, FrequencyType,
  ServiceCategory
} from '../types';

const Cultos: React.FC = () => {
  const {
    events, setEvents,
    details: serviceDetails, setDetails: setServiceDetails,
    toggleServiceCompletion,
    updateServiceNotes
  } = useServices();

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'config'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [expandedChurches, setExpandedChurches] = useState<string[]>([]);
  const [editingChurchName, setEditingChurchName] = useState<string | null>(null);
  const [tempChurchName, setTempChurchName] = useState('');
  const [isQuickAddingDetail, setIsQuickAddingDetail] = useState<string | null>(null); // Church name currently adding to

  // Form states for NEW ACTIVITY TYPE
  const [newEvent, setNewEvent] = useState<Partial<ServiceEvent>>({
    title: '',
    thumbnailUrl: ''
  });

  // Form states for NEW DETAIL
  const [newDetail, setNewDetail] = useState<Partial<ServiceDetail>>({
    eventId: '',
    title: '',
    churchNameOrId: '',
    youtubeUrl: '',
    externalLink: '',
    address: '',
    notes: '',
    frequencies: []
  });

  // Frequency form state
  const [freqType, setFreqType] = useState<FrequencyType>('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [time, setTime] = useState('19:00');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const resetDetailForm = () => {
    setNewDetail({
      eventId: selectedEventId || '',
      title: '',
      churchNameOrId: '',
      youtubeUrl: '',
      externalLink: '',
      address: '',
      notes: '',
      frequencies: []
    });
    setFreqType('weekly');
    setSelectedDays([]);
    setTime('19:00');
    setDate('');
    setStartDate('');
    setEndDate('');
  };

  const handleAddFrequency = () => {
    const freq: ServiceFrequency = {
      id: Date.now().toString(),
      type: freqType,
      time,
      daysOfWeek: freqType === 'weekly' ? selectedDays : undefined,
      date: freqType === 'once' ? date : undefined,
      startDate: freqType === 'period' ? startDate : undefined,
      endDate: freqType === 'period' ? endDate : undefined,
    };
    setNewDetail(prev => ({
      ...prev,
      frequencies: [...(prev.frequencies || []), freq]
    }));
    // Reset secondary form
    setSelectedDays([]);
    setDate('');
    setStartDate('');
    setEndDate('');
  };

  const removeFrequency = (id: string) => {
    setNewDetail(prev => ({
      ...prev,
      frequencies: prev.frequencies?.filter(f => f.id !== id)
    }));
  };

  const handleCreateEvent = () => {
    if (!newEvent.title) return;
    const event: ServiceEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      categoryId: '1', // Hardcoded as categories are removed
      thumbnailUrl: newEvent.thumbnailUrl,
      createdAt: new Date().toISOString()
    };
    setEvents([...events, event]);
    setNewEvent({ title: '', thumbnailUrl: '' });
    setSelectedEventId(event.id);
    setNewDetail(prev => ({ ...prev, eventId: event.id }));
    setActiveTab('list');
  };

  const handleCreateDetail = () => {
    if (!newDetail.eventId) return;
    const detail: ServiceDetail = {
      id: Date.now().toString(),
      eventId: newDetail.eventId,
      title: newDetail.title,
      churchNameOrId: newDetail.churchNameOrId,
      frequencies: newDetail.frequencies || [],
      youtubeUrl: newDetail.youtubeUrl,
      externalLink: newDetail.externalLink,
      address: newDetail.address,
      notes: newDetail.notes,
      createdAt: new Date().toISOString()
    };
    setServiceDetails([...serviceDetails, detail]);
    resetDetailForm();
    setActiveTab('list');
  };

  const deleteEvent = (id: string) => {
    if (confirm('Deseja excluir este tipo de atividade e todas as suas programações?')) {
      setEvents(events.filter(e => e.id !== id));
      setServiceDetails(serviceDetails.filter(d => d.eventId !== id));
      if (selectedEventId === id) setSelectedEventId(null);
    }
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);
  const currentEventDetails = serviceDetails.filter(d => d.eventId === selectedEventId);
  const activeDetail = serviceDetails.find(d => d.id === activeDetailId);
  const todayStr = getLocalDateString();

  const toggleChurch = (churchName: string) => {
    setExpandedChurches(prev =>
      prev.includes(churchName) ? prev.filter(c => c !== churchName) : [...prev, churchName]
    );
  };

  const handleRenameChurch = (oldName: string) => {
    if (!tempChurchName.trim() || tempChurchName === oldName) {
      setEditingChurchName(null);
      return;
    }
    setServiceDetails(prev => prev.map(d =>
      (d.eventId === selectedEventId && d.churchNameOrId === oldName)
        ? { ...d, churchNameOrId: tempChurchName.toUpperCase() }
        : d
    ));
    setExpandedChurches(prev => prev.map(c => c === oldName ? tempChurchName.toUpperCase() : c));
    setEditingChurchName(null);
  };

  const handleDeleteChurch = (churchName: string) => {
    if (confirm(`Deseja excluir TODAS as programações de "${churchName}"?`)) {
      setServiceDetails(prev => prev.filter(d =>
        !(d.eventId === selectedEventId && d.churchNameOrId === churchName)
      ));
      setExpandedChurches(prev => prev.filter(c => c !== churchName));
    }
  };

  const [quickDetailTitle, setQuickDetailTitle] = useState('');
  const [quickDetailTime, setQuickDetailTime] = useState('19:00');

  const handleQuickCreateDetail = (churchName: string) => {
    if (!selectedEventId) return;
    const detail: ServiceDetail = {
      id: Date.now().toString(),
      eventId: selectedEventId,
      title: quickDetailTitle || 'Momento de Atividade',
      churchNameOrId: churchName,
      frequencies: [{ id: Date.now().toString(), type: 'weekly', time: quickDetailTime, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] }],
      createdAt: new Date().toISOString()
    };
    setServiceDetails([...serviceDetails, detail]);
    setIsQuickAddingDetail(null);
    setQuickDetailTitle('');
  };

  const getEventProgress = (eventId: string) => {
    const evDetails = serviceDetails.filter(d => d.eventId === eventId);
    if (evDetails.length === 0) return 0;
    const completed = evDetails.filter(d => d.completions?.[todayStr]).length;
    return Math.round((completed / evDetails.length) * 100);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text">Cultos</h1>
          <p className="text-gray-500 mt-2 font-medium">Gerencie sua agenda espiritual e momentos de comunhão.</p>
        </div>
        <div className="flex bg-[#0b0e14] p-1.5 rounded-2xl border border-white/5 shadow-inner">
          {[
            { id: 'list', label: 'Tipo de Atividade', icon: <Users size={14} /> },
            { id: 'add', label: 'Nova Atividade', icon: <Plus size={14} /> },
            { id: 'config', label: 'Configurar Atividades', icon: <Edit2 size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'list') {
                  setSelectedEventId(null);
                  setExpandedChurches([]);
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'list' && !selectedEventId && (
        <div className="space-y-12 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredEvents.map(event => {
              const progress = getEventProgress(event.id);
              const eventDetails = serviceDetails.filter(d => d.eventId === event.id);
              const completedCount = eventDetails.filter(d => d.completions?.[todayStr]).length;

              return (
                <div
                  key={event.id}
                  onClick={() => { setSelectedEventId(event.id); }}
                  className="bg-[#161b22] border border-white/5 rounded-[48px] overflow-hidden hover:border-brand/30 transition-all cursor-pointer group shadow-2xl flex flex-col h-full"
                >
                  <div className="h-48 bg-black/40 relative overflow-hidden shrink-0">
                    {event.thumbnailUrl ? (
                      <img src={event.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand/20 to-purple-900/20">
                        <Users size={64} className="text-brand/40 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    )}
                    <div className="absolute top-6 left-6">
                      <span className="bg-brand/80 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest backdrop-blur-md shadow-lg">
                        ATIVIDADE
                      </span>
                    </div>
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-brand transition-colors mb-2 line-clamp-1">{event.title}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                         {eventDetails.length} Programações Cadastradas
                      </p>
                    </div>

                    <div className="bg-black/40 p-5 rounded-[32px] border border-white/5 shadow-inner">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Seu Progresso Hoje</span>
                        <span className="text-lg font-black text-brand tracking-tighter">{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand to-purple-600 shadow-[0_0_10px_rgba(var(--brand-rgb),0.5)] transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-2">
                        {completedCount} de {eventDetails.length} Concluídas
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-[#161b22] border-2 border-dashed border-white/5 rounded-[48px] p-10 flex flex-col items-center justify-center text-gray-700 hover:border-brand/40 hover:text-brand transition-all group cursor-pointer h-full" onClick={() => setActiveTab('add')}>
              <Plus size={48} className="mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-black text-xs uppercase tracking-[0.2em] text-center">Criar Novo Tipo de Atividade</span>
            </div>
          </div>
        </div>
      )}

      {/* --- VISÃO DETALHADA DA ATIVIDADE (ESTILO ACADEMY) --- */}
      {activeTab === 'list' && selectedEventId && selectedEvent && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
           {/* Header da Atividade */}
           <div className="bg-brand/5 p-8 rounded-[48px] border border-brand/10 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand/5 to-transparent pointer-events-none"></div>

              <button
                onClick={() => { setSelectedEventId(null); setExpandedChurches([]); }}
                className="w-14 h-14 bg-[#0b0e14] border border-white/5 rounded-2xl flex items-center justify-center text-gray-500 hover:text-brand hover:bg-brand/10 transition-all flex-shrink-0 z-10"
              >
                <ChevronLeft size={24} />
              </button>

              {selectedEvent.thumbnailUrl ? (
                <img src={selectedEvent.thumbnailUrl} className="w-28 h-28 md:w-32 md:h-32 rounded-[40px] object-cover border border-white/10 shadow-2xl z-10" />
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-[40px] bg-[#0b0e14] border border-white/5 flex items-center justify-center text-brand/30 z-10">
                  <Users size={56} />
                </div>
              )}

              <div className="flex-1 text-center md:text-left z-10">
                 <span className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mb-2 block">TIPO DE ATIVIDADE</span>
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedEvent.title}</h2>
                 <p className="text-gray-500 text-xs mt-2 font-bold uppercase tracking-widest bg-white/5 inline-block px-3 py-1 rounded-lg">
                    CRIAÇÃO: {new Date(selectedEvent.createdAt).toLocaleDateString()}
                 </p>
              </div>

              <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 text-center min-w-[240px] shadow-inner z-10">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Seu Progresso de Hoje</p>
                    <p className="text-2xl font-black text-brand tracking-tighter">{getEventProgress(selectedEventId)}%</p>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                     <div className="bg-brand h-full transition-all duration-1000" style={{ width: `${getEventProgress(selectedEventId)}%` }}></div>
                  </div>
               </div>

               <button
                 onClick={() => { setSelectedEventId(null); setExpandedChurches([]); }}
                 className="absolute top-6 right-6 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500 hover:bg-rose-500 hover:text-white transition-all z-20 group"
                 title="Voltar para Lista"
               >
                 <X size={20} className="group-hover:rotate-90 transition-transform" />
               </button>
           </div>

           {/* Controles do Tipo de Atividade */}
           <div className="flex justify-between items-center px-4">
               <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Igrejas e Congregações</h3>
               <button
                 onClick={() => {
                   const churchName = prompt('Nome da Igreja ou Grupo:');
                   if (churchName) {
                     handleQuickCreateDetail(churchName);
                     if (!expandedChurches.includes(churchName)) {
                       setExpandedChurches([...expandedChurches, churchName]);
                     }
                   }
                 }}
                 className="flex items-center gap-2 px-6 py-3 bg-brand/10 text-brand rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand hover:text-white transition-all shadow-lg border border-brand/20"
               >
                 <Plus size={14} /> Adicionar Nova Igreja
               </button>
            </div>

           {/* Lista de Igrejas/Programações */}
           <div className="space-y-6">
              {(() => {
                const groupedByChurch = currentEventDetails.reduce((acc, detail) => {
                  const church = detail.churchNameOrId || 'Outros';
                  if (!acc[church]) acc[church] = [];
                  acc[church].push(detail);
                  return acc;
                }, {} as Record<string, ServiceDetail[]>);

                return Object.keys(groupedByChurch).map(church => {
                   const items = groupedByChurch[church];
                   const isExpanded = expandedChurches.includes(church);
                   const isChurchComplete = items.every(d => d.completions?.[todayStr]);

                   return (
                      <div key={church} className={`border rounded-[40px] overflow-hidden transition-all duration-300 shadow-2xl ${isExpanded ? 'bg-[#161b22] border-brand/20' : 'bg-[#0b0e14] border-white/5 hover:border-white/10'}`}>
                         <div onClick={() => toggleChurch(church)} className="flex items-center justify-between p-8 cursor-pointer hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-6 flex-1">
                               <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center font-black shadow-lg transition-all ${isChurchComplete ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-brand/10 text-brand border border-brand/20'}`}>
                                  {isChurchComplete ? <CheckCircle2 size={28} /> : <GraduationCap size={24} />}
                               </div>
                               <div className="flex-1">
                                  {editingChurchName === church ? (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                      <input
                                        autoFocus
                                        type="text"
                                        value={tempChurchName}
                                        onChange={e => setTempChurchName(e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') handleRenameChurch(church);
                                          if (e.key === 'Escape') setEditingChurchName(null);
                                        }}
                                        className="bg-[#0b0e14] border border-brand/30 rounded-xl px-4 py-2 text-white font-black uppercase text-xl outline-none"
                                      />
                                      <button onClick={() => handleRenameChurch(church)} className="p-2 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-all"><Check size={16} /></button>
                                      <button onClick={() => setEditingChurchName(null)} className="p-2 bg-white/5 text-gray-500 rounded-lg hover:scale-110 transition-all"><X size={16} /></button>
                                    </div>
                                  ) : (
                                    <>
                                       <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${isExpanded ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{church}</h3>
                                       <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
                                          {items.length} Programações cadastradas
                                       </p>
                                    </>
                                  )}
                               </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 p-1.5 rounded-2xl border border-white/5 gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setIsQuickAddingDetail(church); if (!isExpanded) toggleChurch(church); }}
                                    className="p-3 hover:bg-brand/20 hover:text-brand text-gray-600 rounded-xl transition-all"
                                    title="Adicionar Horário"
                                  >
                                    <Plus size={18} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingChurchName(church); setTempChurchName(church); }}
                                    className="p-3 hover:bg-blue-500/20 hover:text-blue-500 text-gray-600 rounded-xl transition-all"
                                    title="Editar Nome"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteChurch(church); }}
                                    className="p-3 hover:bg-rose-500/20 hover:text-rose-500 text-gray-600 rounded-xl transition-all"
                                    title="Excluir Bloco"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                               </div>
                               <ChevronDown className={`text-gray-600 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-brand' : ''}`} size={24} />
                            </div>
                         </div>

                         {isExpanded && (
                           <div className="p-8 pt-2 space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                              {items.map(detail => {
                                const isComplete = detail.completions?.[todayStr];
                                return (
                                  <div
                                    key={detail.id}
                                    onClick={() => setActiveDetailId(detail.id)}
                                    className={`flex items-center justify-between p-5 rounded-[28px] transition-all group cursor-pointer ${isComplete ? 'bg-white/5 border border-white/5' : 'bg-[#1c232b] border border-white/5 shadow-lg hover:border-brand/40'}`}
                                  >
                                     <div className="flex items-center gap-5 pr-4 flex-1">
                                        <div
                                           onClick={(e) => { e.stopPropagation(); toggleServiceCompletion(detail.id, todayStr); }}
                                           className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${isComplete ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-white/10 text-transparent group-hover:border-brand/40 group-hover:text-brand/40'}`}
                                        >
                                           <Check size={20} strokeWidth={4} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                           <h4 className={`text-sm font-black uppercase tracking-tight line-clamp-1 ${isComplete ? 'text-gray-600 line-through' : 'text-white'}`}>{detail.title}</h4>
                                           <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                              <Clock size={12} className="text-brand" />
                                              <span className="text-[10px] font-bold uppercase tracking-widest">{detail.frequencies[0]?.time || '--:--'}</span>
                                           </div>
                                        </div>
                                     </div>
                                     <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); if (confirm('Excluir esta programação?')) setServiceDetails(prev => prev.filter(d => d.id !== detail.id)); }}
                                          className="w-10 h-10 rounded-xl border border-rose-500/20 text-rose-500/40 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shadow-lg">
                                           <Eye size={18} />
                                        </div>
                                     </div>
                                  </div>
                                );
                              })}

                              {/* Formulário de Adição Rápida */}
                              {isQuickAddingDetail === church ? (
                                <div className="p-6 bg-brand/5 border border-brand/20 rounded-[32px] animate-in zoom-in-95 duration-300">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                         <label className="text-[9px] font-black text-brand uppercase tracking-widest ml-1">Título do Momento</label>
                                         <input
                                           autoFocus
                                           type="text"
                                           placeholder="Ex: Culto da Vitória"
                                           value={quickDetailTitle}
                                           onChange={e => setQuickDetailTitle(e.target.value)}
                                           className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-5 py-3 text-white text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-brand/40"
                                         />
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[9px] font-black text-brand uppercase tracking-widest ml-1">Horário</label>
                                         <div className="flex gap-2">
                                            <input
                                              type="time"
                                              value={quickDetailTime}
                                              onChange={e => setQuickDetailTime(e.target.value)}
                                              className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-5 py-3 text-white text-xl font-black outline-none focus:ring-1 focus:ring-brand/40"
                                            />
                                            <button
                                              onClick={() => handleQuickCreateDetail(church)}
                                              className="px-6 bg-brand text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                                            >
                                              Salvar
                                            </button>
                                            <button
                                              onClick={() => setIsQuickAddingDetail(null)}
                                              className="p-3 bg-white/5 text-gray-500 rounded-2xl hover:text-white transition-all"
                                            >
                                              <X size={20} />
                                            </button>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setIsQuickAddingDetail(church)}
                                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-[28px] text-[10px] font-black text-gray-600 uppercase tracking-widest hover:border-brand/40 hover:text-brand transition-all flex items-center justify-center gap-3 group"
                                >
                                   <Plus size={16} className="group-hover:scale-125 transition-transform" /> Adicionar Programação em {church}
                                </button>
                              )}
                           </div>
                         )}
                      </div>
                    );
                 });
              })()}
              {currentEventDetails.length === 0 && (
                <div className="text-center py-24 bg-black/20 rounded-[48px] border border-dashed border-white/5 animate-pulse">
                   <EyeOff size={48} className="text-gray-800 mx-auto mb-4" />
                   <h3 className="text-xl font-black text-gray-700 uppercase tracking-widest">Nenhuma programação definida</h3>
                   <button onClick={() => setActiveTab('add')} className="mt-6 text-brand font-black text-[10px] uppercase tracking-widest border border-brand/20 px-6 py-3 rounded-full hover:bg-brand hover:text-white transition-all">Configurar agora</button>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="space-y-12 animate-in slide-in-from-right duration-500">

          {/* --- CRIAÇÃO DE TIPO DE ATIVIDADE --- */}
          <section className="space-y-8 bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border border-brand/20">
                <ImageIcon size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Novo Tipo de Atividade</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Crie um card (ex: Culto Online, Presencial, Devocional)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título da Atividade</label>
                <input
                  type="text"
                  placeholder="Ex: Culto Online"
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Thumbnail (Opcional)</label>
                <input
                  type="text"
                  placeholder="URL da imagem..."
                  value={newEvent.thumbnailUrl}
                  onChange={e => setNewEvent({ ...newEvent, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-medium text-xs outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleCreateEvent}
              disabled={!newEvent.title}
              className="bg-brand text-white font-black py-4 px-10 rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 disabled:opacity-30"
            >
              Confirmar Atividade
            </button>
          </section>

          {/* --- ADICIONAR PROGRAMAÇÃO A UMA ATIVIDADE --- */}
          <section className="space-y-8 bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <Plus size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Adicionar Programação</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Vincule um horário e igreja a um tipo de atividade</p>
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Atividade</label>
                <select
                  value={newDetail.eventId}
                  onChange={e => setNewDetail({ ...newDetail, eventId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all appearance-none"
                >
                  <option value="">Selecione um tipo de atividade...</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título/Tema (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Culto Dominical"
                  value={newDetail.title}
                  onChange={e => setNewDetail({ ...newDetail, title: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome da Igreja / Instituição</label>
                <input
                  type="text"
                  placeholder="Ex: Assembleia de Deus"
                  value={newDetail.churchNameOrId}
                  onChange={e => setNewDetail({ ...newDetail, churchNameOrId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                />
              </div>

            {/* --- GESTÃO DE FREQUÊNCIA --- */}
            <div className="bg-black/20 p-8 rounded-[32px] border border-white/5 space-y-6 relative z-10">
              <h3 className="text-xs font-black text-brand uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} /> Definir Horários e Frequência
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {[
                      { id: 'weekly', label: 'SEMANAL' },
                      { id: 'once', label: 'DATA ÚNICA' },
                      { id: 'period', label: 'PERÍODO' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFreqType(f.id as any)}
                        className={`flex-1 py-3 rounded-xl text-[9px] font-black tracking-widest transition-all ${freqType === f.id ? 'bg-brand text-white shadow-lg' : 'bg-white/5 text-gray-600'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {freqType === 'weekly' && (
                    <div className="flex justify-between p-2 bg-[#0b0e14] rounded-2xl border border-white/5 shadow-inner">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${selectedDays.includes(i) ? 'bg-brand text-white shadow-lg' : 'text-gray-700 hover:text-gray-400'}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}

                  {freqType === 'once' && (
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-xs outline-none" />
                  )}

                  {freqType === 'period' && (
                    <div className="flex items-center gap-3">
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-xs outline-none" />
                      <span className="text-gray-700 text-[10px] font-black uppercase">até</span>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-xs outline-none" />
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <input type="time" value={time} onChange={e => setTime(e.target.value)} className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-2xl outline-none" />
                    <button
                      onClick={handleAddFrequency}
                      className="h-full px-6 bg-brand/20 text-brand border border-brand/20 rounded-2xl font-black text-[10px] uppercase hover:bg-brand hover:text-white transition-all"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                  {newDetail.frequencies?.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-brand uppercase tracking-widest">
                          {f.type === 'weekly' ? 'Semanal' : f.type === 'once' ? 'Data Única' : 'Período'}
                        </span>
                        <span className="text-xs font-black text-white">
                          {f.type === 'weekly' ? f.daysOfWeek?.map(d => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]).join(', ') : f.date || `${f.startDate} - ${f.endDate}`}
                          {' • '} {f.time}
                        </span>
                      </div>
                      <button onClick={() => removeFrequency(f.id)} className="text-gray-700 hover:text-rose-500 transition-colors"><X size={16} /></button>
                    </div>
                  ))}
                  {(!newDetail.frequencies || newDetail.frequencies.length === 0) && (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                      <Clock size={32} className="mb-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">Nenhum horário definido</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* --- ADICIONAIS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Youtube size={14} className="text-rose-500" /> Link do YouTube / Transmissão
                </label>
                <input type="text" placeholder="https://youtube.com/..." value={newDetail.youtubeUrl} onChange={e => setNewDetail({ ...newDetail, youtubeUrl: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-medium outline-none" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MapPin size={14} className="text-blue-500" /> Endereço Presencial
                </label>
                <input type="text" placeholder="Rua Exemplo, 123 - Cidade" value={newDetail.address} onChange={e => setNewDetail({ ...newDetail, address: e.target.value })} className="w-full bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-medium outline-none" />
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MessageSquare size={14} className="text-emerald-500" /> Minhas Reflexões / Anotações
              </label>
              <textarea
                placeholder="O que você aprendeu com essa mensagem? Anote seus insights..."
                value={newDetail.notes}
                onChange={e => setNewDetail({ ...newDetail, notes: e.target.value })}
                className="w-full h-40 bg-[#0b0e14] border border-white/5 rounded-[32px] px-8 py-6 text-white text-sm font-medium outline-none focus:ring-2 focus:ring-brand/30 transition-all resize-none italic"
              />
            </div>

            <button
              onClick={handleCreateDetail}
              disabled={!newDetail.eventId || (newDetail.frequencies?.length || 0) === 0}
              className="w-full bg-brand text-white font-black py-6 rounded-[32px] transition-all uppercase tracking-[0.2em] shadow-2xl shadow-brand/30 flex items-center justify-center gap-3 disabled:opacity-30 relative z-10"
            >
              <Check size={20} strokeWidth={3} /> PUBLICAR PROGRAMAÇÃO
            </button>
          </section>

          {/* --- LISTAGEM DE PROGRAMAÇÕES EXISTENTES --- */}
           {selectedEventId && (
             <section className="space-y-6">
               <div className="flex items-center gap-3 text-brand">
                 <Info size={16} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Programações Atuais</span>
               </div>
               <div className="flex flex-col gap-3">
                {currentEventDetails.map(detail => (
                  <div key={detail.id} className="bg-[#161b22] border border-white/5 p-6 rounded-[28px] flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-brand transition-colors">
                        {detail.youtubeUrl ? <Youtube size={20} /> : <Users size={20} />}
                      </div>
                      <div>
                        <h4 className="font-black text-white text-sm uppercase tracking-tight">{detail.title || 'Sem Título'}</h4>
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                          {detail.churchNameOrId} • {detail.frequencies.length} horários
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setServiceDetails(prev => prev.filter(d => d.id !== detail.id))} className="w-10 h-10 rounded-xl bg-white/5 text-gray-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {currentEventDetails.length === 0 && (
                  <div className="py-10 text-center opacity-30 italic text-xs font-black uppercase text-gray-600">Nenhuma programação cadastrada.</div>
                )}
              </div>
            </section>
          )}

        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-12 animate-in slide-in-from-right duration-500">
          <section className="bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Gerenciar Tipos de Atividade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Lista de Atividades</label>
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {events.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-5 rounded-[24px] group hover:border-brand/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center font-black">
                           {ev.title.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-white uppercase tracking-tight">{ev.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => {
                          const newTitle = prompt('Novo título para ' + ev.title + ':', ev.title);
                          if (newTitle) setEvents(events.map(e => e.id === ev.id ? { ...e, title: newTitle.toUpperCase() } : e));
                        }} className="p-2 text-gray-500 hover:text-brand transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => deleteEvent(ev.id)} className="p-2 text-gray-500 hover:text-rose-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-brand/5 border border-brand/20 p-8 rounded-[40px] flex flex-col items-center justify-center text-center">
                 <Zap className="text-brand mb-4" size={48} />
                 <h4 className="text-lg font-black text-white uppercase tracking-tighter">Personalize sua Agenda</h4>
                 <p className="text-xs text-gray-500 mt-2 font-medium">Edite os cards principais ou adicione novos para organizar diferentes tipos de reuniões e práticas espirituais.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* --- MODAL DE VISUALIZAÇÃO/LIÇÃO DO CULTO (ESTILO ACADEMY) --- */}
      {activeDetail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 md:p-6 bg-black/95 backdrop-blur-3xl animate-in zoom-in-95 fade-in duration-400">
           <div className="bg-[#161b22] w-full max-w-4xl h-full md:max-h-[92vh] rounded-[48px] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative">

              {/* Header Modal */}
              <div className="p-8 md:p-10 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-[#0b0e14] to-[#161b22] shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand border border-brand/20 shadow-2xl">
                       {activeDetail.youtubeUrl ? <Play size={28} fill="currentColor" /> : <FileText size={28} />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter line-clamp-1">{activeDetail.title || 'Momento de Culto'}</h3>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{activeDetail.churchNameOrId}</p>
                    </div>
                 </div>
                 <button
                    onClick={() => setActiveDetailId(null)}
                    className="w-14 h-14 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-90"
                 >
                    <X size={28} />
                 </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12">

                 {/* Player ou Placeholder */}
                 {activeDetail.youtubeUrl ? (
                   <div className="bg-[#0b0e14] aspect-video rounded-[40px] border border-white/5 overflow-hidden shadow-2xl group relative">
                      <iframe
                        src={`https://www.youtube.com/embed/${activeDetail.youtubeUrl.split('v=')[1]?.split('&')[0] || activeDetail.youtubeUrl.split('/').pop()}`}
                        className="w-full h-full"
                        allowFullScreen
                      />
                   </div>
                 ) : (
                   <div className="bg-black/20 p-16 rounded-[48px] border border-dashed border-white/5 text-center flex flex-col items-center">
                      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Users size={48} className="text-gray-700" />
                      </div>
                      <h4 className="text-xl font-black text-gray-600 uppercase tracking-widest">Acompanhamento Presencial</h4>
                      {activeDetail.address && <p className="text-xs text-brand font-bold uppercase mt-2">{activeDetail.address}</p>}
                   </div>
                 )}

                 {/* Espaço para Anotações */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3 text-brand">
                       <MessageSquare size={18} />
                       <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Suas Anotações e Reflexões</h4>
                    </div>
                    <textarea
                      value={activeDetail.notes || ''}
                      onChange={(e) => updateServiceNotes(activeDetail.id, e.target.value)}
                      placeholder="Escreva aqui tudo o que chamou sua atenção, anote insights da mensagem ou pontos de oração..."
                      className="w-full h-64 bg-[#0b0e14]/50 border border-white/5 rounded-[40px] p-10 text-gray-300 text-lg font-medium leading-relaxed outline-none focus:border-brand/40 transition-all resize-none shadow-inner italic"
                    />
                 </div>
              </div>

              {/* Botão de Conclusão */}
              <div className="p-8 md:p-10 border-t border-white/5 bg-[#0b0e14]/50 shrink-0">
                 <button
                   onClick={() => { toggleServiceCompletion(activeDetail.id, todayStr); setActiveDetailId(null); }}
                   className={`w-full py-8 rounded-[32px] font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-4 transition-all shadow-2xl transform active:scale-95 ${activeDetail.completions?.[todayStr] ? 'bg-emerald-500/10 text-emerald-500 border-2 border-emerald-500 shadow-emerald-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:translate-y-[-4px] shadow-emerald-600/40'}`}
                 >
                    {activeDetail.completions?.[todayStr] ? (
                      <>
                        <CheckCircle2 size={24} /> TAREFA CONCLUÍDA
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={24} /> CONCLUIR CULTO
                      </>
                    )}
                 </button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--brand-rgb), 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .neon-text { text-shadow: 0 0 15px rgba(var(--brand-rgb), 0.4); }
      `}</style>
    </div>
  );
};

export default Cultos;
