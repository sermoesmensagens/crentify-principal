
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademyCourse, AcademyContent, AcademyCategory, AcademyReflection, AcademyProgress, AcademyWeekCategory, AcademyDayCategory } from '../types';
import { useDataContext } from './DataContext';
import { useDataSync } from '../hooks/useDataSync';
import { useAuth } from './AuthContext';
import { ADMIN_EMAILS } from '../constants';
import { safeLocalStorageGet } from '../utils';

interface AcademyContextType {
    courses: AcademyCourse[];
    setAcademyCourses: React.Dispatch<React.SetStateAction<AcademyCourse[]>>;
    content: AcademyContent[];
    setAcademyContent: React.Dispatch<React.SetStateAction<AcademyContent[]>>;
    categories: AcademyCategory[];
    setAcademyCategories: React.Dispatch<React.SetStateAction<AcademyCategory[]>>;
    reflections: AcademyReflection[];
    setReflections: React.Dispatch<React.SetStateAction<AcademyReflection[]>>;
    progress: AcademyProgress;
    setProgress: React.Dispatch<React.SetStateAction<AcademyProgress>>;
    weekCategories: AcademyWeekCategory[];
    setWeekCategories: React.Dispatch<React.SetStateAction<AcademyWeekCategory[]>>;
    dayCategories: AcademyDayCategory[];
    setDayCategories: React.Dispatch<React.SetStateAction<AcademyDayCategory[]>>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session } = useAuth();
    const { cloudData, sharedData, isDataLoaded, isInitialLoading, isSharedDataLoading } = useDataContext();
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

    const [courses, setAcademyCourses] = useState<AcademyCourse[]>(() => safeLocalStorageGet('crentify_academy_courses', []));
    const [content, setAcademyContent] = useState<AcademyContent[]>(() => safeLocalStorageGet('crentify_academy_content', []));
    const [categories, setAcademyCategories] = useState<AcademyCategory[]>(() => safeLocalStorageGet('crentify_academy_categories', [
        { id: "1", name: "Teologia" }, { id: "2", name: "Bíblia" }, { id: "3", name: "Geral" },
        { id: "4", name: "Vida Cristã" }, { id: "5", name: "Sermões" }, { id: "6", name: "Construção" }
    ]));
    const [reflections, setReflections] = useState<AcademyReflection[]>(() => safeLocalStorageGet('crentify_academy_reflections', []));
    const [progress, setProgress] = useState<AcademyProgress>(() => safeLocalStorageGet('crentify_academy_progress', { completedLessons: [] }));
    const [weekCategories, setWeekCategories] = useState<AcademyWeekCategory[]>(() => safeLocalStorageGet('crentify_academy_weeks', [
        { id: "w1", name: "Semana 1" }, { id: "w2", name: "Semana 2" }, { id: "w3", name: "Semana 3" }
    ]));
    const [dayCategories, setDayCategories] = useState<AcademyDayCategory[]>(() => safeLocalStorageGet('crentify_academy_days', [
        { id: "d1", name: "Segunda" }, { id: "d2", name: "Terça" }, { id: "d3", name: "Quarta" },
        { id: "d4", name: "Quinta" }, { id: "d5", name: "Sexta" }, { id: "d6", name: "Sábado" }, { id: "d7", name: "Domingo" }
    ]));

    // Sync from Cloud (User Data)
    useEffect(() => {
        if (isDataLoaded) {
            if (cloudData.crentify_academy_reflections) setReflections(cloudData.crentify_academy_reflections.value);
            if (cloudData.crentify_academy_progress) setProgress(cloudData.crentify_academy_progress.value);

            // Admin specific User Data (if they edited shared content)
            if (isAdmin) {
                if (cloudData.crentify_academy_courses) setAcademyCourses(cloudData.crentify_academy_courses.value);
                if (cloudData.crentify_academy_content) setAcademyContent(cloudData.crentify_academy_content.value);
                if (cloudData.crentify_academy_categories) setAcademyCategories(cloudData.crentify_academy_categories.value);
                if (cloudData.crentify_academy_weeks) setWeekCategories(cloudData.crentify_academy_weeks.value);
                if (cloudData.crentify_academy_days) setDayCategories(cloudData.crentify_academy_days.value);
            }
        }
    }, [isDataLoaded, cloudData, isAdmin]);

    // Sync from Shared Data (All Users, including Admins to keep them in sync with each other)
    useEffect(() => {
        if (!isSharedDataLoading) {
            // Prioritize shared data for content to ensure consistency across admins
            if (sharedData.crentify_academy_courses) setAcademyCourses(sharedData.crentify_academy_courses);
            if (sharedData.crentify_academy_content) setAcademyContent(sharedData.crentify_academy_content);
            if (sharedData.crentify_academy_categories) setAcademyCategories(sharedData.crentify_academy_categories);
            if (sharedData.crentify_academy_weeks) setWeekCategories(sharedData.crentify_academy_weeks);
            if (sharedData.crentify_academy_days) setDayCategories(sharedData.crentify_academy_days);
        }
    }, [isSharedDataLoading, sharedData]);

    // Sync to Cloud
    // SAFETY: We only sync if data is fully loaded and NOT empty during initialization
    // to prevent overwriting cloud data with local empty defaults.
    const isAllDataLoaded = isDataLoaded && !isInitialLoading && !isSharedDataLoading;
    
    useDataSync(isAllDataLoaded ? 'crentify_academy_reflections' : '', reflections);
    useDataSync(isAllDataLoaded ? 'crentify_academy_progress' : '', progress);

    // Shared data sync (Admins only)
    // CRITICAL SAFETY: Only sync shared keys if list has elements OR after significant time to avoid init-race
    const canSyncShared = isAdmin && isAllDataLoaded;
    useDataSync((canSyncShared && (courses.length > 0 || sharedData.crentify_academy_courses)) ? 'crentify_academy_courses' : '', isAdmin ? courses : null);
    useDataSync((canSyncShared && (content.length > 0 || sharedData.crentify_academy_content)) ? 'crentify_academy_content' : '', isAdmin ? content : null);
    useDataSync((canSyncShared && (categories.length > 0 || sharedData.crentify_academy_categories)) ? 'crentify_academy_categories' : '', isAdmin ? categories : null);
    useDataSync((canSyncShared && (weekCategories.length > 0 || sharedData.crentify_academy_weeks)) ? 'crentify_academy_weeks' : '', isAdmin ? weekCategories : null);
    useDataSync((canSyncShared && (dayCategories.length > 0 || sharedData.crentify_academy_days)) ? 'crentify_academy_days' : '', isAdmin ? dayCategories : null);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_academy_courses', JSON.stringify(courses));
        localStorage.setItem('crentify_academy_content', JSON.stringify(content));
        localStorage.setItem('crentify_academy_categories', JSON.stringify(categories));
        localStorage.setItem('crentify_academy_weeks', JSON.stringify(weekCategories));
        localStorage.setItem('crentify_academy_days', JSON.stringify(dayCategories));
        localStorage.setItem('crentify_academy_reflections', JSON.stringify(reflections));
        localStorage.setItem('crentify_academy_progress', JSON.stringify(progress));
    }, [courses, content, categories, reflections, progress, weekCategories, dayCategories]);

    return (
        <AcademyContext.Provider value={{
            courses, setAcademyCourses, content, setAcademyContent, categories, setAcademyCategories,
            reflections, setReflections, progress, setProgress,
            weekCategories, setWeekCategories, dayCategories, setDayCategories
        }}>
            {children}
        </AcademyContext.Provider>
    );
};

export const useAcademy = () => {
    const context = useContext(AcademyContext);
    if (context === undefined) {
        throw new Error('useAcademy must be used within an AcademyProvider');
    }
    return context;
};
