
import React, { useEffect, useState, useRef } from 'react';
import { useStudies } from '../contexts/StudyContext';
import { useTarefas } from '../contexts/TarefasContext';
import { useServices } from '../contexts/ServiceContext';
import { Bell, Zap, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { getLocalDateString } from '../utils';

const NotificationManager: React.FC = () => {
    const [mounted, setMounted] = useState(false);
    const [permission, setPermission] = useState<string>('default');
    const [showPopup, setShowPopup] = useState<{title: string, body: string} | null>(null);
    const notifiedIds = useRef<Set<string>>(new Set());

    const studyContext = useStudies();
    const tarefasContext = useTarefas();
    const serviceContext = useServices();

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        } else {
            setPermission('unsupported');
        }

        const checkActivities = () => {
            try {
                const now = new Date();
                const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                              now.getMinutes().toString().padStart(2, '0');
                const todayStr = getLocalDateString();

                const s = studyContext?.studies || [];
                const t = tarefasContext?.tasks || [];
                const serviceDetails = serviceContext?.details || [];

                // Standard items (Studies, Tasks)
                [...s, ...t].forEach((item: any) => {
                    if (item && item.time === timeStr && !notifiedIds.current.has(item.id)) {
                        const isDone = item.completions && item.completions[todayStr];
                        if (!isDone) {
                            sendAlert('CRENTIFY: Hora da sua atividade!', `${item.category}: ${item.description || 'Sessão iniciada'}`);
                            notifiedIds.current.add(item.id);
                        }
                    }
                });

                // Services (Detailed Frequencies)
                serviceDetails.forEach((detail) => {
                    detail.frequencies.forEach(f => {
                        if (f.time === timeStr && !notifiedIds.current.has(`${detail.id}_${f.id}`)) {
                            const todayNum = new Date().getDay();
                            let isScheduledToday = false;
                            
                            if (f.type === 'weekly') isScheduledToday = f.daysOfWeek?.includes(todayNum) || false;
                            else if (f.type === 'once') isScheduledToday = f.date === todayStr;
                            else if (f.type === 'period') isScheduledToday = todayStr >= (f.startDate || '') && todayStr <= (f.endDate || '');

                            if (isScheduledToday) {
                                const eventTitle = serviceContext?.events.find(e => e.id === detail.eventId)?.title || 'Culto';
                                sendAlert(`CRENTIFY: Hora do ${eventTitle}!`, `${detail.title || 'Início da programação'}: ${detail.churchNameOrId}`);
                                notifiedIds.current.add(`${detail.id}_${f.id}`);
                            }
                        }
                    });
                });
            } catch (err) {}
        };

        const sendAlert = (title: string, body: string) => {
            // 1. Som sempre
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(() => {});
            } catch (e) {}

            // 2. Tentar notificação de sistema (Windows) - Não interromper o fluxo se falhar ou se for bloqueado
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification(title, { body, icon: '/icon-192-v2.png' });
                } catch (e) {}
            }
            
            // 3. SEMPRE mostrar o popup interno (para garantir que o usuário veja o aviso visual no App)
            setShowPopup({ title, body });
        };

        const interval = setInterval(checkActivities, 15000);
        checkActivities();
        return () => clearInterval(interval);
    }, [studyContext, tarefasContext, serviceContext]);

    const handlePermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            try {
                const res = await Notification.requestPermission();
                setPermission(res);
                if (res === 'granted') {
                    // Feedback imediato de sucesso
                    setShowPopup({ title: 'Notificações Ativadas!', body: 'Agora você receberá alertas nativos do Windows e do App.' });
                }
            } catch (e) {
                alert('Erro: ' + e);
            }
        }
    };

    if (!mounted) return null;

    if (showPopup) {
        return (
            <div className="fixed top-0 left-0 right-0 bottom-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-[#1c232b] border-[3px] border-brand p-8 rounded-3xl shadow-[0_0_100px_rgba(108,59,255,0.8)] max-w-sm w-full animate-in zoom-in duration-300">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 bg-brand rounded-2xl flex items-center justify-center text-white shadow-2xl animate-bounce">
                                <Zap size={48} className="fill-white" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-[#1c232b]">
                                <CheckCircle size={24} className="text-white" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-extrabold uppercase text-2xl tracking-tighter mb-2">{showPopup.title}</h3>
                            <p className="text-c-text-secondary font-bold uppercase text-xs leading-relaxed">{showPopup.body}</p>
                        </div>
                        <button 
                            onClick={() => setShowPopup(null)}
                            className="w-full bg-brand hover:bg-brand-light text-white font-extrabold py-5 rounded-2xl uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95"
                        >
                            FECHAR AVISO
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Se as notificações estiverem bloqueadas no Windows, mostramos o banner de aviso
    if (permission !== 'granted') {
        return (
            <div className="fixed top-0 left-0 right-0 z-[15000] animate-in slide-in-from-top duration-700">
                <div className={`w-full ${permission === 'denied' ? 'bg-red-600' : 'bg-brand'} p-3 flex items-center justify-center gap-4 shadow-2xl`}>
                    <div className="flex items-center gap-3">
                        {permission === 'denied' ? <AlertTriangle className="text-white shrink-0" size={24} /> : <Bell className="text-white animate-bounce shrink-0" size={24} />}
                        <span className="text-white font-extrabold uppercase text-[11px] tracking-tight leading-tight">
                            {permission === 'denied' 
                                ? '⚠️ NOTIFICAÇÕES BLOQUEADAS! No cadeado (topo esquerdo), mude para "Permitir" e recarregue.' 
                                : '⚠️ ATIVE AS NOTIFICAÇÕES PARA RECEBER SEUS LEMBRETES NO HORÁRIO CORRETO'
                            }
                        </span>
                    </div>
                    {permission !== 'denied' && (
                        <button 
                            onClick={handlePermission}
                            className="bg-white text-brand px-6 py-2 rounded-full font-extrabold text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0"
                        >
                            ATIVAR AGORA
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return null;
};

export default NotificationManager;
