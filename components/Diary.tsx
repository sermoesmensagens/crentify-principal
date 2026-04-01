
import React, { useState } from 'react';
import { DiaryEntry, BibleNote } from '../types';
import { Plus, Search, Trash2, Calendar, BookMarked, X, Send, Sparkles, MessageSquare, Quote, Edit2, BookOpen } from 'lucide-react';
import { useDiary } from '../contexts/DiaryContext';
import { useBible } from '../contexts/BibleContext';

type Tab = 'general' | 'bible';

const Diary: React.FC = () => {
  const { entries, setEntries } = useDiary();
  const { notes, setNotes } = useBible();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingBibleNote, setIsEditingBibleNote] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newEntry, setNewEntry] = useState<Partial<DiaryEntry>>({
    title: '',
    content: '',
    type: 'free'
  });

  const [editingBibleNote, setEditingBibleNote] = useState<BibleNote | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setNewEntry({ title: '', content: '', type: 'free' });
    setEditingBibleNote(null);
    setIsEditingBibleNote(false);
  };

  const handleSave = () => {
    if (!newEntry.title || !newEntry.content) return;

    if (editingId) {
      setEntries(entries.map(e => e.id === editingId ? {
        ...e,
        title: newEntry.title!,
        content: newEntry.content!,
        type: newEntry.type as any
      } : e));
    } else {
      const entry: DiaryEntry = {
        id: Date.now().toString(),
        title: newEntry.title || 'Sem Título',
        content: newEntry.content || '',
        date: new Date().toISOString(),
        type: (newEntry.type as any) || 'free'
      };
      setEntries([entry, ...entries]);
    }

    setIsAdding(false);
    resetForm();
  };

  const handleSaveBibleNote = () => {
    if (!editingBibleNote || !editingBibleNote.content.trim()) return;

    setNotes(notes.map(n => n.id === editingBibleNote.id ? editingBibleNote : n));
    setIsEditingBibleNote(false);
    resetForm();
  };

  const startEdit = (entry: DiaryEntry) => {
    setNewEntry({ title: entry.title, content: entry.content, type: entry.type });
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const startEditBibleNote = (note: BibleNote) => {
    setEditingBibleNote(note);
    setIsEditingBibleNote(true);
  };

  const deleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja apagar esta memória permanentemente?')) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const deleteBibleNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja apagar este insight permanentemente?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const filteredEntries = (entries || []).filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBibleNotes = (notes || []).filter(n =>
    n.bookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.verseText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-10 animate-in fade-in duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <BookMarked size={42} className="text-brand" />
            Minhas Notas
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Insights, memórias e revelações em um só lugar.</p>
        </div>
        
        {activeTab === 'general' && (
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="bg-gradient-to-r from-brand to-brand-light text-white px-10 py-5 rounded-[22px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/30"
          >
            <Plus size={20} strokeWidth={3} /> Nova Nota
          </button>
        )}
      </header>

      {/* TABS SELECTOR */}
      <div className="flex gap-4 p-1.5 bg-[#161b22] rounded-[28px] border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
        >
          <MessageSquare size={16} /> Meus Insights
        </button>
        <button
          onClick={() => setActiveTab('bible')}
          className={`px-8 py-4 rounded-[22px] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'bible' ? 'bg-brand text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
        >
          <BookOpen size={16} /> Insights Bíblicos
        </button>
      </div>

      {/* Busca */}
      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-brand transition-colors" size={22} />
        <input
          type="text"
          placeholder={activeTab === 'general' ? "Buscar em minhas notas..." : "Buscar em insights bíblicos..."}
          className="w-full bg-[#161b22] border border-white/5 rounded-[28px] py-6 pl-16 pr-6 text-white outline-none focus:ring-2 focus:ring-brand/30 transition-all font-bold placeholder:text-gray-700 shadow-2xl"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'general' ? (
          filteredEntries.length === 0 ? (
            <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center">
              <MessageSquare size={80} className="mb-6" />
              <p className="text-2xl font-black uppercase tracking-widest">Sua história começa aqui.</p>
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div
                key={entry.id}
                onClick={() => startEdit(entry)}
                className="group bg-[#161b22] p-8 rounded-[40px] border border-white/5 hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/5 transition-all relative cursor-pointer overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <Quote size={100} className="text-brand" />
                </div>

                <div className="flex items-center justify-between mb-6">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${entry.type === 'testimony' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      entry.type === 'plan' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-brand/10 text-brand border-brand/20'
                    }`}>
                    {entry.type === 'testimony' ? 'Testemunho' : entry.type === 'plan' ? 'Plano' : 'Insight'}
                  </span>
                  <button
                    onClick={(e) => deleteEntry(e, entry.id)}
                    className="z-10 text-gray-700 hover:text-rose-500 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <h3 className="font-black text-white text-xl mb-3 tracking-tighter uppercase line-clamp-2">{entry.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-4 leading-relaxed italic font-serif">"{entry.content}"</p>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-widest">
                  <Calendar size={12} />
                  {new Date(entry.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))
          )
        ) : (
          filteredBibleNotes.length === 0 ? (
            <div className="col-span-full py-40 text-center opacity-20 flex flex-col items-center">
              <BookOpen size={80} className="mb-6" />
              <p className="text-2xl font-black uppercase tracking-widest">Anote os tesouros da Palavra.</p>
            </div>
          ) : (
            filteredBibleNotes.map(note => (
              <div
                key={note.id}
                onClick={() => startEditBibleNote(note)}
                className="group bg-[#161b22] p-8 rounded-[40px] border border-white/5 hover:border-brand/30 hover:shadow-2xl hover:shadow-brand/5 transition-all relative cursor-pointer overflow-hidden flex flex-col h-full"
              >
                <div className="absolute -right-4 -top-4 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                  <BookOpen size={100} className="text-brand" />
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest">{note.bookName} {note.chapter}:{note.verse}</span>
                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-[0.2em] mt-1">Versículo Original</span>
                  </div>
                  <button
                    onClick={(e) => deleteBibleNote(e, note.id)}
                    className="z-10 text-gray-700 hover:text-rose-500 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 mb-6">
                   <p className="text-gray-600 text-[10px] italic font-serif line-clamp-2 opacity-50">"{note.verseText}"</p>
                </div>

                <p className="text-gray-300 text-sm line-clamp-6 leading-relaxed italic font-serif flex-1">"{note.content}"</p>

                <div className="mt-8 flex items-center gap-2 text-[10px] font-black text-gray-700 uppercase tracking-widest">
                  <Calendar size={12} />
                  {new Date(note.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal - General Notes */}
      {isAdding && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#161b22] w-full max-w-3xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand border border-brand/20">
                  <Edit2 size={24} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                  {editingId ? 'Editar Nota' : 'Nova Nota'}
                </h3>
              </div>
              <button
                onClick={() => { setIsAdding(false); setEditingId(null); }}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título do Registro</label>
                  <input
                    type="text"
                    placeholder="Dê um nome a esse insight..."
                    className="w-full bg-[#0b0e14] border border-white/5 rounded-[22px] px-6 py-4 text-white font-black placeholder:text-gray-800 outline-none focus:ring-2 focus:ring-brand/30 transition-all"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tipo de Registro</label>
                  <select
                    className="w-full bg-[#0b0e14] border border-white/5 text-white rounded-[22px] px-6 py-4 outline-none focus:ring-2 focus:ring-brand/30 font-bold appearance-none"
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as any })}
                  >
                    <option value="free">Livre / Insight</option>
                    <option value="plan">Plano / Estratégia</option>
                    <option value="testimony">Testemunho / Vitória</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sua Escrita</label>
                <textarea
                  placeholder="O que o Senhor tem falado com você hoje?"
                  className="w-full h-64 bg-[#0b0e14] text-white rounded-[32px] p-8 border border-white/5 focus:ring-2 focus:ring-brand/30 outline-none resize-none placeholder:text-gray-800 font-medium text-lg leading-relaxed italic font-serif"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSave}
                  disabled={!newEntry.title || !newEntry.content}
                  className="bg-brand text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
                >
                  <Sparkles size={18} />
                  {editingId ? 'ATUALIZAR NOTA' : 'SALVAR NOTA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Bible Notes */}
      {isEditingBibleNote && editingBibleNote && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#161b22] w-full max-w-3xl rounded-[48px] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center text-brand border border-brand/20">
                  <BookOpen size={24} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Editar Insight Bíblico</h3>
                    <p className="text-brand text-[10px] font-black uppercase tracking-widest">{editingBibleNote.bookName} {editingBibleNote.chapter}:{editingBibleNote.verse}</p>
                </div>
              </div>
              <button
                onClick={() => { setIsEditingBibleNote(false); resetForm(); }}
                className="text-gray-500 hover:text-white transition-colors p-2"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="bg-[#0b0e14] p-6 rounded-[22px] border border-white/5">
                <p className="text-gray-500 text-sm italic font-serif">"{editingBibleNote.verseText}"</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sua Revelação</label>
                <textarea
                  placeholder="O que o Senhor falou..."
                  className="w-full h-64 bg-[#0b0e14] text-white rounded-[32px] p-8 border border-white/5 focus:ring-2 focus:ring-brand/30 outline-none resize-none placeholder:text-gray-800 font-medium text-lg leading-relaxed italic font-serif"
                  value={editingBibleNote.content}
                  onChange={(e) => setEditingBibleNote({ ...editingBibleNote, content: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveBibleNote}
                  disabled={!editingBibleNote.content.trim()}
                  className="bg-brand text-white px-12 py-5 rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-brand/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
                >
                  <Sparkles size={18} />
                  ATUALIZAR INSIGHT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(135, 67, 242, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Diary;
