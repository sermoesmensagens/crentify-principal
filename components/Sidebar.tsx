
import React, { useState, useEffect } from 'react';
import { Section } from '../types';
import { NAV_ITEMS, ADMIN_EMAILS } from '../constants';
import { UserCircle, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { getLogoUrl } from '../services/logoService';

interface SidebarProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  onProfileClick: () => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeSection, setActiveSection, onProfileClick, userEmail }) => {
  const { signOut } = useAuth();
  const visibleNavItems = NAV_ITEMS.filter(item =>
    item.id !== Section.ADMIN || (userEmail && ADMIN_EMAILS.includes(userEmail))
  );

  const { canInstall, promptInstall, isInstalled } = useInstallPrompt();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Carrega o logo dinâmico
  useEffect(() => {
    getLogoUrl().then(url => setLogoUrl(url));

    // Escuta evento de atualização de logo
    const handleLogoUpdate = (e: CustomEvent<string>) => {
      setLogoUrl(e.detail);
    };

    window.addEventListener('logoUpdated', handleLogoUpdate as EventListener);
    return () => window.removeEventListener('logoUpdated', handleLogoUpdate as EventListener);
  }, []);

  return (
    <aside className="w-20 md:w-64 bg-[#0b0e14] border-r border-white/5 flex flex-col h-full transition-all duration-300 z-50 overflow-hidden min-h-0">
      {/* Logo Unidade (Conceito 4) */}
      <div className="p-8 flex items-center gap-4">
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-2 bg-brand/30 rounded-full blur-xl group-hover:bg-brand/50 transition-all opacity-50"></div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="CRENTIFY Logo"
              width="40"
              height="40"
              className="relative rounded-lg"
              style={{ filter: 'saturate(1.5) brightness(1.15) hue-rotate(-10deg)' }}
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            />
          ) : (
            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="hidden md:flex flex-col justify-center">
          <span className="text-2xl font-black text-white tracking-tighter neon-text leading-none mt-1">CRENTIFY</span>
        </div>
      </div>

      <nav className="flex-1 mt-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-[22px] transition-all duration-300 relative group ${activeSection === item.id
              ? 'bg-gradient-to-r from-brand to-brand-light text-white neon-glow shadow-brand/40'
              : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
          >
            <div className={`transition-transform duration-300 group-hover:scale-110 flex flex-col items-center gap-1 ${activeSection === item.id ? 'text-white' : 'text-gray-500 group-hover:text-brand'}`}>
              {item.icon}
              <span className="md:hidden text-[7px] font-bold uppercase tracking-tighter opacity-70">
                {item.label.substring(0, 5)}
              </span>
            </div>
            <span className={`hidden md:block font-bold text-xs uppercase tracking-widest ${activeSection === item.id ? 'text-white' : ''}`}>
              {item.label}
            </span>
            {activeSection === item.id && (
              <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-2">
        {/* Install Button - Only show if app can be installed */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="w-full flex items-center gap-3 p-3 rounded-[20px] bg-brand/10 border border-brand/30 hover:bg-brand hover:text-white text-brand transition-all group animate-pulse hover:animate-none"
            title="Instalar CRENTIFY"
          >
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center border border-brand/40 group-hover:bg-white/20 transition-all">
              <Download size={18} />
            </div>
            <div className="hidden md:block text-left overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-widest">Instalar App</p>
              <p className="text-[8px] font-bold opacity-70">Área de Trabalho</p>
            </div>
          </button>
        )}

        {isInstalled && (
          <div className="w-full flex items-center gap-3 p-3 rounded-[20px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <Download size={18} />
            </div>
            <div className="hidden md:block text-left overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-widest">App Instalado</p>
              <p className="text-[8px] font-bold opacity-70">✓ Pronto para usar</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={onProfileClick}
            className="flex-1 flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 md:p-4 rounded-[18px] md:rounded-[24px] bg-[#161b22] border border-white/5 hover:border-brand/30 transition-all group"
            title="Meu Perfil"
          >
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all shrink-0">
              <UserCircle size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="text-center md:text-left overflow-hidden">
              <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white truncate">Perfil</p>
              <p className="hidden md:block text-[9px] text-gray-500 font-bold truncate">Configurações</p>
            </div>
          </button>

          <button
            onClick={() => {
              signOut();
            }}
            className="flex flex-col md:flex-row items-center justify-center p-2 md:p-4 rounded-[18px] md:rounded-[24px] bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg gap-1 md:gap-3"
            title="Sair"
          >
            <Download size={18} className="rotate-180 md:w-5 md:h-5" />
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
