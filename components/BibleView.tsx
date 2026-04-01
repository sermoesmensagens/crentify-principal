
import React, { useState, useEffect, useRef } from 'react';
import { BibleNote } from '../types';
import { CheckCircle2, Circle, Share2, ArrowLeft, ArrowRight, BookOpen, X, Edit3, Trash2, Bookmark, Search, Loader2, ListChecks, Check } from 'lucide-react';
import { useDataContext } from '../contexts/DataContext';
import { useBible } from '../contexts/BibleContext';

const BibleView: React.FC = () => {
  const { bibleData, isBibleLoading, isSharedDataLoading } = useDataContext();
  const { 
    progress, setProgress, 
    notes, setNotes, 
    selectedBookName, setSelectedBookName, 
    selectedChapterIndex, setSelectedChapterIndex 
  } = useBible();

  const isLoading = isBibleLoading || isSharedDataLoading;
  const [testamentFilter, setTestamentFilter] = useState<'old' | 'new' | null>(null);
  const [showJournal, setShowJournal] = useState(false);
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [tempSelectedChapters, setTempSelectedChapters] = useState<number[]>([]);
  const [activeNoteVerse, setActiveNoteVerse] = useState<{ number: number, text: string } | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showJournal && journalRef.current) {
      journalRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showJournal]);

  // Reset scroll when book or chapter changes
  useEffect(() => {
    // Scroll the reader container itself
    if (readerRef.current) {
      readerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    // CRITICAL: Scroll the main app container to the top
    // Since our layout uses a scrollable <main> element, window.scrollTo(0,0) often doesn't work.
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [selectedBookName, selectedChapterIndex]);

  // Sincronizar seleção inicial caso a bíblia demore a carregar
  useEffect(() => {
    if (bibleData && bibleData.books.length > 0 && selectedBookName === null) {
      setSelectedBookName(bibleData.books[0].name);
    }
  }, [bibleData, selectedBookName]);

  const selectedBookIndex = selectedBookName && bibleData ? bibleData.books.findIndex(b => b.name === selectedBookName) : 0;
  const setSelectedBookIndex = (idx: number) => {
    if (bibleData && bibleData.books[idx]) {
      setSelectedBookName(bibleData.books[idx].name);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#161b22] rounded-[56px] border border-white/5">
        <Loader2 className="animate-spin text-brand mb-6" size={64} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand">Acessando os Arquivos Celestiais...</p>
      </div>
    );
  }

  if (!bibleData || !bibleData.books || bibleData.books.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-[#161b22] rounded-[56px] border border-white/5 shadow-2xl animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand/10 text-brand rounded-full flex items-center justify-center mb-8 border border-brand/20 shadow-[0_0_30px_rgba(135,67,242,0.1)]">
          <BookOpen size={48} />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Santuário Silencioso</h2>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">Nenhuma Bíblia encontrada no banco de dados local. Vá até a aba Admin e importe o arquivo JSON das Escrituras.</p>
      </div>
    );
  }

  const selectedBook = selectedBookIndex !== null ? bibleData.books[selectedBookIndex] : null;
  const selectedChapter = selectedBook ? selectedBook.chapters?.[selectedChapterIndex] : null;

  const toggleChapter = (bookName: string, chapterNum: number) => {
    const current = progress.completedChapters[bookName] || [];
    const isCompleted = current.includes(chapterNum);
    const updated = isCompleted ? current.filter(c => c !== chapterNum) : [...current, chapterNum];
    
    // Update completion dates
    const updatedDates = { ...(progress.completionDates || {}) };
    if (!isCompleted) {
      if (!updatedDates[bookName]) updatedDates[bookName] = {};
      updatedDates[bookName][chapterNum] = new Date().toISOString();
    } else if (updatedDates[bookName]) {
      delete updatedDates[bookName][chapterNum];
    }
    
    setProgress({ 
      ...progress, 
      completedChapters: { ...progress.completedChapters, [bookName]: updated },
      completionDates: updatedDates
    });
  };

  const openSelectionModal = () => {
    if (!selectedBook) return;
    const current = progress.completedChapters[selectedBook.name] || [];
    setTempSelectedChapters([...current]);
    setShowSelectionModal(true);
  };

  const handleConfirmMultiMark = () => {
    if (!selectedBook) return;
    
    const updatedDates = { ...(progress.completionDates || {}) };
    if (!updatedDates[selectedBook.name]) updatedDates[selectedBook.name] = {};
    
    const now = new Date().toISOString();
    tempSelectedChapters.forEach(ch => {
      if (!updatedDates[selectedBook.name][ch]) {
        updatedDates[selectedBook.name][ch] = now;
      }
    });

    setProgress({
      ...progress,
      completedChapters: {
        ...progress.completedChapters,
        [selectedBook.name]: [...tempSelectedChapters]
      },
      completionDates: updatedDates
    });
    setShowSelectionModal(false);
  };

  const toggleTempChapter = (chapterNum: number) => {
    setTempSelectedChapters(prev =>
      prev.includes(chapterNum) ? prev.filter(c => c !== chapterNum) : [...prev, chapterNum]
    );
  };

  const markAllTemp = () => {
    if (!selectedBook) return;
    const all = Array.from({ length: selectedBook.chapters.length }, (_, i) => i + 1);
    setTempSelectedChapters(all);
  };

  const clearTemp = () => {
    setTempSelectedChapters([]);
  };

  const handleSaveNote = () => {
    if (!selectedBook || !activeNoteVerse || !noteInput.trim()) return;
    
    if (editingNoteId) {
      setNotes(notes.map(n => n.id === editingNoteId ? {
        ...n,
        content: noteInput,
        date: new Date().toISOString()
      } : n));
    } else {
      const newNote: BibleNote = {
        id: Date.now().toString(),
        bookName: selectedBook.name,
        chapter: selectedChapterIndex + 1,
        verse: activeNoteVerse.number,
        verseText: activeNoteVerse.text,
        content: noteInput,
        date: new Date().toISOString()
      };
      setNotes([newNote, ...notes]);
    }
    
    setNoteInput('');
    setActiveNoteVerse(null);
    setEditingNoteId(null);
    setShowJournal(true);
  };

  const startEditExistingNote = (note: BibleNote) => {
    setEditingNoteId(note.id);
    setNoteInput(note.content);
    setActiveNoteVerse({ number: note.verse, text: note.verseText });
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja apagar este insight permanentemente?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  const currentNotes = selectedBook ? notes.filter(n => n.bookName === selectedBook.name && n.chapter === selectedChapterIndex + 1) : [];

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-700 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase neon-text flex items-center gap-4">
            <BookOpen size={42} className="text-brand" />
            Bíblia
          </h1>
          <p className="text-gray-500 mt-2 font-medium">As Sagradas Escrituras.</p>
        </div>
        <button
          onClick={() => setShowJournal(!showJournal)}
          className={`px-10 py-5 rounded-[22px] font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 shadow-xl ${showJournal ? 'bg-brand text-white shadow-brand/30' : 'bg-[#161b22] text-gray-400 border border-white/5 hover:border-brand/30'
            }`}
        >
          <Bookmark size={18} /> DIÁRIO BÍBLICO
        </button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <aside className="hidden lg:flex lg:col-span-3 bg-[#161b22] rounded-[32px] border border-white/5 flex-col shadow-2xl">
          <div className="p-5 border-b border-white/5 bg-black/20 flex items-center justify-between">
            <h3 className="font-black text-brand text-[9px] uppercase tracking-[0.3em]">
              {testamentFilter ? (testamentFilter === 'old' ? 'Antigo Testamento' : 'Novo Testamento') : 'Cânon'}
            </h3>
            {testamentFilter ? (
              <button
                onClick={() => setTestamentFilter(null)}
                className="text-[8px] font-black text-brand hover:text-white transition-colors uppercase tracking-widest bg-brand/10 px-2 py-1 rounded-lg border border-brand/20"
              >
                Voltar
              </button>
            ) : (
              <Search size={14} className="text-gray-700" />
            )}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 bg-[#0b0e14]/30">
            {!testamentFilter ? (
              <div className="grid grid-cols-1 gap-3 p-2">
                <button
                  onClick={() => setTestamentFilter('old')}
                  className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-brand/20 to-transparent border border-brand/20 hover:border-brand/50 transition-all text-left"
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-1">Cânon</p>
                    <p className="text-lg font-black text-white uppercase tracking-tighter">Antigo<br />Testamento</p>
                    <p className="text-[9px] font-bold text-gray-500 mt-2">39 LIVROS</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-brand/5 group-hover:text-brand/10 transition-colors">
                    <BookOpen size={80} />
                  </div>
                </button>
                <button
                  onClick={() => setTestamentFilter('new')}
                  className="group relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 hover:border-emerald-500/50 transition-all text-left"
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Cânon</p>
                    <p className="text-lg font-black text-white uppercase tracking-tighter">Novo<br />Testamento</p>
                    <p className="text-[9px] font-bold text-gray-500 mt-2">27 LIVROS</p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 text-emerald-500/5 group-hover:text-emerald-500/10 transition-colors">
                    <BookOpen size={80} />
                  </div>
                </button>
              </div>
            ) : (
              bibleData.books.map((book, idx) => {
                const isNewTestament = idx >= 39;
                if (testamentFilter === 'old' && isNewTestament) return null;
                if (testamentFilter === 'new' && !isNewTestament) return null;

                const comp = (progress.completedChapters[book.name] || []).length;
                const total = book.chapters?.length || 1;
                const pct = Math.round((comp / total) * 100);

                return (
                  <button
                    key={book.name}
                    onClick={() => { setSelectedBookIndex(idx); setSelectedChapterIndex(0); }}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group ${selectedBookIndex === idx ? 'bg-brand text-white shadow-lg' : 'text-gray-600 hover:bg-white/5 hover:text-gray-300'
                      }`}
                  >
                    <span className="font-black uppercase text-[10px] tracking-tight truncate mr-2">{book.name}</span>
                    <span className="text-[8px] font-black opacity-30">{pct}%</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Área Principal */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Mobile Navigator / Breadcrumb */}
          <div className="lg:hidden flex items-center justify-between bg-[#161b22] p-5 rounded-[28px] border border-white/5 shadow-xl">
            <button
              onClick={() => setShowBookSelector(true)}
              className="flex items-center gap-3 bg-brand/10 text-brand px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-brand/20 active:scale-95 transition-all shadow-lg"
            >
              <ArrowLeft size={16} />
              Livros
            </button>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-white uppercase tracking-tight">{selectedBook?.name || 'Escolher Livro'}</span>
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                {selectedBook?.chapters?.length || 0} capítulos
              </span>
            </div>
          </div>
          {/* Leitor */}
          <section className="flex flex-col bg-[#161b22] rounded-[40px] shadow-2xl border border-white/5 overflow-hidden relative min-h-[500px]">
            {selectedBook ? (
              <>
                <div className="p-6 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between bg-black/20 backdrop-blur-xl z-20 gap-4">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter truncate">{selectedBook.name}</h2>
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={selectedChapterIndex}
                        onChange={(e) => setSelectedChapterIndex(Number(e.target.value))}
                        className="w-full bg-[#0b0e14] border border-white/10 rounded-xl px-6 py-3 text-[10px] font-black text-white outline-none focus:ring-4 focus:ring-brand/20 appearance-none cursor-pointer pr-12"
                      >
                        {selectedBook.chapters?.map((_, i) => (
                          <option key={i} value={i}>Capítulo {i + 1}</option>
                        ))}
                      </select>
                      <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand rotate-90" size={14} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={openSelectionModal}
                      className="hidden md:flex items-center gap-2 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-500 border border-white/5 hover:border-brand/30 hover:text-brand transition-all"
                    >
                      <ListChecks size={16} /> MARCAR VÁRIOS
                    </button>

                    <button
                      onClick={() => toggleChapter(selectedBook.name, selectedChapterIndex + 1)}
                      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${(progress.completedChapters[selectedBook.name] || []).includes(selectedChapterIndex + 1)
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-brand text-white shadow-lg shadow-brand/20'
                        }`}
                    >
                      {(progress.completedChapters[selectedBook.name] || []).includes(selectedChapterIndex + 1) ? <Check size={16} /> : <Circle size={16} />}
                      {(progress.completedChapters[selectedBook.name] || []).includes(selectedChapterIndex + 1) ? 'LIDO' : 'CONCLUIR'}
                    </button>
                  </div>
                </div>

                <div 
                  ref={readerRef}
                  className="p-8 md:p-12 space-y-6 bg-[#0b0e14]/50 reader-container"
                >
                  {selectedChapter?.verses?.map((v) => (
                    <div key={v.number} className="group relative">
                      <div className="flex gap-8">
                        <span className="text-brand/20 font-black text-xl mt-1 flex-shrink-0 w-10 text-right italic font-serif">{v.number}</span>
                        <div className="flex-1">
                          <p className="text-gray-300 leading-relaxed text-xl font-serif italic selection:bg-brand/30">
                            {v.text}
                          </p>
                          <div className="mt-4 flex gap-6 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => setActiveNoteVerse(v)} className="flex items-center gap-2 text-[10px] font-black uppercase text-brand">
                              <Edit3 size={14} /> Anotar
                            </button>
                            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`"${v.text}" - ${selectedBook.name} ${selectedChapterIndex + 1}:${v.number}`)}`, '_blank')} className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-600">
                              <Share2 size={14} /> Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}


                </div>

                {/* Floating Side Nav Arrows (Desktop) */}
                <div className="absolute inset-y-0 left-0 flex items-center p-4 z-10 pointer-events-none hidden xl:flex">
                  <button 
                    disabled={selectedChapterIndex === 0}
                    onClick={() => setSelectedChapterIndex(prev => prev - 1)}
                    className="p-4 rounded-xl bg-[#161b22]/40 backdrop-blur-md text-gray-500 hover:text-brand border border-white/10 hover:border-brand/40 transition-all pointer-events-auto disabled:opacity-0"
                    title="Capítulo Anterior"
                  >
                    <ArrowLeft size={24} />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 flex items-center p-4 z-10 pointer-events-none hidden xl:flex">
                  <button 
                    disabled={selectedChapterIndex === (selectedBook.chapters?.length || 1) - 1}
                    onClick={() => setSelectedChapterIndex(prev => prev + 1)}
                    className="p-4 rounded-xl bg-[#161b22]/40 backdrop-blur-md text-gray-500 hover:text-brand border border-white/10 hover:border-brand/40 transition-all pointer-events-auto disabled:opacity-0"
                    title="Próximo Capítulo"
                  >
                    <ArrowRight size={24} />
                  </button>
                </div>

                <div className="p-6 border-t border-white/5 flex items-center justify-between bg-black/20">
                  <button disabled={selectedChapterIndex === 0} onClick={() => setSelectedChapterIndex(prev => prev - 1)} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-brand disabled:opacity-10 transition-all border border-transparent hover:border-brand/20">
                    <ArrowLeft size={14} /> Anterior
                  </button>

                  <button
                    onClick={() => toggleChapter(selectedBook.name, selectedChapterIndex + 1)}
                    className={`group relative overflow-hidden px-6 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all duration-500 active:scale-95 shadow-lg ${
                      (progress.completedChapters[selectedBook.name] || []).includes(selectedChapterIndex + 1)
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/10'
                        : 'bg-brand text-white shadow-lg shadow-brand/30 hover:scale-105'
                    }`}
                  >
                    <div className="relative z-10 flex items-center gap-2">
                      {(progress.completedChapters[selectedBook.name] || []).includes(selectedChapterIndex + 1) ? (
                        <>
                          <CheckCircle2 size={16} />
                          <span>CONCLUÍDO</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} className="group-hover:animate-bounce" />
                          <span>MARCAR COMO LIDO</span>
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
                  </button>

                  <button disabled={selectedChapterIndex === (selectedBook.chapters?.length || 1) - 1} onClick={() => setSelectedChapterIndex(prev => prev + 1)} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-brand disabled:opacity-10 transition-all border border-transparent hover:border-brand/20">
                    Próximo <ArrowRight size={14} />
                  </button>
                </div>

                {/* Floating Navigation Bar (Mobile/Tablet Focused) */}
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-[#161b22]/90 backdrop-blur-2xl p-2.5 rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 lg:hidden">
                  <button
                    disabled={selectedChapterIndex === 0}
                    onClick={() => {
                      setSelectedChapterIndex(prev => prev - 1);
                    }}
                    className="w-16 h-16 rounded-[24px] bg-white/5 text-gray-400 flex items-center justify-center border border-white/5 active:bg-brand active:text-white disabled:opacity-20 transition-all shadow-xl"
                  >
                    <ArrowLeft size={28} />
                  </button>

                  <div className="px-6 py-2 bg-brand text-white rounded-2xl flex flex-col items-center justify-center min-w-[100px] shadow-lg shadow-brand/20">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Capítulo</span>
                    <span className="text-xl font-black tracking-tighter">{selectedChapterIndex + 1}</span>
                  </div>

                  <button
                    disabled={selectedChapterIndex === (selectedBook.chapters?.length || 1) - 1}
                    onClick={() => {
                      setSelectedChapterIndex(prev => prev + 1);
                    }}
                    className="w-20 h-20 rounded-[24px] bg-brand text-white flex items-center justify-center shadow-2xl shadow-brand/40 active:scale-95 disabled:opacity-20 transition-all border-2 border-white/10"
                  >
                    <ArrowRight size={36} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-10">
                <BookOpen size={100} className="mb-8" />
                <h3 className="font-black text-3xl uppercase tracking-tighter">Selecione um Livro</h3>
              </div>
            )}
          </section>

          {/* Journal Section Embaixo */}
          {showJournal && (
            <aside ref={journalRef} className="bg-[#161b22] rounded-[40px] border border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden scroll-mt-6">
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-3">
                  <Bookmark size={20} className="text-brand" />
                  <h3 className="font-black text-white text-lg uppercase tracking-tighter">Insights do Capítulo</h3>
                </div>
                <button onClick={() => setShowJournal(false)} className="text-gray-500 hover:text-white transition-colors p-2"><X size={20} /></button>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar max-h-[400px]">
                {currentNotes.length === 0 ? (
                  <div className="col-span-full text-center py-10 opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma anotação neste capítulo</p>
                  </div>
                ) : (
                  currentNotes.map(note => (
                    <div key={note.id} className="bg-[#0b0e14]/50 p-6 rounded-3xl border border-white/5 hover:border-brand/40 transition-all relative group">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-black text-brand uppercase">Versículo {note.verse}</p>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => startEditExistingNote(note)}
                            className="p-1.5 bg-brand/10 text-brand rounded-lg hover:bg-brand hover:text-white transition-all shadow-lg"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button 
                            onClick={(e) => deleteNote(e, note.id)}
                            className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm font-medium leading-relaxed italic font-serif">"{note.content}"</p>
                    </div>
                  ))
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Overlay de Anotação do Versículo */}
      {activeNoteVerse && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#161b22] w-full max-w-xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 flex justify-between items-center bg-black/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">V{activeNoteVerse.number}</h4>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{selectedBook?.name} {selectedChapterIndex + 1}</p>
                </div>
              </div>
              <button onClick={() => setActiveNoteVerse(null)} className="text-gray-500 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-[#0b0e14] p-6 rounded-2xl border border-white/5 italic text-gray-400 text-sm font-serif">
                "{activeNoteVerse.text}"
              </div>

              <textarea
                autoFocus
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="O que o Espírito revelou sobre este versículo?"
                className="w-full bg-[#0b0e14] border border-white/10 rounded-2xl p-6 text-white text-sm outline-none placeholder:text-gray-800 h-40 resize-none font-medium focus:ring-2 focus:ring-brand/30 transition-all"
              />

              <div className="flex gap-4">
                <button
                  onClick={() => setActiveNoteVerse(null)}
                  className="flex-1 bg-white/5 text-gray-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  CANCELAR
                </button>
                <button
                  onClick={handleSaveNote}
                  className="flex-[2] bg-brand text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingNoteId ? 'ATUALIZAR INSIGHT' : 'SALVAR INSIGHT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Seletor de Livros Mobile */}
      {showBookSelector && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl p-6 lg:hidden animate-in fade-in duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
              {testamentFilter ? (testamentFilter === 'old' ? 'Antigo Testamento' : 'Novo Testamento') : 'Escolha o Testamento'}
            </h3>
            <div className="flex items-center gap-3">
              {testamentFilter && (
                <button
                  onClick={() => setTestamentFilter(null)}
                  className="px-4 py-3 bg-white/5 text-brand rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/5"
                >
                  Voltar
                </button>
              )}
              <button onClick={() => setShowBookSelector(false)} className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-gray-500 shadow-xl">
                <X size={24} />
              </button>
            </div>
          </div>

          {!testamentFilter ? (
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setTestamentFilter('old')}
                className="relative overflow-hidden p-8 rounded-[32px] bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 text-left"
              >
                <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-2">Cânon</p>
                <p className="text-3xl font-black text-white uppercase tracking-tighter">Antigo<br />Testamento</p>
                <div className="absolute -right-6 -bottom-6 text-brand/10">
                  <BookOpen size={120} />
                </div>
              </button>
              <button
                onClick={() => setTestamentFilter('new')}
                className="relative overflow-hidden p-8 rounded-[32px] bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 text-left"
              >
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Cânon</p>
                <p className="text-3xl font-black text-white uppercase tracking-tighter">Novo<br />Testamento</p>
                <div className="absolute -right-6 -bottom-6 text-emerald-500/10">
                  <BookOpen size={120} />
                </div>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-20">
              {bibleData.books.map((book, idx) => {
                const isNewTestament = idx >= 39;
                if (testamentFilter === 'old' && isNewTestament) return null;
                if (testamentFilter === 'new' && !isNewTestament) return null;

                const comp = (progress.completedChapters[book.name] || []).length;
                const total = book.chapters?.length || 1;
                const pct = Math.round((comp / total) * 100);
                return (
                  <button
                    key={book.name}
                    onClick={() => { setSelectedBookIndex(idx); setSelectedChapterIndex(0); setShowBookSelector(false); }}
                    className={`p-5 rounded-2xl text-left transition-all border ${selectedBookIndex === idx ? 'bg-brand text-white border-brand' : 'bg-[#161b22] text-gray-500 border-white/5'}`}
                  >
                    <p className="font-black uppercase text-[10px] tracking-tight truncate">{book.name}</p>
                    <p className="text-[8px] font-bold mt-1 opacity-40">{pct}% Concluído</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Marcar Vários Capítulos */}
      {showSelectionModal && selectedBook && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-[#161b22] w-full max-w-2xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
            <div className="p-8 flex justify-between items-center bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand border border-brand/20">
                  <ListChecks size={24} />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedBook.name}</h4>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Marcar Capítulos Lidos</p>
                </div>
              </div>
              <button onClick={() => setShowSelectionModal(false)} className="text-gray-500 hover:text-white p-2 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 flex gap-3 border-b border-white/5 bg-black/10">
              <button
                onClick={markAllTemp}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-brand/10 text-brand border border-brand/20 hover:bg-brand/20 transition-all"
              >
                <CheckCircle2 size={16} /> Marcar Todos
              </button>
              <button
                onClick={clearTemp}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10 transition-all"
              >
                <Circle size={16} /> Limpar Todos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {selectedBook.chapters.map((_, idx) => {
                  const chapterNum = idx + 1;
                  const isSelected = tempSelectedChapters.includes(chapterNum);
                  return (
                    <button
                      key={chapterNum}
                      onClick={() => toggleTempChapter(chapterNum)}
                      className={`aspect-square rounded-xl text-sm font-black transition-all border ${isSelected
                        ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40 shadow-lg'
                        : 'bg-white/5 text-gray-500 border-white/5 hover:border-brand/30 hover:text-brand'
                        }`}
                    >
                      {chapterNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-8 flex gap-4 border-t border-white/5 bg-black/20">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="flex-1 bg-white/5 text-gray-400 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMultiMark}
                className="flex-[2] bg-brand text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> Confirmar Seleção
              </button>
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

export default BibleView;
