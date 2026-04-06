import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const APP_VERSION = '1.0.1'; // Increment this to trigger the notification

export function UpdateNotification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const savedVersion = localStorage.getItem('crentify_app_version');
    if (savedVersion !== APP_VERSION) {
      setShow(true);
    }
  }, []);

  const handleUpdate = () => {
    localStorage.setItem('crentify_app_version', APP_VERSION);
    
    // Clear caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (let name of names) {
          caches.delete(name);
        }
      });
    }
    
    // Reload hard
    window.location.reload();
  };

  const handleClose = () => {
    setShow(false);
    // Optionally we save the version so it doesn't show again until next update
    localStorage.setItem('crentify_app_version', APP_VERSION);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-brand/10 backdrop-blur-md border border-brand/20 p-4 rounded-xl shadow-2xl animate-fade-up max-w-[320px]">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand/20 rounded-lg">
            <RefreshCw className="h-5 w-5 text-brand animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">Nova Versão Disponível</h3>
            <p className="text-gray-400 text-xs mt-1">Atualizamos o Crentify para você!</p>
          </div>
        </div>
        <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="pt-3">
        <p className="text-xs text-brand/80 mb-3 leading-relaxed font-medium">
          Dica: Se notar lentidão ou travamentos, clique em atualizar para carregar as melhorias recentes e limpar os caches que pesam no navegador.
        </p>
        <button 
          onClick={handleUpdate}
          className="w-full py-2 bg-brand text-black font-extrabold text-xs uppercase tracking-widest rounded-lg hover:bg-brand/90 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-3 w-3" />
          ATUALIZAR AGORA
        </button>
      </div>
    </div>
  );
}
