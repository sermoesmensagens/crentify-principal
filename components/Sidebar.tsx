
import React, { useState, useEffect } from 'react';
import { Section } from '../types';
import { NAV_ITEMS, ADMIN_EMAILS } from '../constants';
import { UserCircle, Download, LogOut } from 'lucide-react';
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
    item.id !== Section.ADMIN || (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase()))
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
    <aside className="w-20 md:w-[260px] bg-brand-bg border-r border-white/5 flex flex-col h-full transition-all duration-300 z-50 overflow-hidden min-h-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-4">
        <div className="relative group cursor-pointer shrink-0">
          <div className="absolute -inset-2 bg-brand-accent/20 rounded-full blur-xl group-hover:bg-brand-accent/30 transition-all opacity-50"></div>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="CRENTIFY Logo"
              width="40"
              height="40"
              className="relative rounded-xl object-contain drop-shadow-2xl"
              onError={(e) => { e.currentTarget.src = '/logo.png'; }}
            />
          ) : (
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="hidden md:flex flex-col justify-center">
          <span className="text-xl font-extrabold text-white tracking-tight leading-none">CRENTIFY</span>
        </div>
      </div>

      <nav className="flex-1 mt-2 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative group ${activeSection === item.id
              ? 'bg-brand-card text-white'
              : 'text-c-text-secondary hover:bg-white/5 hover:text-white'
              }`}
          >
            {/* Active indicator - orange left border */}
            {activeSection === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-accent rounded-r-full"></div>
            )}
            <div className={`transition-transform duration-300 group-hover:scale-110 flex flex-col items-center gap-1 ${activeSection === item.id ? 'text-white' : 'text-c-text-secondary group-hover:text-brand-light'}`}>
              {item.icon}
              <span className="md:hidden text-[7px] font-semibold uppercase tracking-tighter opacity-70">
                {item.label.substring(0, 5)}
              </span>
            </div>
            <span className={`hidden md:block font-semibold text-[14px] tracking-wide ${activeSection === item.id ? 'text-white' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="p-3 mt-auto space-y-2 bg-brand-surface/50">
        {/* Install Button - Only show if app can be installed */}
        {canInstall && (
          <button
            onClick={promptInstall}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-brand/10 border border-brand/30 hover:bg-brand hover:text-white text-brand transition-all group animate-pulse hover:animate-none"
            title="Instalar CRENTIFY"
          >
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center border border-brand/40 group-hover:bg-white/20 transition-all">
              <Download size={18} />
            </div>
            <div className="hidden md:block text-left overflow-hidden">
              <p className="text-[9px] font-extrabold uppercase tracking-widest">Instalar App</p>
              <p className="text-[8px] font-semibold opacity-70">Área de Trabalho</p>
            </div>
          </button>
        )}

        {isInstalled && (
          <div className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
              <Download size={18} />
            </div>
            <div className="hidden md:block text-left overflow-hidden">
              <p className="text-[9px] font-extrabold uppercase tracking-widest">App Instalado</p>
              <p className="text-[8px] font-semibold opacity-70">✓ Pronto para usar</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={onProfileClick}
            className="flex-1 flex flex-col md:flex-row items-center gap-2 md:gap-3 p-2 md:p-3 rounded-2xl bg-brand-surface border border-white/5 hover:border-brand/30 transition-all group"
            title="Meu Perfil"
          >
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-brand/10 flex items-center justify-center text-brand border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all shrink-0">
              <UserCircle size={20} className="md:w-5 md:h-5" />
            </div>
            <div className="text-center md:text-left overflow-hidden">
              <p className="text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest text-white truncate">Perfil</p>
              <p className="hidden md:block text-[9px] text-c-text-muted font-semibold truncate">Configurações</p>
            </div>
          </button>

          <button
            onClick={() => {
              signOut();
            }}
            className="flex flex-col md:flex-row items-center justify-center p-2 md:p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg gap-1 md:gap-3"
            title="Sair"
          >
            <LogOut size={18} className="md:w-5 md:h-5" />
            <span className="text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
