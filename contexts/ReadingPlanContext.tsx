
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ReadingPlan, ReadingPlanContent, ReadingPlanCategory, ReadingPlanProgress } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { useAuth } from './AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { safeLocalStorageGet } from '../utils';

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

export const ReadingPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    const { cloudData, sharedData, isDataLoaded, isInitialLoading, isSharedDataLoading } = useDataContext();
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

    const [plans, setPlans] = useState<ReadingPlan[]>(() => safeLocalStorageGet('crentify_reading_plans', []));
    const [planContent, setPlanContent] = useState<ReadingPlanContent[]>(() => safeLocalStorageGet('crentify_reading_plan_content', []));
    const [categories, setCategories] = useState<ReadingPlanCategory[]>(() => safeLocalStorageGet('crentify_reading_plan_categories', [
        { id: "1", name: "Bíblia Anual", color: "#ff5c5c" },
        { id: "2", name: "Temático", color: "#5cff8a" },
        { id: "3", name: "IA Personalizado", color: "#9d5cff" }
    ]));
    const [progress, setProgress] = useState<Record<string, ReadingPlanProgress>>(() => safeLocalStorageGet('crentify_reading_plan_progress', {}));

    // Sync from Cloud (User Progress)
    useEffect(() => {
        if (isDataLoaded) {
            if (cloudData.crentify_reading_plan_progress) setProgress(cloudData.crentify_reading_plan_progress.value);

            // Admin specific User Data
            if (isAdmin) {
                if (cloudData.crentify_reading_plans) setPlans(cloudData.crentify_reading_plans.value);
                if (cloudData.crentify_reading_plan_content) setPlanContent(cloudData.crentify_reading_plan_content.value);
                if (cloudData.crentify_reading_plan_categories) setCategories(cloudData.crentify_reading_plan_categories.value);
            }
        }
    }, [isDataLoaded, cloudData, isAdmin]);

    // Sync from Shared Data
    useEffect(() => {
        if (!isSharedDataLoading) {
            if (sharedData.crentify_reading_plans) setPlans(sharedData.crentify_reading_plans);
            if (sharedData.crentify_reading_plan_content) setPlanContent(sharedData.crentify_reading_plan_content);
            if (sharedData.crentify_reading_plan_categories) setCategories(sharedData.crentify_reading_plan_categories);
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
