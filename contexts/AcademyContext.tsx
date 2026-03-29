
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AcademyCourse, AcademyContent, AcademyCategory, AcademyReflection, AcademyProgress } from '../types';
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
            }
        }
    }, [isDataLoaded, cloudData, isAdmin]);

    // Sync from Shared Data (All Users)
    useEffect(() => {
        if (!isSharedDataLoading && !isAdmin) {
            if (sharedData.crentify_academy_courses) setAcademyCourses(sharedData.crentify_academy_courses);
            if (sharedData.crentify_academy_content) setAcademyContent(sharedData.crentify_academy_content);
            if (sharedData.crentify_academy_categories) setAcademyCategories(sharedData.crentify_academy_categories);
        }
    }, [isSharedDataLoading, sharedData, isAdmin]);

    // Sync to Cloud
    const canSync = isDataLoaded && !isInitialLoading;
    useDataSync(canSync ? 'crentify_academy_reflections' : '', reflections);
    useDataSync(canSync ? 'crentify_academy_progress' : '', progress);

    // Shared data sync (Admins only)
    useDataSync((isAdmin && canSync) ? 'crentify_academy_courses' : '', isAdmin ? courses : null);
    useDataSync((isAdmin && canSync) ? 'crentify_academy_content' : '', isAdmin ? content : null);
    useDataSync((isAdmin && canSync) ? 'crentify_academy_categories' : '', isAdmin ? categories : null);

    // Local Storage
    useEffect(() => {
        localStorage.setItem('crentify_academy_courses', JSON.stringify(courses));
        localStorage.setItem('crentify_academy_content', JSON.stringify(content));
        localStorage.setItem('crentify_academy_categories', JSON.stringify(categories));
        localStorage.setItem('crentify_academy_reflections', JSON.stringify(reflections));
        localStorage.setItem('crentify_academy_progress', JSON.stringify(progress));
    }, [courses, content, categories, reflections, progress]);

    return (
        <AcademyContext.Provider value={{
            courses, setAcademyCourses, content, setAcademyContent, categories, setAcademyCategories,
            reflections, setReflections, progress, setProgress
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
