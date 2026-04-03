import React, { useState, useRef } from 'react';
import { 
  Users, Plus, Trash2, Calendar, Clock, Edit2, X, Link as LinkIcon, 
  MapPin, Youtube, MessageSquare, ChevronDown, ChevronRight, 
  Search, Info, Check, Image as ImageIcon
} from 'lucide-react';
import { useServices } from '../contexts/ServiceContext';
import { 
  ServiceEvent, ServiceDetail, ServiceFrequency, FrequencyType,
  ServiceCategory 
} from '../types';

const Cultos: React.FC = () => {
  const { 
    events, setEvents, 
    details: serviceDetails, setDetails: setServiceDetails,
    categories, setCategories 
  } = useServices();

  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'config'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Form states for NEW EVENT
  const [newEvent, setNewEvent] = useState<Partial<ServiceEvent>>({
    title: '',
    categoryId: categories[0]?.id || '1',
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
        categoryId: newEvent.categoryId || '1',
        thumbnailUrl: newEvent.thumbnailUrl,
        createdAt: new Date().toISOString()
    };
    setEvents([...events, event]);
    setNewEvent({ title: '', categoryId: categories[0]?.id || '1', thumbnailUrl: '' });
    setSelectedEventId(event.id);
    setNewDetail(prev => ({ ...prev, eventId: event.id }));
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
    if (confirm('Deseja excluir este evento e todos os seus detalhes?')) {
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

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text">Cultos</h1>
          <p className="text-gray-500 mt-2 font-medium">Gerencie sua agenda espiritual e momentos de comunhão.</p>
        </div>
        <div className="flex bg-[#0b0e14] p-1.5 rounded-2xl border border-white/5 shadow-inner">
          {[
            { id: 'list', label: 'Meus Eventos', icon: <Users size={14} /> },
            { id: 'add', label: 'Novo Evento', icon: <Plus size={14} /> },
            { id: 'config', label: 'Configurar', icon: <Edit2 size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'list' && (
        <div className="space-y-12">
          {/* Listagem de Cards no estilo Academy */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <div 
                key={event.id}
                onClick={() => { setSelectedEventId(event.id); setActiveTab('add'); }}
                className={`bg-[#161b22] border border-white/5 rounded-[40px] p-8 hover:border-brand/30 transition-all cursor-pointer group relative overflow-hidden`}
              >
                <div className="flex flex-col gap-4">
                  <div className="w-16 h-16 bg-brand/10 text-brand rounded-[24px] flex items-center justify-center border border-brand/20 shadow-xl">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-brand transition-colors">{event.title}</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      {categories.find(c => c.id === event.categoryId)?.name || 'SERMÕES'}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-gray-600 uppercase tracking-widest">
                    <span>{serviceDetails.filter(d => d.eventId === event.id).length} Programações</span>
                    <button onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }} className="text-gray-800 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div 
              onClick={() => setActiveTab('add')}
              className="border-2 border-dashed border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 text-gray-600 hover:border-brand/30 hover:text-brand transition-all cursor-pointer bg-white/[0.02]"
            >
              <Plus size={48} strokeWidth={1} />
              <span className="font-black text-xs uppercase tracking-widest">Novo Evento</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'add' && (
        <div className="space-y-12 animate-in slide-in-from-right duration-500">
          
          {/* --- CRIAÇÃO DE EVENTO PAI --- */}
          <section className="space-y-8 bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border border-brand/20">
                <ImageIcon size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gerenciar Evento</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Defina o tipo de evento (ex: Culto Online, Presencial)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Evento</label>
                <input 
                  type="text" 
                  placeholder="Ex: Culto Online" 
                  value={newEvent.title} 
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} 
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Categoria</label>
                <select 
                  value={newEvent.categoryId} 
                  onChange={e => setNewEvent({ ...newEvent, categoryId: e.target.value })}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all appearance-none"
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={handleCreateEvent}
              disabled={!newEvent.title}
              className="bg-brand text-white font-black py-4 px-10 rounded-2xl transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 disabled:opacity-30"
            >
              Confirmar Evento
            </button>
          </section>

          {/* --- DETALHES DO EVENTO (FILHO) --- */}
          <section className="space-y-8 bg-[#161b22] p-10 rounded-[48px] border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Calendar size={180} className="text-brand" />
            </div>

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center border border-brand/20">
                <Clock size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Detalhes da Programação</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Vincule horários, locais e anotações</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Pertence ao Evento</label>
                <select 
                  value={newDetail.eventId} 
                  onChange={e => {
                    const id = e.target.value;
                    setNewDetail({ ...newDetail, eventId: id });
                    setSelectedEventId(id);
                  }}
                  className="w-full bg-[#0b0e14] border border-white/5 rounded-[24px] px-8 py-5 text-white font-black outline-none focus:ring-2 focus:ring-brand/30 transition-all appearance-none"
                >
                  <option value="">Selecione um evento...</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
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

          {/* --- LISTAGEM DE DETALHES EXISTENTES --- */}
          {selectedEventId && (
              <section className="space-y-6">
                  <div className="flex items-center gap-3 text-brand">
                      <Info size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Programações para "{selectedEvent?.title}"</span>
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
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Gerenciar Categorias</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nova Categoria</label>
                        <div className="flex gap-2">
                             <input type="text" id="new-cat" className="flex-1 bg-[#0b0e14] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none" placeholder="Ex: Eventos Especiais" />
                             <button onClick={() => {
                                 const el = document.getElementById('new-cat') as HTMLInputElement;
                                 if (el.value) {
                                     setCategories([...categories, { id: Date.now().toString(), name: el.value.toUpperCase() }]);
                                     el.value = '';
                                 }
                             }} className="px-6 bg-brand text-white rounded-2xl font-black text-xs uppercase transition-all hover:scale-105 active:scale-95">Adicionar</button>
                        </div>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-4 rounded-2xl">
                                <span className="text-xs font-black text-white uppercase tracking-widest">{cat.name}</span>
                                {cat.id !== '1' && (
                                    <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="text-gray-700 hover:text-rose-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
           </section>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(var(--brand-rgb), 0.2); border-radius: 10px; }
        .neon-text { text-shadow: 0 0 10px rgba(var(--brand-rgb), 0.5); }
      `}</style>
    </div>
  );
};

export default Cultos;
