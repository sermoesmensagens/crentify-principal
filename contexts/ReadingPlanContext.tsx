
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReadingPlan, ReadingPlanContent, ReadingPlanCategory, ReadingPlanProgress } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { useAuth } from './AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { safeLocalStorageGet } from '../utils';
import { BIBLE_365_CONTENT } from '../data/bible365Plan';

interface ReadingPlanContextType {
    plans: ReadingPlan[];
    setPlans: React.Dispatch<React.SetStateAction<ReadingPlan[]>>;
    planContent: ReadingPlanContent[];
    setPlanContent: React.Dispatch<React.SetStateAction<ReadingPlanContent[]>>;
    categories: ReadingPlanCategory[];
    setCategories: React.Dispatch<React.SetStateAction<ReadingPlanCategory[]>>;
    progress: Record<string, ReadingPlanProgress>;
    setProgress: React.Dispatch<React.SetStateAction<Record<string, ReadingPlanProgress>>>;
}

const ReadingPlanContext = createContext<ReadingPlanContextType | undefined>(undefined);

const INITIAL_MOCK_PLANS: ReadingPlan[] = [
    {
        id: "plan-bible-year",
        title: "Bíblia em 365 Dias",
        description: "Uma jornada completa por toda a Escritura em um ano, do Gênesis ao Apocalipse. 1.189 capítulos divididos em 365 dias de comunhão com Deus.",
        durationDays: 365,
        categoryId: "1",
        isAiGenerated: false,
        visibility: "público",
        thumbnailUrl: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070&auto=format&fit=crop",
        createdAt: new Date().toISOString()
    },
    {
        id: "plan-vencendo-ansiedade",
        title: "Vencendo a Ansiedade",
        description: "Plano temático focado no descanso em Deus e no controle da mente através da Palavra.",
        durationDays: 7,
        categoryId: "2",
        isAiGenerated: true,
        visibility: "público",
        thumbnailUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2099&auto=format&fit=crop",
        createdAt: new Date().toISOString()
    }
];

const INITIAL_MOCK_CONTENT: ReadingPlanContent[] = [
    // ── Bíblia em 365 Dias (gerado automaticamente) ────────────────────────────
    ...BIBLE_365_CONTENT,
    // ── Vencendo a Ansiedade ────────────────────────────────────────────────────
    {
        id: "c1",
        planId: "plan-vencendo-ansiedade",
        week: "Semana 1",
        day: "Dia 1",
        title: "O Cuidado de Deus",
        resources: [
            { id: "r1", type: "leitura", title: "Mateus 6", duration: "1 cap" },
            { id: "r2", type: "leitura", title: "Filipenses 4", duration: "1 cap" }
        ]
    },
    {
        id: "c2",
        planId: "plan-vencendo-ansiedade",
        week: "Semana 1",
        day: "Dia 2",
        title: "Paz que Excede Entendimento",
        resources: [
            { id: "r3", type: "leitura", title: "João 14", duration: "1 cap" },
            { id: "r4", type: "leitura", title: "Salmos 23", duration: "1 cap" }
        ]
    }
];

export const ReadingPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    const { cloudData, sharedData, isDataLoaded, isInitialLoading, isSharedDataLoading } = useDataContext();
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase());

    const [plans, setPlans] = useState<ReadingPlan[]>(() => {
        const local = safeLocalStorageGet('crentify_reading_plans', null);
        if (local && local.length > 0) {
            // Always ensure mock plans are present with latest data
            const merged = [...local];
            for (const mock of INITIAL_MOCK_PLANS) {
                if (!merged.find(p => p.id === mock.id)) merged.unshift(mock);
            }
            return merged;
        }
        return isAdmin ? [] : INITIAL_MOCK_PLANS;
    });
    const [planContent, setPlanContent] = useState<ReadingPlanContent[]>(() => {
        const local = safeLocalStorageGet('crentify_reading_plan_content', null);
        if (local && local.length > 0) {
            // If the 365-day plan content is missing or incomplete, inject it
            const hasBible365 = local.filter((c: ReadingPlanContent) => c.planId === 'plan-bible-year').length >= 365;
            if (!hasBible365) {
                const otherContent = local.filter((c: ReadingPlanContent) => c.planId !== 'plan-bible-year');
                return [...BIBLE_365_CONTENT, ...otherContent];
            }
            return local;
        }
        return isAdmin ? [] : INITIAL_MOCK_CONTENT;
    });
    const [categories, setCategories] = useState<ReadingPlanCategory[]>(() => {
        const local = safeLocalStorageGet('crentify_reading_plan_categories', null);
        if (local) return local;
        return [
            { id: "1", name: "Bíblia Anual", color: "#ff5c5c" },
            { id: "2", name: "Temático", color: "#5cff8a" },
            { id: "3", name: "IA Personalizado", color: "#9d5cff" }
        ];
    });
    const [progress, setProgress] = useState<Record<string, ReadingPlanProgress>>(() => safeLocalStorageGet('crentify_reading_plan_progress', {}));

    // Sync from Cloud (User Progress)
    useEffect(() => {
        if (isDataLoaded) {
            if (cloudData.crentify_reading_plan_progress) setProgress(cloudData.crentify_reading_plan_progress.value);

            // Admin specific User Data
            if (isAdmin) {
                if (cloudData.crentify_reading_plans?.value?.length > 0) setPlans(cloudData.crentify_reading_plans.value);
                if (cloudData.crentify_reading_plan_content?.value?.length > 0) setPlanContent(cloudData.crentify_reading_plan_content.value);
                if (cloudData.crentify_reading_plan_categories) setCategories(cloudData.crentify_reading_plan_categories.value);
            }
        }
    }, [isDataLoaded, cloudData, isAdmin]);

    // Sync from Shared Data (Admins and Users)
    useEffect(() => {
        if (!isSharedDataLoading && sharedData) {
            // Prioritize shared data for content to ensure consistency across accounts
            if (sharedData.crentify_reading_plans?.length > 0) {
                console.log("☁️ ReadingPlanContext: Carregando planos compartilhados...");
                setPlans(sharedData.crentify_reading_plans);
            }
            if (sharedData.crentify_reading_plan_content?.length > 0) {
                setPlanContent(sharedData.crentify_reading_plan_content);
            }
            if (sharedData.crentify_reading_plan_categories) {
                setCategories(sharedData.crentify_reading_plan_categories);
            }
        }
    }, [isSharedDataLoading, sharedData]);

    const isAllDataLoaded = isDataLoaded && !isInitialLoading && !isSharedDataLoading;
    
    // User progress sync
    useDataSync(isAllDataLoaded ? 'crentify_reading_plan_progress' : '', progress);

    // Shared data sync (Admins only)
    const canSyncShared = isAdmin && isAllDataLoaded;
    useDataSync((canSyncShared && (plans.length > 0 || sharedData.crentify_reading_plans)) ? 'crentify_reading_plans' : '', isAdmin ? plans : null);
    useDataSync((canSyncShared && (planContent.length > 0 || sharedData.crentify_reading_plan_content)) ? 'crentify_reading_plan_content' : '', isAdmin ? planContent : null);
    useDataSync((canSyncShared && (categories.length > 0 || sharedData.crentify_reading_plan_categories)) ? 'crentify_reading_plan_categories' : '', isAdmin ? categories : null);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_reading_plans', JSON.stringify(plans));
        localStorage.setItem('crentify_reading_plan_content', JSON.stringify(planContent));
        localStorage.setItem('crentify_reading_plan_categories', JSON.stringify(categories));
        localStorage.setItem('crentify_reading_plan_progress', JSON.stringify(progress));
    }, [plans, planContent, categories, progress]);

    return (
        <ReadingPlanContext.Provider value={{
            plans, setPlans, planContent, setPlanContent, categories, setCategories, progress, setProgress
        }}>
            {children}
        </ReadingPlanContext.Provider>
    );
};

export const useReadingPlans = () => {
    const context = useContext(ReadingPlanContext);
    if (context === undefined) {
        throw new Error('useReadingPlans must be used within a ReadingPlanProvider');
    }
    return context;
};
