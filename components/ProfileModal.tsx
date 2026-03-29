
import React, { useState, useEffect } from 'react';
import { X, User, Shield, LogOut, Bookmark, Trash2, Edit2, Check } from 'lucide-react';
import { BibleNote } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ProfileModalProps {
  onClose: () => void;
  bibleNotes?: BibleNote[];
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, bibleNotes = [] }) => {
  const { user, signOut } = useAuth();
  const [name, setName] = useState(user?.user_metadata?.full_name || 'Usuário CRENTIFY');
  const [email, setEmail] = useState(user?.email || 'contato@crentify.app');
  const [activeTab, setActiveTab] = useState<'info' | 'notes'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const { updatePassword } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ text: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      setPasswordMessage({ text: 'Erro ao alterar senha. Tente novamente.', type: 'error' });
    } else {
      setPasswordMessage({ text: 'Senha alterada com sucesso!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordMessage(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-[#161b22] w-full max-w-2xl rounded-[32px] border border-white/10 shadow-2xl overflow-hidden text-white animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">

        {/* Banner Compacto */}
        <div className="relative h-32 bg-gradient-to-br from-brand to-brand-dark flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-rose-500 transition-all z-10 shadow-xl">
            <X size={20} />
          </button>
          <div className="absolute -bottom-10 left-8 flex items-end gap-5">
            <div className="relative">
              <div className="w-24 h-24 bg-[#0b0e14] rounded-[24px] border-[6px] border-[#161b22] flex items-center justify-center text-brand shadow-2xl overflow-hidden neon-border">
                <User size={40} strokeWidth={1.5} />
              </div>
            </div>
            <div className="pb-2">
              <h2 className="text-xl font-black tracking-tighter uppercase neon-text text-white">{name}</h2>
              <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">{email}</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="pt-14 px-8 pb-4 border-b border-white/5 flex-shrink-0 flex justify-between items-center">
          <div className="flex bg-[#0b0e14] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Identidade
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'notes' ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Registros ({bibleNotes.length})
            </button>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isEditing ? 'bg-emerald-500 text-white' : 'bg-white/5 text-gray-500 hover:text-brand'}`}
          >
            {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
            {isEditing ? 'SALVAR' : 'EDITAR'}
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0b0e14]/50">
          {activeTab === 'info' ? (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[9px] font-black text-brand uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand"></div> Dados Pessoais
                </h3>
                <div className="grid gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={`w-full bg-[#161b22] border rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all ${isEditing ? 'border-brand/40 text-white focus:ring-2 focus:ring-brand/30' : 'border-white/10 text-gray-400 cursor-not-allowed'}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail</label>
                    <input
                      type="email"
                      disabled={true}
                      value={email}
                      className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 font-bold text-sm text-gray-500 cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[9px] font-black text-brand uppercase tracking-[0.3em] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand"></div> Conta
                </h3>
                <div className="grid gap-3">
                  {isChangingPassword ? (
                    <div className="space-y-4 bg-[#161b22] p-6 rounded-2xl border border-brand/20 animate-in slide-in-from-top-2">
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Nova Senha</h4>
                      <input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 font-bold text-sm text-white outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <input
                        type="password"
                        placeholder="Confirme a nova senha"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-white/5 rounded-xl px-4 py-3 font-bold text-sm text-white outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      {passwordMessage && (
                        <p className={`text-[10px] font-bold uppercase text-center ${passwordMessage.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {passwordMessage.text}
                        </p>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => { setIsChangingPassword(false); setPasswordMessage(null); }}
                          className="flex-1 px-4 py-3 bg-white/5 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all font-bold"
                        >
                          CANCELAR
                        </button>
                        <button
                          onClick={handleUpdatePassword}
                          className="flex-1 px-4 py-3 bg-brand text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
                        >
                          CONFIRMAR
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsChangingPassword(true)}
                      className="w-full flex items-center justify-between p-4 bg-[#161b22] border border-white/5 rounded-xl hover:border-brand/40 transition-all group"
                    >
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">
                        <Shield size={16} className="text-brand" /> Alterar Senha
                      </div>
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 hover:border-rose-500/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-rose-400 group-hover:text-rose-300">
                      <LogOut size={16} /> Encerrar Sessão
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bibleNotes.map(note => (
                <div key={note.id} className="p-5 bg-[#161b22] rounded-2xl border border-white/5 hover:border-brand/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-brand/10 text-brand rounded-lg flex items-center justify-center border border-brand/20">
                        <Bookmark size={14} />
                      </div>
                      <span className="text-[9px] font-black uppercase text-white tracking-widest">{note.bookName} {note.chapter}:{note.verse}</span>
                    </div>
                    <span className="text-[8px] text-gray-600 font-bold uppercase">{new Date(note.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-gray-300 text-xs leading-relaxed">"{note.content}"</p>
                </div>
              ))}
              {bibleNotes.length === 0 && (
                <div className="text-center py-12 opacity-30">
                  <Bookmark size={48} className="mx-auto mb-4" strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="bg-brand text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all text-[10px]"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
